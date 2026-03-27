const mongoose = require("mongoose");
const Notice = require("../models/Notice");
const User = require("../models/User");
const { publishScheduledNotices } = require("../utils/scheduler");

const getDisplayTitle = (noticeLike = {}) => {
  const title = `${noticeLike.title || ""}`.trim();
  if (title) return title;

  const description = `${noticeLike.description || ""}`.trim();
  if (!description) return "Notice";

  return description.length > 60 ? `${description.slice(0, 60).trim()}...` : description;
};

const normalizeOptionalText = (value) => `${value || ""}`.trim();
const normalizeRequiredMessage = (value) => `${value || ""}`.trim();

const parsePublishAt = (value, fallback = new Date()) => {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
};

const buildVisibilityQuery = (user) => {
  if (user.role === "admin") {
    return {};
  }

  return {
    isPublished: true,
    publishAt: { $lte: new Date() },
  };
};

const mapNotice = (notice, userDoc) => {
  const readSet = new Set((userDoc.readNotices || []).map((entry) => entry.notice.toString()));
  const bookmarkSet = new Set((userDoc.bookmarkedNotices || []).map((id) => id.toString()));

  return {
    id: notice._id,
    rawTitle: `${notice.title || ""}`.trim(),
    title: getDisplayTitle(notice),
    description: notice.description,
    attachmentUrl: notice.attachmentUrl,
    isImportant: notice.isImportant,
    publishAt: notice.publishAt,
    isPublished: notice.isPublished,
    createdAt: notice.createdAt,
    updatedAt: notice.updatedAt,
    createdBy: notice.createdBy?.username || "admin",
    isRead: readSet.has(notice._id.toString()),
    isBookmarked: bookmarkSet.has(notice._id.toString()),
    status: notice.isPublished ? "Published" : "Scheduled",
  };
};

const getNotices = async (req, res, next) => {
  try {
    await publishScheduledNotices();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 24);
    const search = req.query.search?.trim() || "";
    const filter = req.query.filter?.trim() || "all";

    const baseQuery = buildVisibilityQuery(req.user);
    const query = { ...baseQuery };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (filter === "important") {
      query.isImportant = true;
    }

    if (filter === "latest") {
      query.isPublished = true;
      query.publishAt = { $lte: new Date() };
    }

    if (filter === "bookmarked") {
      query._id = { $in: req.userDoc.bookmarkedNotices || [] };
    }

    if (filter === "unread") {
      const readIds = (req.userDoc.readNotices || []).map((entry) => entry.notice);
      query._id = {
        $nin: readIds,
      };
    }

    const total = await Notice.countDocuments(query);
    const notices = await Notice.find(query)
      .populate("createdBy", "username")
      .sort({ isImportant: -1, publishAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const visibleQuery = {
      isPublished: true,
      publishAt: { $lte: new Date() },
    };

    const readIds = (req.userDoc.readNotices || []).map((entry) => entry.notice);
    const newCount = await Notice.countDocuments({
      ...visibleQuery,
      publishAt: { $gt: req.userDoc.lastSeenAt || new Date(0), $lte: new Date() },
    });
    const unreadCount = await Notice.countDocuments({
      ...visibleQuery,
      _id: { $nin: readIds },
    });

    return res.json({
      items: notices.map((notice) => mapNotice(notice, req.userDoc)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        newCount,
        unreadCount,
        bookmarkedCount: req.userDoc.bookmarkedNotices?.length || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getNoticeById = async (req, res, next) => {
  try {
    await publishScheduledNotices();

    const notice = await Notice.findById(req.params.id).populate("createdBy", "username");

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (req.user.role !== "admin" && (!notice.isPublished || notice.publishAt > new Date())) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const hasRead = (req.userDoc.readNotices || []).some(
      (entry) => entry.notice.toString() === notice._id.toString()
    );

    if (!hasRead) {
      req.userDoc.readNotices.push({
        notice: notice._id,
        readAt: new Date(),
      });
      await req.userDoc.save();
    }

    return res.json({
      notice: mapNotice(notice, req.userDoc),
    });
  } catch (error) {
    return next(error);
  }
};

const createNotice = async (req, res, next) => {
  try {
    const description = normalizeRequiredMessage(req.body.description);
    const title = normalizeOptionalText(req.body.title);
    const publishAt = parsePublishAt(req.body.publishAt, new Date());
    const isPublished = publishAt <= new Date();

    const notice = await Notice.create({
      title,
      description,
      attachmentUrl: req.body.attachmentUrl || "",
      isImportant: Boolean(req.body.isImportant),
      publishAt,
      isPublished,
      createdBy: req.user.id,
    });

    const populated = await Notice.findById(notice._id).populate("createdBy", "username");

    return res.status(201).json({
      notice: mapNotice(populated, req.userDoc),
    });
  } catch (error) {
    return next(error);
  }
};

const updateNotice = async (req, res, next) => {
  try {
    await publishScheduledNotices();

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const description = normalizeRequiredMessage(req.body.description);
    const title = normalizeOptionalText(req.body.title);
    const publishAt = parsePublishAt(req.body.publishAt, new Date());
    const isPublished = publishAt <= new Date();

    notice.title = title;
    notice.description = description;
    notice.attachmentUrl = req.body.attachmentUrl || "";
    notice.isImportant = Boolean(req.body.isImportant);
    notice.publishAt = publishAt;
    notice.isPublished = isPublished;
    await notice.save();

    const populated = await Notice.findById(notice._id).populate("createdBy", "username");

    return res.json({
      notice: mapNotice(populated, req.userDoc),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await Notice.findByIdAndDelete(req.params.id);
    await User.updateMany(
      {},
      {
        $pull: {
          bookmarkedNotices: notice._id,
          readNotices: { notice: notice._id },
        },
      }
    );

    return res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const toggleImportant = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    notice.isImportant = Boolean(req.body.isImportant);
    await notice.save();

    return res.json({
      message: notice.isImportant ? "Notice marked important" : "Notice importance removed",
    });
  } catch (error) {
    return next(error);
  }
};

const toggleBookmark = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).select("_id");
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const noticeId = new mongoose.Types.ObjectId(req.params.id);
    const bookmarkedIds = new Set((req.userDoc.bookmarkedNotices || []).map((id) => id.toString()));
    const isBookmarked = bookmarkedIds.has(noticeId.toString());

    if (isBookmarked) {
      req.userDoc.bookmarkedNotices = req.userDoc.bookmarkedNotices.filter(
        (id) => id.toString() !== noticeId.toString()
      );
    } else {
      req.userDoc.bookmarkedNotices.push(noticeId);
    }

    await req.userDoc.save();

    return res.json({
      message: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      isBookmarked: !isBookmarked,
    });
  } catch (error) {
    return next(error);
  }
};

const toggleRead = async (req, res, next) => {
  try {
    const noticeId = req.params.id;
    const notice = await Notice.findById(noticeId).select("_id");
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const shouldMarkRead = Boolean(req.body.isRead);
    const hasRead = (req.userDoc.readNotices || []).some(
      (entry) => entry.notice.toString() === noticeId
    );

    if (shouldMarkRead && !hasRead) {
      req.userDoc.readNotices.push({
        notice: noticeId,
        readAt: new Date(),
      });
    }

    if (!shouldMarkRead && hasRead) {
      req.userDoc.readNotices = req.userDoc.readNotices.filter(
        (entry) => entry.notice.toString() !== noticeId
      );
    }

    await req.userDoc.save();

    return res.json({
      message: shouldMarkRead ? "Marked as read" : "Marked as unread",
      isRead: shouldMarkRead,
    });
  } catch (error) {
    return next(error);
  }
};

const markFeedSeen = async (req, res, next) => {
  try {
    req.userDoc.lastSeenAt = new Date();
    await req.userDoc.save();

    return res.json({ message: "Feed seen" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  toggleImportant,
  toggleBookmark,
  toggleRead,
  markFeedSeen,
};
