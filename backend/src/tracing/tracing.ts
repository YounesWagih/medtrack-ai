import { context, propagation, trace, SpanStatusCode, type Span } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
    BatchSpanProcessor,
    ParentBasedSampler,
    TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import {
    ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { env } from "../config/env.js";

let sdk: NodeSDK | null = null;

export function startTracing(): void {
    if (!env.TRACING_ENABLED || sdk) {
        return;
    }

    const exporter = new OTLPTraceExporter({
        url: env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    });

    sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: env.SERVICE_NAME,
            [ATTR_SERVICE_VERSION]: env.SERVICE_VERSION,
            [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: env.NODE_ENV,
        }),
        sampler: new ParentBasedSampler({
            root: new TraceIdRatioBasedSampler(env.OTEL_TRACES_SAMPLER_RATIO),
        }),
        textMapPropagator: new W3CTraceContextPropagator(),
        spanLimits: {
            attributeCountLimit: 64,
            attributeValueLengthLimit: 1024,
            eventCountLimit: 64,
        },
        spanProcessors: [new BatchSpanProcessor(exporter)],
        instrumentations: [
            getNodeAutoInstrumentations({
                "@opentelemetry/instrumentation-fs": { enabled: false },
                "@opentelemetry/instrumentation-pino": { enabled: false },
                "@opentelemetry/instrumentation-http": {
                    ignoreIncomingRequestHook: (req) => req.url === "/metrics",
                    headersToSpanAttributes: {
                        client: { requestHeaders: [], responseHeaders: [] },
                        server: { requestHeaders: [], responseHeaders: [] },
                    },
                },
                "@opentelemetry/instrumentation-redis": {
                    dbStatementSerializer: (cmdName) => cmdName,
                },
            }),
            new PrismaInstrumentation(),
        ],
    });

    sdk.start();
}

export async function stopTracing(): Promise<void> {
    if (!sdk) {
        return;
    }

    const activeSdk = sdk;
    sdk = null;
    await activeSdk.shutdown();
}

export function getActiveSpanContext(): {
    traceId?: string;
    spanId?: string;
    traceFlags?: number;
} {
    const activeSpan = trace.getActiveSpan();
    const spanContext = activeSpan?.spanContext();
    if (!spanContext?.traceId || !spanContext?.spanId) {
        return {};
    }

    return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags,
    };
}

export function injectTraceHeaders(headers: Record<string, string>): void {
    propagation.inject(context.active(), headers);
}

export function recordSpanException(error: unknown, span: Span | undefined = trace.getActiveSpan()): void {
    if (!span) {
        return;
    }

    if (error instanceof Error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        return;
    }

    const message = String(error);
    span.recordException({ message });
    span.setStatus({ code: SpanStatusCode.ERROR, message });
}

export function getTracer() {
    return trace.getTracer(env.SERVICE_NAME, env.SERVICE_VERSION);
}
