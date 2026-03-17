const { Friendship, User, Conversation } = require('../models');
const { Op } = require('sequelize');

// @desc  Send friend request
// @route POST /api/friends/request/:userId
exports.sendRequest = async (req, res) => {
  try {
    const receiverId = req.params.userId;
    if (receiverId === req.user.id) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }
    const receiver = await User.findByPk(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    const existing = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId: req.user.id, receiverId },
          { requesterId: receiverId, receiverId: req.user.id },
        ],
      },
    });
    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ message: 'Already friends' });
      if (existing.status === 'pending') return res.status(400).json({ message: 'Request already sent' });
      if (existing.status === 'blocked') return res.status(400).json({ message: 'Cannot send request' });
    }

    const friendship = await Friendship.create({ requesterId: req.user.id, receiverId });
    res.status(201).json({ message: 'Friend request sent', friendship });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Accept friend request
// @route PUT /api/friends/accept/:friendshipId
exports.acceptRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      where: { id: req.params.friendshipId, receiverId: req.user.id, status: 'pending' },
    });
    if (!friendship) return res.status(404).json({ message: 'Request not found' });

    await friendship.update({ status: 'accepted' });

    // Create conversation between the two users
    const [user1Id, user2Id] = [friendship.requesterId, friendship.receiverId].sort();
    const [conv] = await Conversation.findOrCreate({
      where: { user1Id, user2Id },
      defaults: { user1Id, user2Id },
    });

    const fullConv = await Conversation.findByPk(conv.id, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'fullName', 'avatar', 'isOnline', 'lastSeen'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'fullName', 'avatar', 'isOnline', 'lastSeen'] },
      ],
    });

    const other = fullConv.user1Id === req.user.id ? fullConv.user2 : fullConv.user1;
    const unreadCount = fullConv.user1Id === req.user.id ? fullConv.user1UnreadCount : fullConv.user2UnreadCount;
    const formattedConversation = {
      id: fullConv.id,
      other,
      lastMessage: null,
      unreadCount,
      updatedAt: fullConv.updatedAt,
    };

    res.json({ message: 'Friend request accepted', friendship, conversation: formattedConversation });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Reject friend request
// @route PUT /api/friends/reject/:friendshipId
exports.rejectRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      where: { id: req.params.friendshipId, receiverId: req.user.id, status: 'pending' },
    });
    if (!friendship) return res.status(404).json({ message: 'Request not found' });
    await friendship.update({ status: 'rejected' });
    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Cancel sent request
// @route DELETE /api/friends/cancel/:userId
exports.cancelRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      where: { requesterId: req.user.id, receiverId: req.params.userId, status: 'pending' },
    });
    if (!friendship) return res.status(404).json({ message: 'Request not found' });
    await friendship.destroy();
    res.json({ message: 'Request cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Remove friend (unfriend)
// @route DELETE /api/friends/:userId
exports.removeFriend = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      where: {
        status: 'accepted',
        [Op.or]: [
          { requesterId: req.user.id, receiverId: req.params.userId },
          { requesterId: req.params.userId, receiverId: req.user.id },
        ],
      },
    });
    if (!friendship) return res.status(404).json({ message: 'Friendship not found' });
    await friendship.destroy();
    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get friends list
// @route GET /api/friends
exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [{ requesterId: req.user.id }, { receiverId: req.user.id }],
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username', 'fullName', 'avatar', 'isOnline', 'lastSeen', 'bio'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'fullName', 'avatar', 'isOnline', 'lastSeen', 'bio'] },
      ],
    });
    const friends = friendships.map((f) => {
      const friend = f.requesterId === req.user.id ? f.receiver : f.requester;
      return { ...friend.toJSON(), friendshipId: f.id };
    });
    res.json({ friends });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get pending requests (received)
// @route GET /api/friends/requests/pending
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Friendship.findAll({
      where: { receiverId: req.user.id, status: 'pending' },
      include: [{ model: User, as: 'requester', attributes: ['id', 'username', 'fullName', 'avatar', 'bio'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get sent requests
// @route GET /api/friends/requests/sent
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await Friendship.findAll({
      where: { requesterId: req.user.id, status: 'pending' },
      include: [{ model: User, as: 'receiver', attributes: ['id', 'username', 'fullName', 'avatar', 'bio'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
