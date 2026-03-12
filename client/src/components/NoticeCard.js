import React from "react";
import { Link } from "react-router-dom";
import { resolveAttachmentUrl } from "../services/api";

function NoticeCard({ notice }) {
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        notice.isImportant ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200/70"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{notice.category}</p>
        {notice.isImportant && (
          <span className="chip bg-amber-100 text-amber-700">
            Important
          </span>
        )}
        <span
          className={`chip ${
            notice.isRead ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
          }`}
        >
          {notice.isRead ? "Read" : "Unread"}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{notice.title}</h3>
      <p className="mb-4 text-sm text-slate-600">
        {notice.description.slice(0, 160)}
        {notice.description.length > 160 ? "..." : ""}
      </p>
      {notice.attachmentUrl && (
        <a
          href={resolveAttachmentUrl(notice.attachmentUrl)}
          target="_blank"
          rel="noreferrer"
          className="mb-3 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Open Attachment
        </a>
      )}
      <div className="mt-auto flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">By {notice.createdBy || "admin"}</p>
        <Link
          to={`/notices/${notice._id}`}
          className="btn-primary text-xs"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export default NoticeCard;
