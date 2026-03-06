const { pool } = require("../config/db");
const { emitNoticeChanged, noticeEvents } = require("../utils/noticeEvents");

const mapNotice = (row) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  createdBy: row.created_by,
  isImportant: Boolean(row.is_important),
  isRead: Boolean(row.is_read),
  createdAt: row.created_at,
});

const getAllNotices = async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();
    const readStatus = (req.query.readStatus || "").trim().toLowerCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
    const userId = req.user.id;

    const where = [];
    const params = [];

    if (search) {
      where.push("(title LIKE ? OR description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      where.push("category = ?");
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
      `SELECT n.id, n.title, n.description, n.category, n.created_by, n.is_important, n.created_at,
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
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getNoticeCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT DISTINCT category FROM notices WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC"
    );
    const normalized = rows.map((row) => row.category);

    return res.json({ data: normalized });
  } catch (error) {
    return next(error);
  }
};

const getNoticeById = async (req, res, next) => {
  try {
    const noticeId = Number(req.params.id);
    if (!Number.isInteger(noticeId) || noticeId <= 0) {
      return res.status(400).json({ message: "Invalid notice id" });
    }

    const [rows] = await pool.execute(
      `SELECT n.id, n.title, n.description, n.category, n.created_by, n.is_important, n.created_at,
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
    const { title, description, category, isImportant } = req.body;
    const createdBy = req.user.username;

    const [result] = await pool.execute(
      "INSERT INTO notices (title, description, category, created_by, is_important) VALUES (?, ?, ?, ?, ?)",
      [title, description, category, createdBy, isImportant ? 1 : 0]
    );

    const [rows] = await pool.execute(
      "SELECT id, title, description, category, created_by, is_important, created_at, 0 AS is_read FROM notices WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    const created = mapNotice(rows[0]);
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

    const { title, description, category, isImportant } = req.body;

    const [existing] = await pool.execute("SELECT id FROM notices WHERE id = ? LIMIT 1", [noticeId]);
    if (!existing.length) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await pool.execute(
      "UPDATE notices SET title = ?, description = ?, category = ?, is_important = ? WHERE id = ?",
      [title, description, category, isImportant ? 1 : 0, noticeId]
    );

    const [rows] = await pool.execute(
      "SELECT id, title, description, category, created_by, is_important, created_at, 0 AS is_read FROM notices WHERE id = ? LIMIT 1",
      [noticeId]
    );

    const updated = mapNotice(rows[0]);
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
