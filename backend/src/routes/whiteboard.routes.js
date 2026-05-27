const express = require('express');
const {
  createWhiteboard,
  getWhiteboards,
  getWhiteboardById,
  saveCanvas,
  shareWhiteboard,
  analyzeCanvas,
  renameWhiteboard,
  deleteWhiteboard,
  getInvitations,
  acceptInvitation,
  declineInvitation
} = require('../controllers/whiteboard.controller');
const { validate, createWhiteboardSchema, saveCanvasSchema, shareWhiteboardSchema } = require('../validators/whiteboard.validator');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(validate(createWhiteboardSchema), createWhiteboard)
  .get(getWhiteboards);

router.route('/invitations')
  .get(getInvitations);

router.route('/:id')
  .get(getWhiteboardById)
  .delete(deleteWhiteboard);

router.route('/:id/rename')
  .put(renameWhiteboard);

router.route('/:id/accept')
  .post(acceptInvitation);

router.route('/:id/decline')
  .post(declineInvitation);

router.route('/:id/canvas')
  .put(validate(saveCanvasSchema), saveCanvas);

router.route('/:id/share')
  .post(validate(shareWhiteboardSchema), shareWhiteboard);

router.route('/:id/analyze')
  .post(analyzeCanvas);

module.exports = router;
