import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import {
  deleteNotice,
  getNoticeCategories,
  getNotices,
  resolveAttachmentUrl,
  updateImportantStatus,
  updateNotice,
  uploadAttachment,
} from "../services/api";

function AdminDashboard() {
  const { addToast } = useToast();
  const [notices, setNotices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    isImportant: false,
    attachmentUrl: "",
    publishAt: "",
    expiresAt: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getNoticeCategories({ includeAll: true });
        setCategories(response.data?.data || []);
      } catch (err) {
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getNotices({
        includeAll: true,
        search,
        category,
        status,
        page,
        limit: 8,
      });
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
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [search, category, status, page]);

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteNotice(id);
      addToast({ type: "success", message: "Notice deleted successfully" });
      await loadNotices();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete notice";
      setError(message);
      addToast({ type: "error", message });
    }
  };

  const handleImportantToggle = async (notice) => {
    try {
      await updateImportantStatus(notice._id, !notice.isImportant);
      addToast({
        type: "success",
        message: !notice.isImportant ? "Marked as important" : "Removed important mark",
      });
      await loadNotices();
    } catch (err) {
      addToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update important status",
      });
    }
  };

  const toDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
      date.getMinutes()
    )}`;
  };

  const startEditing = (notice) => {
    setEditingId(notice._id);
    setEditForm({
      title: notice.title,
      description: notice.description,
      category: notice.category,
      isImportant: Boolean(notice.isImportant),
      attachmentUrl: notice.attachmentUrl || "",
      publishAt: toDateInput(notice.publishAt),
      expiresAt: toDateInput(notice.expiresAt),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      title: "",
      description: "",
      category: "",
      isImportant: false,
      attachmentUrl: "",
      publishAt: "",
      expiresAt: "",
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      await updateNotice(editingId, {
        ...editForm,
        publishAt: editForm.publishAt || null,
        expiresAt: editForm.expiresAt || null,
        attachmentUrl: editForm.attachmentUrl || null,
      });
      addToast({ type: "success", message: "Notice updated successfully" });
      cancelEditing();
      await loadNotices();
    } catch (err) {
      addToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update notice",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const response = await uploadAttachment(file);
      setEditForm((prev) => ({ ...prev, attachmentUrl: response.data?.url || "" }));
      addToast({ type: "success", message: "Attachment uploaded" });
    } catch (err) {
      addToast({ type: "error", message: err.response?.data?.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-slate-900 via-indigo-700 to-cyan-700 bg-clip-text text-2xl font-extrabold text-transparent">
            Admin Dashboard
          </h2>
          <p className="text-sm text-slate-600">Create, schedule, archive, and manage notices.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/create" className="btn-primary w-fit">
            Create Notice
          </Link>
          <Link to="/admin/insights" className="btn-secondary w-fit">
            Insights & Reports
          </Link>
        </div>
      </div>

      <div className="panel grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
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
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input-base"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading && (
        <div className="panel p-6">
          <LoadingSpinner label="Loading notices..." />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>
      )}

      {!loading && notices.length === 0 && (
        <div className="panel p-6 text-sm text-slate-600">No notices available.</div>
      )}

      {!loading && notices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {notices.map((notice) => (
            <article
              key={notice._id}
              className={`rounded-2xl border bg-white/90 p-5 shadow-sm ${
                notice.isImportant ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200/70"
              }`}
            >
              {editingId === notice._id ? (
                <form className="space-y-3" onSubmit={handleEditSubmit}>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="input-base"
                    placeholder="Title"
                    required
                  />
                  <input
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="input-base"
                    placeholder="Category"
                    required
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="input-base min-h-28"
                    placeholder="Description"
                    required
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="datetime-local"
                      value={editForm.publishAt}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, publishAt: e.target.value }))}
                      className="input-base"
                    />
                    <input
                      type="datetime-local"
                      value={editForm.expiresAt}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                      className="input-base"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={editForm.isImportant}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, isImportant: e.target.checked }))}
                    />
                    Mark as important
                  </label>
                  <input type="file" accept=".pdf,image/*" onChange={handleAttachment} className="input-base" />
                  {uploading && <p className="text-xs text-slate-500">Uploading...</p>}
                  {editForm.attachmentUrl && (
                    <a
                      href={resolveAttachmentUrl(editForm.attachmentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600"
                    >
                      View Attachment
                    </a>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={saving} className="btn-primary text-xs disabled:opacity-60">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={cancelEditing} className="btn-secondary text-xs">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{notice.category}</p>
                    <span className="chip bg-slate-200 text-slate-700">{notice.status}</span>
                    {notice.isImportant && <span className="chip bg-amber-100 text-amber-700">Important</span>}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{notice.title}</h3>
                  <p className="mb-2 text-sm text-slate-600">{notice.description}</p>
                  {notice.attachmentUrl && (
                    <a
                      href={resolveAttachmentUrl(notice.attachmentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-2 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Open Attachment
                    </a>
                  )}
                  <p className="text-xs text-slate-500">Publish: {new Date(notice.publishAt).toLocaleString()}</p>
                  {notice.expiresAt && <p className="text-xs text-slate-500">Expires: {new Date(notice.expiresAt).toLocaleString()}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">By {notice.createdBy || "admin"}</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => startEditing(notice)} className="btn-secondary text-xs">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImportantToggle(notice)}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-amber-400"
                      >
                        {notice.isImportant ? "Unmark" : "Mark Important"}
                      </button>
                      <button type="button" onClick={() => handleDelete(notice._id)} className="btn-danger text-xs">
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="panel mt-1 flex flex-wrap items-center justify-between gap-3 p-4">
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

export default AdminDashboard;
