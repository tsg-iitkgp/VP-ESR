import asyncHandler from 'express-async-handler';
import {
  createBookingService,
  getBookingsByDateService,
  delBooking,
  bookingByName
} from '../service/booking.service.js';


export const createBooking = asyncHandler(async (req, res) => {
  try {
    const bookingData = req.body;
    const newBooking = await createBookingService(bookingData);
    res.status(201).json(newBooking);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Failed to create booking' });
  }
});


export const getBookingsByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    res.status(400);
    throw new Error('Date query parameter is required');
  }
  const bookings = await getBookingsByDateService(date);
  res.status(200).json(bookings);
});

export const deleteBooking = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) {
    res.status(400);
    throw new Error('Id is required for Deleting')
  }
  const del = await delBooking(_id);

  if (del.deletedCount == 0) {
    res.status(400);
    throw new Error('No such booking found while deleting')
  }
  res.status(200).json(del);
})

export const getBookingsByName = asyncHandler(async (req, res) => {
  const { name } = req.query;
  if (!name) {
    res.status(400);
    throw new Error('Name is required for fetching')
  }
  const name_bookings = await bookingByName(name);
  res.status(200).json(name_bookings);
})