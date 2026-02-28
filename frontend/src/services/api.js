/**
 * CivicLens AI — API Service Layer
 * Handles all HTTP requests to the FastAPI backend.
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civiclens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civiclens_token');
      localStorage.removeItem('civiclens_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getPreferences: () => api.get('/auth/preferences'),
  addPreference: (data) => api.post('/auth/preferences', data),
};

// ── Dashboard ────────────────────────────────────
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getWhatsRelevant: () => api.get('/whats-relevant'),
};

// ── Schemes ──────────────────────────────────────
export const schemesAPI = {
  getSchemes: (params) => api.get('/schemes', { params }),
  getSchemeDetail: (id) => api.get(`/schemes/${id}`),
  getUpdates: (limit = 20) => api.get('/updates', { params: { limit } }),
};

// ── Alerts ───────────────────────────────────────
export const alertsAPI = {
  getAlerts: (unreadOnly = false) => api.get('/alerts', { params: { unread_only: unreadOnly } }),
  markRead: (id) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
  getCount: () => api.get('/alerts/count'),
};

// ── AI Chat ──────────────────────────────────────
export const chatAPI = {
  ask: (question, context = null) => api.post('/ask', { question, context }),
  summarize: (text) => api.post('/summarize', { text }),
};

// ── Admin ────────────────────────────────────────
export const adminAPI = {
  getCrawlSources: () => api.get('/admin/crawl-sources'),
  addCrawlSource: (data) => api.post('/admin/crawl-sources', data),
  toggleSource: (id) => api.put(`/admin/crawl-sources/${id}/toggle`),
  deleteSource: (id) => api.delete(`/admin/crawl-sources/${id}`),
  triggerCrawl: () => api.post('/admin/trigger-crawl'),
  getCrawlStats: () => api.get('/admin/crawl-stats'),
};

export default api;
