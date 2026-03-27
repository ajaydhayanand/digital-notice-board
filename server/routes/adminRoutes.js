const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../middleware/upload");
const { getDashboardStats, getAdminNotices, uploadAttachment } = require("../controllers/adminController");

const router = express.Router();
const adminOnly = authorizeRoles("admin");

router.use(authMiddleware, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/notices", getAdminNotices);
router.post("/attachments", upload.single("file"), uploadAttachment);

module.exports = router;
