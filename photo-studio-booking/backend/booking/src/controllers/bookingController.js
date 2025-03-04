import pool from '../config/db.js';

class BookingController {
  // Create a new booking
  async createBooking(req, res) {
    try {
      const { studioId, packageId, slotId, bookingDate, notes } = req.body;
      const userId = req.user.id;
      
      if (!studioId || !packageId || !slotId || !bookingDate) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }
      
      // Start a transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Check if slot is available
        const slotCheck = await client.query(
          'SELECT * FROM slots WHERE id = $1 AND is_available = true',
          [slotId]
        );
        
        if (slotCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'The selected time slot is no longer available' });
        }
        
        // Get package details for price
        const packageCheck = await client.query(
          'SELECT price FROM packages WHERE id = $1',
          [packageId]
        );
        
        if (packageCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Invalid package selected' });
        }
        
        const packagePrice = packageCheck.rows[0].price;
        
        // Create booking record
        const bookingResult = await client.query(
          `INSERT INTO bookings (user_id, studio_id, package_id, slot_id, booking_date, total_price, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [userId, studioId, packageId, slotId, bookingDate, packagePrice, notes]
        );
        
        // Mark slot as unavailable
        await client.query(
          'UPDATE slots SET is_available = false WHERE id = $1',
          [slotId]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
          message: 'Booking created successfully',
          booking: bookingResult.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Get user's bookings
  async getUserBookings(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await pool.query(
        `SELECT b.*, s.name as studio_name, p.name as package_name, sl.date, sl.start_time, sl.end_time
         FROM bookings b
         JOIN studios s ON b.studio_id = s.id
         JOIN packages p ON b.package_id = p.id
         JOIN slots sl ON b.slot_id = sl.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting user bookings:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Get booking by ID
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await pool.query(
        `SELECT b.*, s.name as studio_name, p.name as package_name, sl.date, sl.start_time, sl.end_time
         FROM bookings b
         JOIN studios s ON b.studio_id = s.id
         JOIN packages p ON b.package_id = p.id
         JOIN slots sl ON b.slot_id = sl.id
         WHERE b.id = $1 AND b.user_id = $2`,
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting booking:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Cancel booking
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Start a transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Check if booking exists and belongs to user
        const bookingCheck = await client.query(
          'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
          [id, userId]
        );
        
        if (bookingCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Check if booking is already canceled
        if (bookingCheck.rows[0].status === 'canceled') {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Booking is already canceled' });
        }
        
        const slotId = bookingCheck.rows[0].slot_id;
        
        // Update booking status
        await client.query(
          'UPDATE bookings SET status = $1 WHERE id = $2',
          ['canceled', id]
        );
        
        // Make slot available again
        await client.query(
          'UPDATE slots SET is_available = true WHERE id = $1',
          [slotId]
        );
        
        await client.query('COMMIT');
        
        res.json({ message: 'Booking canceled successfully' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new BookingController();