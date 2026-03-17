const express = require('express');
const router = express.Router();
const {
  getConversations, getMessages, sendMessage,
  editMessage, deleteForMe, deleteForEveryone
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { uploadFile } = require('../middleware/upload');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:conversationId', getMessages);
router.post('/:conversationId', uploadFile, sendMessage);
router.put('/:messageId', editMessage);
router.delete('/:messageId/me', deleteForMe);
router.delete('/:messageId/everyone', deleteForEveryone);

module.exports = router;
