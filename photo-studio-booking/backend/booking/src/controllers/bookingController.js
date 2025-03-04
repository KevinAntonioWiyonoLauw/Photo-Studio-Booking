import pool from '../config/db.js';

class BookingController {
  // User Methods
  async createBooking(req, res) {
    try {
      const { packageId, slotId, notes } = req.body;
      const userId = req.user.id;
      
      // Check if slot is a generated ID (studio-date-hour format)
      if (typeof slotId === 'string' && slotId.includes('-')) {
        console.log('Processing generated slot ID:', slotId);
        
        // Extract data from the generated ID with proper date handling
        // The format is expected to be "studioId-YYYY-MM-DD-hour"
        const parts = slotId.split('-');
        
        if (parts.length < 4) {
          return res.status(400).json({ message: 'Invalid slot ID format' });
        }
        
        // First part is studio ID
        const studioId = parts[0];
        
        // Next three parts form the date (YYYY-MM-DD)
        const dateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
        
        // Last part is the hour
        const hour = parts[4];
        
        console.log(`Extracted: Studio ID ${studioId}, Date ${dateStr}, Hour ${hour}`);
        
        // Create the actual slot in database
        try {
          const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
          const endTime = `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00:00`;
          
          // Check if the slot already exists
          const existingSlot = await pool.query(
            'SELECT * FROM slots WHERE studio_id = $1 AND date = $2 AND start_time = $3',
            [studioId, dateStr, startTime]
          );
          
          let realSlotId;
          
          if (existingSlot.rows.length > 0) {
            // Use existing slot if found
            realSlotId = existingSlot.rows[0].id;
            
            // Check if it's already booked
            if (existingSlot.rows[0].is_booked) {
              return res.status(400).json({ message: 'Selected time slot is already booked' });
            }
          } else {
            // Create new slot if not found
            const newSlot = await pool.query(
              'INSERT INTO slots (studio_id, date, start_time, end_time, is_booked) VALUES ($1, $2, $3, $4, $5) RETURNING *',
              [studioId, dateStr, startTime, endTime, false]
            );
            realSlotId = newSlot.rows[0].id;
          }
          
          // Use the real slot ID from now on
          req.body.slotId = realSlotId;
        } catch (error) {
          console.error('Error creating slot from generated ID:', error);
          return res.status(500).json({ message: 'Failed to create slot', error: error.message });
        }
      }
      
      // Continue with standard booking logic
      // Check if the slot exists and is available
      const slotCheck = await pool.query(
        'SELECT * FROM slots WHERE id = $1', 
        [req.body.slotId]
      );
      
      if (slotCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Time slot not found' });
      }
      
      if (slotCheck.rows[0].is_booked) {
        return res.status(400).json({ message: 'Selected time slot is already booked' });
      }
      
      // Get studio_id from slot
      const studioId = slotCheck.rows[0].studio_id;
      const bookingDate = slotCheck.rows[0].date;
      
      // Get package details
      const packageCheck = await pool.query(
        'SELECT * FROM packages WHERE id = $1',
        [packageId]
      );
      
      if (packageCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Selected package not found' });
      }
      
      const totalPrice = packageCheck.rows[0].price;
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // Create booking
        const bookingResult = await pool.query(
          `INSERT INTO bookings 
          (user_id, studio_id, package_id, slot_id, booking_date, status, total_price, notes) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          RETURNING *`,
          [userId, studioId, packageId, req.body.slotId, bookingDate, 'pending', totalPrice, notes]
        );
        
        // Update slot to booked
        await pool.query(
          'UPDATE slots SET is_booked = true WHERE id = $1',
          [req.body.slotId]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(201).json(bookingResult.rows[0]);
      } catch (error) {
        // Rollback in case of error during transaction
        await pool.query('ROLLBACK');
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  
  async getUserBookings(req, res) {
    try {
      const userId = req.user.id;
      
      // First check if user has any bookings (simpler query)
      const bookingExists = await pool.query(
        'SELECT EXISTS(SELECT 1 FROM bookings WHERE user_id = $1)',
        [userId]
      );
      
      // If no bookings exist, return empty array early
      if (!bookingExists.rows[0].exists) {
        return res.json([]);
      }
      
      // Get detailed booking information
      const result = await pool.query(
        `SELECT b.*, p.name as package_name, s.date, s.start_time, s.end_time 
        FROM bookings b 
        JOIN packages p ON b.package_id = p.id 
        JOIN slots s ON b.slot_id = s.id 
        WHERE b.user_id = $1 
        ORDER BY s.date DESC, s.start_time DESC`,
        [userId]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting user bookings:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  
  async getBookedSlots(req, res) {
    try {
      const { studioId, date } = req.query;
      
      if (!studioId || !date) {
        return res.status(400).json({ message: 'Studio ID and date are required' });
      }
      
      // Find slots that are already booked for this studio and date
      const result = await pool.query(
        `SELECT s.* FROM slots s
         WHERE s.studio_id = $1 AND s.date = $2 AND s.is_booked = true`,
        [studioId, date]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting booked slots:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getAvailableHours(req, res) {
    try {
      
      const { studioId, date } = req.query;
      
      if (!studioId || !date) {
        return res.status(400).json({ message: 'Studio ID and date are required' });
      }
      
      // Get studio operating hours
      const studioResult = await pool.query(
        'SELECT opening_hour, closing_hour FROM studios WHERE id = $1',
        [studioId]
      );
      
      if (studioResult.rows.length === 0) {
        return res.status(404).json({ message: 'Studio not found' });
      }
      
      const { opening_hour, closing_hour } = studioResult.rows[0];
      
      // Get booked slots
      const bookedResult = await pool.query(
        `SELECT start_time FROM slots 
         WHERE studio_id = $1 AND date = $2 AND is_booked = true`,
        [studioId, date]
      );
      
      const bookedHours = new Set(bookedResult.rows.map(row => {
        return row.start_time.substring(0, 2); // Extract hour from 'HH:MM:SS'
      }));
      
      // Generate available time slots
      const availableSlots = [];
      
      for (let hour = opening_hour; hour < closing_hour; hour++) {
        // Skip if this hour is already booked
        if (bookedHours.has(hour.toString().padStart(2, '0'))) {
          continue;
        }
        
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
        
        availableSlots.push({
          id: `${studioId}-${date}-${hour}`,  // Generate a virtual ID
          studio_id: studioId,
          date: date,
          start_time: startTime,
          end_time: endTime,
          is_booked: false
        });
      }
      
      res.json(availableSlots);
    } catch (error) {
      console.error('Error getting available hours:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';
      
      // If admin, can access any booking, otherwise only user's own bookings
      const query = isAdmin 
        ? 'SELECT * FROM bookings WHERE id = $1' 
        : 'SELECT * FROM bookings WHERE id = $1 AND user_id = $2';
      
      const params = isAdmin ? [id] : [id, userId];
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting booking:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // Get the booking and verify ownership
        const bookingResult = await pool.query(
          'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
          [id, userId]
        );
        
        if (bookingResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ message: 'Booking not found' });
        }
        
        const booking = bookingResult.rows[0];
        
        if (booking.status === 'cancelled') {
          await pool.query('ROLLBACK');
          return res.status(400).json({ message: 'Booking is already cancelled' });
        }
        
        // Update booking status
        await pool.query(
          'UPDATE bookings SET status = $1 WHERE id = $2',
          ['cancelled', id]
        );
        
        // Free up the slot
        await pool.query(
          'UPDATE slots SET is_booked = false WHERE id = $1',
          [booking.slot_id]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.json({ message: 'Booking cancelled successfully' });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  
  // Admin Methods
  async getAllBookings(req, res) {
    try {
      // Check if there are any bookings first
      const hasBookings = await pool.query('SELECT EXISTS(SELECT 1 FROM bookings)');
      
      if (!hasBookings.rows[0].exists) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT b.*, p.name as package_name, s.date, s.start_time, s.end_time
        FROM bookings b 
        JOIN packages p ON b.package_id = p.id 
        JOIN slots s ON b.slot_id = s.id 
        ORDER BY s.date DESC, s.start_time DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting all bookings:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled' 
        });
      }
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // Get the booking
        const bookingResult = await pool.query(
          'SELECT * FROM bookings WHERE id = $1',
          [id]
        );
        
        if (bookingResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ message: 'Booking not found' });
        }
        
        const booking = bookingResult.rows[0];
        
        // Update booking status
        await pool.query(
          'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
          [status, id]
        );
        
        // If status is cancelled, free up the slot
        if (status === 'cancelled') {
          await pool.query(
            'UPDATE slots SET is_booked = false WHERE id = $1',
            [booking.slot_id]
          );
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.json({ message: `Booking status updated to ${status}` });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

export default new BookingController();