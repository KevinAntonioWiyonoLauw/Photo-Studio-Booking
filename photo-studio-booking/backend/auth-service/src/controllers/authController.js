import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

class AuthController {
  async register(req, res) {
    const { username, email, password } = req.body;
    
    try {
      // Check if user already exists
      const userExists = await pool.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2', 
        [username, email]
      );
      
      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user
      const newUser = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, role',
        [username, email, hashedPassword]
      );
      
      // Generate token
      const token = jwt.sign(
        { id: newUser.rows[0].id, role: newUser.rows[0].role },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.rows[0].id,
          username: newUser.rows[0].username,
          email: newUser.rows[0].email,
          role: newUser.rows[0].role
        },
        token
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  async login(req, res) {
    const { email, password } = req.body;
    
    try {
      // Check if user exists
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const user = userResult.rows[0];
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Verify token and get user data
  async getProfile(req, res) {
    try {
      const user = await pool.query(
        'SELECT id, username, email, role FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (user.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        user: user.rows[0]
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new AuthController();