import pool from '../config/db.js';

class SlotController {
  // Get available slots for a studio on a specific date
  async getAvailableSlots(req, res) {
    try {
      const { studioId, date } = req.query;
      
      if (!studioId || !date) {
        return res.status(400).json({ message: 'Studio ID and date are required' });
      }
      
      // Updated to use is_booked field
      const result = await pool.query(
        'SELECT * FROM slots WHERE studio_id = $1 AND date = $2 AND is_booked = false ORDER BY start_time',
        [studioId, date]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Get all slots by studio (admin function)
  async getAllSlotsByStudio(req, res) {
    try {
      const { studioId } = req.params;
      
      if (!studioId) {
        return res.status(400).json({ message: 'Studio ID is required' });
      }
      
      const result = await pool.query(
        'SELECT * FROM slots WHERE studio_id = $1 ORDER BY date, start_time',
        [studioId]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting slots:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new slots (admin function)
  async createSlot(req, res) {
    try {
      const { studioId, date, startTime, endTime } = req.body;
      
      // Validate required fields
      if (!studioId || !date || !startTime || !endTime) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if studio exists
      const studioCheck = await pool.query('SELECT * FROM studios WHERE id = $1', [studioId]);
      if (studioCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Studio does not exist' });
      }
      
      // Check for time conflicts
      const conflictCheck = await pool.query(
        `SELECT * FROM slots 
         WHERE studio_id = $1 AND date = $2 AND 
         ((start_time <= $3 AND end_time > $3) OR 
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4))`,
        [studioId, date, startTime, endTime]
      );
      
      if (conflictCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Time slot conflicts with an existing slot' });
      }
      
      const result = await pool.query(
        'INSERT INTO slots (studio_id, date, start_time, end_time, is_booked) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [studioId, date, startTime, endTime, false]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating slot:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Update slot (admin function)
  async updateSlot(req, res) {
    try {
      const { id } = req.params;
      const { date, startTime, endTime, isBooked } = req.body;
      
      // Check if slot exists
      const slotCheck = await pool.query('SELECT * FROM slots WHERE id = $1', [id]);
      if (slotCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Slot not found' });
      }
      
      const slot = slotCheck.rows[0];
      
      // If the slot is booked and we're trying to change the time, prevent it
      if (slot.is_booked && (date !== slot.date || startTime !== slot.start_time || endTime !== slot.end_time)) {
        return res.status(400).json({ message: 'Cannot modify time for a booked slot' });
      }
      
      // Update values considering what was provided
      const updatedDate = date || slot.date;
      const updatedStartTime = startTime || slot.start_time;
      const updatedEndTime = endTime || slot.end_time;
      const updatedIsBooked = isBooked !== undefined ? isBooked : slot.is_booked;
      
      const result = await pool.query(
        'UPDATE slots SET date = $1, start_time = $2, end_time = $3, is_booked = $4 WHERE id = $5 RETURNING *',
        [updatedDate, updatedStartTime, updatedEndTime, updatedIsBooked, id]
      );
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating slot:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Delete slot (admin function)
  async deleteSlot(req, res) {
    try {
      const { id } = req.params;
      
      // Check if slot exists and is not booked
      const slotCheck = await pool.query('SELECT * FROM slots WHERE id = $1', [id]);
      if (slotCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Slot not found' });
      }
      
      if (slotCheck.rows[0].is_booked) {
        return res.status(400).json({ message: 'Cannot delete a booked slot' });
      }
      
      await pool.query('DELETE FROM slots WHERE id = $1', [id]);
      
      res.json({ message: 'Slot deleted successfully' });
    } catch (error) {
      console.error('Error deleting slot:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Batch create slots (admin function) - useful for creating multiple slots at once
  async batchCreateSlots(req, res) {
    try {
      const { studioId, date, slots } = req.body;
      
      if (!studioId || !date || !slots || !Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({ message: 'Studio ID, date and slots array are required' });
      }
      
      // Check if studio exists
      const studioCheck = await pool.query('SELECT * FROM studios WHERE id = $1', [studioId]);
      if (studioCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Studio does not exist' });
      }
      
      // Begin transaction
      await pool.query('BEGIN');
      
      const createdSlots = [];
      
      for (const slot of slots) {
        const { startTime, endTime } = slot;
        
        if (!startTime || !endTime) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ message: 'Each slot must have startTime and endTime' });
        }
        
        // Check for time conflicts
        const conflictCheck = await pool.query(
          `SELECT * FROM slots 
           WHERE studio_id = $1 AND date = $2 AND 
           ((start_time <= $3 AND end_time > $3) OR 
            (start_time < $4 AND end_time >= $4) OR
            (start_time >= $3 AND end_time <= $4))`,
          [studioId, date, startTime, endTime]
        );
        
        if (conflictCheck.rows.length > 0) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Time slot ${startTime}-${endTime} conflicts with an existing slot` 
          });
        }
        
        const result = await pool.query(
          'INSERT INTO slots (studio_id, date, start_time, end_time, is_booked) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [studioId, date, startTime, endTime, false]
        );
        
        createdSlots.push(result.rows[0]);
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.status(201).json(createdSlots);
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error batch creating slots:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new SlotController();