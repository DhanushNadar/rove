const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const env = require('../config/env');
const logger = require('../utils/logger');

// Helper to generate access token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

// Helper to generate refresh token
const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  
  // Convert '7d' to milliseconds (assuming env.JWT_REFRESH_EXPIRES_IN is usually '7d')
  // For robustness, calculate 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const refreshToken = await RefreshToken.create({
    token,
    user: userId,
    expiresAt
  });

  return refreshToken.token;
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    res.status(201).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password'
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refresh = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    const existingToken = await RefreshToken.findOne({ token }).populate('user');

    if (!existingToken) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid refresh token'
      });
    }

    if (existingToken.isExpired || existingToken.revoked) {
      return res.status(401).json({
        status: 'fail',
        message: 'Refresh token expired or revoked'
      });
    }

    // Revoke the old token (Token Rotation)
    existingToken.revoked = true;
    await existingToken.save();

    // Generate new tokens
    const accessToken = generateAccessToken(existingToken.user._id);
    const newRefreshToken = await generateRefreshToken(existingToken.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify if email exists in database
// @route   GET /api/v1/auth/verify-email
// @access  Private
const verifyEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Email query parameter is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user with this email'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Verified',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifyEmail
};
