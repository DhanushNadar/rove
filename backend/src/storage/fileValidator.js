const multer = require('multer');
const path = require('path');
const os = require('os');

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB MVP limit

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Cross-platform temp directory
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: MAX_UPLOAD_SIZE }
});

module.exports = { upload, MAX_UPLOAD_SIZE };
