export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    totalPages: number;
};

export type SortParams<T extends string> = {
    sortBy: T;
    sortOrder: "asc" | "desc";
};

export type PaginationParams = {
    page: number;
    limit: number;
};

export type ChatRecommendationMedicine = {
    name: string;
    recommendation: string;
    dosage: string;
    frequency: string;
};

export type ChatResponseData = {
    type: "recommendation" | "text";
    content: string;
    medicines?: ChatRecommendationMedicine[];
    extractedMedicineNames: string[];
};

export type ChatMessageResponse = {
    sessionId: string;
    response: ChatResponseData;
};
