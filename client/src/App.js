import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import NoticeList from "./pages/NoticeList";
import NoticeDetails from "./pages/NoticeDetails";
import AdminDashboard from "./pages/AdminDashboard";
import CreateNoticeForm from "./pages/CreateNoticeForm";
import LoginPage from "./pages/LoginPage";
import AdminInsights from "./pages/AdminInsights";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/ToastProvider";
import {
  AUTH_CHANGED_EVENT,
  canManageNotices,
  getCurrentUser,
  isAdmin,
  isAuthenticated,
  logout,
} from "./services/auth";

function App() {
  const [authState, setAuthState] = useState({
    authenticated: isAuthenticated(),
    user: getCurrentUser(),
    admin: isAdmin(),
    manager: canManageNotices(),
  });

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState({
        authenticated: isAuthenticated(),
        user: getCurrentUser(),
        admin: isAdmin(),
        manager: canManageNotices(),
      });
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
  }, []);

  const { authenticated, user: currentUser, admin, manager } = authState;

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="bg-gradient-to-r from-slate-900 via-indigo-700 to-cyan-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Digital Notice Board
            </h1>
            <nav className="flex flex-wrap items-center gap-2">
              <Link
                to="/"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Notices
              </Link>
              {admin && (
                <Link
                  to={manager ? "/admin" : "/admin/insights"}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Admin Dashboard
                </Link>
              )}
              {admin && (
                <Link
                  to="/admin/insights"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Insights
                </Link>
              )}
              {authenticated && (
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {currentUser?.role || "user"}
                </span>
              )}
              {!authenticated ? (
                <Link
                  to="/login"
                  className="btn-primary"
                >
                  Login
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={logout}
                  className="btn-danger"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["student", "viewer", "editor", "admin", "superadmin"]}>
                  <NoticeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notices/:id"
              element={
                <ProtectedRoute allowedRoles={["student", "viewer", "editor", "admin", "superadmin"]}>
                  <NoticeDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["editor", "admin", "superadmin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/insights"
              element={
                <ProtectedRoute allowedRoles={["viewer", "editor", "admin", "superadmin"]}>
                  <AdminInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create"
              element={
                <ProtectedRoute allowedRoles={["editor", "admin", "superadmin"]}>
                  <CreateNoticeForm />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
