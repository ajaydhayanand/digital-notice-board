import React, { useCallback, useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import NoticeCard from "../components/NoticeCard";
import SkeletonCard from "../components/SkeletonCard";
import { getNotices, markFeedSeen, toggleBookmark, toggleRead } from "../services/api";
import { useToast } from "../components/ToastProvider";

const POLL_INTERVAL_MS = 5000;

function NoticeList({ onMetaChange }) {
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, newCount: 0, unreadCount: 0, bookmarkedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadNotices = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await getNotices({ search: query, filter, page, limit: 6 });
        setItems(response.data.items || []);
        setMeta(response.data.meta || {});
        onMetaChange?.(response.data.meta || {});
        if (!silent) {
          markFeedSeen().catch(() => {});
        }
        setError("");
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load notices");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filter, onMetaChange, page, query]
  );

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  useEffect(() => {
    const refreshSilently = () => {
      if (document.visibilityState === "visible") {
        loadNotices({ silent: true });
      }
    };

    const intervalId = window.setInterval(refreshSilently, POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshSilently);
    document.addEventListener("visibilitychange", refreshSilently);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshSilently);
      document.removeEventListener("visibilitychange", refreshSilently);
    };
  }, [loadNotices]);

  const handleBookmark = async (id) => {
    try {
      const response = await toggleBookmark(id);
      addToast({ type: "success", message: response.data.message });
      await loadNotices({ silent: true });
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Bookmark update failed" });
    }
  };

  const handleRead = async (id, isRead) => {
    try {
      const response = await toggleRead(id, isRead);
      addToast({ type: "success", message: response.data.message });
      await loadNotices({ silent: true });
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Read status update failed" });
    }
  };

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.18),transparent_22%),rgba(255,255,255,0.9)] p-8 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.18),transparent_22%),rgba(2,6,23,0.72)]">
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Student feed</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">Catch every update before it slips by.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Browse announcements, bookmark the ones you care about, and spot important updates instantly with
            glowing priority cards and fresh-notice badges.
          </p>
        </div>
        <div className="absolute -right-6 top-6 hidden h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl lg:block" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input-base pl-11"
            placeholder="Search notices, events, and circulars"
          />
        </label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
          {[
            { key: "all", label: "All" },
            { key: "important", label: "Important" },
            { key: "latest", label: "Latest" },
            { key: "bookmarked", label: "Bookmarks" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setFilter(option.key);
                setPage(1);
              }}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                filter === option.key
                  ? "border-cyan-300/60 bg-cyan-300 text-slate-950"
                  : "border-slate-200/70 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Unread</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">{meta.unreadCount || 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Bookmarks</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">{meta.bookmarkedCount || 0}</p>
        </div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-amber-100">
            <Sparkles className="h-4 w-4" />
            New notices
          </p>
          <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">{meta.newCount || 0}</p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-100">Auto-refreshes every 5 seconds</p>
        </div>
      </div>

      {error && <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-10 text-center text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          No notices match your current filters.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onBookmarkToggle={handleBookmark} onReadToggle={handleRead} compact />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Page {meta.page || 1} of {meta.totalPages || 1}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={(meta.page || 1) <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={(meta.page || 1) >= (meta.totalPages || 1)}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default NoticeList;
