import React from 'react';
import { Booking } from './BookingTimeline';
import { Clock } from 'lucide-react';

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
    return Math.max(1, endHour - startHour);
  };

  const renderBookingBlock = (booking: Booking, span: number) => {
    return (
      <div
        className="w-full bg-primary text-primary-foreground p-2.5 sm:p-4 rounded-xl shadow-md border border-primary/30 flex flex-col justify-between transition-all"
        style={{
          minHeight: `${Math.max(span * 3.75, 3.5)}rem`
        }}
      >
        <div className="min-w-0">
          <div className="font-semibold text-xs sm:text-sm md:text-base leading-tight truncate">
            {booking.name}
          </div>
          <div className="text-[11px] sm:text-xs opacity-90 truncate mt-0.5">
            {booking.title}
          </div>
          {booking.purpose && (
            <p className="text-[10px] sm:text-xs opacity-80 mt-1 line-clamp-1 sm:line-clamp-2">
              {booking.purpose}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-medium opacity-85 mt-1.5 pt-1 border-t border-primary-foreground/15">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{booking.startTime} - {booking.endTime}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Timeline View</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Showing schedule for <strong className="text-foreground font-medium">{selectedRoom}</strong> on {formatDate(selectedDate)}
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-md self-start sm:self-auto shrink-0 mt-1 sm:mt-0">
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
        </div>
      </div>

      <div className="border-t border-border/60 pt-2 sm:pt-4">
        <div className="grid grid-cols-1 divide-y divide-border/20">
          {timeSlots.map((timeSlot) => {
            const booking = getBookingForTimeSlot(timeSlot);
            const isBookingStart = booking && booking.startTime === timeSlot;

            // Skip rendering rows that are part of a multi-hour booking (except the start)
            if (booking && !isBookingStart) {
              return null;
            }

            const hourNum = parseInt(timeSlot.split(':')[0], 10);
            const period = hourNum < 12 ? 'AM' : 'PM';
            const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;

            return (
              <div
                key={timeSlot}
                className="flex items-stretch min-h-[3.5rem] sm:min-h-[4rem] group"
              >
                {/* Time Indicator Column */}
                <div className="w-14 sm:w-20 shrink-0 py-2 sm:py-3 pr-2 sm:pr-4 flex flex-col justify-start items-end border-r border-border/40 select-none">
                  <div className="text-xs sm:text-sm font-semibold text-foreground/80">
                    {timeSlot}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {displayHour} {period}
                  </div>
                </div>

                {/* Slot Content */}
                <div className="flex-1 py-1.5 sm:py-2 pl-2 sm:pl-4 min-w-0">
                  {isBookingStart && booking ? (
                    renderBookingBlock(booking, getBookingSpan(booking))
                  ) : (
                    <div className="h-full min-h-[2.5rem] sm:min-h-[3rem] rounded-lg group-hover:bg-secondary/20 transition-colors flex items-center">
                    </div>
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