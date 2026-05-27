const Whiteboard = require('../models/Whiteboard');
const User = require('../models/User');

// @desc    Create a new whiteboard
// @route   POST /api/v1/whiteboards
// @access  Private
const createWhiteboard = async (req, res, next) => {
  try {
    const { title, isPublic } = req.body;

    const whiteboard = await Whiteboard.create({
      title: title || 'Untitled Whiteboard',
      owner: req.user._id,
      isPublic: isPublic || false
    });

    res.status(201).json({
      status: 'success',
      data: whiteboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all whiteboards for user (owned and collaborated)
// @route   GET /api/v1/whiteboards
// @access  Private
const getWhiteboards = async (req, res, next) => {
  try {
    const whiteboards = await Whiteboard.find({
      $or: [
        { owner: req.user._id },
        { 
          collaborators: {
            $elemMatch: {
              user: req.user._id,
              status: 'accepted'
            }
          }
        }
      ]
    })
    .sort('-updatedAt')
    .select('-canvasData'); // Exclude heavy canvas data from list view

    res.status(200).json({
      status: 'success',
      results: whiteboards.length,
      data: whiteboards
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single whiteboard (Restore API)
// @route   GET /api/v1/whiteboards/:id
// @access  Private
const getWhiteboardById = async (req, res, next) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id)
      .populate('owner', 'name email profilePicture')
      .populate('collaborators.user', 'name email profilePicture');

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    // Check access permissions
    const isOwner = whiteboard.owner._id.toString() === req.user._id.toString();
    const isCollaborator = whiteboard.collaborators.some(
      c => c.user._id.toString() === req.user._id.toString() && c.status === 'accepted'
    );

    if (!isOwner && !isCollaborator && !whiteboard.isPublic) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to access this whiteboard' });
    }

    res.status(200).json({
      status: 'success',
      data: whiteboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save canvas data
// @route   PUT /api/v1/whiteboards/:id/canvas
// @access  Private
const saveCanvas = async (req, res, next) => {
  try {
    const { canvasData } = req.body;
    
    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    // Check editor permissions
    const isOwner = whiteboard.owner.toString() === req.user._id.toString();
    const collaborator = whiteboard.collaborators.find(
      c => c.user.toString() === req.user._id.toString() && c.status === 'accepted'
    );
    const isEditor = collaborator && collaborator.role === 'editor';

    if (!isOwner && !isEditor) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to edit this whiteboard' });
    }

    whiteboard.canvasData = canvasData;
    await whiteboard.save();

    res.status(200).json({
      status: 'success',
      message: 'Canvas saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Share whiteboard with a user
// @route   POST /api/v1/whiteboards/:id/share
// @access  Private
const shareWhiteboard = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    // Only owner can share
    if (whiteboard.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'Only owner can share the whiteboard' });
    }

    const userToShare = await User.findOne({ email });
    
    if (!userToShare) {
      return res.status(404).json({ status: 'fail', message: 'User to share with not found' });
    }

    // Prevent sharing with self
    if (userToShare._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ status: 'fail', message: 'Cannot share whiteboard with yourself' });
    }

    // Check if already collaborated
    const existingCollaboratorIndex = whiteboard.collaborators.findIndex(
      c => c.user.toString() === userToShare._id.toString()
    );

    if (existingCollaboratorIndex !== -1) {
      // Update role if already exists
      whiteboard.collaborators[existingCollaboratorIndex].role = role;
    } else {
      // Add new collaborator
      whiteboard.collaborators.push({ user: userToShare._id, role });
    }

    await whiteboard.save();

    res.status(200).json({
      status: 'success',
      message: `Whiteboard shared successfully with ${email} as ${role}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze Canvas and generate Semantic Graph
// @route   POST /api/v1/whiteboards/:id/analyze
// @access  Private
const analyzeCanvas = async (req, res, next) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    // Check access permissions
    const isOwner = whiteboard.owner.toString() === req.user._id.toString();
    const isCollaborator = whiteboard.collaborators.some(
      c => c.user.toString() === req.user._id.toString() && c.status === 'accepted'
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to analyze this whiteboard' });
    }

    if (!whiteboard.canvasData || !whiteboard.canvasData.objects) {
      return res.status(400).json({ status: 'fail', message: 'No canvas data available to analyze' });
    }

    const { parseCanvasToGraph } = require('../ai/semanticEngine');
    const graphData = parseCanvasToGraph(whiteboard.canvasData);

    // Save metadata back to whiteboard
    whiteboard.aiMetadata = graphData;
    await whiteboard.save();

    res.status(200).json({
      status: 'success',
      data: graphData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename whiteboard
// @route   PUT /api/v1/whiteboards/:id/rename
// @access  Private
const renameWhiteboard = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ status: 'fail', message: 'Title is required' });
    }

    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    // Only owner or editor collaborator can rename
    const isOwner = whiteboard.owner.toString() === req.user._id.toString();
    const collaborator = whiteboard.collaborators.find(
      c => c.user.toString() === req.user._id.toString() && c.status === 'accepted'
    );
    const isEditor = collaborator && collaborator.role === 'editor';

    if (!isOwner && !isEditor) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to rename this whiteboard' });
    }

    whiteboard.title = title;
    await whiteboard.save();

    res.status(200).json({
      status: 'success',
      data: whiteboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete whiteboard
// @route   DELETE /api/v1/whiteboards/:id
// @access  Private
const deleteWhiteboard = async (req, res, next) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    // Only owner can delete
    if (whiteboard.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'Only the owner can delete the whiteboard' });
    }

    await Whiteboard.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Whiteboard deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending invitations for user
// @route   GET /api/v1/whiteboards/invitations
// @access  Private
const getInvitations = async (req, res, next) => {
  try {
    const invitations = await Whiteboard.find({
      collaborators: {
        $elemMatch: {
          user: req.user._id,
          status: 'pending'
        }
      }
    })
    .populate('owner', 'name email')
    .sort('-createdAt')
    .select('-canvasData');

    res.status(200).json({
      status: 'success',
      results: invitations.length,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept whiteboard invitation
// @route   POST /api/v1/whiteboards/:id/accept
// @access  Private
const acceptInvitation = async (req, res, next) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    const collaboratorIndex = whiteboard.collaborators.findIndex(
      c => c.user.toString() === req.user._id.toString() && c.status === 'pending'
    );

    if (collaboratorIndex === -1) {
      return res.status(400).json({ status: 'fail', message: 'No pending invitation found for this whiteboard' });
    }

    whiteboard.collaborators[collaboratorIndex].status = 'accepted';
    await whiteboard.save();

    res.status(200).json({
      status: 'success',
      message: 'Invitation accepted successfully',
      data: whiteboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline whiteboard invitation
// @route   POST /api/v1/whiteboards/:id/decline
// @access  Private
const declineInvitation = async (req, res, next) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ status: 'fail', message: 'Whiteboard not found' });
    }

    const collaboratorIndex = whiteboard.collaborators.findIndex(
      c => c.user.toString() === req.user._id.toString() && c.status === 'pending'
    );

    if (collaboratorIndex === -1) {
      return res.status(400).json({ status: 'fail', message: 'No pending invitation found' });
    }

    // Pull the collaborator from the array
    whiteboard.collaborators.splice(collaboratorIndex, 1);
    await whiteboard.save();

    res.status(200).json({
      status: 'success',
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
