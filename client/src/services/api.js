import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

const getBackendOrigin = () => {
  const configured = process.env.REACT_APP_BACKEND_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const apiBase = process.env.REACT_APP_API_URL || "/api";
  if (/^https?:\/\//i.test(apiBase)) {
    try {
      return new URL(apiBase).origin;
    } catch (error) {
      return "";
    }
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

export const resolveAttachmentUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const origin = getBackendOrigin();
  if (!origin) return url;
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${normalized}`;
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (payload) => api.post("/auth/login", payload);

export const getNotices = (params = {}) => api.get("/notices", { params });
export const getNoticeCategories = (params = {}) => api.get("/notices/categories", { params });
export const getNoticeById = (id) => api.get(`/notices/${id}`);
export const createNotice = (payload) => api.post("/notices", payload);
export const updateNotice = (id, payload) => api.put(`/notices/${id}`, payload);
export const deleteNotice = (id) => api.delete(`/notices/${id}`);
export const updateReadStatus = (id, isRead) => api.patch(`/notices/${id}/read-status`, { isRead });
export const updateImportantStatus = (id, isImportant) => api.patch(`/notices/${id}/important`, { isImportant });

export const uploadAttachment = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/admin/attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAnalytics = () => api.get("/admin/analytics");
export const getAuditLogs = (params = {}) => api.get("/admin/audit-logs", { params });
export const subscribeNotification = (payload) => api.post("/admin/notifications/subscribe", payload);
export const getNotificationLogs = (params = {}) => api.get("/admin/notifications/logs", { params });

export const getNoticesCsvUrl = () =>
  `${process.env.REACT_APP_API_URL || "/api"}/admin/reports/notices.csv`;
export const getAnalyticsCsvUrl = () =>
  `${process.env.REACT_APP_API_URL || "/api"}/admin/reports/analytics.csv`;
export const getPrintableReportUrl = () =>
  `${process.env.REACT_APP_API_URL || "/api"}/admin/reports/notices-print`;
export const downloadNoticesCsv = () =>
  api.get("/admin/reports/notices.csv", { responseType: "blob" });
export const downloadAnalyticsCsv = () =>
  api.get("/admin/reports/analytics.csv", { responseType: "blob" });
export const fetchPrintableReport = () =>
  api.get("/admin/reports/notices-print", { responseType: "text" });

export default api;
