const express = require('express');
const router = express.Router();
const { listUsers, searchUsers, getUserProfile, updateProfile, updateAvatar, requestPasswordOtp, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.use(protect);

router.get('/', listUsers);
router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);
router.put('/avatar', uploadAvatar, updateAvatar);
router.post('/password/otp', requestPasswordOtp);
router.put('/password', changePassword);

module.exports = router;
