const { Message, Conversation, User, Friendship, Group, GroupMember } = require('../models');
const { Op } = require('sequelize');

// Helper: verify user is part of conversation
const verifyConversationAccess = async (conversationId, userId) => {
  const conv = await Conversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
    },
  });
  if (!conv) return null;

  const friendship = await Friendship.findOne({
    where: {
      status: 'accepted',
      [Op.or]: [
        { requesterId: conv.user1Id, receiverId: conv.user2Id },
        { requesterId: conv.user2Id, receiverId: conv.user1Id },
      ],
    },
  });

  if (!friendship) return null;
  return conv;
};

// @desc  Get conversations list
// @route GET /api/messages/conversations
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ user1Id: req.user.id }, { user2Id: req.user.id }],
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'fullName', 'avatar', 'isOnline', 'lastSeen'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'fullName', 'avatar', 'isOnline', 'lastSeen'] },
        {
          model: Message, as: 'lastMessage',
          include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const friendships = await Friendship.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [{ requesterId: req.user.id }, { receiverId: req.user.id }],
      },
    });
    const allowed = new Set(friendships.map((f) => [f.requesterId, f.receiverId].sort().join(':')));

    const formattedDirect = conversations
      .filter((conv) => allowed.has([conv.user1Id, conv.user2Id].sort().join(':')))
      .map((conv) => {
      const other = conv.user1Id === req.user.id ? conv.user2 : conv.user1;
      const unreadCount = conv.user1Id === req.user.id ? conv.user1UnreadCount : conv.user2UnreadCount;
      return {
        id: conv.id,
        isGroup: false,
        other,
        group: null,
        lastMessage: conv.lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt,
      };
    });

    const memberships = await GroupMember.findAll({
      where: { userId: req.user.id },
      attributes: ['groupId', 'unreadCount'],
    });
    const groupIds = memberships.map((m) => m.groupId);
    const unreadMap = new Map(memberships.map((m) => [m.groupId, m.unreadCount || 0]));

    let formattedGroups = [];
    if (groupIds.length > 0) {
      const groups = await Group.findAll({
        where: { id: groupIds },
        include: [
          {
            model: Message,
            as: 'lastMessage',
            include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] }],
          },
          {
            model: GroupMember,
            as: 'members',
            include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'avatar'] }],
          },
        ],
      });

      formattedGroups = groups.map((group) => ({
        id: group.id,
        isGroup: true,
        other: null,
        group: {
          id: group.id,
          name: group.name,
          avatar: group.avatar,
          description: group.description,
          ownerId: group.ownerId,
          adminId: group.ownerId,
          memberCount: group.members.length,
          members: group.members.map((m) => ({
            id: m.user?.id,
            username: m.user?.username,
            fullName: m.user?.fullName,
            avatar: m.user?.avatar,
            role: m.role,
          })),
        },
        lastMessage: group.lastMessage,
        unreadCount: unreadMap.get(group.id) || 0,
        updatedAt: group.updatedAt,
      }));
    }

    const formatted = [...formattedDirect, ...formattedGroups].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.json({ conversations: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get messages in conversation
// @route GET /api/messages/:conversationId
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const conv = await verifyConversationAccess(conversationId, req.user.id);
    if (!conv) return res.status(403).json({ message: 'Access denied' });

    const offset = (page - 1) * limit;
    const messages = await Message.findAll({
      where: {
        conversationId,
        deletedForEveryone: false,
        [Op.or]: [
          { senderId: req.user.id, deletedBySender: false },
          { senderId: { [Op.ne]: req.user.id }, deletedByReceiver: false },
        ],
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
        {
          model: Message, as: 'replyTo',
          include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Mark messages as seen
    const otherUserId = conv.user1Id === req.user.id ? conv.user2Id : conv.user1Id;
    await Message.update(
      { status: 'seen', seenAt: new Date() },
      { where: { conversationId, senderId: otherUserId, status: { [Op.ne]: 'seen' } } }
    );
    // Reset unread count
    const unreadField = conv.user1Id === req.user.id ? 'user1UnreadCount' : 'user2UnreadCount';
    await conv.update({ [unreadField]: 0 });

    res.json({ messages: messages.reverse(), page: parseInt(page) });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Send message
// @route POST /api/messages/:conversationId
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, replyToId, isForwarded } = req.body;
    const normalizedIsForwarded = isForwarded === true || isForwarded === 'true';
    const conv = await verifyConversationAccess(conversationId, req.user.id);
    if (!conv) return res.status(403).json({ message: 'Access denied' });

    let type = 'text';
    let fileUrl = null;
    let fileName = null;
    if (req.file) {
      fileUrl = `/uploads/files/${req.file.filename}`;
      fileName = req.file.originalname;
      type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    }
    if (!content && !fileUrl) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      content: content || null,
      type,
      fileUrl,
      fileName,
      replyToId: replyToId || null,
      isForwarded: normalizedIsForwarded,
    });

    // Update conversation: last message + unread count
    const otherUserField = conv.user1Id === req.user.id ? 'user2UnreadCount' : 'user1UnreadCount';
    const currentUnread = conv.user1Id === req.user.id ? conv.user2UnreadCount : conv.user1UnreadCount;
    await conv.update({ lastMessageId: message.id, [otherUserField]: currentUnread + 1 });

    const fullMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
        {
          model: Message, as: 'replyTo',
          include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
        },
      ],
    });

    res.status(201).json({ message: fullMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Edit message
// @route PUT /api/messages/:messageId
exports.editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findOne({
      where: { id: req.params.messageId, senderId: req.user.id, deletedForEveryone: false },
    });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.type !== 'text') return res.status(400).json({ message: 'Only text messages can be edited' });

    await message.update({ content, isEdited: true, editedAt: new Date() });
    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Delete message for me
// @route DELETE /api/messages/:messageId/me
exports.deleteForMe = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    const conv = await verifyConversationAccess(message.conversationId, req.user.id);
    if (!conv) return res.status(403).json({ message: 'Access denied' });

    if (message.senderId === req.user.id) {
      await message.update({ deletedBySender: true });
    } else {
      await message.update({ deletedByReceiver: true });
    }
    res.json({ message: 'Message deleted for you' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Delete message for everyone
// @route DELETE /api/messages/:messageId/everyone
exports.deleteForEveryone = async (req, res) => {
  try {
    const message = await Message.findOne({
      where: { id: req.params.messageId, senderId: req.user.id },
    });
    if (!message) return res.status(403).json({ message: 'You can only delete your own messages' });
    await message.update({ deletedForEveryone: true, content: null, fileUrl: null });
    res.json({ message: 'Message deleted for everyone' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
