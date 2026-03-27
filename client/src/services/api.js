import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const backendOrigin = (
  process.env.REACT_APP_BACKEND_ORIGIN ||
  process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000"
).replace(/\/$/, "");

export const resolveAttachmentUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${backendOrigin}${url.startsWith("/") ? url : `/${url}`}`;
};

export const login = (payload) => api.post("/auth/login", payload);
export const getMe = () => api.get("/auth/me");

export const getNotices = (params = {}) => api.get("/notices", { params });
export const getNoticeById = (id) => api.get(`/notices/${id}`);
export const createNotice = (payload) => api.post("/notices", payload);
export const updateNotice = (id, payload) => api.put(`/notices/${id}`, payload);
export const deleteNotice = (id) => api.delete(`/notices/${id}`);
export const toggleImportant = (id, isImportant) => api.patch(`/notices/${id}/important`, { isImportant });
export const toggleBookmark = (id) => api.patch(`/notices/${id}/bookmark`);
export const toggleRead = (id, isRead) => api.patch(`/notices/${id}/read`, { isRead });
export const markFeedSeen = () => api.post("/notices/feed/seen");

export const getAdminDashboard = () => api.get("/admin/dashboard");
export const getAdminNotices = (params = {}) => api.get("/admin/notices", { params });
export const uploadAttachment = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/admin/attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export default api;
