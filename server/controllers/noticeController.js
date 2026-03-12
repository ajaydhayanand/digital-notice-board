const { pool } = require("../config/db");
const { emitNoticeChanged, noticeEvents } = require("../utils/noticeEvents");
const { logAudit } = require("../utils/audit");
const { createNotificationLogsForNotice } = require("../utils/notifications");

const mapNotice = (row) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  createdBy: row.created_by,
  isImportant: Boolean(row.is_important),
  isRead: Boolean(row.is_read),
  attachmentUrl: row.attachment_url || "",
  publishAt: row.publish_at,
  expiresAt: row.expires_at,
  status: row.status,
  createdAt: row.created_at,
});

const privilegedRoles = new Set(["superadmin", "admin", "editor"]);
const canSeeAllNotices = (user) => privilegedRoles.has(user.role);

const syncNoticeStatuses = async () => {
  await pool.execute(
    "UPDATE notices SET status = 'archived' WHERE expires_at IS NOT NULL AND expires_at < NOW() AND status <> 'archived'"
  );
  await pool.execute(
    "UPDATE notices SET status = 'scheduled' WHERE status <> 'archived' AND publish_at > NOW()"
  );
  await pool.execute(
    "UPDATE notices SET status = 'published' WHERE status <> 'archived' AND publish_at <= NOW() AND (expires_at IS NULL OR expires_at >= NOW())"
  );
};

const getAllNotices = async (req, res, next) => {
  try {
    await syncNoticeStatuses();

    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();
    const readStatus = (req.query.readStatus || "").trim().toLowerCase();
    const status = (req.query.status || "").trim().toLowerCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
    const userId = req.user.id;
    const includeAll = req.query.includeAll === "true" && canSeeAllNotices(req.user);

    const where = [];
    const params = [];

    if (!includeAll) {
      where.push("n.status = 'published'");
      where.push("(n.expires_at IS NULL OR n.expires_at >= NOW())");
      where.push("n.publish_at <= NOW()");
    } else if (status && ["scheduled", "published", "archived"].includes(status)) {
      where.push("n.status = ?");
      params.push(status);
    }

    if (search) {
      where.push("(n.title LIKE ? OR n.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      where.push("n.category = ?");
      params.push(category);
    }

    if (readStatus === "read") {
      where.push("nr.user_id IS NOT NULL");
    } else if (readStatus === "unread") {
      where.push("nr.user_id IS NULL");
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM notices n
       LEFT JOIN notice_reads nr ON nr.notice_id = n.id AND nr.user_id = ?
       ${whereClause}`,
      [userId, ...params]
    );
    const total = countRows[0].total || 0;

    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.description, n.category, n.created_by, n.is_important, n.attachment_url, n.publish_at, n.expires_at, n.status, n.created_at,
              CASE WHEN nr.user_id IS NULL THEN 0 ELSE 1 END AS is_read
       FROM notices n
       LEFT JOIN notice_reads nr ON nr.notice_id = n.id AND nr.user_id = ?
       ${whereClause}
       ORDER BY n.is_important DESC, n.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [userId, ...params]
    );

    const notices = rows.map(mapNotice);

    return res.json({
      data: notices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      filters: {
        search,
        category,
        readStatus,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getNoticeCategories = async (req, res, next) => {
  try {
    await syncNoticeStatuses();
    const includeAll = req.query.includeAll === "true" && canSeeAllNotices(req.user);
    const visibilityWhere = includeAll
      ? "1=1"
      : "status = 'published' AND publish_at <= NOW() AND (expires_at IS NULL OR expires_at >= NOW())";

    const [rows] = await pool.execute(
      `SELECT DISTINCT category FROM notices
       WHERE category IS NOT NULL AND category <> '' AND ${visibilityWhere}
       ORDER BY category ASC`
    );
    const normalized = rows.map((row) => row.category);

    return res.json({ data: normalized });
  } catch (error) {
    return next(error);
  }
};

const getNoticeById = async (req, res, next) => {
  try {
    await syncNoticeStatuses();

    const noticeId = Number(req.params.id);
    if (!Number.isInteger(noticeId) || noticeId <= 0) {
      return res.status(400).json({ message: "Invalid notice id" });
    }

    const [rows] = await pool.execute(
      `SELECT n.id, n.title, n.description, n.category, n.created_by, n.is_important, n.attachment_url, n.publish_at, n.expires_at, n.status, n.created_at,
              CASE WHEN nr.user_id IS NULL THEN 0 ELSE 1 END AS is_read
       FROM notices n
       LEFT JOIN notice_reads nr ON nr.notice_id = n.id AND nr.user_id = ?
       WHERE n.id = ?
       LIMIT 1`,
      [req.user.id, noticeId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Notice not found" });
    }
    if (!canSeeAllNotices(req.user)) {
      const notice = rows[0];
      const isVisible =
        notice.status === "published" &&
        new Date(notice.publish_at).getTime() <= Date.now() &&
        (!notice.expires_at || new Date(notice.expires_at).getTime() >= Date.now());
      if (!isVisible) {
        return res.status(404).json({ message: "Notice not found" });
      }
    }

    await pool.execute(
      "INSERT INTO notice_reads (user_id, notice_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP",
      [req.user.id, noticeId]
    );

    return res.json({ ...mapNotice(rows[0]), isRead: true });
  } catch (error) {
    return next(error);
  }
};

const createNotice = async (req, res, next) => {
  try {
    const { title, description, category, isImportant, attachmentUrl, publishAt, expiresAt } = req.body;
    const createdBy = req.user.username;
    const publishAtValue = publishAt ? new Date(publishAt) : new Date();
    const expiresAtValue = expiresAt ? new Date(expiresAt) : null;

    if (expiresAtValue && publishAtValue.getTime() > expiresAtValue.getTime()) {
      return res.status(400).json({ message: "Expiry date must be after publish date" });
    }

    const status = publishAtValue.getTime() > Date.now() ? "scheduled" : "published";

    const [result] = await pool.execute(
      `INSERT INTO notices
      (title, description, category, created_by, is_important, attachment_url, publish_at, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        category,
        createdBy,
        isImportant ? 1 : 0,
        attachmentUrl || null,
        publishAtValue,
        expiresAtValue,
        status,
      ]
    );

    const [rows] = await pool.execute(
      "SELECT id, title, description, category, created_by, is_important, attachment_url, publish_at, expires_at, status, created_at, 0 AS is_read FROM notices WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    const created = mapNotice(rows[0]);
    await logAudit({
      user: req.user,
      action: "notice_created",
      entityType: "notice",
      entityId: created.id,
      details: { title: created.title, category: created.category, isImportant: created.isImportant },
    });

    if (created.isImportant) {
      await createNotificationLogsForNotice(created.id, {
        title: created.title,
        category: created.category,
        important: true,
      });
    }

    emitNoticeChanged({ action: "created", noticeId: created.id });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
};

const updateNotice = async (req, res, next) => {
  try {
    const noticeId = Number(req.params.id);
    if (!Number.isInteger(noticeId) || noticeId <= 0) {
      return res.status(400).json({ message: "Invalid notice id" });
    }

    const { title, description, category, isImportant, attachmentUrl, publishAt, expiresAt } = req.body;
    const publishAtValue = publishAt ? new Date(publishAt) : new Date();
    const expiresAtValue = expiresAt ? new Date(expiresAt) : null;

    if (expiresAtValue && publishAtValue.getTime() > expiresAtValue.getTime()) {
      return res.status(400).json({ message: "Expiry date must be after publish date" });
    }
    const status = publishAtValue.getTime() > Date.now() ? "scheduled" : "published";

    const [existing] = await pool.execute("SELECT id FROM notices WHERE id = ? LIMIT 1", [noticeId]);
    if (!existing.length) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await pool.execute(
      `UPDATE notices
       SET title = ?, description = ?, category = ?, is_important = ?, attachment_url = ?, publish_at = ?, expires_at = ?, status = ?
       WHERE id = ?`,
      [
        title,
        description,
        category,
        isImportant ? 1 : 0,
        attachmentUrl || null,
        publishAtValue,
        expiresAtValue,
        status,
        noticeId,
      ]
    );

    const [rows] = await pool.execute(
      "SELECT id, title, description, category, created_by, is_important, attachment_url, publish_at, expires_at, status, created_at, 0 AS is_read FROM notices WHERE id = ? LIMIT 1",
      [noticeId]
    );

    const updated = mapNotice(rows[0]);
    await logAudit({
      user: req.user,
      action: "notice_updated",
      entityType: "notice",
      entityId: updated.id,
      details: { title: updated.title, category: updated.category, isImportant: updated.isImportant },
    });

    if (updated.isImportant) {
      await createNotificationLogsForNotice(updated.id, {
        title: updated.title,
        category: updated.category,
        important: true,
        source: "update",
      });
    }

    emitNoticeChanged({ action: "updated", noticeId: updated.id });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const noticeId = Number(req.params.id);
    if (!Number.isInteger(noticeId) || noticeId <= 0) {
      return res.status(400).json({ message: "Invalid notice id" });
    }

    const [result] = await pool.execute("DELETE FROM notices WHERE id = ?", [noticeId]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await logAudit({
      user: req.user,
      action: "notice_deleted",
      entityType: "notice",
      entityId: noticeId,
    });

    emitNoticeChanged({ action: "deleted", noticeId });
    return res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const updateReadStatus = async (req, res, next) => {
  try {
    const noticeId = Number(req.params.id);
    const { isRead } = req.body;

    if (!Number.isInteger(noticeId) || noticeId <= 0) {
      return res.status(400).json({ message: "Invalid notice id" });
    }

    if (typeof isRead !== "boolean") {
      return res.status(400).json({ message: "isRead must be boolean" });
    }

    const [exists] = await pool.execute("SELECT id FROM notices WHERE id = ? LIMIT 1", [noticeId]);
    if (!exists.length) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (isRead) {
      await pool.execute(
        "INSERT INTO notice_reads (user_id, notice_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP",
        [req.user.id, noticeId]
      );
    } else {
      await pool.execute("DELETE FROM notice_reads WHERE user_id = ? AND notice_id = ?", [
        req.user.id,
        noticeId,
      ]);
    }

    await logAudit({
      user: req.user,
      action: isRead ? "notice_mark_read" : "notice_mark_unread",
      entityType: "notice",
      entityId: noticeId,
    });

    return res.json({ message: "Read status updated", isRead });
  } catch (error) {
    return next(error);
  }
};

const updateImportantStatus = async (req, res, next) => {
  try {
    const noticeId = Number(req.params.id);
    const { isImportant } = req.body;

    if (!Number.isInteger(noticeId) || noticeId <= 0) {
      return res.status(400).json({ message: "Invalid notice id" });
    }

    if (typeof isImportant !== "boolean") {
      return res.status(400).json({ message: "isImportant must be boolean" });
    }

    const [result] = await pool.execute(
      "UPDATE notices SET is_important = ? WHERE id = ?",
      [isImportant ? 1 : 0, noticeId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await logAudit({
      user: req.user,
      action: isImportant ? "notice_marked_important" : "notice_unmarked_important",
      entityType: "notice",
      entityId: noticeId,
    });

    if (isImportant) {
      const [[notice]] = await pool.execute(
        "SELECT id, title, category FROM notices WHERE id = ? LIMIT 1",
        [noticeId]
      );
      if (notice) {
        await createNotificationLogsForNotice(noticeId, {
          title: notice.title,
          category: notice.category,
          important: true,
          source: "important_toggle",
        });
      }
    }

    emitNoticeChanged({ action: "important_changed", noticeId, isImportant });
    return res.json({ message: "Important status updated", isImportant });
  } catch (error) {
    return next(error);
  }
};

const streamNoticeEvents = async (req, res, next) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const send = (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    send({ type: "connected" });

    const onChanged = (payload) => {
      send({ type: "notice_changed", payload });
    };

    noticeEvents.on("notice:changed", onChanged);

    const keepAlive = setInterval(() => {
      res.write(": ping\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAlive);
      noticeEvents.off("notice:changed", onChanged);
      res.end();
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllNotices,
  getNoticeCategories,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  updateReadStatus,
  updateImportantStatus,
  streamNoticeEvents,
};
