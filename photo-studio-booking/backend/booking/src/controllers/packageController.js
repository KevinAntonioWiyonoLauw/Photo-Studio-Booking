import pool from '../config/db.js';

class PackageController {
  // Get all packages
  async getAllPackages(req, res) {
    try {
      const result = await pool.query(`
        SELECT p.*, s.name as studio_name 
        FROM packages p
        JOIN studios s ON p.studio_id = s.id
        ORDER BY p.price
      `);
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
      const result = await pool.query(`
        SELECT p.*, s.name as studio_name
        FROM packages p
        JOIN studios s ON p.studio_id = s.id
        WHERE p.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting package:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Create new package (admin only)
  async createPackage(req, res) {
    try {
      const { name, description, price, duration, studioId, features } = req.body;
      
      // Validate required fields
      if (!name || !price || !duration || !studioId) {
        return res.status(400).json({ 
          message: 'Name, price, duration and studioId are required fields' 
        });
      }
      
      // Validate price is a positive number
      if (price <= 0) {
        return res.status(400).json({ message: 'Price must be greater than zero' });
      }
      
      // Check if studio exists
      const studioCheck = await pool.query(
        'SELECT * FROM studios WHERE id = $1',
        [studioId]
      );
      
      if (studioCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Studio does not exist' });
      }
      
      const result = await pool.query(
        'INSERT INTO packages (name, description, price, duration, studio_id, features) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, description, price, duration, studioId, features]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Update package (admin only)
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, duration, studioId, features } = req.body;
      
      // Check if package exists
      const packageCheck = await pool.query(
        'SELECT * FROM packages WHERE id = $1',
        [id]
      );
      
      if (packageCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      // Validate price if provided
      if (price !== undefined && price <= 0) {
        return res.status(400).json({ message: 'Price must be greater than zero' });
      }
      
      // Check if studio exists if studioId is provided
      if (studioId) {
        const studioCheck = await pool.query(
          'SELECT * FROM studios WHERE id = $1',
          [studioId]
        );
        
        if (studioCheck.rows.length === 0) {
          return res.status(400).json({ message: 'Studio does not exist' });
        }
      }
      
      // Update only fields that are provided
      const oldPackage = packageCheck.rows[0];
      const updatedName = name !== undefined ? name : oldPackage.name;
      const updatedDescription = description !== undefined ? description : oldPackage.description;
      const updatedPrice = price !== undefined ? price : oldPackage.price;
      const updatedDuration = duration !== undefined ? duration : oldPackage.duration;
      const updatedStudioId = studioId !== undefined ? studioId : oldPackage.studio_id;
      const updatedFeatures = features !== undefined ? features : oldPackage.features;
      
      const result = await pool.query(
        `UPDATE packages 
         SET name = $1, description = $2, price = $3, duration = $4, studio_id = $5, features = $6 
         WHERE id = $7 
         RETURNING *`,
        [updatedName, updatedDescription, updatedPrice, updatedDuration, updatedStudioId, updatedFeatures, id]
      );
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Delete package (admin only)
  async deletePackage(req, res) {
    try {
      const { id } = req.params;
      
      // Check if the package is associated with any bookings
      const bookingCheck = await pool.query(
        'SELECT * FROM bookings WHERE package_id = $1',
        [id]
      );
      
      if (bookingCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete package that has associated bookings' 
        });
      }
      
      const result = await pool.query(
        'DELETE FROM packages WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json({ message: 'Package deleted successfully' });
    } catch (error) {
      console.error('Error deleting package:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new PackageController();