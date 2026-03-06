import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (payload) => api.post("/auth/login", payload);

export const getNotices = (params = {}) => api.get("/notices", { params });
export const getNoticeCategories = () => api.get("/notices/categories");
export const getNoticeById = (id) => api.get(`/notices/${id}`);
export const createNotice = (payload) => api.post("/notices", payload);
export const updateNotice = (id, payload) => api.put(`/notices/${id}`, payload);
export const deleteNotice = (id) => api.delete(`/notices/${id}`);
export const updateReadStatus = (id, isRead) => api.patch(`/notices/${id}/read-status`, { isRead });
export const updateImportantStatus = (id, isImportant) => api.patch(`/notices/${id}/important`, { isImportant });

export default api;
