import React from "react";
import { BellRing, LayoutDashboard, LogOut, MoonStar, SunMedium } from "lucide-react";
import { NavLink } from "react-router-dom";
import { isAdmin, logout } from "../services/auth";

function Sidebar({ theme, onToggleTheme, newCount }) {
  const admin = isAdmin();

  const navClass = ({ isActive }) =>
    `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-950"
        : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
    }`;

  return (
    <aside className="w-full rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-2xl shadow-slate-200/70 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-cyan-950/30 lg:w-72">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Digital Notice Board</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Campus Pulse</h1>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.9),rgba(14,116,144,0.2))] shadow-lg shadow-cyan-500/30" />
      </div>

      <nav className="space-y-2">
        <NavLink to="/" className={navClass}>
          <span className="inline-flex items-center gap-3">
            <BellRing className="h-4 w-4" />
            Notice Feed
          </span>
          {newCount > 0 && (
            <span className="rounded-full bg-rose-400 px-2 py-1 text-[10px] font-bold text-white">{newCount}</span>
          )}
        </NavLink>
        {admin && (
          <NavLink to="/admin" className={navClass}>
            <span className="inline-flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4" />
              Admin Studio
            </span>
          </NavLink>
        )}
      </nav>

      <div className="mt-8 rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Theme</p>
        <button
          type="button"
          onClick={onToggleTheme}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
          {theme === "dark" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}

export default Sidebar;
