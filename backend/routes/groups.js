const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  listGroups,
  createGroup,
  getGroupById,
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  removeGroupMember,
  updateGroup,
  updateGroupAvatar,
  transferGroupAdmin,
  leaveGroup,
} = require('../controllers/groupController');
const { uploadFile, uploadAvatar } = require('../middleware/upload');

router.use(protect);

router.get('/', listGroups);
router.post('/', createGroup);
router.get('/:groupId', getGroupById);
router.get('/:groupId/messages', getGroupMessages);
router.post('/:groupId/messages', uploadFile, sendGroupMessage);
router.post('/:groupId/members', addGroupMember);
router.delete('/:groupId/members/:userId', removeGroupMember);
router.put('/:groupId', updateGroup);
router.put('/:groupId/avatar', uploadAvatar, updateGroupAvatar);
router.put('/:groupId/admin', transferGroupAdmin);
router.delete('/:groupId/leave', leaveGroup);

module.exports = router;
