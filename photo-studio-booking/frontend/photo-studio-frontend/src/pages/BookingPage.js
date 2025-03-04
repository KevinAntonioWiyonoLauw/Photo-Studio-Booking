// src/pages/BookingPage.js
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAvailableSlots } from '../services/slotService';
import { getStudioById } from '../services/studioService';
import { getPackagesByStudio } from '../services/packageService';
import { createBooking } from '../services/bookingService';
import {
  Container, Typography, Box, FormControl, InputLabel, Select, 
  MenuItem, Button, TextField, Alert, Paper, Grid
} from '@mui/material';

const BookingPage = () => {
  const { studioId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  const [studio, setStudio] = useState(null);
  const [date, setDate] = useState(new Date());
  const [packages, setPackages] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(location.state?.selectedPackageId || '');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load studio details
  useEffect(() => {
    const fetchStudioDetails = async () => {
      try {
        const studioData = await getStudioById(studioId);
        setStudio(studioData);
      } catch (err) {
        setError('Failed to load studio details');
      }
    };
    
    fetchStudioDetails();
  }, [studioId]);

  // Load packages for this studio
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await getPackagesByStudio(studioId);
        setPackages(data);
      } catch (err) {
        setError('Failed to load packages');
      }
    };
    
    fetchPackages();
  }, [studioId]);

  // Load available slots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        setLoading(true);
        // Format date as YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];
        const data = await getAvailableSlots(studioId, formattedDate);
        setSlots(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load time slots');
        setLoading(false);
      }
    };
    
    if (date) {
      fetchAvailableSlots();
    }
  }, [studioId, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPackageId || !selectedSlotId) {
      setError('Please select a package and time slot');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await createBooking({
        packageId: selectedPackageId,
        slotId: selectedSlotId,
        notes
      });
      
      navigate('/bookings', { 
        state: { message: 'Booking created successfully!' } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
      setIsSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Book a Session
        </Typography>
        
        {studio && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {studio.name}
          </Typography>
        )}
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Select Date"
                type="date"
                value={date.toISOString().split('T')[0]}
                onChange={(e) => {
                  setDate(new Date(e.target.value));
                  setSelectedSlotId('');
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0], // Disable past dates
                }}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Package</InputLabel>
                <Select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  label="Select Package"
                >
                  {packages.map(pkg => (
                    <MenuItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - ${pkg.price} ({pkg.duration} mins)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Time Slot</InputLabel>
                <Select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  label="Select Time Slot"
                  disabled={loading || slots.length === 0}
                >
                  {slots.map(slot => (
                    <MenuItem key={slot.id} value={slot.id}>
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </MenuItem>
                  ))}
                </Select>
                {slots.length === 0 && !loading && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    No available slots for this date
                  </Typography>
                )}
                {loading && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Loading available slots...
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Requests/Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={4}
                placeholder="Any special requests or notes for the photographer"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined"
              onClick={() => navigate(`/studios/${studioId}`)}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || !selectedPackageId || !selectedSlotId}
            >
              {isSubmitting ? 'Processing...' : 'Confirm Booking'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default BookingPage;