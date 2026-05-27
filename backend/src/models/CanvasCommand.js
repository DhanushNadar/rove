const mongoose = require('mongoose');

const CanvasCommandSchema = new mongoose.Schema({
  whiteboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Whiteboard',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  objectId: {
    type: String, // ID of the canvas shape, drawing, or connector
    required: true,
    index: true
  },
  type: {
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE'], 
    required: true
  },
  // Detailed state snapshot to enable precise visual reconstruction and undo swaps
  beforeState: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  afterState: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isUndone: {
    type: Boolean,
    default: false,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('CanvasCommand', CanvasCommandSchema);
