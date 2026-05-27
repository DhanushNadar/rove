const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const MediaArtifact = require('../models/MediaArtifact');
const Whiteboard = require('../models/Whiteboard');
const StorageFactory = require('../storage/storageFactory');

// @desc    Upload media to board
// @route   POST /api/v1/media/upload
// @access  Private
const uploadMedia = async (req, res, next) => {
  try {
    const { boardId, type, x, y } = req.body;
    
    if (!req.file || !boardId || !type) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ status: 'fail', message: 'File, boardId, and type are required' });
    }

    const whiteboard = await Whiteboard.findById(boardId);
    if (!whiteboard) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    // Check permissions
    const isOwner = whiteboard.owner.toString() === req.user._id.toString();
    const collaborator = whiteboard.collaborators.find(c => c.user.toString() === req.user._id.toString());
    const isEditor = collaborator && collaborator.role === 'editor';

    if (!isOwner && !isEditor) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ status: 'fail', message: 'Not authorized to upload to this board' });
    }

    // Upload to Storage Provider (Telegram)
    const provider = StorageFactory.getProvider();
    const uploadResult = await provider.upload(req.file);

    // Clean up local temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    // Generate unique media ID
    const mediaId = crypto.randomBytes(16).toString('hex');

    const artifact = await MediaArtifact.create({
      mediaId,
      boardId,
      type,
      fileName: uploadResult.fileName || req.file.originalname,
      mimeType: uploadResult.mimeType || req.file.mimetype,
      size: uploadResult.size || req.file.size,
      telegramFileId: uploadResult.fileId,
      telegramThumbnailId: uploadResult.thumbnailId || null,
      telegramMessageId: uploadResult.messageId,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        mediaId: artifact.mediaId,
        type: artifact.type,
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        size: artifact.size,
        hasThumbnail: !!artifact.telegramThumbnailId,
        x: parseFloat(x) || 0,
        y: parseFloat(y) || 0
      }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// @desc    Securely Proxy Media File
// @route   GET /api/v1/media/proxy/:mediaId
// @access  Private (or public if board is public - simplified to check token)
const proxyMedia = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const artifact = await MediaArtifact.findOne({ mediaId });

    if (!artifact) {
      return res.status(404).json({ status: 'fail', message: 'Media not found' });
    }

    // Get direct URL from provider (this is a temporary Telegram URL)
    const provider = StorageFactory.getProvider();
    const directUrl = await provider.generateAccessUrl(artifact.telegramFileId);

    // Stream it to client
    const response = await axios({
      method: 'GET',
      url: directUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', artifact.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${artifact.fileName}"`);
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to proxy media' });
  }
};

// @desc    Securely Proxy Media Thumbnail
// @route   GET /api/v1/media/thumbnail/:mediaId
// @access  Private
const proxyThumbnail = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const artifact = await MediaArtifact.findOne({ mediaId });

    if (!artifact) {
      return res.status(404).json({ status: 'fail', message: 'Media not found' });
    }

    const provider = StorageFactory.getProvider();
    let fileIdToFetch = artifact.telegramThumbnailId;

    // If no thumbnail exists, fallback to the original file if it's an image
    if (!fileIdToFetch) {
      if (artifact.mimeType.startsWith('image/')) {
        fileIdToFetch = artifact.telegramFileId;
      } else {
        return res.status(404).json({ status: 'fail', message: 'Thumbnail not available' });
      }
    }

    const directUrl = await provider.generateAccessUrl(fileIdToFetch);

    const response = await axios({
      method: 'GET',
      url: directUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', fileIdToFetch === artifact.telegramThumbnailId ? 'image/jpeg' : artifact.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache aggressively
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Thumbnail Proxy error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to proxy thumbnail' });
  }
};

module.exports = {
  uploadMedia,
  proxyMedia,
  proxyThumbnail
};
