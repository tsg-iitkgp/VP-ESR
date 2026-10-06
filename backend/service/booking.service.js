import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Booking } from '../models/booking.models.js';

/**
 * Fetches bookings for a given date.
 */
export const getBookingsByDateService = async (dateString) => {
  const date = parseISO(dateString);
  const bookings = await Booking.find({
    startTime: { $lt: endOfDay(date) },
    endTime: { $gt: startOfDay(date) },
  }).sort({ startTime: 'asc' });

  return bookings;
};

/**
 * Creates a new booking after checking for conflicts.
 */
export const createBookingService = async (bookingData) => {
  const { name, title, room, date, startTime, endTime, description } =
    bookingData;

  if (!name || !title || !room || !date || !startTime || !endTime) {
    const error = new Error('Missing required fields');
    error.statusCode = 400;
    throw error;
  }

  // Append IST offset (+05:30) so times are always interpreted as IST,
  // regardless of the server/container timezone setting
  const startDateTime = new Date(`${date}T${startTime}+05:30`);
  let endDateTime = new Date(`${date}T${endTime}+05:30`);

  if (startDateTime.getTime() === endDateTime.getTime()) {
    const error = new Error('Start and end time cannot be the same');
    error.statusCode = 400;
    throw error;
  }

  // Overnight booking: end time before start time on the same calendar day
  // means the booking wraps past midnight into the next day.
  if (endDateTime < startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  const conflictingBookings = await Booking.find({
    room: room,
    startTime: { $lt: endDateTime },
    endTime: { $gt: startDateTime },
  }).sort({ startTime: 1 });

  if (conflictingBookings.length > 0) {
    const conflicts = conflictingBookings.map((b) => ({
      name: b.name,
      title: b.title,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
    }));

    const n = conflicts.length;
    const error = new Error(
      `This time overlaps with ${n} existing booking${n > 1 ? 's' : ''}.`
    );
    error.statusCode = 409;
    error.conflicts = conflicts;
    throw error;
  }

  // Create the new booking
  const newBooking = await Booking.create({
    name,
    title,
    description,
    startTime: startDateTime,
    endTime: endDateTime,
    room,
  });

  return newBooking;
};


export const delBooking = async (_id) => {
  if (!_id) {
    const error = new Error('Id not found for deleting the booking in service');
    error.statusCode = 409;
    throw error.message;
  }
  const del = await Booking.deleteOne({ _id });

  return del;
}

export const bookingByName = async (name) => {
  if (!name) {
    const error = new Error('No name found while fetching using name');
    error.statusCode = 409;
    throw error.message;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0); // start of today

  const bookings = await Booking.find({
    name: name,
    endTime: { $gte: today }
  }).sort({ startTime: 'asc' });

  return bookings;

}