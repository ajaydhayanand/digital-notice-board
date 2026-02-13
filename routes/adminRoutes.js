const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.login);
router.get('/login', (req, res) => {
  res.send('Admin login API is working. Use POST request.');
});

module.exports = router;
