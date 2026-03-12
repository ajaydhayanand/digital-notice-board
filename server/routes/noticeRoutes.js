const express = require("express");
const { body, param } = require("express-validator");
const {
  getAllNotices,
  getNoticeCategories,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  updateReadStatus,
  updateImportantStatus,
  streamNoticeEvents,
} = require("../controllers/noticeController");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const validate = require("../middleware/validate");

const router = express.Router();

const noticeValidation = [
  body("title").trim().isLength({ min: 3, max: 120 }).withMessage("Title must be 3-120 characters"),
  body("description")
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage("Description must be 5-2000 characters"),
  body("category").trim().isLength({ min: 2, max: 60 }).withMessage("Category must be 2-60 characters"),
  body("isImportant").optional().isBoolean().withMessage("isImportant must be boolean"),
  body("attachmentUrl").optional({ nullable: true, checkFalsy: true }).isLength({ max: 500 }).withMessage("attachmentUrl too long"),
  body("publishAt").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("publishAt must be a valid date"),
  body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("expiresAt must be a valid date"),
];

const idValidation = [param("id").isInt({ min: 1 }).withMessage("Invalid notice id")];

router.get("/", authMiddleware, getAllNotices);
router.get("/categories", authMiddleware, getNoticeCategories);
router.get("/stream", authMiddleware, streamNoticeEvents);
router.get("/:id", authMiddleware, idValidation, validate, getNoticeById);
router.post("/", authMiddleware, requireAdmin, noticeValidation, validate, createNotice);
router.put("/:id", authMiddleware, requireAdmin, idValidation, noticeValidation, validate, updateNotice);
router.delete("/:id", authMiddleware, requireAdmin, idValidation, validate, deleteNotice);
router.patch(
  "/:id/read-status",
  authMiddleware,
  idValidation,
  body("isRead").isBoolean().withMessage("isRead must be boolean"),
  validate,
  updateReadStatus
);
router.patch(
  "/:id/important",
  authMiddleware,
  requireAdmin,
  idValidation,
  body("isImportant").isBoolean().withMessage("isImportant must be boolean"),
  validate,
  updateImportantStatus
);

module.exports = router;
