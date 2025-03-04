import pool from '../config/db.js';

class SlotController {
  // Get available slots for a studio on a specific date
  async getAvailableSlots(req, res) {
    try {
      const { studioId, date } = req.query;
      
      if (!studioId || !date) {
        return res.status(400).json({ message: 'Studio ID and date are required' });
      }
      
      // Fixed the typo here - changed 'falsei' to 'false'
      const result = await pool.query(
        'SELECT * FROM slots WHERE studio_id = $1 AND date = $2 AND is_booked = false ORDER BY start_time',
        [studioId, date]
      );
      
      // If no slots are found, generate them automatically
      if (result.rows.length === 0) {
        // Generate slots for this studio and date
        await this.ensureSlotsExist(studioId, date);
        
        // Query again after generating
        const newResult = await pool.query(
          'SELECT * FROM slots WHERE studio_id = $1 AND date = $2 AND is_booked = false ORDER BY start_time',
          [studioId, date]
        );
        
        res.json(newResult.rows);
      } else {
        res.json(result.rows);
      }
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Helper method to ensure slots exist for a given studio and date
  async ensureSlotsExist(studioId, date) {
    try {
      // Check if studio exists
      const studioCheck = await pool.query('SELECT * FROM studios WHERE id = $1', [studioId]);
      if (studioCheck.rows.length === 0) {
        throw new Error('Studio not found');
      }
      
      // Get studio opening/closing hours or use defaults
      const studio = studioCheck.rows[0];
      const openingHour = studio.opening_hour || 9;  // Default opening at 9 AM
      const closingHour = studio.closing_hour || 18; // Default closing at 6 PM
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // Generate hourly slots from opening to closing hour
        for (let hour = openingHour; hour < closingHour; hour++) {
          await pool.query(
            'INSERT INTO slots (studio_id, date, start_time, end_time, is_booked) VALUES ($1, $2, $3, $4, $5)',
            [studioId, date, `${hour}:00:00`, `${hour+1}:00:00`, false]
          );
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        console.log(`Generated slots for studio ID ${studioId} on ${date}`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error ensuring slots exist:', error);
      throw error;
    }
  }

  // Rest of your existing methods remain unchanged...
  
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

  // Add this method to your SlotController class

// Generate slots for a specific studio
async generateSlotsForStudio(req, res) {
  try {
    const { studioId } = req.params;
    const daysAhead = req.query.days ? parseInt(req.query.days) : 7;
    
    // Check if studio exists
    const studioCheck = await pool.query('SELECT * FROM studios WHERE id = $1', [studioId]);
    if (studioCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Studio not found' });
    }
    
    // Get studio opening/closing hours
    const studio = studioCheck.rows[0];
    const openingHour = studio.opening_hour || 9;
    const closingHour = studio.closing_hour || 18;
    
    // Begin transaction
    await pool.query('BEGIN');
    
    try {
      const createdSlots = [];
      
      // Generate slots for the specified number of days
      for (let day = 0; day < daysAhead; day++) {
        const slotDate = new Date();
        slotDate.setDate(slotDate.getDate() + day);
        const formattedDate = slotDate.toISOString().split('T')[0];
        
        // Check if slots already exist for this date and studio
        const existingCheck = await pool.query(
          'SELECT COUNT(*) FROM slots WHERE studio_id = $1 AND date = $2',
          [studioId, formattedDate]
        );
        
        // Skip if slots already exist for this date
        if (existingCheck.rows[0].count > 0) {
          continue;
        }
        
        // Generate hourly slots from opening to closing hour
        for (let hour = openingHour; hour < closingHour; hour++) {
          const result = await pool.query(
            'INSERT INTO slots (studio_id, date, start_time, end_time, is_booked) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [studioId, formattedDate, `${hour}:00:00`, `${hour+1}:00:00`, false]
          );
          
          createdSlots.push(result.rows[0]);
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.status(201).json({ 
        message: `Generated ${createdSlots.length} slots for studio ID ${studioId}`,
        slots: createdSlots
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error generating slots for studio:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
}

export default new SlotController();