const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

module.exports = {
  connectDB,
};
