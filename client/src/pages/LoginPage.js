import React, { useState } from "react";
import { useToast } from "../components/ToastProvider";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { saveAuth } from "../services/auth";

function LoginPage() {
  const { addToast } = useToast();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await login(credentials);
      saveAuth(response.data.token, response.data.user);
      addToast({ type: "success", message: "Login successful" });
      if (["superadmin", "admin", "editor"].includes(response.data.user?.role)) {
        navigate("/admin");
      } else if (response.data.user?.role === "viewer") {
        navigate("/admin/insights");
      } else {
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-lg backdrop-blur sm:p-8">
      <h2 className="mb-1 bg-gradient-to-r from-slate-900 via-indigo-700 to-cyan-700 bg-clip-text text-2xl font-extrabold text-transparent">
        Login
      </h2>
      <div className="mb-6" />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            placeholder="Enter username"
            value={credentials.username}
            onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
            className="input-base"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={credentials.password}
            onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
            className="input-base"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
}

export default LoginPage;
