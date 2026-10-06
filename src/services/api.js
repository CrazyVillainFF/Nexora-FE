import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors and handle expired auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized / token expired and not on public pages
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname.includes('/signin') || window.location.pathname.includes('/signup');
      if (!isAuthRoute && localStorage.getItem('nexora_token')) {
        console.warn('Session expired or unauthorized. Clearing stored auth.');
        localStorage.removeItem('nexora_token');
        localStorage.removeItem('nexora_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);

// ================= AUTH APIs =================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

// ================= USER APIs =================
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getSuggested: () => api.get('/users/suggested'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadCover: (formData) =>
    api.post('/users/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  search: (query) => api.get('/users/search', { params: { q: query } }),
  updateSettings: (data) => api.put('/users/settings', data),
};

// ================= POST APIs =================
export const postAPI = {
  createPost: (formDataOrData) => {
    const isFormData = formDataOrData instanceof FormData;
    return api.post('/posts', formDataOrData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  getFeed: (params) => api.get('/posts/feed', { params }),
  getUserPosts: (userId, params) => api.get(`/posts/user/${userId}`, { params }),
  getPostById: (id) => api.get(`/posts/${id}`),
  updatePost: (id, formDataOrData) => {
    const isFormData = formDataOrData instanceof FormData;
    return api.put(`/posts/${id}`, formDataOrData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  deletePost: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
};

// ================= COMMENT APIs =================
export const commentAPI = {
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  getPostComments: (postId) => api.get(`/posts/${postId}/comments`),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

// ================= CONNECTION APIs =================
export const connectionAPI = {
  sendRequest: (userId) => api.post(`/connections/${userId}`),
  acceptRequest: (requestIdOrUserId) => api.put(`/connections/${requestIdOrUserId}/accept`),
  rejectOrRemove: (requestIdOrUserId) => api.delete(`/connections/${requestIdOrUserId}`),
  getConnections: () => api.get('/connections'),
};

// ================= NOTIFICATION APIs =================
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default api;
