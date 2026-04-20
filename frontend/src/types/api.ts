// Enums matching backend Prisma enums
export enum MedicineStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  REMOVED = 'REMOVED',
}

export enum ChatSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum ChatMessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Medicine types
export interface Medicine {
  id: string;
  userId: string;
  name: string;
  expiryDate: string; // ISO date string
  status: MedicineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineDto {
  name: string;
  expiryDate: string;
}

export interface UpdateMedicineDto extends CreateMedicineDto {}

export interface ListMedicineQuery {
  page?: number;
  limit?: number;
  status?: MedicineStatus | 'ALL';
  search?: string;
  sortBy?: 'name' | 'expiryDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

// Chat types
export interface ChatSession {
  id: string;
  userId: string;
  status: ChatSessionStatus;
  createdAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export interface CreateSessionDto {
  // initially empty; could include provider or other options later
}

export interface SendMessageDto {
  content: string;
}

export interface ChatRecommendationMedicine {
  name: string;
  recommendation: string;
  dosage: string;
  frequency: string;
}

export interface ChatResponseData {
  type: 'recommendation' | 'text';
  content: string;
  medicines?: ChatRecommendationMedicine[];
  extractedMedicineNames: string[];
}

export interface ChatMessageResponse {
  sessionId: string;
  response: ChatResponseData;
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Pagination query params (shared)
export interface PaginationParams {
  page?: number;
  limit?: number;
}
