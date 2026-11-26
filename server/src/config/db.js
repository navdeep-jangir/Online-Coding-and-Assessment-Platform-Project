import mongoose from 'mongoose';

let reconnectTimer = null;

const scheduleReconnect = (uri) => {
  if (process.env.NODE_ENV === 'test' || reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (mongoose.connection.readyState === 0) {
      await connectDB(uri);
    }
  }, 10000);
  if (typeof reconnectTimer.unref === 'function') {
    reconnectTimer.unref();
  }
};

/**
 * Connect to MongoDB using Mongoose.
 * @param {string} [uri] - Optional MongoDB connection URI override.
 * @returns {Promise<mongoose.Mongoose>}
 */
export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (!uri && process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI environment variable is required in production.');
  }
  const mongoUri = uri || 'mongodb://localhost:27017/codeclimb';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'test') {
      throw error;
    }
    scheduleReconnect(uri);
    return null;
  }
};

/**
 * Gracefully close the active Mongoose connection.
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export default connectDB;
