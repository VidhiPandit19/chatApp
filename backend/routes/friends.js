const express = require('express');
const router = express.Router();
const {
  sendRequest, acceptRequest, rejectRequest, cancelRequest,
  removeFriend, getFriends, getPendingRequests, getSentRequests
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getFriends);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/sent', getSentRequests);
router.post('/request/:userId', sendRequest);
router.put('/accept/:friendshipId', acceptRequest);
router.put('/reject/:friendshipId', rejectRequest);
router.delete('/cancel/:userId', cancelRequest);
router.delete('/:userId', removeFriend);

module.exports = router;
