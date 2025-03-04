// src/pages/UserBookingsPage.js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getUserBookings, cancelBooking } from '../services/bookingService';
import {
  Container, Typography, Box, Card, CardContent, CardActions,
  Button, Grid, Chip, Alert, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';

const UserBookingsPage = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getUserBookings();
        setBookings(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings');
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelBooking(selectedBookingId);
      
      // Update the bookings list
      setBookings(bookings.map(booking => 
        booking.id === selectedBookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
      setSuccess('Booking cancelled successfully');
      setDialogOpen(false);
    } catch (err) {
      setError('Failed to cancel booking');
      setDialogOpen(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Bookings
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading your bookings...</Typography>
        </Box>
      ) : bookings.length === 0 ? (
        <Alert severity="info">
          You don't have any bookings yet. Browse our studios to book your first session!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {bookings.map(booking => (
            <Grid item xs={12} md={6} key={booking.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {booking.package_name}
                    </Typography>
                    <Chip 
                      label={booking.status.toUpperCase()} 
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Time:</strong> {booking.start_time && booking.start_time.substring(0, 5)} - {booking.end_time && booking.end_time.substring(0, 5)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Price:</strong> ${booking.total_price}
                  </Typography>
                  
                  {booking.notes && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Notes:</strong> {booking.notes}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions>
                  {booking.status === 'pending' && (
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => handleCancelClick(booking.id)}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>No, Keep It</Button>
          <Button onClick={handleConfirmCancel} color="error" autoFocus>
            Yes, Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserBookingsPage;