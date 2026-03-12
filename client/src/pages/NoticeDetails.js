import React, { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getNoticeById, resolveAttachmentUrl, updateReadStatus } from "../services/api";

function NoticeDetails() {
  const { addToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotice = async () => {
      try {
        const response = await getNoticeById(id);
        setNotice(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch notice details");
      } finally {
        setLoading(false);
      }
    };

    loadNotice();
  }, [id]);

  if (loading) {
    return (
      <div className="panel p-6">
        <LoadingSpinner label="Loading notice details..." />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>;
  }

  if (!notice) {
    return <div className="panel p-6 text-sm text-slate-600">Notice not found.</div>;
  }

  const handleReadToggle = async () => {
    try {
      const nextStatus = !notice.isRead;
      await updateReadStatus(id, nextStatus);
      setNotice((prev) => ({ ...prev, isRead: nextStatus }));
      addToast({
        type: "success",
        message: nextStatus ? "Marked as read" : "Marked as unread",
      });
    } catch (err) {
      addToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update read status",
      });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          Back
        </button>
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          All notices
        </Link>
      </div>

      <article className="panel p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">{notice.title}</h2>
        <p className="whitespace-pre-wrap leading-7 text-slate-700">{notice.description}</p>
        {notice.attachmentUrl && (
          <a
            href={resolveAttachmentUrl(notice.attachmentUrl)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Open attachment
          </a>
        )}
        <div className="mt-6 grid gap-1 text-xs text-slate-500 sm:text-sm">
          <p>Created by: {notice.createdBy || "admin"}</p>
          <p>Status: {notice.status || "published"}</p>
          <p>Publish at: {notice.publishAt ? new Date(notice.publishAt).toLocaleString() : "-"}</p>
          {notice.expiresAt && <p>Expires at: {new Date(notice.expiresAt).toLocaleString()}</p>}
          <p>Created at: {new Date(notice.createdAt).toLocaleString()}</p>
        </div>
        <button
          type="button"
          onClick={handleReadToggle}
          className="btn-secondary mt-5"
        >
          Mark as {notice.isRead ? "Unread" : "Read"}
        </button>
      </article>
    </section>
  );
}

export default NoticeDetails;
