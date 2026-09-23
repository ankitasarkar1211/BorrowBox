const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string in process.env.MONGO_URI.
 * Exits the process if the connection fails, since the API cannot function
 * without a database in this project.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not defined in the environment. Check your .env file.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
