import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    room: {
      type: String,
      required: true,
      enum: ['esr', 'vp'], 
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ room: 1, startTime: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);