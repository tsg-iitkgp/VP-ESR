import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateSelect }) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getWeekDays = (date: Date) => {
    // Get Monday of the current week
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const mondayDiff = day === 0 ? -6 : 1 - day; 
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayDiff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(selectedDate);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    onDateSelect(newDate);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">
          {formatDate(selectedDate)}
        </h2>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="h-8 w-8 p-0 rounded-md hover:bg-secondary"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDateSelect(new Date())}
            className="text-xs px-2 h-8 hidden xs:inline-flex sm:inline-flex"
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigateWeek('next')}
            className="h-8 w-8 p-0 rounded-md hover:bg-secondary"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day, index) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const isCurrentToday = day.toDateString() === new Date().toDateString();
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => onDateSelect(day)}
              className={`
                p-1.5 sm:p-2.5 md:p-3 rounded-lg text-center transition-all min-w-0 flex flex-col items-center justify-center relative
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isSelected 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                  : 'bg-secondary hover:bg-booking-hover text-secondary-foreground'
                }
              `}
            >
              <div className="text-xs sm:text-sm md:text-base font-semibold leading-tight">
                {day.getDate()}
              </div>
              <div className="text-[10px] sm:text-xs opacity-80 leading-tight mt-0.5 truncate w-full">
                {dayNames[index]}
              </div>
              {isCurrentToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-primary absolute bottom-1"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};