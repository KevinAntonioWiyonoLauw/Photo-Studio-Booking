// src/services/slotService.js
import api from './api';

/**
 * Get available time slots for a studio on a specific date
 * Uses the new backend endpoint that handles all the logic
 */
export const getAvailableSlots = async (studioId, date) => {
  try {
    // Use the new endpoint that generates slots on the backend
    const response = await api.get(`/bookings/available-hours?studioId=${studioId}&date=${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    // Return a specific error that we can handle in the UI
    throw new Error('Failed to load time slots');
  }
};

/**
 * Alternative implementation if the /available-hours endpoint isn't working
 * This generates slots on the frontend side
 */
export const getAvailableSlotsBackup = async (studioId, date) => {
  try {
    // First, get the studio to know its working hours
    const studioResponse = await api.get(`/api/studios/${studioId}`);
    const studio = studioResponse.data;
    
    // Get default or studio-specific hours
    const openingHour = studio.opening_hour || 9;
    const closingHour = studio.closing_hour || 18;
    
    // Get slots that are already booked
    const bookedResponse = await api.get(`/api/slots?studioId=${studioId}&date=${date}&isBooked=true`);
    const bookedSlots = bookedResponse.data;
    const bookedTimes = new Set(bookedSlots.map(slot => slot.start_time));
    
    // Generate hourly slots based on opening/closing hours
    const availableSlots = [];
    for (let hour = openingHour; hour < closingHour; hour++) {
      const hourString = hour.toString().padStart(2, '0');
      const startTime = `${hourString}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      
      // Skip if this hour is already booked
      if (bookedTimes.has(startTime)) {
        continue;
      }
      
      availableSlots.push({
        id: `${studioId}-${date}-${hour}`,  // Generate a predictable ID
        studio_id: studioId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        is_booked: false
      });
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error generating available slots:', error);
    throw new Error('Failed to load time slots');
  }
};

/**
 * Check if a specific date and time is available for booking
 * Useful for validating before submission
 */
export const checkSlotAvailability = async (studioId, date, hour) => {
  try {
    const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
    const response = await api.get(
      `/api/slots/check-availability?studioId=${studioId}&date=${date}&startTime=${startTime}`
    );
    return response.data.available;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false; // Assume not available if there's an error
  }
};