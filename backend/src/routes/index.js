const express = require('express');
const authRoutes = require('./auth.routes');
const whiteboardRoutes = require('./whiteboard.routes');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/whiteboards', whiteboardRoutes);
router.use('/attachments', require('./attachment.routes'));
router.use('/media', require('./mediaRoutes'));

module.exports = router;
