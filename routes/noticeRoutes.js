const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

router.post('/add', noticeController.addNotice);
router.get('/', noticeController.getNotices);
router.delete('/:id', noticeController.deleteNotice);

module.exports = router;
