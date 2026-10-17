const mongoose = require('mongoose');

let memoryReplSet = null;

/**
 * Connects to MongoDB using the connection string in process.env.MONGO_URI.
 * In development, if local MongoDB is not yet running, it automatically
 * starts an in-memory replica set fallback so the developer doesn't need
 * to manually install or start MongoDB service.
 */
const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not defined in the environment. Check your .env file.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Local MongoDB not reachable (${err.message}). Launching in-memory MongoDB replica set...`);
      try {
        const { MongoMemoryReplSet } = require('mongodb-memory-server');
        memoryReplSet = await MongoMemoryReplSet.create({
          replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' },
          instanceOpts: [{ port: 27017, dbName: 'borrowbox' }],
        });
        uri = memoryReplSet.getUri('borrowbox');
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Memory ReplSet connected: ${conn.connection.host}`);
        return;
      } catch (memErr) {
        console.error(`Failed to start MongoMemoryReplSet fallback: ${memErr.message}`);
      }
    }
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
