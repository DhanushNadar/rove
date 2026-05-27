const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('../config/redis');
const socketAuthMiddleware = require('./auth');
const registerWhiteboardHandlers = require('./whiteboard.handler');
const logger = require('../utils/logger');

const initializeSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Setup Redis Adapter for scaling
  // We need a pub and sub client
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('🚀 Socket.io Redis Adapter configured');
  });

  // Global Middleware for Auth
  io.use(socketAuthMiddleware);

  // Connection Handler
  io.on('connection', (socket) => {
    logger.info(`⚡ Socket connected: ${socket.id} (User: ${socket.user.email})`);

    // Register handlers
    registerWhiteboardHandlers(io, socket);

    socket.on('error', (err) => {
      logger.error(`Socket error (${socket.id}):`, err);
    });
  });

  return io;
};

module.exports = initializeSockets;
