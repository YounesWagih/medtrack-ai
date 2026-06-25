# MedTrack Fake Telemetry

Standalone Python generator for local observability testing. It emits MedTrack-shaped JSON logs to stdout for Alloy/Loki and exposes Prometheus metrics on `/metrics`.

## Run

```powershell
docker compose -f docker-compose.loki.yml --profile fake-telemetry up --build
```

The generator is disabled unless the `fake-telemetry` profile is enabled.

## Scenarios

Set `FAKE_TELEMETRY_SCENARIO` before starting Compose, or edit the default on the `fake-telemetry` service.

Useful values:

- `normal`: healthy traffic, low latency, successful jobs.
- `error_spike`: higher 5xx ratio and exception logs.
- `slow_database`: slow DB logs and high HTTP latency.
- `redis_degraded`: Redis unavailable gauge and cache failures.
- `external_api_outage`: OpenFDA/OpenRouter timeouts and rate limits.
- `auth_attack`: login failures, 401/429 responses, rate-limit metrics.
- `ai_chat_degraded`: AI chat timeout and malformed response events.
- `expiry_job_failure`: failed expiry job and notification failures.
- `memory_eventloop_pressure`: high memory and event-loop lag gauges.
- `mixed_incident`: rotates through several incident types.

Example:

```powershell
$env:FAKE_TELEMETRY_SCENARIO = "error_spike"
docker compose -f docker-compose.loki.yml --profile fake-telemetry up --build
```

Redis degraded:

```powershell
$env:FAKE_TELEMETRY_SCENARIO = "redis_degraded"
docker compose -f docker-compose.loki.yml --profile fake-telemetry up --build
```

Mixed incident demo:

```powershell
$env:FAKE_TELEMETRY_SCENARIO = "mixed_incident"
docker compose -f docker-compose.loki.yml --profile fake-telemetry up --build
```

## Local knobs

- `FAKE_TELEMETRY_LOGS_PER_SECOND`: default `2`.
- `FAKE_TELEMETRY_METRICS_PORT`: default `9465`.
- `FAKE_TELEMETRY_SERVICE_NAME`: default `medtrack-backend`.
- `FAKE_TELEMETRY_ENVIRONMENT`: default `production`.
- `FAKE_TELEMETRY_VERSION`: default `1.0.0`.
- `FAKE_TELEMETRY_RANDOM_SEED`: default `medtrack-fake-telemetry`.

The default service name intentionally matches the backend so existing Grafana dashboards and Loki links light up without edits.
