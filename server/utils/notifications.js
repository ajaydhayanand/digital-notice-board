const { pool } = require("../config/db");

const createNotificationLogsForNotice = async (noticeId, payload) => {
  const [subs] = await pool.execute(
    "SELECT channel, destination FROM notification_subscriptions WHERE is_active = 1"
  );

  if (!subs.length) return;

  const values = subs.map((sub) => [
    noticeId,
    sub.channel,
    sub.destination,
    JSON.stringify(payload),
    "sent",
  ]);

  const placeholders = values.map(() => "(?, ?, ?, ?, ?)").join(",");
  const flat = values.flat();

  await pool.query(
    `INSERT INTO notification_logs (notice_id, channel, destination, payload, delivery_status)
     VALUES ${placeholders}`,
    flat
  );
};

module.exports = {
  createNotificationLogsForNotice,
};
