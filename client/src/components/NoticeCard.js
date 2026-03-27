import React from "react";
import { Bookmark, BookmarkCheck, Clock3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveAttachmentUrl } from "../services/api";

function NoticeCard({ notice, onBookmarkToggle, onReadToggle, compact = false }) {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl ${
        notice.isImportant
          ? "border-amber-300/50 bg-amber-200/10 shadow-glow animate-pulse-soft"
          : "border-white/10 bg-white/5"
      } ${notice.isRead ? "opacity-90" : ""}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_30%)] opacity-70" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {notice.isImportant && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Important
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                {notice.status}
              </span>
              {!notice.isRead && (
                <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-200">
                  New
                </span>
              )}
            </div>
            <h3 className="text-xl font-semibold text-white">{notice.title || "Notice"}</h3>
          </div>

          <button
            type="button"
            onClick={() => onBookmarkToggle?.(notice.id)}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            {notice.isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        <p className="text-sm leading-7 text-slate-300">
          {compact && notice.description.length > 180 ? `${notice.description.slice(0, 180)}...` : notice.description}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {new Date(notice.publishAt).toLocaleString()}
          </span>
          <span>By {notice.createdBy}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/notices/${notice.id}`}
            className="inline-flex items-center rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Read Notice
          </Link>
          <button
            type="button"
            onClick={() => onReadToggle?.(notice.id, !notice.isRead)}
            className="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/8"
          >
            Mark as {notice.isRead ? "Unread" : "Read"}
          </button>
          {notice.attachmentUrl && (
            <a
              href={resolveAttachmentUrl(notice.attachmentUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
            >
              Open Attachment
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default NoticeCard;
