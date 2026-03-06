import React, { useState } from "react";
import { useToast } from "../components/ToastProvider";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { createNotice } from "../services/api";

const initialState = {
  title: "",
  description: "",
  category: "",
  isImportant: false,
};

function CreateNoticeForm() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await createNotice(formData);
      addToast({ type: "success", message: "Notice created successfully" });
      navigate("/admin");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create notice";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="bg-gradient-to-r from-slate-900 via-indigo-700 to-cyan-700 bg-clip-text text-2xl font-extrabold text-transparent">
          Create Notice
        </h2>
        <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to dashboard
        </Link>
      </div>

      <div className="panel p-5 sm:p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              placeholder="Enter notice title"
              value={formData.title}
              onChange={handleChange}
              className="input-base"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              placeholder="Ex: Events, Exam, Circular"
              value={formData.category}
              onChange={handleChange}
              className="input-base"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Write notice details"
              value={formData.description}
              onChange={handleChange}
              className="input-base min-h-40"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="isImportant">
            <input
              id="isImportant"
              name="isImportant"
              type="checkbox"
              checked={formData.isImportant}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            Mark this notice as important
          </label>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create Notice"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CreateNoticeForm;
