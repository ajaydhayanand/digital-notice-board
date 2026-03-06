const TOKEN_KEY = "dnb_token";
const USER_KEY = "dnb_user";
const AUTH_EVENT = "dnb-auth-changed";

export const saveAuth = (token, user) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user || null));
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getCurrentUser = () => {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};
export const getUserRole = () => getCurrentUser()?.role || "";
export const isAdmin = () => getUserRole() === "admin";

export const logout = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
  window.location.href = "/";
};

export const isAuthenticated = () => Boolean(getToken());
export const AUTH_CHANGED_EVENT = AUTH_EVENT;
