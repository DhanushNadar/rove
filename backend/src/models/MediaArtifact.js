const mongoose = require('mongoose');

const mediaArtifactSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    boardId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Whiteboard',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['file', 'image', 'video'],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    telegramFileId: {
      type: String,
      required: true
    },
    telegramThumbnailId: {
      type: String,
      default: null
    },
    telegramMessageId: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MediaArtifact', mediaArtifactSchema);
