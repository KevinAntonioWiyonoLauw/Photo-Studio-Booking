import pool from '../config/db.js';

class BookingController {
  // User Methods
  
  async createBooking(req, res) {
    try {
      const { packageId, slotId, specialRequests, contactPhone } = req.body;
      const userId = req.user.id;
      
      // Check if the slot is available
      const slotCheck = await pool.query(
        'SELECT * FROM slots WHERE id = $1 AND is_booked = false', 
        [slotId]
      );
      
      if (slotCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Selected time slot is not available' });
      }
      
      // Begin transaction
      await pool.query('BEGIN');
      
      // Create booking
      const bookingResult = await pool.query(
        `INSERT INTO bookings 
        (user_id, package_id, slot_id, special_requests, contact_phone, status) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [userId, packageId, slotId, specialRequests, contactPhone, 'pending']
      );
      
      // Update slot to booked
      await pool.query(
        'UPDATE slots SET is_booked = true WHERE id = $1',
        [slotId]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.status(201).json(bookingResult.rows[0]);
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getUserBookings(req, res) {
    try {
      const userId = req.user.id;
      
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
      res.status(500).json({ message: 'Server error' });
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
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Begin transaction
      await pool.query('BEGIN');
      
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
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error cancelling booking:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Admin Methods
  
  async getAllBookings(req, res) {
    try {
      const result = await pool.query(
        `SELECT b.*, p.name as package_name, s.date, s.start_time, s.end_time, u.username as user_name
        FROM bookings b 
        JOIN packages p ON b.package_id = p.id 
        JOIN slots s ON b.slot_id = s.id 
        JOIN users u ON b.user_id = u.id
        ORDER BY s.date DESC, s.start_time DESC`
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting all bookings:', error);
      res.status(500).json({ message: 'Server error' });
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
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new BookingController();