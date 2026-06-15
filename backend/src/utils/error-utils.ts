export type SafeErrorFields = {
    name?: string;
    message: string;
};

export type SafeAxiosErrorFields = SafeErrorFields & {
    code?: string;
    statusCode?: number;
};

export function getSafeErrorFields(error: unknown): SafeErrorFields {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
        };
    }
    return {
        name: "UnknownError",
        message: String(error),
    };
}

export function getSafeAxiosErrorFields(
    error: unknown,
): SafeAxiosErrorFields {
    const base = getSafeErrorFields(error);
    const axiosError = error as { code?: string; response?: { status?: number } };

    return {
        ...base,
        code: axiosError.code,
        statusCode: axiosError.response?.status,
    };
}