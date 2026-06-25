from __future__ import annotations

import json
import os
import random
import signal
import sys
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable

from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram, start_http_server


LEVELS = {
    "debug": 20,
    "info": 30,
    "warn": 40,
    "error": 50,
}

HTTP_ROUTES = [
    ("GET", "/api/medicines", "/api/medicines"),
    ("POST", "/api/medicines", "/api/medicines"),
    ("GET", "/api/medicines/:id", "/api/medicines/med_fake_42"),
    ("PATCH", "/api/medicines/:id", "/api/medicines/med_fake_42"),
    ("DELETE", "/api/medicines/:id", "/api/medicines/med_fake_42"),
    ("GET", "/api/medicines/search", "/api/medicines/search?q=atorvastatin"),
    ("POST", "/api/auth/login", "/api/auth/login"),
    ("POST", "/api/auth/register", "/api/auth/register"),
    ("POST", "/api/chat/sessions/:id/messages", "/api/chat/sessions/chat_fake_12/messages"),
    ("GET", "/api/users/profile", "/api/users/profile"),
]

DEPENDENCIES = [
    ("openfda", "medicine_search"),
    ("openrouter", "chat_completion"),
    ("smtp", "expiry_notification"),
]

WORKFLOWS = [
    ("auth", "login"),
    ("auth", "register"),
    ("medicine", "create"),
    ("medicine", "update"),
    ("medicine", "delete"),
    ("chat", "send_message"),
]


@dataclass(frozen=True)
class Settings:
    scenario: str
    logs_per_second: float
    metrics_port: int
    service_name: str
    environment: str
    version: str
    seed: str


@dataclass(frozen=True)
class ScenarioProfile:
    name: str
    http_success_weight: int
    http_client_error_weight: int
    http_server_error_weight: int
    latency_multiplier: float
    external_failure_weight: int
    redis_available: int
    cache_hit_weight: int
    job_failure_weight: int
    auth_attack_weight: int
    chat_failure_weight: int
    memory_bytes: int
    event_loop_lag_seconds: float
    cpu_seconds_per_tick: float
    traffic_multiplier: int = 1


SCENARIOS: dict[str, ScenarioProfile] = {
    "normal": ScenarioProfile("normal", 94, 5, 1, 1.0, 3, 1, 82, 2, 1, 3, 190_000_000, 0.018, 0.03),
    "high_traffic": ScenarioProfile("high_traffic", 92, 6, 2, 1.25, 4, 1, 76, 2, 2, 4, 260_000_000, 0.045, 0.12, 5),
    "error_spike": ScenarioProfile("error_spike", 55, 15, 30, 2.5, 18, 1, 65, 10, 4, 8, 330_000_000, 0.09, 0.18, 3),
    "slow_database": ScenarioProfile("slow_database", 78, 8, 14, 7.0, 8, 1, 58, 7, 2, 5, 360_000_000, 0.16, 0.16, 2),
    "redis_degraded": ScenarioProfile("redis_degraded", 82, 10, 8, 2.0, 7, 0, 12, 6, 2, 4, 280_000_000, 0.07, 0.1, 2),
    "external_api_outage": ScenarioProfile("external_api_outage", 74, 8, 18, 3.0, 55, 1, 70, 5, 2, 22, 310_000_000, 0.08, 0.14, 2),
    "auth_attack": ScenarioProfile("auth_attack", 58, 36, 6, 1.4, 8, 1, 75, 3, 50, 4, 250_000_000, 0.05, 0.09, 4),
    "ai_chat_degraded": ScenarioProfile("ai_chat_degraded", 76, 8, 16, 2.8, 35, 1, 72, 4, 2, 55, 340_000_000, 0.11, 0.16, 2),
    "expiry_job_failure": ScenarioProfile("expiry_job_failure", 88, 7, 5, 1.5, 14, 1, 72, 70, 2, 5, 260_000_000, 0.05, 0.08),
    "memory_eventloop_pressure": ScenarioProfile(
        "memory_eventloop_pressure", 80, 8, 12, 3.5, 10, 1, 65, 6, 2, 8, 720_000_000, 0.42, 0.28, 2
    ),
}

MIXED_INCIDENT_SEQUENCE = [
    "normal",
    "high_traffic",
    "slow_database",
    "external_api_outage",
    "redis_degraded",
    "error_spike",
    "ai_chat_degraded",
    "expiry_job_failure",
    "memory_eventloop_pressure",
    "auth_attack",
]


class Metrics:
    def __init__(self) -> None:
        self.registry = CollectorRegistry()

        self.http_requests = Counter(
            "medtrack_http_requests",
            "Completed HTTP requests.",
            ["method", "route", "status_code"],
            registry=self.registry,
        )
        self.http_duration = Histogram(
            "medtrack_http_request_duration_seconds",
            "HTTP request duration in seconds.",
            ["method", "route", "status_class"],
            buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registry=self.registry,
        )
        self.http_in_flight = Gauge(
            "medtrack_http_requests_in_flight",
            "HTTP requests currently being processed.",
            ["method"],
            registry=self.registry,
        )
        self.external_requests = Counter(
            "medtrack_external_requests",
            "Calls to bounded external dependencies.",
            ["dependency", "operation", "outcome", "status_class"],
            registry=self.registry,
        )
        self.external_duration = Histogram(
            "medtrack_external_request_duration_seconds",
            "External dependency request duration in seconds.",
            ["dependency", "operation", "outcome"],
            buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
            registry=self.registry,
        )
        self.redis_available = Gauge(
            "medtrack_redis_available",
            "Whether the application Redis client is available (1) or degraded (0).",
            registry=self.registry,
        )
        self.cache_operations = Counter(
            "medtrack_cache_operations",
            "Cache operations and their bounded outcomes.",
            ["namespace", "operation", "outcome"],
            registry=self.registry,
        )
        self.job_runs = Counter(
            "medtrack_job_runs",
            "Background job runs by outcome.",
            ["job", "outcome"],
            registry=self.registry,
        )
        self.job_duration = Histogram(
            "medtrack_job_duration_seconds",
            "Background job duration in seconds.",
            ["job", "outcome"],
            buckets=[0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 900],
            registry=self.registry,
        )
        self.job_last_success = Gauge(
            "medtrack_job_last_success_timestamp_seconds",
            "Unix timestamp of the last successful background job run.",
            ["job"],
            registry=self.registry,
        )
        self.job_items = Counter(
            "medtrack_job_items",
            "Items processed by background jobs.",
            ["job", "item", "outcome"],
            registry=self.registry,
        )
        self.workflow_operations = Counter(
            "medtrack_workflow_operations",
            "Critical product workflow operations.",
            ["workflow", "operation", "outcome"],
            registry=self.registry,
        )
        self.chat_messages = Counter(
            "medtrack_chat_messages",
            "AI chat message processing outcomes.",
            ["outcome", "model", "response_type"],
            registry=self.registry,
        )
        self.rate_limit_rejections = Counter(
            "medtrack_rate_limit_rejections",
            "Requests rejected by a rate limiter.",
            ["limiter"],
            registry=self.registry,
        )
        self.notification_attempts = Counter(
            "medtrack_notification_attempts",
            "Notification attempts by type and outcome.",
            ["type", "outcome"],
            registry=self.registry,
        )
        self.memory = Gauge(
            "medtrack_process_resident_memory_bytes",
            "Fake backend resident memory.",
            registry=self.registry,
        )
        self.event_loop_lag = Gauge(
            "medtrack_nodejs_eventloop_lag_seconds",
            "Fake Node.js event-loop lag.",
            registry=self.registry,
        )
        self.cpu = Counter(
            "medtrack_process_cpu_seconds",
            "Fake total user and system CPU time spent in seconds.",
            registry=self.registry,
        )


def read_settings() -> Settings:
    scenario = os.getenv("FAKE_TELEMETRY_SCENARIO", "normal").strip() or "normal"
    if scenario != "mixed_incident" and scenario not in SCENARIOS:
        print(
            json.dumps(
                {
                    "time": iso_now(),
                    "level": LEVELS["warn"],
                    "levelLabel": "warn",
                    "service": os.getenv("FAKE_TELEMETRY_SERVICE_NAME", "medtrack-backend"),
                    "environment": os.getenv("FAKE_TELEMETRY_ENVIRONMENT", "production"),
                    "version": os.getenv("FAKE_TELEMETRY_VERSION", "1.0.0"),
                    "logger": "metrics",
                    "event": "fake_telemetry.unknown_scenario",
                    "scenario": scenario,
                    "msg": "Unknown fake telemetry scenario; falling back to normal",
                },
                separators=(",", ":"),
            ),
            flush=True,
        )
        scenario = "normal"

    return Settings(
        scenario=scenario,
        logs_per_second=max(float(os.getenv("FAKE_TELEMETRY_LOGS_PER_SECOND", "2")), 0.1),
        metrics_port=int(os.getenv("FAKE_TELEMETRY_METRICS_PORT", "9465")),
        service_name=os.getenv("FAKE_TELEMETRY_SERVICE_NAME", "medtrack-backend"),
        environment=os.getenv("FAKE_TELEMETRY_ENVIRONMENT", "production"),
        version=os.getenv("FAKE_TELEMETRY_VERSION", "1.0.0"),
        seed=os.getenv("FAKE_TELEMETRY_RANDOM_SEED", "medtrack-fake-telemetry"),
    )


def iso_now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def status_class(status_code: int) -> str:
    return f"{status_code // 100}xx" if 100 <= status_code <= 599 else "unknown"


def choose_status(profile: ScenarioProfile) -> int:
    bucket = random.choices(
        ["success", "client_error", "server_error"],
        weights=[
            profile.http_success_weight,
            profile.http_client_error_weight,
            profile.http_server_error_weight,
        ],
        k=1,
    )[0]
    if bucket == "success":
        return random.choices([200, 201, 204], weights=[82, 12, 6], k=1)[0]
    if bucket == "client_error":
        return random.choices([400, 401, 403, 404, 409, 422, 429], weights=[10, 28, 8, 10, 6, 14, 24], k=1)[0]
    return random.choices([500, 502, 503, 504], weights=[38, 18, 24, 20], k=1)[0]


def latency_seconds(profile: ScenarioProfile, status_code: int) -> float:
    base = random.lognormvariate(-2.4, 0.65) * profile.latency_multiplier
    if status_code >= 500:
        base *= random.uniform(1.7, 4.5)
    if status_code == 429:
        base *= 0.35
    return min(max(base, 0.004), 9.8)


def request_context() -> dict[str, str]:
    request_id = f"req_{uuid.uuid4().hex[:16]}"
    trace_id = uuid.uuid4().hex
    return {
        "requestId": request_id,
        "traceId": trace_id,
        "spanId": uuid.uuid4().hex[:16],
        "userId": f"user_{random.randint(1000, 9999)}",
    }


def emit_log(settings: Settings, logger: str, event: str, level: str, msg: str, **fields: object) -> None:
    record = {
        "time": iso_now(),
        "level": LEVELS[level],
        "levelLabel": level,
        "service": settings.service_name,
        "environment": settings.environment,
        "version": settings.version,
        "logger": logger,
        "event": event,
        "msg": msg,
    }
    record.update({key: value for key, value in fields.items() if value is not None})
    print(json.dumps(record, separators=(",", ":"), sort_keys=False), flush=True)


def record_http(settings: Settings, metrics: Metrics, profile: ScenarioProfile) -> None:
    method, route, path = random.choice(HTTP_ROUTES)
    if profile.name == "auth_attack":
        method, route, path = ("POST", "/api/auth/login", "/api/auth/login")

    status_code = choose_status(profile)
    duration = latency_seconds(profile, status_code)
    context = request_context()

    metrics.http_requests.labels(method=method, route=route, status_code=str(status_code)).inc()
    metrics.http_duration.labels(method=method, route=route, status_class=status_class(status_code)).observe(duration)
    metrics.http_in_flight.labels(method=method).set(random.randint(0, max(2, profile.traffic_multiplier * 3)))

    if status_code >= 500:
        level = "error"
    elif status_code >= 400:
        level = "warn"
    else:
        level = "info"

    emit_log(
        settings,
        "http",
        "request.completed",
        level,
        f"{method} {route} completed with {status_code}",
        **context,
        route=route,
        method=method,
        path=path,
        statusCode=status_code,
        durationMs=round(duration * 1000, 2),
    )


def record_workflow(settings: Settings, metrics: Metrics, profile: ScenarioProfile) -> None:
    workflow, operation = random.choice(WORKFLOWS)
    outcome = "error" if random.randint(1, 100) <= profile.http_server_error_weight else "success"
    metrics.workflow_operations.labels(workflow=workflow, operation=operation, outcome=outcome).inc()

    logger = workflow if workflow in {"auth", "medicine", "chat"} else "medicine"
    level = "error" if outcome == "error" else "info"
    event = f"{workflow}.{operation}_{'failed' if outcome == 'error' else 'completed'}"
    message = f"{workflow} {operation} {'failed' if outcome == 'error' else 'completed'}"
    emit_log(settings, logger, event, level, message, **request_context(), workflow=workflow, operation=operation, outcome=outcome)


def record_auth_attack(settings: Settings, metrics: Metrics) -> None:
    metrics.rate_limit_rejections.labels(limiter="auth-login").inc(random.randint(1, 4))
    emit_log(
        settings,
        "auth",
        "auth.login_failed",
        "warn",
        "Login failed for synthetic user hash",
        **request_context(),
        emailHash=f"sha256:{uuid.uuid4().hex}",
        reason=random.choice(["invalid_credentials", "account_locked", "rate_limited"]),
        statusCode=random.choice([401, 429]),
    )


def record_cache(settings: Settings, metrics: Metrics, profile: ScenarioProfile) -> None:
    operation = random.choice(["read", "write", "delete"])
    if operation == "read":
        outcome = random.choices(["hit", "miss", "error"], weights=[profile.cache_hit_weight, 100 - profile.cache_hit_weight, 5], k=1)[0]
    else:
        outcome = random.choices(["success", "error"], weights=[92 if profile.redis_available else 35, 8 if profile.redis_available else 65], k=1)[0]

    metrics.cache_operations.labels(namespace="medicine_details", operation=operation, outcome=outcome).inc()
    if outcome == "error" or not profile.redis_available:
        emit_log(
            settings,
            "redis",
            "redis.cache_operation_failed",
            "warn",
            "Redis cache operation failed in fake telemetry scenario",
            operation=operation,
            namespace="medicine_details",
            outcome=outcome,
        )


def record_dependency(settings: Settings, metrics: Metrics, profile: ScenarioProfile) -> None:
    dependency, operation = random.choice(DEPENDENCIES)
    failed = random.randint(1, 100) <= profile.external_failure_weight
    if failed:
        outcome = random.choice(["timeout", "rate_limited", "error"])
        code = random.choice([429, 500, 502, 503, 504])
        level = "warn" if outcome == "rate_limited" else "error"
        duration = random.uniform(1.0, 12.0) * max(1.0, profile.latency_multiplier / 2)
    else:
        outcome = "success"
        code = 200
        level = "info"
        duration = random.uniform(0.04, 0.9) * profile.latency_multiplier

    metrics.external_requests.labels(
        dependency=dependency,
        operation=operation,
        outcome=outcome,
        status_class=status_class(code),
    ).inc()
    metrics.external_duration.labels(dependency=dependency, operation=operation, outcome=outcome).observe(min(duration, 59.0))

    emit_log(
        settings,
        "external-api",
        f"{dependency}.{operation}",
        level,
        f"{dependency} {operation} {outcome}",
        **request_context(),
        dependency=dependency,
        operation=operation,
        outcome=outcome,
        statusCode=code,
        durationMs=round(duration * 1000, 2),
    )


def record_chat(settings: Settings, metrics: Metrics, profile: ScenarioProfile) -> None:
    failed = random.randint(1, 100) <= profile.chat_failure_weight
    outcome = random.choice(["timeout", "malformed_response", "error"]) if failed else "success"
    response_type = random.choice(["answer", "medicine_recommendation", "safety_warning"])
    metrics.chat_messages.labels(outcome=outcome, model="openrouter/fake-medtrack", response_type=response_type).inc()
    emit_log(
        settings,
        "chat",
        "chat.message_processed" if outcome == "success" else "chat.message_failed",
        "info" if outcome == "success" else "warn",
        f"AI chat message {outcome}",
        **request_context(),
        outcome=outcome,
        model="openrouter/fake-medtrack",
        responseType=response_type,
    )


def record_job(settings: Settings, metrics: Metrics, profile: ScenarioProfile) -> None:
    failed = random.randint(1, 100) <= profile.job_failure_weight
    outcome = "error" if failed else "success"
    duration = random.uniform(1.5, 45.0) * (2.0 if failed else 1.0)

    metrics.job_runs.labels(job="medicine_expiry", outcome=outcome).inc()
    metrics.job_duration.labels(job="medicine_expiry", outcome=outcome).observe(duration)
    metrics.job_items.labels(
        job="medicine_expiry",
        item="medicine_updated",
        outcome="error" if failed else "success",
    ).inc(random.randint(0 if failed else 3, 24))

    if not failed:
        metrics.job_last_success.labels(job="medicine_expiry").set(time.time())

    emit_log(
        settings,
        "cron",
        "medicine_expiry_job.failed" if failed else "medicine_expiry_job.completed",
        "error" if failed else "info",
        "Medicine expiry job failed" if failed else "Medicine expiry job completed",
        jobRunId=f"job_{uuid.uuid4().hex[:12]}",
        outcome=outcome,
        durationMs=round(duration * 1000, 2),
    )

    notification_outcome = "failed" if failed or random.randint(1, 100) <= profile.job_failure_weight else "sent"
    metrics.notification_attempts.labels(type="medicine_expiry", outcome=notification_outcome).inc(random.randint(1, 8))
    if notification_outcome == "failed":
        emit_log(
            settings,
            "cron",
            "notification.failed",
            "warn",
            "Medicine expiry notification failed",
            notificationType="medicine_expiry",
            outcome=notification_outcome,
        )


def record_db_pressure(settings: Settings, profile: ScenarioProfile) -> None:
    if profile.name != "slow_database" and random.randint(1, 100) > profile.http_server_error_weight:
        return
    duration = random.uniform(750, 6500) * max(1.0, profile.latency_multiplier / 3)
    emit_log(
        settings,
        "db",
        random.choice(["db.query_slow", "db.connection_timeout", "db.transaction_retry"]),
        "warn" if duration < 5000 else "error",
        "Database operation exceeded expected latency",
        queryName=random.choice(["medicine.findMany", "user.findUnique", "chatSession.create", "medicine.update"]),
        durationMs=round(duration, 2),
    )


def record_global_exception(settings: Settings, profile: ScenarioProfile) -> None:
    if random.randint(1, 100) > max(2, profile.http_server_error_weight // 2):
        return
    emit_log(
        settings,
        "error",
        "request.unhandled_exception",
        "error",
        "Unhandled synthetic exception captured by global handler",
        **request_context(),
        errorType=random.choice(["PrismaClientKnownRequestError", "ExternalDependencyError", "ValidationBoundaryError"]),
        statusCode=500,
        route=random.choice([route for _, route, _ in HTTP_ROUTES]),
    )


def update_runtime_gauges(metrics: Metrics, profile: ScenarioProfile) -> None:
    memory_jitter = random.randint(-12_000_000, 24_000_000)
    lag_jitter = random.uniform(-0.01, 0.04)
    metrics.redis_available.set(profile.redis_available)
    metrics.memory.set(max(90_000_000, profile.memory_bytes + memory_jitter))
    metrics.event_loop_lag.set(max(0.002, profile.event_loop_lag_seconds + lag_jitter))
    metrics.cpu.inc(max(0.001, profile.cpu_seconds_per_tick * random.uniform(0.5, 1.8)))


def active_profile(settings: Settings, started_at: float) -> ScenarioProfile:
    if settings.scenario != "mixed_incident":
        return SCENARIOS[settings.scenario]
    elapsed = int(time.time() - started_at)
    name = MIXED_INCIDENT_SEQUENCE[(elapsed // 45) % len(MIXED_INCIDENT_SEQUENCE)]
    return SCENARIOS[name]


def weighted_actions(profile: ScenarioProfile) -> list[tuple[Callable[..., None], int]]:
    return [
        (record_http, 48),
        (record_workflow, 14),
        (record_cache, 9),
        (record_dependency, 10 if profile.name != "external_api_outage" else 24),
        (record_chat, 8 if profile.name != "ai_chat_degraded" else 24),
        (record_job, 3 if profile.name != "expiry_job_failure" else 22),
        (record_auth_attack, max(1, profile.auth_attack_weight)),
    ]


def run(settings: Settings, metrics: Metrics) -> None:
    stop = False
    started_at = time.time()

    def handle_stop(_signum: int, _frame: object) -> None:
        nonlocal stop
        stop = True

    signal.signal(signal.SIGTERM, handle_stop)
    signal.signal(signal.SIGINT, handle_stop)

    start_http_server(settings.metrics_port, registry=metrics.registry)
    emit_log(
        settings,
        "metrics",
        "fake_telemetry.started",
        "info",
        "Fake telemetry generator started",
        scenario=settings.scenario,
        metricsPort=settings.metrics_port,
        logsPerSecond=settings.logs_per_second,
    )

    while not stop:
        profile = active_profile(settings, started_at)
        update_runtime_gauges(metrics, profile)

        for _ in range(profile.traffic_multiplier):
            actions = weighted_actions(profile)
            action = random.choices([item[0] for item in actions], weights=[item[1] for item in actions], k=1)[0]
            if action is record_http:
                action(settings, metrics, profile)
            elif action is record_auth_attack:
                action(settings, metrics)
            else:
                action(settings, metrics, profile)

        record_db_pressure(settings, profile)
        record_global_exception(settings, profile)

        if settings.scenario == "mixed_incident":
            emit_log(
                settings,
                "metrics",
                "fake_telemetry.active_scenario",
                "debug",
                "Fake telemetry mixed incident active scenario",
                activeScenario=profile.name,
            )

        time.sleep(1 / settings.logs_per_second)

    emit_log(settings, "metrics", "fake_telemetry.stopped", "info", "Fake telemetry generator stopped")


if __name__ == "__main__":
    settings = read_settings()
    random.seed(settings.seed)
    try:
        run(settings, Metrics())
    except Exception as error:
        emit_log(
            settings,
            "error",
            "fake_telemetry.crashed",
            "error",
            "Fake telemetry generator crashed",
            errorType=type(error).__name__,
            error=str(error),
        )
        sys.exit(1)
