import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { saveAuth } from "../services/auth";
import { useToast } from "../components/ToastProvider";

const demoAccounts = [
  { label: "Admin", username: "admin", password: "admin123", accent: "from-cyan-400/30 to-sky-500/10" },
  { label: "User", username: "student", password: "student123", accent: "from-amber-300/30 to-rose-400/10" },
];

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login(form);
      saveAuth(response.data.token, response.data.user);
      addToast({ type: "success", message: "Welcome back to the notice board" });
      const redirectTo =
        location.state?.from?.pathname || (response.data.user.role === "admin" ? "/admin" : "/");
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Login failed";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid min-h-screen gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.25),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_24%),rgba(2,6,23,0.82)] p-8 shadow-2xl shadow-cyan-950/30">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Digital Notice Board</p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-tight text-white">
            A premium command center for campus announcements.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Publish instant updates, schedule future notices, spotlight critical alerts, and give students a
            delightful reading experience on every device.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {demoAccounts.map((account) => (
            <button
              key={account.label}
              type="button"
              onClick={() => setForm({ username: account.username, password: account.password })}
              className={`rounded-3xl border border-white/10 bg-gradient-to-br ${account.accent} p-5 text-left transition hover:-translate-y-1`}
            >
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">{account.label} access</p>
              <p className="mt-4 text-xl font-semibold text-white">{account.username}</p>
              <p className="mt-2 text-sm text-slate-300">{account.password}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.36em] text-cyan-300">Sign in</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Enter your workspace</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Use the seeded credentials or replace them later with your own MongoDB-backed accounts.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Username</span>
              <input
                className="input-base"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="admin"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
              <input
                type="password"
                className="input-base"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="••••••••"
                required
              />
            </label>

            {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? "Signing in..." : "Access Notice Board"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
