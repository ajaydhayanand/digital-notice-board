import React, { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { getNoticeById, resolveAttachmentUrl, toggleBookmark, toggleRead } from "../services/api";
import { useToast } from "../components/ToastProvider";

function NoticeDetails() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotice = async () => {
    try {
      setLoading(true);
      const response = await getNoticeById(id);
      setNotice(response.data.notice);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load notice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotice();
  }, [id]);

  const handleBookmark = async () => {
    try {
      const response = await toggleBookmark(id);
      addToast({ type: "success", message: response.data.message });
      await loadNotice();
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Bookmark update failed" });
    }
  };

  const handleReadToggle = async () => {
    try {
      const response = await toggleRead(id, !notice.isRead);
      addToast({ type: "success", message: response.data.message });
      await loadNotice();
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Read status update failed" });
    }
  };

  if (loading) return <LoadingSpinner label="Loading notice details..." />;

  if (error) {
    return <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>;
  }

  return (
    <section className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-cyan-100">
        <ArrowLeft className="h-4 w-4" />
        Back to notices
      </Link>

      <article className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%),rgba(255,255,255,0.9)] p-8 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_28%),rgba(15,23,42,0.8)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {notice.isImportant && (
              <span className="inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-amber-700 dark:text-amber-100">
                Important Notice
              </span>
            )}
            <h1 className="mt-5 text-4xl font-semibold text-slate-900 dark:text-white">{notice.title || "Notice"}</h1>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Published {new Date(notice.publishAt).toLocaleString()} by {notice.createdBy}
            </p>
          </div>

          <button
            type="button"
            onClick={handleBookmark}
            className="rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            {notice.isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-base leading-8 text-slate-700 dark:border-white/10 dark:bg-black/20 dark:text-slate-200">
          {notice.description}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={handleReadToggle} className="btn-secondary">
            Mark as {notice.isRead ? "Unread" : "Read"}
          </button>
          {notice.attachmentUrl && (
            <a
              href={resolveAttachmentUrl(notice.attachmentUrl)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              Open Attachment
            </a>
          )}
        </div>
      </article>
    </section>
  );
}

export default NoticeDetails;
