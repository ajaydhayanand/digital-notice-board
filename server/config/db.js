const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

const getMongoUri = async () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production");
  }

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: "digital_notice_board",
    },
  });

  const uri = memoryServer.getUri();
  console.log("Using in-memory MongoDB for development");
  return uri;
};

const connectDB = async () => {
  const mongoUri = await getMongoUri();

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

module.exports = {
  connectDB,
};
