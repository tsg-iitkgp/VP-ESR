import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';

/* ---------------- Schema ---------------- */

const bookingSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    title: z.string().min(2, 'Title must be at least 2 characters'),
    room: z.string().min(1, 'Please select a room'),
    date: z.date({ required_error: 'Please select a date' }),
    startTime: z.string().min(1, 'Please select start time'),
    endTime: z.string().min(1, 'Please select end time'),
    purpose: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = parseInt(data.startTime.split(':')[0]);
      const end = parseInt(data.endTime.split(':')[0]);
      // Allow midnight (00:00) as end time - treat as 24 for 11pm to 12am bookings
      const adjustedEnd = end === 0 ? 24 : end;
      return adjustedEnd > start;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BookingFormData) => void;
}

/* ---------------- Constants ---------------- */

const rooms = [
  {
    value: 'ESR Room',
    label: "ESR Room - Elected Student's Representative Room",
  },
  { value: 'VP Room', label: 'VP Room - Vice President Room' },
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

/* ---------------- Component ---------------- */

export const BookingForm: React.FC<BookingFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const { toast } = useToast();
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const { user } = useAuth();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: user?.name || '',
      title: '',
      room: '',
      startTime: '',
      endTime: '',
      purpose: '',
    },
  });

  /* 🔹 Sync JWT name */
  React.useEffect(() => {
    if (user?.name) {
      form.reset({
        ...form.getValues(),
        name: user.name,
      });
    }
  }, [user, form]);

  /* 🔹 Date helpers */
  const isToday = (date?: Date) => {
    if (!date) return false;
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  // Helper to get current hour fresh each time - used for filtering time slots
  const getCurrentHour = () => new Date().getHours();

  const handleSubmit = (data: BookingFormData) => {
    if (!data.date) return;

    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[560px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
            New Room Booking
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Fill in the details below to book a room. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 sm:space-y-5 pt-2"
          >
            {/* Name + Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        className="h-10 sm:h-11 text-sm bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Title/Position *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Coordinator"
                        className="h-10 sm:h-11 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Room */}
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Room *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.value} value={room.value} className="text-sm">
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Date *</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full h-10 sm:h-11 pl-3 text-left font-normal text-sm',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(d) => {
                          field.onChange(d);
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Start + End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Start Time *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 sm:h-11 text-sm">
                          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-56">
                        {timeSlots
                          .filter((time) => {
                            if (!isToday(form.watch('date'))) return true;
                            return parseInt(time.value) > getCurrentHour();
                          })
                          .map((time) => (
                            <SelectItem key={time.value} value={time.value} className="text-sm">
                              {time.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">End Time *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 sm:h-11 text-sm">
                          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-56">
                        {timeSlots
                          .filter((time) => {
                            if (!isToday(form.watch('date'))) return true;
                            const hour = parseInt(time.value);
                            // Always allow midnight (00:00) as end time option
                            if (hour === 0) return true;
                            return hour > getCurrentHour();
                          })
                          .map((time) => (
                            <SelectItem key={time.value} value={time.value} className="text-sm">
                              {time.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Purpose (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the meeting purpose"
                      className="resize-none min-h-[75px] text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:pt-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto h-10 text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Booking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

