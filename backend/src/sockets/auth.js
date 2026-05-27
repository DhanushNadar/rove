const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    // Extract Bearer part if present
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    // Verify token
    const decoded = jwt.verify(cleanToken, env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuthMiddleware;
