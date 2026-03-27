import React, { useEffect, useState } from "react";
import { CalendarClock, Plus, Save, Star, Trash2, UploadCloud } from "lucide-react";
import SkeletonCard from "../components/SkeletonCard";
import StatCard from "../components/StatCard";
import {
  createNotice,
  deleteNotice,
  getAdminDashboard,
  getAdminNotices,
  toggleImportant,
  updateNotice,
  uploadAttachment,
} from "../services/api";
import { useToast } from "../components/ToastProvider";

const emptyForm = {
  title: "",
  description: "",
  attachmentUrl: "",
  isImportant: false,
  publishAt: "",
};

function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    totalNotices: 0,
    importantNotices: 0,
    scheduledNotices: 0,
    publishedNotices: 0,
  });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadDashboard = async () => {
    const [statsResponse, noticesResponse] = await Promise.all([
      getAdminDashboard(),
      getAdminNotices({ page, status, search: query, limit: 6 }),
    ]);

    setStats(statsResponse.data.stats || {});
    setItems(noticesResponse.data.items || []);
    setMeta(noticesResponse.data.meta || { page: 1, totalPages: 1 });
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await loadDashboard();
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [page, status, query]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        publishAt: form.publishAt || null,
      };

      if (editingId) {
        await updateNotice(editingId, payload);
        addToast({ type: "success", message: "Notice updated successfully" });
      } else {
        await createNotice(payload);
        addToast({ type: "success", message: "Notice created successfully" });
      }

      resetForm();
      await loadDashboard();
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Unable to save notice" });
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (notice) => {
    setEditingId(notice.id);
    setForm({
      title: notice.rawTitle || "",
      description: notice.description,
      attachmentUrl: notice.attachmentUrl || "",
      isImportant: Boolean(notice.isImportant),
      publishAt: notice.publishAt ? new Date(notice.publishAt).toISOString().slice(0, 16) : "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotice(id);
      addToast({ type: "success", message: "Notice deleted successfully" });
      await loadDashboard();
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Delete failed" });
    }
  };

  const handleImportantToggle = async (notice) => {
    try {
      await toggleImportant(notice.id, !notice.isImportant);
      addToast({
        type: "success",
        message: !notice.isImportant ? "Notice marked important" : "Important label removed",
      });
      await loadDashboard();
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Update failed" });
    }
  };

  const handleAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await uploadAttachment(file);
      setForm((current) => ({ ...current, attachmentUrl: response.data.url }));
      addToast({ type: "success", message: "Attachment uploaded" });
    } catch (requestError) {
      addToast({ type: "error", message: requestError.response?.data?.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.15),transparent_24%),rgba(15,23,42,0.78)] p-8">
          <p className="text-xs uppercase tracking-[0.38em] text-cyan-300">Admin studio</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">Create, schedule, and spotlight notices.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Shape the entire notice experience from one premium workspace. Schedule future posts, upload
            attachments, and elevate critical information with one click.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                {editingId ? "Edit notice" : "Create notice"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Notice composer</h3>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <input
              className="input-base"
              placeholder="Optional title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              className="input-base min-h-36"
              placeholder="Write the notice message"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Publish time</span>
                <input
                  type="datetime-local"
                  className="input-base"
                  value={form.publishAt}
                  onChange={(event) => setForm((current) => ({ ...current, publishAt: event.target.value }))}
                />
                <p className="mt-2 text-xs text-slate-400">Leave empty to publish immediately.</p>
              </label>
              <label className="flex items-end gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white">
                <input
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={(event) => setForm((current) => ({ ...current, isImportant: event.target.checked }))}
                />
                Mark this notice as important
              </label>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/5 px-4 py-4 text-sm text-cyan-100">
              <span className="inline-flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                {uploading ? "Uploading..." : form.attachmentUrl ? "Replace attachment" : "Upload PDF or image"}
              </span>
              <input type="file" accept=".pdf,image/*" onChange={handleAttachment} className="hidden" />
            </label>
            <p className="text-xs text-slate-400">Attachment is optional. You can send a message-only notice.</p>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? (
                "Saving..."
              ) : editingId ? (
                <>
                  <Save className="h-4 w-4" />
                  Update Notice
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Publish Notice
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Notices" value={stats.totalNotices || 0} accent="border-white/10 bg-white/5" />
        <StatCard label="Important" value={stats.importantNotices || 0} accent="border-amber-300/20 bg-amber-300/10" />
        <StatCard label="Scheduled" value={stats.scheduledNotices || 0} accent="border-cyan-300/20 bg-cyan-300/10" />
        <StatCard label="Published" value={stats.publishedNotices || 0} accent="border-emerald-300/20 bg-emerald-300/10" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.7fr]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input-base"
          placeholder="Search all notices"
        />
        <div className="grid grid-cols-3 gap-3">
          {["all", "published", "scheduled"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                status === value
                  ? "border-cyan-300/60 bg-cyan-300 text-slate-950"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((notice) => (
            <article
              key={notice.id}
              className={`rounded-3xl border p-5 ${
                notice.isImportant ? "border-amber-300/30 bg-amber-300/10" : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{notice.status}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{notice.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleImportantToggle(notice)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-amber-200 transition hover:bg-white/10"
                >
                  <Star className={`h-4 w-4 ${notice.isImportant ? "fill-current" : ""}`} />
                </button>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {notice.description.length > 220 ? `${notice.description.slice(0, 220)}...` : notice.description}
              </p>
              <div className="mt-6 space-y-2 text-xs text-slate-400">
                <p className="inline-flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  {new Date(notice.publishAt).toLocaleString()}
                </p>
                <p>Created by {notice.createdBy}</p>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => beginEdit(notice)} className="btn-secondary flex-1 justify-center">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(notice.id)} className="btn-danger flex-1 justify-center">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-300">
          Page {meta.page || 1} of {meta.totalPages || 1}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={(meta.page || 1) <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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

export default AdminDashboard;
