import api from './api';
import { AuthResponse, LoginCredentials, RegisterCredentials } from '../types/user.types';

export const authService = {
  async register(data: RegisterCredentials) {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginCredentials) {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout', {});
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};