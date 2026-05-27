const { redisClient } = require('../config/redis');
const CanvasCommand = require('../models/CanvasCommand');
const logger = require('../utils/logger');

// We use Redis Streams to build a durable, sequential event-sourced command queue (equivalent to a Kafka stream)
const STREAM_KEY = 'rove:whiteboard:commands';

const initKafka = async (io) => {
  try {
    logger.info('🚀 Redis Streams Event Sourcing Service online. Queue consumer activated.');

    // Start background consumer polling loop
    let lastId = '$'; // Start reading only new events from this point forward

    const pollStream = async () => {
      try {
        if (!redisClient.isOpen) return;

        // Perform a blocking read on the stream (similar to Kafka poll)
        const results = await redisClient.xRead(
          { key: STREAM_KEY, id: lastId },
          { BLOCK: 3000, COUNT: 1 }
        );

        if (results && results.length > 0) {
          for (const stream of results) {
            for (const message of stream.messages) {
              lastId = message.id; // update offset pointer
              const payload = message.message;

              // Parse payload attributes
              const type = payload.type;
              const whiteboardId = payload.whiteboardId;
              const userId = payload.userId;
              const data = JSON.parse(payload.data || '{}');
              const roomId = `whiteboard:${whiteboardId}`;

              try {
                if (type === 'CANVAS_COMMAND') {
                  const { objectId, opType, beforeState, afterState } = data;

                  // 1. Durably log command transaction in MongoDB event log
                  const command = new CanvasCommand({
                    whiteboardId,
                    userId,
                    objectId,
                    type: opType,
                    beforeState,
                    afterState
                  });
                  await command.save();

                  // 2. Broadcast acknowledged execution log to all room collaborators
                  io.to(roomId).emit('draw-ack', {
                    commandId: command._id,
                    userId,
                    objectId,
                    opType,
                    state: afterState
                  });

                } else if (type === 'UNDO_REQUEST') {
                  // ---- COLLABORATIVE LOCALIZED UNDO RESOLUTION ALGORITHM ----
                  
                  // 1. Query history for the User's latest active (non-undone) operation
                  const lastActiveCommand = await CanvasCommand.findOne({
                    whiteboardId,
                    userId,
                    isUndone: false
                  }).sort({ timestamp: -1 });

                  if (!lastActiveCommand) {
                    io.to(roomId).emit('undo-failed', { 
                      userId, 
                      reason: 'No undoable operations found for your session.' 
                    });
                    continue;
                  }

                  const targetObjectId = lastActiveCommand.objectId;

                  // 2. CONFLICT CHECK: Has another user modified this specific object since?
                  const concurrentEdit = await CanvasCommand.findOne({
                    whiteboardId,
                    objectId: targetObjectId,
                    timestamp: { $gt: lastActiveCommand.timestamp },
                    userId: { $ne: userId }
                  });

                  if (concurrentEdit) {
                    io.to(roomId).emit('undo-failed', {
                      userId,
                      reason: 'Conflict: This element was recently updated by another collaborator.'
                    });
                    continue;
                  }

                  // 3. COMPUTE INVERSE TRANSACTION STATE
                  // Swap states to undo: beforeState becomes the target result state
                  const inverseState = lastActiveCommand.beforeState;
                  const inverseOpType = lastActiveCommand.type === 'CREATE' ? 'DELETE' : 
                                        lastActiveCommand.type === 'DELETE' ? 'CREATE' : 'UPDATE';

                  // 4. Update parent transaction status
                  lastActiveCommand.isUndone = true;
                  await lastActiveCommand.save();

                  // 5. Append inverse operation to event log (enables downstream REDO commands)
                  const inverseCommand = new CanvasCommand({
                    whiteboardId,
                    userId,
                    objectId: targetObjectId,
                    type: inverseOpType,
                    beforeState: lastActiveCommand.afterState,
                    afterState: inverseState
                  });
                  await inverseCommand.save();

                  // 6. Broadcast selective command rollback to all workspace instances
                  io.to(roomId).emit('draw-ack', {
                    commandId: inverseCommand._id,
                    userId,
                    objectId: targetObjectId,
                    opType: inverseOpType,
                    state: inverseState,
                    isUndoAction: true
                  });

                  logger.info(`Collaborative Undo resolved for User ${userId} on Object ${targetObjectId}`);
                }
              } catch (eventErr) {
                logger.error(`Error executing event queue command: ${eventErr.message}`);
              }
            }
          }
        }
      } catch (err) {
        // Suppress timeout warnings during blocking reads
      }

      // Schedule next poll iteration (maintains low CPU load)
      setTimeout(pollStream, 50);
    };

    pollStream();

  } catch (err) {
    logger.error(`Redis Streams queue initialization failure: ${err.message}`);
  }
};

const sendCanvasCommand = async (whiteboardId, userId, opPayload) => {
  try {
    const payload = {
      type: 'CANVAS_COMMAND',
      whiteboardId: whiteboardId.toString(),
      userId: userId.toString(),
      data: JSON.stringify(opPayload)
    };

    // Publish to Redis Stream (equivalent to producing a Kafka message)
    await redisClient.xAdd(STREAM_KEY, '*', payload);
  } catch (err) {
    logger.error(`Failed to push to Redis Stream queue: ${err.message}`);
    throw err;
  }
};

const sendUndoRequest = async (whiteboardId, userId) => {
  try {
    const payload = {
      type: 'UNDO_REQUEST',
      whiteboardId: whiteboardId.toString(),
      userId: userId.toString()
    };

    await redisClient.xAdd(STREAM_KEY, '*', payload);
  } catch (err) {
    logger.error(`Failed to push Undo request to Redis Stream queue: ${err.message}`);
    throw err;
  }
};

module.exports = {
  initKafka, // Keep identical export names so server.js / whiteboard.handler.js require calls require 0 refactoring
  sendCanvasCommand,
  sendUndoRequest
};
