import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, LogOut, User } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { RoomSelector } from './RoomSelector';
import { TimelineView } from './TimelineView';
import { BookingForm } from './BookingForm';
import { useAuth } from '../context/AuthContext';

export interface Booking {
  id: string;
  name: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string; // "ESR Room" or "VP Room"
  date: Date;
  purpose?: string;
}

const API_BASE = `${import.meta.env.VITE_APP_API_PREFIX || 'http://localhost:5001'
  }/api/bookings`;


// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const BookingTimeline = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState('ESR Room');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Format date in local timezone (YYYY-MM-DD) - IMPORTANT: toISOString() uses UTC which causes date shift!
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };



  // ✅ GET bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const formattedDate = formatDate(selectedDate);
      const res = await fetch(`${API_BASE}?date=${formattedDate}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn('Auth failed for bookings fetch - backend may be unavailable');
          // Don't logout - just show empty bookings
        }
        return;
      }

      const data = await res.json();
      // console.log('📥 Raw bookings from backend:', data);

      const transformed: Booking[] = data
        .filter((b: any) => {
          const roomName = b.room === 'esr' ? 'ESR Room' : 'VP Room';
          return roomName === selectedRoom;
        })
        .map((b: any) => {
          const startDate = new Date(b.startTime);
          const endDate = new Date(b.endTime);
          // Format times as HH:00 to match timeline slots exactly
          const startHour = startDate.getHours().toString().padStart(2, '0');
          const endHour = endDate.getHours().toString().padStart(2, '0');
          return {
            id: b._id,
            name: b.name,
            title: b.title,
            startTime: `${startHour}:00`,
            endTime: `${endHour}:00`,
            room: b.room === 'esr' ? 'ESR Room' : 'VP Room',
            date: startDate,
            purpose: b.description,
          };
        });

      // console.log('✅ Transformed bookings for timeline:', transformed);
      setBookings(transformed);
    } catch (err) {
      // console.error('💥 Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ POST new booking
  const handleBookingSubmit = async (bookingData: any) => {
    try {
      // console.log('📤 Sending booking to backend:', bookingData);

      const body = {
        name: bookingData.name,
        title: bookingData.title,
        room: bookingData.room === 'ESR Room' ? 'esr' : 'vp',
        date: formatDate(bookingData.date),
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        description: bookingData.purpose || '',
      };
      // console.log(body);

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      // console.log('📡 POST status:', res.status);

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Failed to create booking');
        return;
      }

      const newBooking = await res.json();
      // console.log('✅ Booking created successfully:', newBooking);

      setSelectedDate(new Date(bookingData.date));
      setSelectedRoom(bookingData.room);

      await fetchBookings();
      setShowBookingForm(false);
    } catch (err) {
      // console.error('💥 Error creating booking:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedDate, selectedRoom]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* User Info Bar */}
        <div className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Welcome, <strong className="text-foreground">{user?.name || 'User'}</strong></span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome {user?.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Timeline for booking ESR and VP room • Book available slots
              instantly
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => navigate('/my-bookings')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              My Bookings
            </Button>
            <Button
              onClick={() => setShowBookingForm(true)}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 sm:p-6">
            <DatePicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </Card>

          <Card className="p-4 sm:p-6">
            <RoomSelector
              selectedRoom={selectedRoom}
              onRoomSelect={setSelectedRoom}
            />
          </Card>
        </div>

        {/* Timeline View */}
        <Card className="p-4 sm:p-6 overflow-x-auto">
          <TimelineView
            selectedDate={selectedDate}
            selectedRoom={selectedRoom}
            bookings={bookings}
          />
        </Card>

        {/* Booking Form Dialog */}
        <BookingForm
          open={showBookingForm}
          onOpenChange={setShowBookingForm}
          onSubmit={handleBookingSubmit}
        />
      </div>
    </div>
  );
};

export default BookingTimeline;
