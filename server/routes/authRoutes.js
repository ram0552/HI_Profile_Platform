const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
    usernameCheckLimiter,
    registerLimiter,
    loginLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
    verificationLimiter,
    refreshLimiter
} = require('../middleware/rateLimiter');

const {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateReserveUsername
} = require('../middleware/authValidation');

// Username check & reserve
router.get('/username-check', usernameCheckLimiter, authController.checkUsername);
router.post('/username-reserve', validateReserveUsername, authController.reserveUsername);

// Register & email verification
router.post('/register', registerLimiter, validateRegister, authController.register);
router.get('/verify-email', verificationLimiter, authController.verifyEmail);
router.post('/resend-verification', verificationLimiter, authController.resendVerification);

// Login & Session management
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

// Password Reset
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validateResetPassword, authController.resetPassword);

// Profile
router.get('/me', protect, authController.getMe);

// OAuth 2.0 Google
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// OAuth 2.0 GitHub
router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

module.exports = router;
