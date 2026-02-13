const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Ajay@7465',
  database: 'digital_notice_board'
});

db.connect((err) => {
  if (err) {
    console.log('Database connection failed');
    console.log(err);
  } else {
    console.log('MySQL Connected Successfully');
  }
});

module.exports = db;
