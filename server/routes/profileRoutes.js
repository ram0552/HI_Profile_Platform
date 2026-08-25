const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { bioEnhanceLimiter } = require('../middleware/rateLimiter');

// Protected onboarding routes (updating profile & onboarding state)
router.post('/upload', protect, profileController.uploadAvatar);
router.post('/bio', protect, profileController.updateBio);
router.post('/bio/enhance', protect, bioEnhanceLimiter, profileController.enhanceBio);
router.post('/social', protect, profileController.updateSocialLinks);
router.post('/template', protect, profileController.selectTemplate);

// Profile detail & update routes
router.get('/me', protect, profileController.getProfileMe);
router.put('/me', protect, profileController.updateProfileMe);
router.get('/user/:username', profileController.getPublicProfile);

module.exports = router;
