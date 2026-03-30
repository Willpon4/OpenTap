const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${API_PREFIX}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('opentap_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Fountains
  getFountains: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/fountains?${query}`);
  },
  getFountain: (id) => request(`/fountains/${id}`),
  getNearbyFountains: (lat, lng, radius = 1000) =>
    request(`/fountains/nearby?lat=${lat}&lng=${lng}&radius_m=${radius}`),

  // Reports
  createReport: (data) =>
    request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getReport: (id) => request(`/reports/${id}`),

  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports?${query}`);
  },

  // Admin
  login: (email, password) =>
    request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getDashboard: () => request('/admin/dashboard'),
  getAdminReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/reports?${query}`);
  },
  updateReportStatus: (id, status, notes = '') =>
    request(`/admin/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Cities
  getCities: () => request('/cities'),
  getCityScorecard: (id) => request(`/cities/${id}/scorecard`),
};
