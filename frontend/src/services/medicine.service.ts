import apiService from '@/services/api';
import type { Medicine, CreateMedicineDto, UpdateMedicineDto, PaginatedResponse, ListMedicineQuery } from '@/types/api';

export const medicineService = {
  // List medicines with filters, pagination, sorting
  async list(params?: ListMedicineQuery): Promise<PaginatedResponse<Medicine>> {
    return apiService.get('/medicines', { params });
  },

  // Get single medicine by ID
  async get(id: string): Promise<Medicine> {
    return apiService.get(`/medicines/${id}`);
  },

  // Create new medicine
  async create(data: CreateMedicineDto): Promise<Medicine> {
    return apiService.post('/medicines', data);
  },

  // Update medicine
  async update(id: string, data: UpdateMedicineDto): Promise<Medicine> {
    return apiService.patch(`/medicines/${id}`, data);
  },

  // Remove (soft delete) medicine
  async remove(id: string): Promise<void> {
    return apiService.patch(`/medicines/${id}/remove`);
  },
};
