const express = require("express");
const { body, param } = require("express-validator");
const {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  toggleImportant,
  toggleBookmark,
  toggleRead,
  markFeedSeen,
} = require("../controllers/noticeController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const validate = require("../middleware/validate");

const router = express.Router();

const adminOnly = authorizeRoles("admin");
const noticeValidation = [
  body("title")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Title must be 120 characters or fewer"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage("Message must be between 1 and 4000 characters"),
  body("attachmentUrl")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage("Attachment URL is too long"),
  body("isImportant").optional().isBoolean().withMessage("isImportant must be boolean"),
  body("publishAt").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("publishAt must be a valid date"),
];

router.use(authMiddleware);

router.get("/", getNotices);
router.get("/:id", param("id").isMongoId().withMessage("Invalid notice id"), validate, getNoticeById);
router.post("/", adminOnly, noticeValidation, validate, createNotice);
router.put(
  "/:id",
  adminOnly,
  param("id").isMongoId().withMessage("Invalid notice id"),
  noticeValidation,
  validate,
  updateNotice
);
router.delete("/:id", adminOnly, param("id").isMongoId().withMessage("Invalid notice id"), validate, deleteNotice);
router.patch(
  "/:id/important",
  adminOnly,
  param("id").isMongoId().withMessage("Invalid notice id"),
  body("isImportant").isBoolean().withMessage("isImportant must be boolean"),
  validate,
  toggleImportant
);
router.patch(
  "/:id/bookmark",
  param("id").isMongoId().withMessage("Invalid notice id"),
  validate,
  toggleBookmark
);
router.patch(
  "/:id/read",
  param("id").isMongoId().withMessage("Invalid notice id"),
  body("isRead").isBoolean().withMessage("isRead must be boolean"),
  validate,
  toggleRead
);
router.post("/feed/seen", markFeedSeen);

module.exports = router;
