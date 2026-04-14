export const ResponseHelper = {
    success: (message: string, data?: unknown) => ({
        success: true,
        message,
        data: data ?? null,
    }),
    error: (message: string, data?: unknown) => ({
        success: false,
        message,
        data: data ?? null,
    }),
};
