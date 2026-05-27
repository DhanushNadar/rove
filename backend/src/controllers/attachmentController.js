const StorageFactory = require('../storage/storageFactory');
const Attachment = require('../models/Attachment');
const fs = require('fs');

exports.uploadFile = async (req, res) => {
  try {
    const { objectId, boardId } = req.body;
    if (!req.file || !objectId || !boardId) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'File, objectId, and boardId are required' });
    }

    const provider = StorageFactory.getProvider();
    const storageResult = await provider.upload(req.file);

    // Clean up local temp file
    fs.unlinkSync(req.file.path);

    const attachment = await Attachment.create({
      objectId,
      boardId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      telegramFileId: storageResult.fileId,
      telegramMessageId: storageResult.messageId,
      uploadedBy: req.user.id
    });

    res.status(201).json({ success: true, data: attachment });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const { objectId } = req.params;
    const attachments = await Attachment.find({ objectId }).populate('uploadedBy', 'name email');
    res.status(200).json({ success: true, count: attachments.length, data: attachments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getDownloadUrl = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) return res.status(404).json({ success: false, error: 'Not found' });

    const provider = StorageFactory.getProvider();
    const url = await provider.generateAccessUrl(attachment.telegramFileId);
    
    res.status(200).json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) return res.status(404).json({ success: false, error: 'Not found' });

    const provider = StorageFactory.getProvider();
    await provider.delete(attachment.telegramMessageId);
    
    await attachment.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
