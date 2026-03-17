const jwt = require('jsonwebtoken');
const { User, Conversation, Message, Friendship, Group, GroupMember } = require('../models');
const { Op } = require('sequelize');

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 User connected: ${socket.user.username} [${socket.id}]`);

    const joinGroupRooms = async () => {
      const memberships = await GroupMember.findAll({
        where: { userId },
        attributes: ['groupId'],
      });
      memberships.forEach((m) => socket.join(`group:${m.groupId}`));
    };

    const resolveConversation = async (conversationId, otherUserId) => {
      if (conversationId) {
        return Conversation.findOne({
          where: {
            id: conversationId,
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
          },
        });
      }

      if (!otherUserId) return null;

      return Conversation.findOne({
        where: {
          [Op.or]: [
            { user1Id: userId, user2Id: otherUserId },
            { user1Id: otherUserId, user2Id: userId },
          ],
        },
      });
    };

    const emitCallLog = async ({ conversationId, otherUserId, content }) => {
      try {
        const conv = await resolveConversation(conversationId, otherUserId);
        if (!conv || !content) return;

        const receiverId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const receiverUnreadField = conv.user1Id === userId ? 'user2UnreadCount' : 'user1UnreadCount';
        const currentUnread = conv.user1Id === userId ? conv.user2UnreadCount : conv.user1UnreadCount;

        const message = await Message.create({
          conversationId: conv.id,
          senderId: userId,
          type: 'call_log',
          content,
        });

        await conv.update({
          lastMessageId: message.id,
          [receiverUnreadField]: currentUnread + 1,
        });

        const fullMessage = await Message.findByPk(message.id, {
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
          ],
        });

        io.to(userId).to(receiverId).emit('message:received', {
          message: fullMessage,
          conversationId: conv.id,
        });

        io.to(receiverId).emit('conversation:unread', {
          conversationId: conv.id,
          unreadCount: currentUnread + 1,
        });
      } catch (error) {
        console.error('Socket call log error:', error);
      }
    };

    // Register user as online
    onlineUsers.set(userId, socket.id);
    await User.update({ isOnline: true, socketId: socket.id }, { where: { id: userId } });

    // Join personal room
    socket.join(userId);
    await joinGroupRooms();

    // Broadcast online status to all friends
    socket.broadcast.emit('user:online', { userId, isOnline: true });

    // ─── MESSAGING ────────────────────────────────────────────
    socket.on('message:send', async (data) => {
      const { conversationId, content, type = 'text', fileUrl, fileName, replyToId } = data;
      try {
        const groupMembership = await GroupMember.findOne({
          where: { groupId: conversationId, userId },
        });

        if (groupMembership) {
          const group = await Group.findByPk(conversationId);
          if (!group) return;

          const message = await Message.create({
            conversationId: null,
            groupId: conversationId,
            senderId: userId,
            content,
            type,
            fileUrl,
            fileName,
            replyToId: replyToId || null,
          });

          await group.update({ lastMessageId: message.id });

          const fullMessage = await Message.findByPk(message.id, {
            include: [
              { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
              {
                model: Message, as: 'replyTo',
                include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
              },
            ],
          });

          io.to(`group:${conversationId}`).emit('message:received', {
            message: fullMessage,
            conversationId,
          });
          io.to(userId).emit('message:received', {
            message: fullMessage,
            conversationId,
          });

          const members = await GroupMember.findAll({ where: { groupId: conversationId } });
          for (const member of members) {
            if (member.userId === userId) continue;
            const nextUnread = (member.unreadCount || 0) + 1;
            await member.update({ unreadCount: nextUnread });
            io.to(member.userId).emit('conversation:unread', {
              conversationId,
              unreadCount: nextUnread,
            });
          }
          return;
        }

        const conv = await Conversation.findOne({
          where: {
            id: conversationId,
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
          },
        });
        if (!conv) return;

        const friendship = await Friendship.findOne({
          where: {
            status: 'accepted',
            [Op.or]: [
              { requesterId: conv.user1Id, receiverId: conv.user2Id },
              { requesterId: conv.user2Id, receiverId: conv.user1Id },
            ],
          },
        });
        if (!friendship) return;

        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          type,
          fileUrl,
          fileName,
          replyToId: replyToId || null,
        });

        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUserField = conv.user1Id === userId ? 'user2UnreadCount' : 'user1UnreadCount';
        const currentUnread = conv.user1Id === userId ? conv.user2UnreadCount : conv.user1UnreadCount;
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

        // Send to both users
        io.to(userId).to(otherUserId).emit('message:received', {
          message: fullMessage,
          conversationId,
        });

        // Send unread count update to receiver
        io.to(otherUserId).emit('conversation:unread', {
          conversationId,
          unreadCount: currentUnread + 1,
        });
      } catch (err) {
        console.error('Socket message:send error:', err);
      }
    });

    // Sync an already-created message (e.g. uploaded via REST) to both chat participants.
    socket.on('message:sync', async (data) => {
      const { messageId, conversationId } = data;
      try {
        const groupMembership = await GroupMember.findOne({
          where: { groupId: conversationId, userId },
        });

        if (groupMembership) {
          const message = await Message.findOne({
            where: {
              id: messageId,
              groupId: conversationId,
              senderId: userId,
            },
          });
          if (!message) return;

          const fullMessage = await Message.findByPk(message.id, {
            include: [
              { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
              {
                model: Message, as: 'replyTo',
                include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
              },
            ],
          });

          io.to(`group:${conversationId}`).emit('message:received', {
            message: fullMessage,
            conversationId,
          });
          io.to(userId).emit('message:received', {
            message: fullMessage,
            conversationId,
          });
          return;
        }

        const conv = await Conversation.findOne({
          where: {
            id: conversationId,
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
          },
        });
        if (!conv) return;

        const friendship = await Friendship.findOne({
          where: {
            status: 'accepted',
            [Op.or]: [
              { requesterId: conv.user1Id, receiverId: conv.user2Id },
              { requesterId: conv.user2Id, receiverId: conv.user1Id },
            ],
          },
        });
        if (!friendship) return;

        const message = await Message.findOne({
          where: {
            id: messageId,
            conversationId,
            senderId: userId,
          },
        });
        if (!message) return;

        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const unreadCount = conv.user1Id === userId ? conv.user2UnreadCount : conv.user1UnreadCount;

        const fullMessage = await Message.findByPk(message.id, {
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
            {
              model: Message, as: 'replyTo',
              include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] }],
            },
          ],
        });

        io.to(userId).to(otherUserId).emit('message:received', {
          message: fullMessage,
          conversationId,
        });

        io.to(otherUserId).emit('conversation:unread', {
          conversationId,
          unreadCount,
        });
      } catch (err) {
        console.error('Socket message:sync error:', err);
      }
    });

    // ─── TYPING INDICATORS ────────────────────────────────────
    socket.on('typing:start', async (data) => {
      const { conversationId, otherUserId } = data;
      const membership = await GroupMember.findOne({ where: { groupId: conversationId, userId } });
      if (membership) {
        socket.to(`group:${conversationId}`).emit('typing:start', { conversationId, userId });
        return;
      }
      io.to(otherUserId).emit('typing:start', { conversationId, userId });
    });

    socket.on('typing:stop', async (data) => {
      const { conversationId, otherUserId } = data;
      const membership = await GroupMember.findOne({ where: { groupId: conversationId, userId } });
      if (membership) {
        socket.to(`group:${conversationId}`).emit('typing:stop', { conversationId, userId });
        return;
      }
      io.to(otherUserId).emit('typing:stop', { conversationId, userId });
    });

    socket.on('group:join', async ({ groupId }) => {
      if (!groupId) return;
      const membership = await GroupMember.findOne({ where: { groupId, userId } });
      if (!membership) return;
      socket.join(`group:${groupId}`);
    });

    // ─── MESSAGE STATUS ───────────────────────────────────────
    socket.on('message:seen', async (data) => {
      const { conversationId, senderId } = data;
      try {
        await Message.update(
          { status: 'seen', seenAt: new Date() },
          { where: { conversationId, senderId, status: { [Op.ne]: 'seen' } } }
        );
        const conv = await Conversation.findByPk(conversationId);
        if (conv) {
          const unreadField = conv.user1Id === userId ? 'user1UnreadCount' : 'user2UnreadCount';
          await conv.update({ [unreadField]: 0 });
        }
        io.to(senderId).emit('message:seen', { conversationId, seenBy: userId });
      } catch (err) {
        console.error('Socket message:seen error:', err);
      }
    });

    socket.on('message:edit', async (data) => {
      const { messageId, content, conversationId, otherUserId } = data;
      try {
        await Message.update(
          { content, isEdited: true, editedAt: new Date() },
          { where: { id: messageId, senderId: userId } }
        );

        const membership = await GroupMember.findOne({ where: { groupId: conversationId, userId } });
        if (membership) {
          io.to(`group:${conversationId}`).emit('message:edited', { messageId, content, conversationId });
          return;
        }

        io.to(userId).to(otherUserId).emit('message:edited', { messageId, content, conversationId });
      } catch (err) {
        console.error('Socket message:edit error:', err);
      }
    });

    socket.on('message:delete', async (data) => {
      const { messageId, conversationId, deleteType, otherUserId } = data;
      try {
        const membership = await GroupMember.findOne({ where: { groupId: conversationId, userId } });

        if (deleteType === 'everyone') {
          await Message.update(
            { deletedForEveryone: true, content: null, fileUrl: null },
            { where: { id: messageId, senderId: userId } }
          );

          if (membership) {
            io.to(`group:${conversationId}`).emit('message:deleted', {
              messageId, conversationId, deleteType: 'everyone',
            });
            return;
          }

          io.to(userId).to(otherUserId).emit('message:deleted', {
            messageId, conversationId, deleteType: 'everyone',
          });
        } else {
          const msg = await Message.findByPk(messageId);
          if (msg.senderId === userId) await msg.update({ deletedBySender: true });
          else await msg.update({ deletedByReceiver: true });

          if (membership) {
            io.to(userId).emit('message:deleted', {
              messageId, conversationId, deleteType: 'me',
            });
            return;
          }

          io.to(userId).emit('message:deleted', {
            messageId, conversationId, deleteType: 'me',
          });
        }
      } catch (err) {
        console.error('Socket message:delete error:', err);
      }
    });

    socket.on('message:react', async (data) => {
      const { messageId, conversationId, emoji, otherUserId } = data;
      try {
        const membership = await GroupMember.findOne({ where: { groupId: conversationId, userId } });

        let conv = null;
        if (!membership) {
          conv = await Conversation.findOne({
            where: {
              id: conversationId,
              [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
            },
          });
          if (!conv) return;
        }

        const message = await Message.findOne({
          where: {
            id: messageId,
            ...(membership ? { groupId: conversationId } : { conversationId }),
          },
        });
        if (!message) return;

        const existingReactions = Array.isArray(message.reactions) ? message.reactions : [];
        const existingEmoji = existingReactions.find((r) => r.emoji === emoji);
        const userAlreadyOnSameEmoji = existingEmoji?.userIds?.includes(userId);

        const cleaned = existingReactions
          .map((r) => ({ ...r, userIds: (r.userIds || []).filter((id) => id !== userId) }))
          .filter((r) => r.userIds.length > 0);

        if (!userAlreadyOnSameEmoji) {
          const existingAfter = cleaned.find((r) => r.emoji === emoji);
          if (existingAfter) {
            existingAfter.userIds.push(userId);
          } else {
            cleaned.push({ emoji, userIds: [userId] });
          }
        }

        await message.update({ reactions: cleaned });

        if (membership) {
          io.to(`group:${conversationId}`).emit('message:reacted', {
            messageId,
            conversationId,
            emoji,
            userId,
            reactions: cleaned,
          });
          return;
        }

        const receiverId = otherUserId || (conv.user1Id === userId ? conv.user2Id : conv.user1Id);
        io.to(userId).to(receiverId).emit('message:reacted', {
          messageId,
          conversationId,
          emoji,
          userId,
          reactions: cleaned,
        });
      } catch (err) {
        console.error('Socket message:react error:', err);
      }
    });

    // ─── FRIEND REQUESTS ──────────────────────────────────────
    socket.on('friend:request', (data) => {
      const { receiverId, friendship } = data;
      io.to(receiverId).emit('friend:request', { friendship });
    });

    socket.on('friend:accept', (data) => {
      const { requesterId, friendship, conversation } = data;
      const requesterConversation = conversation
        ? {
          ...conversation,
          // For requester, the accepter is always the "other" person in chat list.
          other: {
            id: userId,
            username: socket.user.username,
            fullName: socket.user.fullName,
            avatar: socket.user.avatar,
            isOnline: true,
            lastSeen: socket.user.lastSeen,
            bio: socket.user.bio,
          },
        }
        : null;

      io.to(requesterId).emit('friend:accepted', {
        friendship,
        conversation: requesterConversation,
      });
    });

    socket.on('friend:remove', (data) => {
      const { otherUserId } = data;
      io.to(otherUserId).emit('friend:removed', { otherUserId: userId });
      io.to(userId).emit('friend:removed', { otherUserId });
    });

    // ─── PROFILE UPDATES ─────────────────────────────────────
    socket.on('user:profile', (data) => {
      const payload = {
        userId,
        avatar: data?.avatar || socket.user.avatar,
        fullName: data?.fullName || socket.user.fullName,
        bio: data?.bio ?? socket.user.bio,
      };
      socket.broadcast.emit('user:profile', payload);
    });

    // ─── WEBRTC CALLS ─────────────────────────────────────────
    socket.on('call:initiate', async (data) => {
      const { receiverId, callType, callId, offer, conversationId } = data;
      io.to(receiverId).emit('call:incoming', {
        callId, callType, callerId: userId,
        callerName: socket.user.fullName,
        callerAvatar: socket.user.avatar,
        conversationId,
        offer,
      });

      await emitCallLog({
        conversationId,
        otherUserId: receiverId,
        content: `${callType}:initiated`,
      });
    });

    socket.on('call:answer', async (data) => {
      const { callerId, answer, callId, conversationId } = data;
      io.to(callerId).emit('call:answered', { callId, answer, answererId: userId, conversationId });

      await emitCallLog({
        conversationId,
        otherUserId: callerId,
        content: `${data.callType || 'voice'}:connected`,
      });
    });

    socket.on('call:reject', async (data) => {
      const { callerId, callId, callType, conversationId } = data;
      io.to(callerId).emit('call:rejected', { callId, rejectedBy: userId });

      await emitCallLog({
        conversationId,
        otherUserId: callerId,
        content: `${callType}:declined`,
      });
    });

    socket.on('call:end', async (data) => {
      const { otherUserId, callId, callType, conversationId } = data;
      io.to(otherUserId).emit('call:ended', { callId, endedBy: userId });

      await emitCallLog({
        conversationId,
        otherUserId,
        content: `${callType}:ended`,
      });
    });

    socket.on('call:ice-candidate', (data) => {
      const { receiverId, candidate, callId } = data;
      io.to(receiverId).emit('call:ice-candidate', { candidate, callId, senderId: userId });
    });

    socket.on('call:missed', async (data) => {
      const { callerId, callId, callType, conversationId } = data;
      io.to(callerId).emit('call:missed', { callId });

      await emitCallLog({
        conversationId,
        otherUserId: callerId,
        content: `${callType}:missed`,
      });
    });

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);
      await User.update(
        { isOnline: false, lastSeen: new Date(), socketId: null },
        { where: { id: userId } }
      );
      socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
    });
  });

  return { onlineUsers };
};
