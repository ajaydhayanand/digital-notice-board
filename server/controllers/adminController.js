const Notice = require("../models/Notice");

const mapNotice = (notice) => ({
  id: notice._id,
  title: notice.title,
  description: notice.description,
  attachmentUrl: notice.attachmentUrl,
  isImportant: notice.isImportant,
  publishAt: notice.publishAt,
  isPublished: notice.isPublished,
  createdAt: notice.createdAt,
  createdBy: notice.createdBy?.username || "admin",
  status: notice.isPublished ? "Published" : "Scheduled",
});

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const [totalNotices, importantNotices, scheduledNotices, publishedNotices] = await Promise.all([
      Notice.countDocuments(),
      Notice.countDocuments({ isImportant: true }),
      Notice.countDocuments({ isPublished: false, publishAt: { $gt: now } }),
      Notice.countDocuments({ isPublished: true }),
    ]);

    return res.json({
      stats: {
        totalNotices,
        importantNotices,
        scheduledNotices,
        publishedNotices,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminNotices = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 24);
    const search = req.query.search?.trim() || "";
    const status = req.query.status?.trim() || "all";

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "published") {
      query.isPublished = true;
    }

    if (status === "scheduled") {
      query.isPublished = false;
    }

    const total = await Notice.countDocuments(query);
    const notices = await Notice.find(query)
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      items: notices.map(mapNotice),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const uploadAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Attachment is required" });
  }

  return res.status(201).json({
    url: `/uploads/${req.file.filename}`,
  });
};

module.exports = {
  getDashboardStats,
  getAdminNotices,
  uploadAttachment,
};
