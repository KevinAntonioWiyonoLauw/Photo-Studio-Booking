/**
 * Middleware to restrict access to admin users only
 */// booking/src/middlewares/adminMiddleware.js
const adminMiddleware = (req, res, next) => {
  console.log('Admin check - user info:', req.user);
  
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