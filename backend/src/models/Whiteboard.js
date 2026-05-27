const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      default: 'Untitled Whiteboard',
      trim: true
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          enum: ['viewer', 'editor'],
          default: 'viewer'
        },
        status: {
          type: String,
          enum: ['pending', 'accepted'],
          default: 'pending'
        }
      }
    ],
    canvasData: {
      type: mongoose.Schema.Types.Mixed,
      default: {} // Will hold Fabric.js JSON state
    },
    aiMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {} // Will hold future AI parsed data
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
