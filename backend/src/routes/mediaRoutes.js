const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadMedia, proxyMedia, proxyThumbnail } = require('../controllers/mediaController');
const { protect } = require('../middleware/auth.middleware');
const path = require('path');
const os = require('os');

// Configure Multer for temp storage before Telegram upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const maxSize = process.env.MAX_MEDIA_UPLOAD_SIZE ? parseInt(process.env.MAX_MEDIA_UPLOAD_SIZE) : 20971520; // 20MB default

const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize }
});

router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/proxy/:mediaId', protect, proxyMedia);
router.get('/thumbnail/:mediaId', protect, proxyThumbnail);

module.exports = router;
