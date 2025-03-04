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
}

export default new StudioController();