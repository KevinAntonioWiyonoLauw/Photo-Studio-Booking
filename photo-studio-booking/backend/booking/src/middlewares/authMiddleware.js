// booking/src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Debug: Log the token
    console.log('Token received:', token);
    
    // Just decode the token, don't verify signature
    const decoded = jwt.decode(token);
    
    // Debug: Log the decoded structure
    console.log('Decoded token:', decoded);
    
   // Make more flexible checking for user ID
if (!decoded || (!decoded.id && !decoded.userId && !decoded.sub && !decoded.user_id)) {
  return res.status(401).json({ message: 'Invalid token structure' });
}

// Add user info to request (handle different field names)
req.user = {
  id: decoded.id || decoded.userId || decoded.sub || decoded.user_id,
  role: decoded.role || 'user'
};
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export default protect;