import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const institutionService = {
  async getAllInstitutions() {
    const response = await api.get('/institutions/all');
    return response.data;
  },

  async getInstitution(id: string) {
    const response = await api.get(`/institutions/${id}`);
    return response.data;
  },

  async createInstitution(institutionData: any) {
    const response = await api.post('/institutions/', institutionData);
    return response.data;
  },

  async updateInstitution(id: string, updateData: any) {
    const response = await api.put(`/institutions/${id}`, updateData);
    return response.data;
  },

  async getRecommendations(id: string) {
    const response = await api.get(`/recommendations/${id}`);
    return response.data;
  },

  async getDataStatistics() {
    const response = await api.get('/data/statistics');
    return response.data;
  },

  async importData(formData: FormData) {
    const response = await api.post('/data/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async saveSettings(settings: any) {
    const response = await api.post('/settings', settings);
    return response.data;
  },

  async getSettings() {
    const response = await api.get('/settings');
    return response.data;
  }
};

export default api;