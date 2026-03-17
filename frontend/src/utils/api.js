import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Users API ─────────────────────────────────────────────────
export const usersAPI = {
  list: (q) => (q ? api.get(`/users?q=${encodeURIComponent(q)}`) : api.get('/users')),
  search: (q) => api.get(`/users/search?q=${q}`),
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.put('/users/password', data),
  requestPasswordOtp: () => api.post('/users/password/otp'),
};

// ─── Friends API ───────────────────────────────────────────────
export const friendsAPI = {
  getFriends: () => api.get('/friends'),
  getPendingRequests: () => api.get('/friends/requests/pending'),
  getSentRequests: () => api.get('/friends/requests/sent'),
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  acceptRequest: (id) => api.put(`/friends/accept/${id}`),
  rejectRequest: (id) => api.put(`/friends/reject/${id}`),
  cancelRequest: (userId) => api.delete(`/friends/cancel/${userId}`),
  removeFriend: (userId) => api.delete(`/friends/${userId}`),
};

// ─── Messages API ──────────────────────────────────────────────
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (convId, page = 1, options = {}) => {
    if (options.isGroup) return api.get(`/groups/${convId}/messages?page=${page}`);
    return api.get(`/messages/${convId}?page=${page}`);
  },
  sendMessage: (convId, data, options = {}) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.replyToId) formData.append('replyToId', data.replyToId);
    if (data.file) formData.append('file', data.file);
    const endpoint = options.isGroup ? `/groups/${convId}/messages` : `/messages/${convId}`;
    return api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  editMessage: (msgId, content) => api.put(`/messages/${msgId}`, { content }),
  deleteForMe: (msgId) => api.delete(`/messages/${msgId}/me`),
  deleteForEveryone: (msgId) => api.delete(`/messages/${msgId}/everyone`),
};

// ─── Groups API ───────────────────────────────────────────────
export const groupsAPI = {
  list: () => api.get('/groups'),
  getById: (groupId) => api.get(`/groups/${groupId}`),
  create: (payload) => api.post('/groups', payload),
  update: (groupId, payload) => api.put(`/groups/${groupId}`, payload),
  updateAvatar: (groupId, formData) => api.put(`/groups/${groupId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  transferAdmin: (groupId, userId) => api.put(`/groups/${groupId}/admin`, { userId }),
  leave: (groupId) => api.delete(`/groups/${groupId}/leave`),
  addMember: (groupId, userId) => api.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
};

export default api;
