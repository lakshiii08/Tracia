const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/tracia";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    console.warn(`[MongoDB] Hint: If running locally without a MongoDB daemon, start MongoDB or set MONGODB_URI in backend/.env to a MongoDB Atlas cluster URI.`);
    return false;
  }
};

module.exports = connectDB;
