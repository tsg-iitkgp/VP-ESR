import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, User } from 'lucide-react';

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
      background: '#1f2937',
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
        background: '#1f2937',
        color: '#f3f4f6',
        confirmButtonColor: '#3b82f6',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Delete failed',
        icon: 'error',
        background: '#1f2937',
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
    <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-10">
      {/* User Info Bar */}
      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 mb-6 border border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User className="h-4 w-4" />
          <span>Welcome, <strong className="text-white">{user?.name || 'User'}</strong></span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-red-400">
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>

      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">My Bookings</h1>
      </div>

      {loading && <p>Loading your bookings...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <p className="text-gray-400">No bookings found for {userName}.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {bookings
          .filter((booking) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const bookingDate = new Date(booking.startTime);
            bookingDate.setHours(0, 0, 0, 0);

            return bookingDate >= today;
          })
          .map((booking) => (
          <div
            key={booking._id}
            className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col gap-3"
          >
            <div>
              <h2 className="text-xl font-bold text-white">{booking.name}</h2>
              <p className="text-sm text-gray-400">{booking.title}</p>
            </div>

            <div className="text-sm text-gray-300 space-y-1">
              <p>
                <span className="font-medium text-gray-200">Room:</span>{' '}
                {booking.room === 'esr' ? 'ESR Room' : 'VP Room'}
              </p>
              <p>
                <span className="font-medium text-gray-200">Date:</span>{' '}
                {new Date(booking.startTime).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium text-gray-200">Time:</span>{' '}
                {new Date(booking.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(booking.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <button
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold disabled:opacity-50 transition-colors"
              onClick={() => handleDelete(booking._id)}
              disabled={deletingId === booking._id}
            >
              {deletingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings;
