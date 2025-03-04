import pool from '../config/db.js';

class PackageController {
  // Get all packages
  async getAllPackages(req, res) {
    try {
      const result = await pool.query('SELECT * FROM packages ORDER BY price');
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting packages:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get package by ID
  async getPackageById(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting package:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new PackageController();