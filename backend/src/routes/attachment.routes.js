const express = require('express');
const { uploadFile, getAttachments, getDownloadUrl, deleteAttachment } = require('../controllers/attachmentController');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../storage/fileValidator');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/object/:objectId', protect, getAttachments);
router.get('/:id/url', protect, getDownloadUrl);
router.delete('/:id', protect, deleteAttachment);

module.exports = router;
