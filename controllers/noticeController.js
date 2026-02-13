const db = require('../config/db');

const addNotice = (req, res) => {
  const { title, description, category } = req.body;

  const sql = 'INSERT INTO notices (title, description, category) VALUES (?, ?, ?)';
  db.query(sql, [title, description, category], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error adding notice' });
    }
    res.json({ message: 'Notice added successfully' });
  });
};

const getNotices = (req, res) => {
  const sql = 'SELECT * FROM notices ORDER BY created_at DESC';
  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching notices' });
    }
    res.json(result);
  });
};

const deleteNotice = (req, res) => {
  const sql = 'DELETE FROM notices WHERE id=?';
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting notice' });
    }
    res.json({ message: 'Notice deleted successfully' });
  });
};

module.exports = {
  addNotice,
  getNotices,
  deleteNotice
};
