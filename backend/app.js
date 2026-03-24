import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookingRoutes from './routes/booking.routes.js';
import authRoutes from './routes/auth.routes.js';
import mobileRoutes from './routes/mobile/mobile.routes.js';
import verifyAuth from './middlewares/authMiddleware.js';
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  //checking if working fine
  res.send('Hello');
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes (public - for code exchange)
app.use('/api/auth', authRoutes);

//for the sending to the booking route
app.use('/api/bookings', verifyAuth, bookingRoutes);

// Mobile routes
app.use('/api/mobile', mobileRoutes);

export default app;
