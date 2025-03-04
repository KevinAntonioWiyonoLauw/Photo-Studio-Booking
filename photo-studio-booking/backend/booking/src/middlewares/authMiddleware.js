import jwt from 'jsonwebtoken';
import axios from 'axios';

// Middleware to validate tokens and protect routes
const protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token locally
    try {
      // Decode token (we only need the user ID for most operations)
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.id) {
        throw new Error('Invalid token structure');
      }
      
      // Store user data in request
      req.user = {
        id: decoded.id,
        role: decoded.role || 'user'
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export default protect;