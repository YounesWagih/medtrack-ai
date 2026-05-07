import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse, User } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: attach token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

     // Response interceptor: handle common errors
     this.client.interceptors.response.use(
       (response: AxiosResponse<ApiResponse>) => response,
       (error) => {
         // Handle 401/403 - logout and redirect
         if (error.response?.status === 401 || error.response?.status === 403) {
           this.clearToken();
           // Dispatch custom event to notify auth store
           window.dispatchEvent(new CustomEvent('auth:logout'));
           // Redirect will happen after the event is handled
           setTimeout(() => window.location.href = '/login', 0);
         }

         // For any other error, if we have a response with data, use the message from the data
         if (error.response && error.response.data) {
           const data = error.response.data as any;
           const message = data.message || data.error;
           // Create a new error with the message from the response
           return Promise.reject(new Error(message || error.message));
         }

         // Otherwise, reject with the original error
         return Promise.reject(error);
       }
     );
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return this.handleResponse(response);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return this.handleResponse(response);
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return this.handleResponse(response);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return this.handleResponse(response);
  }

  private handleResponse<T>(response: AxiosResponse<{ success: boolean; message: string; data?: T; error?: string }>): T {
    const { success, message, data, error } = response.data;
    if (!success || error) {
      throw new Error(error || message || 'Unknown error');
    }
    return data as T;
  }

  // Convenience methods for auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    });
    return response;
  }

  async register(data: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await this.post<{ user: User; token: string }>('/auth/register', data);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.get<{ user: User }>('/users/me');
    return response.user;
  }

  logout(): void {
    this.clearToken();
  }


}

export const apiService = new ApiService();
export default apiService;
