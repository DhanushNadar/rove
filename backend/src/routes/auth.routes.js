const express = require('express');
const { register, login, refresh, logout, getMe, verifyEmail } = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema, refreshTokenSchema } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/verify-email', protect, verifyEmail);

module.exports = router;
