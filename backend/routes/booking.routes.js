import express from 'express';
import {
  createBooking,
  deleteBooking,
  getBookingsByDate,
  getBookingsByName
} from '../controllers/booking.controller.js';

const router = express.Router();

router.route('/').get(getBookingsByDate).post( createBooking).delete(deleteBooking);
router.route('/myBookings').get(getBookingsByName);

export default router;