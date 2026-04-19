import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import NoticeList from "./pages/NoticeList";
import NoticeDetails from "./pages/NoticeDetails";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/ToastProvider";
import Sidebar from "./components/Sidebar";
import { AUTH_CHANGED_EVENT, getCurrentUser, getStoredTheme, isAuthenticated, saveTheme } from "./services/auth";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-100">
          <h1 className="mb-3 text-xl font-semibold">App Error</h1>
          <pre className="whitespace-pre-wrap break-words">{this.state.error.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppShell() {
  const [theme, setTheme] = useState(getStoredTheme());
  const [user, setUser] = useState(getCurrentUser());
  const [feedMeta, setFeedMeta] = useState({ newCount: 0 });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.body.dataset.theme = theme;
    saveTheme(theme);

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute("content", theme === "dark" ? "#020617" : "#f3f7ff");
    }
  }, [theme]);

  useEffect(() => {
    const sync = () => setUser(getCurrentUser());
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-6 lg:grid-cols-[18rem_1fr]">
        <Sidebar
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          newCount={feedMeta.newCount || 0}
        />

        <main className="rounded-[2rem] border border-slate-200/70 bg-white/75 p-5 shadow-2xl shadow-slate-200/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 dark:shadow-slate-950/30 sm:p-8">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-6 dark:border-white/10">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Welcome back</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                {user?.role === "admin" ? "Administrator Control Room" : "Your Notice Feed"}
              </h2>
            </div>
            <div className="rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              Signed in as <span className="font-semibold text-slate-900 dark:text-white">{user?.username}</span>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<NoticeList onMetaChange={setFeedMeta} />} />
            <Route path="/notices/:id" element={<NoticeDetails />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AppErrorBoundary>
  );
}

export default App;
