/**
 * Middleware to restrict access to admin users only
 */
const adminMiddleware = (req, res, next) => {
    // The user object should be attached by the authMiddleware
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required' 
      });
    }
    
    next();
  };
  
  export default adminMiddleware;