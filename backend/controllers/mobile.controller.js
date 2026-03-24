import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import {
  createBookingService,
  getBookingsByDateService,
  delBooking,
  bookingByName,
} from '../service/booking.service.js';

/**
 * POST /api/mobile/auth
 * Accepts the ApnaInsti userToken, verifies it using the shared JWT_SECRET,
 * and issues a VP-ESR mobile JWT.
 */
export const mobileAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    // Verify the ApnaInsti userToken using shared secret
    const decoded = jwt.verify(token, process.env.APNAINSTI_JWT_SECRET);

    const userName =
      decoded.name ||
      (decoded.first_name && decoded.last_name
        ? `${decoded.first_name} ${decoded.last_name}`
        : decoded.email?.split('@')[0] || 'User');

    // Issue a VP-ESR mobile JWT
    const vpEsrToken = jwt.sign(
      {
        name: userName,
        email: decoded.email || '',
        role: decoded.role || '',
        iss: 'vp-esr-mobile',
        aud: 'vp-esr',
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token: vpEsrToken,
      user: {
        name: userName,
        email: decoded.email || '',
        role: decoded.role || '',
      },
    });
  } catch (error) {
    console.error('Mobile auth failed:', error.message);
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Authentication failed' });
  }
});

/**
 * GET /api/mobile/bookings?date=YYYY-MM-DD
 * Fetch bookings for a given date.
 */
export const getBookingsByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    res.status(400);
    throw new Error('Date query parameter is required');
  }
  const bookings = await getBookingsByDateService(date);
  res.status(200).json(bookings);
});

/**
 * POST /api/mobile/bookings
 * Create a new booking.
 */
export const createBooking = asyncHandler(async (req, res) => {
  try {
    const bookingData = req.body;
    // Use the authenticated user's name
    bookingData.name = req.user.name;
    const newBooking = await createBookingService(bookingData);
    res.status(201).json(newBooking);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || 'Failed to create booking' });
  }
});

/**
 * DELETE /api/mobile/bookings?_id=...
 * Delete own booking.
 */
export const deleteBooking = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) {
    res.status(400);
    throw new Error('Booking ID is required');
  }
  const del = await delBooking(_id);

  if (del.deletedCount === 0) {
    res.status(404);
    throw new Error('Booking not found');
  }
  res.status(200).json(del);
});

/**
 * GET /api/mobile/bookings/mine
 * Get current user's upcoming bookings.
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const name = req.user.name;
  if (!name) {
    res.status(400);
    throw new Error('User name not found in token');
  }
  const bookings = await bookingByName(name);
  res.status(200).json(bookings);
});

/**
 * DELETE /api/mobile/bookings/admin?_id=...
 * Admin: delete any booking.
 */
export const adminDeleteBooking = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) {
    res.status(400);
    throw new Error('Booking ID is required');
  }
  const del = await delBooking(_id);

  if (del.deletedCount === 0) {
    res.status(404);
    throw new Error('Booking not found');
  }
  res.status(200).json(del);
});
