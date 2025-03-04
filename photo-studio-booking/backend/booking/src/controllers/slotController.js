import pool from '../config/db.js';

class SlotController {
  // Get available slots for a studio on a specific date
  async getAvailableSlots(req, res) {
    try {
      const { studioId, date } = req.query;
      
      if (!studioId || !date) {
        return res.status(400).json({ message: 'Studio ID and date are required' });
      }
      
      const result = await pool.query(
        'SELECT * FROM slots WHERE studio_id = $1 AND date = $2 AND is_available = true ORDER BY start_time',
        [studioId, date]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new slots (admin function)
  async createSlot(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { studioId, date, startTime, endTime } = req.body;
      
      if (!studioId || !date || !startTime || !endTime) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      const result = await pool.query(
        'INSERT INTO slots (studio_id, date, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
        [studioId, date, startTime, endTime]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating slot:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new SlotController();