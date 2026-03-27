const TOKEN_KEY = "digital-notice-board-token";
const USER_KEY = "digital-notice-board-user";
const AUTH_EVENT = "digital-notice-board-auth";
const THEME_KEY = "digital-notice-board-theme";

export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getCurrentUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => Boolean(getToken());
export const isAdmin = () => getCurrentUser()?.role === "admin";
export const logout = () => clearAuth();
export const AUTH_CHANGED_EVENT = AUTH_EVENT;

export const getStoredTheme = () => localStorage.getItem(THEME_KEY) || "dark";
export const saveTheme = (theme) => localStorage.setItem(THEME_KEY, theme);
