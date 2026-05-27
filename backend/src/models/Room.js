const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    whiteboardId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Whiteboard',
      required: true,
      unique: true
    },
    activeUsers: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User'
        },
        socketId: String,
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Middleware to update lastActivity on save
roomSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

module.exports = mongoose.model('Room', roomSchema);
