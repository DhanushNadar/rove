const Whiteboard = require('../models/Whiteboard');
const Room = require('../models/Room');
const logger = require('../utils/logger');
const { redisClient } = require('../config/redis');
const { sendCanvasCommand, sendUndoRequest } = require('../services/kafka.service');

module.exports = (io, socket) => {
  const joinRoom = async ({ whiteboardId }) => {
    try {
      if (!whiteboardId) {
        return socket.emit('error', { message: 'whiteboardId is required to join a room' });
      }

      // 1. Verify Authorization
      const whiteboard = await Whiteboard.findById(whiteboardId);
      if (!whiteboard) {
        return socket.emit('error', { message: 'Whiteboard not found' });
      }

      const isOwner = whiteboard.owner.toString() === socket.user._id.toString();
      const isCollaborator = whiteboard.collaborators.some(
        c => c.user.toString() === socket.user._id.toString() && c.status === 'accepted'
      );

      if (!isOwner && !isCollaborator && !whiteboard.isPublic) {
        return socket.emit('error', { message: 'Not authorized to join this whiteboard room' });
      }

      // 2. Join Socket.io Room
      const roomId = `whiteboard:${whiteboardId}`;
      socket.join(roomId);
      socket.currentRoom = roomId;

      // 3. Update Redis Presence and clean up any stale sockets for the same userId in this room
      const currentUsersRaw = await redisClient.hGetAll(`room:${roomId}:users`);
      for (const [sid, userStr] of Object.entries(currentUsersRaw)) {
        try {
          const u = JSON.parse(userStr);
          if (u.userId.toString() === socket.user._id.toString()) {
            await redisClient.hDel(`room:${roomId}:users`, sid);
          }
        } catch (e) {
          // ignore
        }
      }

      const userPayload = {
        userId: socket.user._id,
        name: socket.user.name,
        socketId: socket.id,
        joinedAt: Date.now()
      };
      
      await redisClient.hSet(`room:${roomId}:users`, socket.id, JSON.stringify(userPayload));

      // 4. Update MongoDB Room Model (async, no need to block)
      Room.findOneAndUpdate(
        { whiteboardId },
        { 
          $push: { activeUsers: { user: socket.user._id, socketId: socket.id } },
          lastActivity: Date.now()
        },
        { upsert: true, new: true }
      ).catch(err => logger.error(`Room save error: ${err.message}`));

      // 5. Notify Room
      socket.to(roomId).emit('user-joined', { user: userPayload });
      
      // Send current users in room to the newly joined client
      const usersInRoomRaw = await redisClient.hGetAll(`room:${roomId}:users`);
      const usersInRoom = Object.values(usersInRoomRaw).map(u => JSON.parse(u));
      socket.emit('room-joined', { users: usersInRoom });

      logger.info(`User ${socket.user.email} joined room ${roomId}`);
    } catch (error) {
      logger.error(`Join room error: ${error.message}`);
      socket.emit('error', { message: 'Internal server error joining room' });
    }
  };

  const handleDraw = async (data) => {
    if (!socket.currentRoom) return;
    const whiteboardId = socket.currentRoom.split(':')[1];

    try {
      // Stream canvas operation transaction through Kafka event sourcing engine
      await sendCanvasCommand(whiteboardId, socket.user._id, {
        objectId: data.objectId,
        opType: data.opType || 'UPDATE',
        beforeState: data.beforeState || {},
        afterState: data.afterState || data
      });
    } catch (err) {
      logger.error(`Kafka draw publish failed, fallback to broadcast: ${err.message}`);
      // Fallback: direct ephemeral broadcast if Kafka broker is unavailable
      socket.to(socket.currentRoom).emit('draw', data);
    }
  };

  const handleUndo = async () => {
    if (!socket.currentRoom) return;
    const whiteboardId = socket.currentRoom.split(':')[1];

    try {
      // Publish localized undo transaction request into Kafka
      await sendUndoRequest(whiteboardId, socket.user._id);
    } catch (err) {
      logger.error(`Kafka undo request publish failed: ${err.message}`);
      socket.emit('error', { message: 'Undo queue currently unavailable. Please try again later.' });
    }
  };

  const handleCursorMove = (data) => {
    if (!socket.currentRoom) return;
    // Broadcast cursor position (usually x, y, and user info)
    socket.to(socket.currentRoom).emit('cursor-move', {
      userId: socket.user._id,
      name: socket.user.name,
      ...data
    });
  };

  const leaveRoom = async () => {
    if (!socket.currentRoom) return;
    
    const roomId = socket.currentRoom;
    socket.leave(roomId);
    
    // Remove from Redis
    await redisClient.hDel(`room:${roomId}:users`, socket.id);
    
    // Remove from MongoDB
    const whiteboardId = roomId.split(':')[1];
    Room.findOneAndUpdate(
      { whiteboardId },
      { $pull: { activeUsers: { socketId: socket.id } } }
    ).catch(err => logger.error(err));

    socket.to(roomId).emit('user-left', { userId: socket.user._id, socketId: socket.id });
    socket.currentRoom = null;
    logger.info(`User ${socket.user.email} left room ${roomId}`);
  };

  const disconnect = async () => {
    await leaveRoom();
  };

  socket.on('join-room', joinRoom);
  socket.on('leave-room', leaveRoom);
  socket.on('draw', handleDraw);
  socket.on('undo-trigger', handleUndo);
  socket.on('cursor-move', handleCursorMove);
  socket.on('disconnect', disconnect);
};
