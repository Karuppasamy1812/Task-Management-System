import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    logger.info('DB', 'Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 10000,
    });
    logger.success('DB', 'MongoDB connected');
  } catch (err) {
    logger.error('DB', 'Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

export default connectDB;
