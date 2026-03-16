import mongoose from 'mongoose';
import { DB_NAME } from './constant.js';
const connectDb = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    const conn = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(`connected to database ${conn.connection.port}`);
  } catch (error) {
    console.log(`error while connecting to database ${error.message}`);
    throw error;
  }
};

export default connectDb;
