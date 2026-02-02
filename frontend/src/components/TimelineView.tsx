import React from 'react';
import { Booking } from './BookingTimeline';

interface TimelineViewProps {
  selectedDate: Date;
  selectedRoom: string;
  bookings: Booking[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  selectedDate,
  selectedRoom,
  bookings
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getBookingForTimeSlot = (timeSlot: string) => {
    return bookings.find(booking => {
      const [bookingStartHour] = booking.startTime.split(':').map(Number);
      let [bookingEndHour] = booking.endTime.split(':').map(Number);
      const [slotHour] = timeSlot.split(':').map(Number);

      // Handle midnight (00:00) as 24 for comparison
      if (bookingEndHour === 0) bookingEndHour = 24;

      return slotHour >= bookingStartHour && slotHour < bookingEndHour;
    });
  };

  const getBookingSpan = (booking: Booking) => {
    const [startHour] = booking.startTime.split(':').map(Number);
    let [endHour] = booking.endTime.split(':').map(Number);
    // Handle midnight (00:00) as 24 for calculation
    if (endHour === 0) endHour = 24;
    return endHour - startHour;
  };

  const renderBookingBlock = (booking: Booking, span: number) => {
    return (
      <div
        className="bg-primary text-primary-foreground p-4 rounded-lg ml-16"
        style={{
          gridRowEnd: `span ${span}`,
          minHeight: `${span * 4}rem`
        }}
      >
        <div className="font-medium text-sm">{booking.name}</div>
        <div className="text-xs opacity-90 mt-1">{booking.title}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Timeline view</h2>
        <p className="text-muted-foreground text-sm">
          timeline showing all bookings for {formatDate(selectedDate)}
        </p>
      </div>

      <div className="border-t border-timeline-border pt-4">
        <div className="grid grid-cols-1 gap-1">
          {timeSlots.map((timeSlot, index) => {
            const booking = getBookingForTimeSlot(timeSlot);
            const isBookingStart = booking && booking.startTime === timeSlot;

            // Skip rendering rows that are part of a multi-hour booking (except the start)
            if (booking && !isBookingStart) {
              return null;
            }

            return (
              <div
                key={timeSlot}
                className="flex items-start min-h-16 border-b border-timeline-border/30 last:border-b-0"
              >
                <div className="w-16 flex-shrink-0 py-2">
                  <div className="text-sm text-muted-foreground">
                    {timeSlot}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {parseInt(timeSlot.split(':')[0]) < 12 ? 'AM' : 'PM'}
                  </div>
                </div>

                <div className="flex-1 py-2">
                  {isBookingStart && booking ? (
                    renderBookingBlock(booking, getBookingSpan(booking))
                  ) : (
                    <div className="h-12"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};