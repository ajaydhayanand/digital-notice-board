const path = require("path");
const { pool } = require("../config/db");
const { logAudit } = require("../utils/audit");

const getAnalytics = async (req, res, next) => {
  try {
    const [[noticeStats]] = await pool.query(
      `SELECT
         COUNT(*) AS totalNotices,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS publishedCount,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduledCount,
         SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archivedCount,
         SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) AS importantCount
       FROM notices`
    );

    const [[readStats]] = await pool.query(
      `SELECT
         COUNT(*) AS totalReadEvents,
         COUNT(DISTINCT user_id) AS uniqueReaders
       FROM notice_reads`
    );

    const [categoryRows] = await pool.query(
      `SELECT category, COUNT(*) AS noticeCount
       FROM notices
       GROUP BY category
       ORDER BY noticeCount DESC, category ASC
       LIMIT 10`
    );

    const [[notificationStats]] = await pool.query(
      `SELECT
         COUNT(*) AS totalNotificationEvents,
         SUM(CASE WHEN delivery_status = 'sent' THEN 1 ELSE 0 END) AS sentCount,
         SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) AS failedCount
       FROM notification_logs`
    );

    return res.json({
      data: {
        noticeStats,
        readStats,
        categoryStats: categoryRows,
        notificationStats,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const [rows] = await pool.query(
      `SELECT id, user_id, username, role, action, entity_type, entity_id, details, created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT ${limit}`
    );
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
};

const subscribeNotification = async (req, res, next) => {
  try {
    const { channel, destination } = req.body;
    const createdBy = req.user.username;

    await pool.execute(
      `INSERT INTO notification_subscriptions (channel, destination, created_by, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1, created_by = VALUES(created_by)`,
      [channel, destination, createdBy]
    );

    await logAudit({
      user: req.user,
      action: "notification_subscribed",
      entityType: "notification_subscription",
      details: { channel, destination },
    });

    return res.status(201).json({ message: "Subscription saved" });
  } catch (error) {
    return next(error);
  }
};

const getNotificationLogs = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const [rows] = await pool.query(
      `SELECT id, notice_id, channel, destination, delivery_status, created_at
       FROM notification_logs
       ORDER BY created_at DESC
       LIMIT ${limit}`
    );
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
};

const uploadAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const relativePath = path.posix.join("uploads", req.file.filename);
  return res.status(201).json({
    url: `/${relativePath}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
};

const downloadNoticesCsv = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, category, created_by, is_important, status, publish_at, expires_at, created_at
       FROM notices
       ORDER BY created_at DESC`
    );

    const header = [
      "id",
      "title",
      "category",
      "createdBy",
      "isImportant",
      "status",
      "publishAt",
      "expiresAt",
      "createdAt",
    ];

    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")];

    rows.forEach((row) => {
      lines.push(
        [
          row.id,
          row.title,
          row.category,
          row.created_by,
          row.is_important ? "true" : "false",
          row.status,
          row.publish_at || "",
          row.expires_at || "",
          row.created_at,
        ]
          .map(escapeCell)
          .join(",")
      );
    });

    await logAudit({
      user: req.user,
      action: "report_exported",
      entityType: "report",
      details: { format: "csv", report: "notices" },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=notices-report.csv");
    return res.send(lines.join("\n"));
  } catch (error) {
    return next(error);
  }
};

const downloadAnalyticsCsv = async (req, res, next) => {
  try {
    const [[stats]] = await pool.query(
      `SELECT
         COUNT(*) AS totalNotices,
         SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) AS importantCount,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduledCount,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS publishedCount,
         SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archivedCount
       FROM notices`
    );
    const [[reads]] = await pool.query(
      "SELECT COUNT(*) AS totalReadEvents, COUNT(DISTINCT user_id) AS uniqueReaders FROM notice_reads"
    );
    const lines = [
      "metric,value",
      `totalNotices,${stats.totalNotices || 0}`,
      `importantCount,${stats.importantCount || 0}`,
      `scheduledCount,${stats.scheduledCount || 0}`,
      `publishedCount,${stats.publishedCount || 0}`,
      `archivedCount,${stats.archivedCount || 0}`,
      `totalReadEvents,${reads.totalReadEvents || 0}`,
      `uniqueReaders,${reads.uniqueReaders || 0}`,
    ];

    await logAudit({
      user: req.user,
      action: "report_exported",
      entityType: "report",
      details: { format: "csv", report: "analytics" },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=analytics-report.csv");
    return res.send(lines.join("\n"));
  } catch (error) {
    return next(error);
  }
};

const getPrintableReportHtml = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT title, category, created_by, status, is_important, publish_at, expires_at, created_at
       FROM notices
       ORDER BY created_at DESC
       LIMIT 200`
    );
    const body = rows
      .map(
        (row) => `
          <tr>
            <td>${row.title}</td>
            <td>${row.category}</td>
            <td>${row.created_by}</td>
            <td>${row.status}</td>
            <td>${row.is_important ? "Yes" : "No"}</td>
            <td>${row.publish_at || ""}</td>
            <td>${row.expires_at || ""}</td>
            <td>${row.created_at || ""}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Digital Notice Board Report</title>
          <style>
            body { font-family: Arial; padding: 24px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Digital Notice Board - Printable Report</h2>
          <p>Use browser print and select \"Save as PDF\".</p>
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Category</th><th>Created By</th><th>Status</th>
                <th>Important</th><th>Publish At</th><th>Expires At</th><th>Created At</th>
              </tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAnalytics,
  getAuditLogs,
  subscribeNotification,
  getNotificationLogs,
  uploadAttachment,
  downloadNoticesCsv,
  downloadAnalyticsCsv,
  getPrintableReportHtml,
};
