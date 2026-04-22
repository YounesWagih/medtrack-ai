import apiService from '@/services/api';
import type { Medicine, CreateMedicineDto, UpdateMedicineDto, PaginatedResponse, ListMedicineQuery, ExternalMedicineSearchItem, ExternalMedicineDetails } from '@/types/api';

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

  // Remove (soft delete) medicine - returns null on success
  async remove(id: string): Promise<null> {
    return apiService.patch<null>(`/medicines/${id}/remove`);
  },

  // Search medicines from external API
  async searchMedicines(query: string): Promise<ExternalMedicineSearchItem[]> {
    if (!query || query.trim().length < 2) return [];
    const response = await apiService.post<ExternalMedicineSearchItem[]>('/medicines/search', { q: query, page: 1, page_size: 24 });
    return response;
  },

  // Get medicine details from external API
  async getMedicineDetails(slug: string): Promise<ExternalMedicineDetails> {
    const response = await apiService.get<ExternalMedicineDetails>(`/medicines/details/${slug}`);
    return response;
  },

  // Check if medicine exists in user's inventory
  async checkExists(name: string): Promise<boolean> {
    const response = await apiService.get<{ items: Medicine[] }>('/medicines', { params: { search: name, limit: 1 } });
    return response.items.some(m => m.name.toLowerCase() === name.toLowerCase());
  },
};
