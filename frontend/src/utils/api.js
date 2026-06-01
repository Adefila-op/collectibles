import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Artwork API
export const artworkAPI = {
  create: (data) => api.post('/artworks', data),
  getAll: (params) => api.get('/artworks', { params }),
  getById: (id) => api.get(`/artworks/${id}`),
  update: (id, data) => api.put(`/artworks/${id}`, data),
  delete: (id) => api.delete(`/artworks/${id}`),
};

// Offer API
export const offerAPI = {
  create: (data) => api.post('/offers', data),
  getAll: (params) => api.get('/offers', { params }),
  updateStatus: (id, data) => api.put(`/offers/${id}`, data),
  decline: (id) => api.delete(`/offers/${id}`),
};

// Swap API
export const swapAPI = {
  acceptOffer: (data) => api.post('/swaps', data),
  getAll: (params) => api.get('/swaps', { params }),
  updateStatus: (id, data) => api.put(`/swaps/${id}`, data),
  approveAudit: (id) => api.post(`/swaps/${id}/approve`),
};

// User API
export const userAPI = {
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
};
