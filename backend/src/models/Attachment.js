const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  objectId: { type: String, required: true, index: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Whiteboard', required: true, index: true },
  
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  
  telegramFileId: { type: String, required: true },
  telegramMessageId: { type: String, required: true },
  
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  tags: [{ type: String }],
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Attachment', attachmentSchema);
