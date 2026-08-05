import express from 'express';
import {
  mobileAuth,
  getBookingsByDate,
  createBooking,
  deleteBooking,
  getMyBookings,
  adminDeleteBooking,
} from '../../controllers/mobile.controller.js';
import {
  verifyMobileAuth,
  requireAdmin,
} from '../../middlewares/mobileAuthMiddleware.js';

const router = express.Router();

// Public — exchange ApnaInsti token for VP-ESR mobile JWT
router.post('/auth', mobileAuth);

// Protected — all below require mobile JWT
router
  .route('/bookings')
  .get(verifyMobileAuth, getBookingsByDate)
  .post(verifyMobileAuth, createBooking)
  .delete(verifyMobileAuth, deleteBooking);

router.get('/bookings/mine', verifyMobileAuth, getMyBookings);

// Admin-only — delete any booking
router.delete(
  '/bookings/admin',
  verifyMobileAuth,
  requireAdmin,
  adminDeleteBooking
);

export default router;
