const { Op } = require('sequelize');
const { Group, GroupMember, Message, User, Friendship } = require('../models');

const isAdminRole = (role) => role === 'admin' || role === 'owner';

const getIO = (req) => req.app.get('io');

const formatGroupConversation = (group) => ({
  id: group.id,
  isGroup: true,
  group: {
    id: group.id,
    name: group.name,
    avatar: group.avatar,
    description: group.description,
    ownerId: group.ownerId,
    adminId: group.ownerId,
    memberCount: Array.isArray(group.members) ? group.members.length : group.memberCount || 0,
    members: Array.isArray(group.members)
      ? group.members.map((m) => ({
        id: m.user?.id,
        username: m.user?.username,
        fullName: m.user?.fullName,
        avatar: m.user?.avatar,
        role: m.role,
      }))
      : undefined,
  },
  other: null,
  lastMessage: group.lastMessage || null,
  unreadCount: 0,
  updatedAt: group.updatedAt,
});

const ensureMembership = async (groupId, userId) => GroupMember.findOne({ where: { groupId, userId } });

const emitUnreadCountsToGroupMembers = async (io, groupId, senderId) => {
  const members = await GroupMember.findAll({ where: { groupId } });
  for (const member of members) {
    if (member.userId === senderId) continue;
    const nextUnread = (member.unreadCount || 0) + 1;
    await member.update({ unreadCount: nextUnread });
    io.to(member.userId).emit('conversation:unread', {
      conversationId: groupId,
      unreadCount: nextUnread,
    });
  }
};

const emitSystemMessage = async ({ io, groupId, actorId, content }) => {
  if (!content) return;

  const message = await Message.create({
    conversationId: null,
    groupId,
    senderId: actorId,
    type: 'system',
    content,
  });

  await Group.update({ lastMessageId: message.id }, { where: { id: groupId } });

  const fullMessage = await Message.findByPk(message.id, {
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
    ],
  });

  io.to(`group:${groupId}`).emit('message:received', {
    message: fullMessage,
    conversationId: groupId,
  });

  await emitUnreadCountsToGroupMembers(io, groupId, actorId);
};

const loadFullGroup = async (groupId) => Group.findByPk(groupId, {
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

// @desc  List groups where user is a member
// @route GET /api/groups
exports.listGroups = async (req, res) => {
  try {
    const memberships = await GroupMember.findAll({
      where: { userId: req.user.id },
      attributes: ['groupId'],
    });
    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return res.json({ groups: [] });

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
      order: [['updatedAt', 'DESC']],
    });

    res.json({ groups: groups.map((g) => formatGroupConversation(g)) });
  } catch (error) {
    console.error('List groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Create new group
// @route POST /api/groups
exports.createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Group name is required' });

    const uniqueMemberIds = Array.from(new Set([req.user.id, ...(Array.isArray(memberIds) ? memberIds : [])]));
    if (uniqueMemberIds.length < 2) {
      return res.status(400).json({ message: 'Group must have at least 2 members' });
    }

    const friendLinks = await Friendship.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { requesterId: req.user.id, receiverId: { [Op.in]: uniqueMemberIds } },
          { requesterId: { [Op.in]: uniqueMemberIds }, receiverId: req.user.id },
        ],
      },
    });

    const allowedSet = new Set([req.user.id]);
    friendLinks.forEach((f) => {
      if (f.requesterId === req.user.id) allowedSet.add(f.receiverId);
      if (f.receiverId === req.user.id) allowedSet.add(f.requesterId);
    });

    const invalid = uniqueMemberIds.filter((id) => !allowedSet.has(id));
    if (invalid.length > 0) {
      return res.status(400).json({ message: 'You can only add friends to a group' });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || null,
      ownerId: req.user.id,
    });

    const memberships = uniqueMemberIds.map((id) => ({
      groupId: group.id,
      userId: id,
      role: id === req.user.id ? 'admin' : 'member',
    }));
    await GroupMember.bulkCreate(memberships);

    const fullGroup = await loadFullGroup(group.id);

    res.status(201).json({
      message: 'Group created',
      group: formatGroupConversation(fullGroup),
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get group messages
// @route GET /api/groups/:groupId/messages
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const membership = await ensureMembership(groupId, req.user.id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.findAll({
      where: {
        groupId,
        deletedForEveryone: false,
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
        {
          model: Message,
          as: 'replyTo',
          include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    await membership.update({ unreadCount: 0 });

    res.json({ messages: messages.reverse(), page: parseInt(page) });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Send group message
// @route POST /api/groups/:groupId/messages
exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, replyToId, isForwarded } = req.body;
    const normalizedIsForwarded = isForwarded === true || isForwarded === 'true';

    const membership = await ensureMembership(groupId, req.user.id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });

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
      conversationId: null,
      groupId,
      senderId: req.user.id,
      content: content || null,
      type,
      fileUrl,
      fileName,
      replyToId: replyToId || null,
      isForwarded: normalizedIsForwarded,
    });

    await Group.update({ lastMessageId: message.id }, { where: { id: groupId } });

    const fullMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
        {
          model: Message,
          as: 'replyTo',
          include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
        },
      ],
    });

    res.status(201).json({ message: fullMessage });

    const io = getIO(req);
    io.to(`group:${groupId}`).emit('message:received', {
      message: fullMessage,
      conversationId: groupId,
    });
    await emitUnreadCountsToGroupMembers(io, groupId, req.user.id);
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Add member to group
// @route POST /api/groups/:groupId/members
exports.addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const actor = await ensureMembership(groupId, req.user.id);
    if (!actor || !isAdminRole(actor.role)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    if (!userId || userId === req.user.id) {
      return res.status(400).json({ message: 'Invalid member' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const friendship = await Friendship.findOne({
      where: {
        status: 'accepted',
        [Op.or]: [
          { requesterId: req.user.id, receiverId: userId },
          { requesterId: userId, receiverId: req.user.id },
        ],
      },
    });
    if (!friendship) {
      return res.status(400).json({ message: 'You can only add friends to group' });
    }

    const exists = await GroupMember.findOne({ where: { groupId, userId } });
    if (exists) return res.status(400).json({ message: 'User already in group' });

    await GroupMember.create({ groupId, userId, role: 'member' });

    const updatedGroup = await loadFullGroup(groupId);
    const io = getIO(req);
    const formatted = formatGroupConversation(updatedGroup);
    io.to(`group:${groupId}`).emit('group:updated', { conversation: formatted });
    io.to(userId).emit('group:added', { conversation: formatted });

    await emitSystemMessage({
      io,
      groupId,
      actorId: req.user.id,
      content: `${req.user.fullName || req.user.username} added ${user.fullName || user.username}`,
    });

    res.status(201).json({ message: 'Member added', group: formatGroupConversation(updatedGroup) });
  } catch (error) {
    console.error('Add group member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Remove member from group
// @route DELETE /api/groups/:groupId/members/:userId
exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const actor = await ensureMembership(groupId, req.user.id);
    if (!actor || !isAdminRole(actor.role)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    const target = await GroupMember.findOne({
      where: { groupId, userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }],
    });
    if (!target) return res.status(404).json({ message: 'Member not found' });
    if (target.userId === group.ownerId) return res.status(400).json({ message: 'Admin cannot be removed' });

    await target.destroy();

    const io = getIO(req);
    io.to(target.userId).emit('group:removed', { groupId });
    await emitSystemMessage({
      io,
      groupId,
      actorId: req.user.id,
      content: `${req.user.fullName || req.user.username} removed ${target.user?.fullName || target.user?.username || 'a member'}`,
    });

    const updatedGroup = await loadFullGroup(groupId);
    io.to(`group:${groupId}`).emit('group:updated', { conversation: formatGroupConversation(updatedGroup) });
    res.json({ message: 'Member removed', group: formatGroupConversation(updatedGroup) });
  } catch (error) {
    console.error('Remove group member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update group details
// @route PUT /api/groups/:groupId
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const actor = await ensureMembership(groupId, req.user.id);
    if (!actor || !isAdminRole(actor.role)) {
      return res.status(403).json({ message: 'Only admins can update group' });
    }

    const previousName = group.name;
    const previousDescription = group.description;

    const nextName = name?.trim() || group.name;
    const nextDescription = description !== undefined ? (description?.trim() || null) : group.description;

    await group.update({
      name: nextName,
      description: nextDescription,
    });

    const updatedGroup = await loadFullGroup(groupId);
    const io = getIO(req);

    if (previousName !== nextName) {
      await emitSystemMessage({
        io,
        groupId,
        actorId: req.user.id,
        content: `${req.user.fullName || req.user.username} changed the group name to "${nextName}"`,
      });
    }

    if ((previousDescription || null) !== (nextDescription || null)) {
      await emitSystemMessage({
        io,
        groupId,
        actorId: req.user.id,
        content: nextDescription
          ? `${req.user.fullName || req.user.username} changed the group description: "${nextDescription}"`
          : `${req.user.fullName || req.user.username} removed the group description`,
      });
    }

    io.to(`group:${groupId}`).emit('group:updated', { conversation: formatGroupConversation(updatedGroup) });
    res.json({ message: 'Group updated', group: formatGroupConversation(updatedGroup) });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Leave group
// @route DELETE /api/groups/:groupId/leave
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = await GroupMember.findOne({ where: { groupId, userId: req.user.id } });
    if (!member) return res.status(404).json({ message: 'Not a member of this group' });

    const remainingCount = await GroupMember.count({ where: { groupId, userId: { [Op.ne]: req.user.id } } });

    if (group.ownerId === req.user.id && remainingCount > 0) {
      return res.status(400).json({ message: 'Transfer admin before leaving group' });
    }

    await member.destroy();

    const io = getIO(req);
    io.to(req.user.id).emit('group:removed', { groupId });
    if (remainingCount > 0) {
      await emitSystemMessage({
        io,
        groupId,
        actorId: req.user.id,
        content: `${req.user.fullName || req.user.username} left the group`,
      });
    }

    if (remainingCount === 0) {
      await Message.destroy({ where: { groupId } });
      await Group.destroy({ where: { id: groupId } });
    } else {
      const updatedGroup = await loadFullGroup(groupId);
      io.to(`group:${groupId}`).emit('group:updated', { conversation: formatGroupConversation(updatedGroup) });
    }

    res.json({ message: 'Left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get group detail
// @route GET /api/groups/:groupId
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const membership = await ensureMembership(groupId, req.user.id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });

    const group = await loadFullGroup(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json({ group: formatGroupConversation(group) });
  } catch (error) {
    console.error('Get group detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update group avatar
// @route PUT /api/groups/:groupId/avatar
exports.updateGroupAvatar = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'Avatar image is required' });

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can update group photo' });
    }

    await group.update({ avatar: `/uploads/avatars/${req.file.filename}` });
    const updatedGroup = await loadFullGroup(groupId);
    const io = getIO(req);
    io.to(`group:${groupId}`).emit('group:updated', { conversation: formatGroupConversation(updatedGroup) });
    await emitSystemMessage({
      io,
      groupId,
      actorId: req.user.id,
      content: `${req.user.fullName || req.user.username} changed group photo`,
    });
    res.json({ message: 'Group photo updated', group: formatGroupConversation(updatedGroup) });
  } catch (error) {
    console.error('Update group avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Transfer admin to another member
// @route PUT /api/groups/:groupId/admin
exports.transferGroupAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Only current admin can assign next admin' });
    }

    if (!userId || userId === req.user.id) {
      return res.status(400).json({ message: 'Choose another member as admin' });
    }

    const target = await GroupMember.findOne({ where: { groupId, userId } });
    if (!target) return res.status(404).json({ message: 'Target user is not in this group' });

    const current = await GroupMember.findOne({ where: { groupId, userId: req.user.id } });

    await current.update({ role: 'member' });
    await target.update({ role: 'admin' });
    await group.update({ ownerId: userId });

    const updatedGroup = await loadFullGroup(groupId);
    const io = getIO(req);
    io.to(`group:${groupId}`).emit('group:updated', { conversation: formatGroupConversation(updatedGroup) });
    await emitSystemMessage({
      io,
      groupId,
      actorId: req.user.id,
      content: `${target.user?.fullName || target.user?.username || 'A member'} is now admin`,
    });
    res.json({ message: 'Admin transferred', group: formatGroupConversation(updatedGroup) });
  } catch (error) {
    console.error('Transfer admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
