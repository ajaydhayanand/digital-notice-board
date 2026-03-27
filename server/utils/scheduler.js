const cron = require("node-cron");
const Notice = require("../models/Notice");

const publishScheduledNotices = async () => {
  const now = new Date();

  const result = await Notice.updateMany(
    {
      isPublished: false,
      publishAt: { $lte: now },
    },
    {
      $set: { isPublished: true },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`Published ${result.modifiedCount} scheduled notice(s)`);
  }
};

const startScheduler = () => {
  cron.schedule("*/10 * * * * *", async () => {
    try {
      await publishScheduledNotices();
    } catch (error) {
      console.error("Scheduler error:", error.message);
    }
  });
};

module.exports = {
  startScheduler,
  publishScheduledNotices,
};
