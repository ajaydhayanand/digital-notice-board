const express = require("express");
const { body } = require("express-validator");
const {
  getAnalytics,
  getAuditLogs,
  subscribeNotification,
  getNotificationLogs,
  uploadAttachment,
  downloadNoticesCsv,
  downloadAnalyticsCsv,
  getPrintableReportHtml,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");

const router = express.Router();

const canManageNotices = authorizeRoles("superadmin", "admin", "editor");
const canViewAdminData = authorizeRoles("superadmin", "admin", "editor", "viewer");

router.get("/analytics", authMiddleware, canViewAdminData, getAnalytics);
router.get("/audit-logs", authMiddleware, canViewAdminData, getAuditLogs);
router.get("/notifications/logs", authMiddleware, canViewAdminData, getNotificationLogs);
router.post(
  "/notifications/subscribe",
  authMiddleware,
  canManageNotices,
  [
    body("channel").isIn(["email", "whatsapp", "push"]).withMessage("Invalid channel"),
    body("destination").trim().isLength({ min: 3, max: 255 }).withMessage("Invalid destination"),
  ],
  validate,
  subscribeNotification
);

router.post("/attachments", authMiddleware, canManageNotices, upload.single("file"), uploadAttachment);

router.get("/reports/notices.csv", authMiddleware, canViewAdminData, downloadNoticesCsv);
router.get("/reports/analytics.csv", authMiddleware, canViewAdminData, downloadAnalyticsCsv);
router.get("/reports/notices-print", authMiddleware, canViewAdminData, getPrintableReportHtml);

module.exports = router;
