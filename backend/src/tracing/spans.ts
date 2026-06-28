import { type Span, type SpanOptions } from "@opentelemetry/api";
import { getTracer, recordSpanException } from "./tracing.js";

type SpanAttributes = Record<string, string | number | boolean | undefined>;

export async function withSpan<T>(
    name: string,
    attributes: SpanAttributes,
    callback: (span: Span) => Promise<T>,
    options?: SpanOptions,
): Promise<T> {
    const tracer = getTracer();

    return await tracer.startActiveSpan(name, options ?? {}, async (span) => {
        setSpanAttributes(span, attributes);
        try {
            const result = await callback(span);
            return result;
        } catch (error) {
            recordSpanException(error, span);
            throw error;
        } finally {
            span.end();
        }
    });
}

export function setSpanAttributes(span: Span, attributes: SpanAttributes): void {
    for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined) {
            span.setAttribute(key, value);
        }
    }
}
