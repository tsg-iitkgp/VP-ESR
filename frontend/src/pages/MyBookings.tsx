import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, User, Calendar, Clock, MapPin } from 'lucide-react';

interface Booking {
  _id: string;
  title: string; // Position / Title
  room: string;
  startTime: string;
  endTime: string;
  name: string;
}

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Use authenticated user's name
  const userName = user?.name || '';

  const API_PREFIX = import.meta.env.VITE_APP_API_PREFIX || 'http://localhost:5001';

  const fetchMyBookings = async () => {
    if (!userName) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_PREFIX}/api/bookings/myBookings?name=${encodeURIComponent(userName)}`,
        { headers: getAuthHeaders() }
      );

      if (res.status === 401) {
        console.warn('Auth failed for fetching bookings');
        setError('Authentication failed');
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Cancel Booking?',
      text: 'Are you sure you want to cancel this booking?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it',
      background: '#181e29',
      color: '#f3f4f6',
    });

    if (!confirm.isConfirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_PREFIX}/api/bookings?_id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        console.warn('Auth failed for delete');
        return;
      }

      if (!res.ok) throw new Error('Failed to delete booking');
      setBookings((prev) => prev.filter((b) => b._id !== id));

      Swal.fire({
        title: 'Cancelled!',
        text: 'Your booking has been cancelled.',
        icon: 'success',
        background: '#181e29',
        color: '#f3f4f6',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Delete failed',
        icon: 'error',
        background: '#181e29',
        color: '#f3f4f6',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [userName]);

  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* User Info Bar */}
        <div className="flex items-center justify-between bg-card rounded-xl p-3 sm:p-3.5 border border-border gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
            <User className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              Welcome, <strong className="text-foreground font-semibold">{user?.name || 'User'}</strong>
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="text-xs sm:text-sm h-8 px-2 sm:px-3 text-muted-foreground hover:text-destructive shrink-0"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Logout
          </Button>
        </div>

        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="h-9 sm:h-10 px-3 text-xs sm:text-sm rounded-lg border-border hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">
              My Bookings
            </h1>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs sm:text-sm text-muted-foreground">Loading your bookings...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">No active bookings found for <strong className="text-foreground">{userName}</strong>.</p>
            <Button
              onClick={() => navigate('/')}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm h-10 px-4"
            >
              Book a Room
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {bookings
            .filter((booking) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const bookingDate = new Date(booking.startTime);
              bookingDate.setHours(0, 0, 0, 0);

              return bookingDate >= today;
            })
            .map((booking) => {
              const startDate = new Date(booking.startTime);
              const endDate = new Date(booking.endTime);
              const roomName = booking.room === 'esr' ? 'ESR Room' : 'VP Room';

              return (
                <div
                  key={booking._id}
                  className="bg-card p-4 sm:p-5 rounded-xl shadow-sm border border-border hover:border-primary/40 transition-colors flex flex-col justify-between gap-3 sm:gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                          {booking.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {booking.title}
                        </p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-md bg-secondary text-secondary-foreground border border-border">
                        {roomName}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-muted-foreground space-y-1.5 pt-1 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-mono">
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2 h-9 sm:h-10 text-xs sm:text-sm font-medium"
                    onClick={() => handleDelete(booking._id)}
                    disabled={deletingId === booking._id}
                  >
                    {deletingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
