const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view blocks for a username
router.get('/public/:username', blockController.getPublicBlocks);

// Protected routes (Owner management only)
router.use(protect);
router.post('/', blockController.createBlock);
router.get('/', blockController.getUserBlocks);
router.patch('/reorder', blockController.reorderBlocks);
router.put('/:id', blockController.updateBlock);
router.delete('/:id', blockController.deleteBlock);

module.exports = router;
