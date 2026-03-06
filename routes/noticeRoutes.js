const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/noticeController");

router.route("/")
  .get(noticeController.getNotices)
  .post(noticeController.createNotice);

router.route("/:id")
  .get(noticeController.getNoticeById)
  .put(noticeController.updateNotice)
  .delete(noticeController.deleteNotice);

module.exports = router;
