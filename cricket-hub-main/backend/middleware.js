const jwt = require('jsonwebtoken');
const { User, Session } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_league_secret';

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.session_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }
    
    // Try JWT token first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ user_id: decoded.user_id }).select('-_id -__v -password_hash');
      if (!user) {
        return res.status(401).json({ detail: 'User not found' });
      }
      req.user = user.toObject();
      return next();
    } catch (jwtError) {
      // Not a JWT, try session token
    }
    
    // Try session token
    const session = await Session.findOne({ session_token: token });
    if (!session) {
      return res.status(401).json({ detail: 'Invalid session' });
    }
    
    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ detail: 'Session expired' });
    }
    
    const user = await User.findOne({ user_id: session.user_id }).select('-_id -__v -password_hash');
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    req.user = user.toObject();
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ detail: 'Authentication failed' });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ detail: 'Admin access required' });
  }
  next();
};

// Middleware to require manager or admin role (removed player from here)
const requireManagerOrAdmin = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user?.role)) {
    return res.status(403).json({ detail: 'Manager or Admin access required' });
  }
  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
};

module.exports = {
  authenticate,
  requireAdmin,
  requireManagerOrAdmin,
  generateToken
};
