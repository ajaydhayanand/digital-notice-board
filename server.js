const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const adminRoutes = require('./routes/adminRoutes');
const noticeRoutes = require('./routes/noticeRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(express.static('public'));

app.use('/api/admin', adminRoutes);
app.use('/api/notices', noticeRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
