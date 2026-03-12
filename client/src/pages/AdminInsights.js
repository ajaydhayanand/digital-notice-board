import React, { useEffect, useState } from "react";
import { useToast } from "../components/ToastProvider";
import {
  downloadAnalyticsCsv,
  downloadNoticesCsv,
  fetchPrintableReport,
  getAnalytics,
  getAuditLogs,
  getNotificationLogs,
  subscribeNotification,
} from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

function AdminInsights() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [form, setForm] = useState({ channel: "email", destination: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, auditsRes, logsRes] = await Promise.all([
        getAnalytics(),
        getAuditLogs({ limit: 15 }),
        getNotificationLogs({ limit: 15 }),
      ]);
      setAnalytics(analyticsRes.data?.data || null);
      setAuditLogs(auditsRes.data?.data || []);
      setNotificationLogs(logsRes.data?.data || []);
    } catch (error) {
      addToast({ type: "error", message: "Failed to load insights" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubscribe = async (event) => {
    event.preventDefault();
    try {
      await subscribeNotification(form);
      setForm((prev) => ({ ...prev, destination: "" }));
      addToast({ type: "success", message: "Notification destination saved" });
      await loadData();
    } catch (error) {
      addToast({ type: "error", message: error.response?.data?.message || "Failed to save subscription" });
    }
  };

  const handleDownloadNotices = async () => {
    const res = await downloadNoticesCsv();
    saveBlob(res.data, "notices-report.csv");
  };

  const handleDownloadAnalytics = async () => {
    const res = await downloadAnalyticsCsv();
    saveBlob(res.data, "analytics-report.csv");
  };

  const handleOpenPrintable = async () => {
    const res = await fetchPrintableReport();
    const reportWindow = window.open("", "_blank");
    if (reportWindow) {
      reportWindow.document.open();
      reportWindow.document.write(res.data);
      reportWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="panel p-6">
        <LoadingSpinner label="Loading insights..." />
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="bg-gradient-to-r from-slate-900 via-indigo-700 to-cyan-700 bg-clip-text text-2xl font-extrabold text-transparent">
          Admin Insights
        </h2>
        <p className="text-sm text-slate-600">Analytics, notification setup, audit logs, and exports.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="panel p-4">
          <p className="text-xs uppercase text-slate-500">Total Notices</p>
          <p className="text-2xl font-bold text-slate-900">{analytics?.noticeStats?.totalNotices || 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase text-slate-500">Important</p>
          <p className="text-2xl font-bold text-amber-600">{analytics?.noticeStats?.importantCount || 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase text-slate-500">Read Events</p>
          <p className="text-2xl font-bold text-emerald-600">{analytics?.readStats?.totalReadEvents || 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase text-slate-500">Unique Readers</p>
          <p className="text-2xl font-bold text-indigo-600">{analytics?.readStats?.uniqueReaders || 0}</p>
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="text-lg font-semibold text-slate-900">Notification Channels</h3>
        <form onSubmit={handleSubscribe} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={form.channel}
            onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}
            className="input-base"
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="push">Push</option>
          </select>
          <input
            value={form.destination}
            onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
            className="input-base sm:col-span-2"
            placeholder="Destination (email / number / push topic)"
            required
          />
          <button type="submit" className="btn-primary w-fit">
            Save Destination
          </button>
        </form>
      </div>

      <div className="panel p-4">
        <h3 className="text-lg font-semibold text-slate-900">Reports Export</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={handleDownloadNotices} className="btn-secondary">
            Download Notices CSV
          </button>
          <button type="button" onClick={handleDownloadAnalytics} className="btn-secondary">
            Download Analytics CSV
          </button>
          <button type="button" onClick={handleOpenPrintable} className="btn-primary">
            Open Printable Report (Save as PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Audit Logs</h3>
          <div className="mt-3 space-y-2 text-sm">
            {auditLogs.length === 0 ? (
              <p className="text-slate-500">No audit logs yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-2">
                  <p className="font-medium text-slate-900">
                    {log.username} ({log.role}) - {log.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.entity_type} #{log.entity_id || "-"} | {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Notification Logs</h3>
          <div className="mt-3 space-y-2 text-sm">
            {notificationLogs.length === 0 ? (
              <p className="text-slate-500">No notifications yet.</p>
            ) : (
              notificationLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-2">
                  <p className="font-medium text-slate-900">
                    {log.channel} - {log.destination}
                  </p>
                  <p className="text-xs text-slate-500">
                    Notice #{log.notice_id} | {log.delivery_status} | {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminInsights;
