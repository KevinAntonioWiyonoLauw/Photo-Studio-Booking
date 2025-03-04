import pool from '../config/db.js';

class StudioController {
  // Get all studios
  async getAllStudios(req, res) {
    try {
      const result = await pool.query('SELECT * FROM studios ORDER BY id');
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting studios:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get studio by ID
  async getStudioById(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM studios WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Studio not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting studio:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update the createStudio method to include studio hours and slot generation

async createStudio(req, res) {
  try {
    const { name, description, image_url, opening_hour, closing_hour } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        message: 'Name is required' 
      });
    }
    
    // Check if studio with same name already exists
    const existingStudio = await pool.query(
      'SELECT * FROM studios WHERE name = $1',
      [name]
    );
    
    if (existingStudio.rows.length > 0) {
      return res.status(400).json({ message: 'A studio with this name already exists' });
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    try {
      // Create the studio with opening/closing hours
      const result = await pool.query(
        'INSERT INTO studios (name, description, image_url, opening_hour, closing_hour) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, image_url, opening_hour || 9, closing_hour || 18]
      );
      
      const newStudio = result.rows[0];
      
      // Generate slots for the next 7 days
      const daysToGenerate = 7;
      const studioId = newStudio.id;
      const studioOpeningHour = newStudio.opening_hour;
      const studioClosingHour = newStudio.closing_hour;
      
      console.log(`Generating slots for new studio ${name} (ID: ${studioId})`);
      console.log(`Hours: ${studioOpeningHour} to ${studioClosingHour}`);
      
      for (let day = 0; day < daysToGenerate; day++) {
        const slotDate = new Date();
        slotDate.setDate(slotDate.getDate() + day);
        const formattedDate = slotDate.toISOString().split('T')[0];
        
        console.log(`Creating slots for ${formattedDate}`);
        
        // Generate hourly slots from opening to closing hour
        for (let hour = studioOpeningHour; hour < studioClosingHour; hour++) {
          await pool.query(
            'INSERT INTO slots (studio_id, date, start_time, end_time, is_booked) VALUES ($1, $2, $3, $4, $5)',
            [studioId, formattedDate, `${hour}:00:00`, `${hour+1}:00:00`, false]
          );
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.status(201).json({
        ...newStudio,
        message: `Studio created with ${daysToGenerate} days of available slots`
      });
    } catch (error) {
      // Rollback on error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating studio:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
  
// Update the updateStudio method to include studio hours

async updateStudio(req, res) {
  try {
    const { id } = req.params;
    const { name, description, image_url, opening_hour, closing_hour } = req.body;
    
    // Check if studio exists
    const studioCheck = await pool.query(
      'SELECT * FROM studios WHERE id = $1',
      [id]
    );
    
    if (studioCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Studio not found' });
    }
    
    const studio = studioCheck.rows[0];
    
    // If name is changing, check if new name already exists
    if (name && name !== studio.name) {
      const nameCheck = await pool.query(
        'SELECT * FROM studios WHERE name = $1 AND id != $2',
        [name, id]
      );
      
      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ message: 'A studio with this name already exists' });
      }
    }
    
    // Update with provided values or keep existing
    const updatedName = name || studio.name;
    const updatedDescription = description !== undefined ? description : studio.description;
    const updatedImageUrl = image_url !== undefined ? image_url : studio.image_url;
    const updatedOpeningHour = opening_hour !== undefined ? opening_hour : studio.opening_hour;
    const updatedClosingHour = closing_hour !== undefined ? closing_hour : studio.closing_hour;
    
    const result = await pool.query(
      `UPDATE studios 
       SET name = $1, description = $2, image_url = $3, opening_hour = $4, closing_hour = $5 
       WHERE id = $6 
       RETURNING *`,
      [updatedName, updatedDescription, updatedImageUrl, updatedOpeningHour, updatedClosingHour, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating studio:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

  
  // Delete studio
  async deleteStudio(req, res) {
    try {
      const { id } = req.params;
      
      // Check if studio exists
      const studioCheck = await pool.query(
        'SELECT * FROM studios WHERE id = $1',
        [id]
      );
      
      if (studioCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Studio not found' });
      }
      
      // Check if studio has associated packages
      const packagesCheck = await pool.query(
        'SELECT * FROM packages WHERE studio_id = $1 LIMIT 1',
        [id]
      );
      
      if (packagesCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete studio that has associated packages' 
        });
      }
      
      // Check if studio has associated slots
      const slotsCheck = await pool.query(
        'SELECT * FROM slots WHERE studio_id = $1 LIMIT 1',
        [id]
      );
      
      if (slotsCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete studio that has associated time slots' 
        });
      }
      
      // If no associations exist, delete the studio
      await pool.query('DELETE FROM studios WHERE id = $1', [id]);
      
      res.json({ message: 'Studio deleted successfully' });
    } catch (error) {
      console.error('Error deleting studio:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new StudioController();