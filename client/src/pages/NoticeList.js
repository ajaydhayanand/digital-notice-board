import React, { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import NoticeCard from "../components/NoticeCard";
import { getNoticeCategories, getNotices } from "../services/api";
import { getToken } from "../services/auth";

function NoticeList() {
  const [notices, setNotices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [readStatus, setReadStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await getNoticeCategories();
      setCategories(response.data?.data || []);
    } catch (err) {
      setCategories([]);
    }
  }, []);

  const loadNotices = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      try {
        const response = await getNotices({
          search,
          category,
          readStatus,
          page,
          limit: 9,
        });

        if (Array.isArray(response.data)) {
          setNotices(response.data);
          setPagination({
            page: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            total: response.data.length,
          });
        } else {
          setNotices(response.data?.data || []);
          setPagination(
            response.data?.pagination || {
              page: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
              total: 0,
            }
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch notices");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [search, category, readStatus, page]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    const stream = new EventSource(`/api/notices/stream?token=${encodeURIComponent(token)}`);

    stream.onmessage = async (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.type === "notice_changed") {
          await loadNotices({ silent: true });
          await loadCategories();
        }
      } catch (error) {
        // Ignore malformed event payloads.
      }
    };

    stream.onerror = () => {
      // Browser will auto-reconnect for EventSource; no action needed here.
    };

    return () => stream.close();
  }, [loadNotices, loadCategories]);

  useEffect(() => {
    // Fallback sync in case SSE is blocked by browser/proxy/network.
    const noticeInterval = window.setInterval(() => {
      loadNotices({ silent: true });
    }, 4000);

    const categoryInterval = window.setInterval(() => {
      loadCategories();
    }, 15000);

    return () => {
      window.clearInterval(noticeInterval);
      window.clearInterval(categoryInterval);
    };
  }, [loadNotices, loadCategories]);

  if (loading) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Latest Notices</h2>
        <div className="panel p-6">
          <LoadingSpinner label="Loading notices..." />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Latest Notices</h2>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-800 to-cyan-700 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold sm:text-3xl">Latest Notices</h2>
        <p className="mt-1 text-sm text-slate-100">Stay updated with announcements, events, and important updates.</p>
      </div>

      <div className="panel mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search notices..."
          className="input-base sm:col-span-2"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="input-base"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Unread", value: "unread" },
          { label: "Read", value: "read" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setReadStatus(item.value);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              readStatus === item.value
                ? "bg-slate-900 text-white shadow"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notices.length === 0 ? (
        <div className="panel p-6 text-sm text-slate-600">No notices available.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notices.map((notice) => (
            <NoticeCard key={notice._id} notice={notice} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="panel mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
            {typeof pagination.total === "number" ? ` (${pagination.total} total)` : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrevPage}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default NoticeList;
