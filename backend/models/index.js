const User = require('./User');
const Friendship = require('./Friendship');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Call = require('./Call');
const Group = require('./Group');
const GroupMember = require('./GroupMember');

// ─── Friendship Associations ───────────────────────────
User.hasMany(Friendship, { foreignKey: 'requesterId', as: 'sentRequests' });
User.hasMany(Friendship, { foreignKey: 'receiverId', as: 'receivedRequests' });
Friendship.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Friendship.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// ─── Conversation Associations ─────────────────────────
User.hasMany(Conversation, { foreignKey: 'user1Id', as: 'conversations1' });
User.hasMany(Conversation, { foreignKey: 'user2Id', as: 'conversations2' });
Conversation.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });

// ─── Message Associations ──────────────────────────────
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });

Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });

// Self-referential: reply
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });

// Last message
Conversation.belongsTo(Message, {
	foreignKey: 'lastMessageId',
	as: 'lastMessage',
	constraints: false,
});

// ─── Group Associations ───────────────────────────────
Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Group, { foreignKey: 'ownerId', as: 'ownedGroups' });

Group.belongsTo(Message, {
	foreignKey: 'lastMessageId',
	as: 'lastMessage',
	constraints: false,
});

Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members', onDelete: 'CASCADE' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });

User.hasMany(GroupMember, { foreignKey: 'userId', as: 'groupMemberships', onDelete: 'CASCADE' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Message.belongsTo(Group, { foreignKey: 'groupId' });
Group.hasMany(Message, { foreignKey: 'groupId', as: 'messages' });

// ─── Call Associations ─────────────────────────────────
Call.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });
Call.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
Call.belongsTo(Conversation, { foreignKey: 'conversationId' });

module.exports = { User, Friendship, Conversation, Message, Call, Group, GroupMember };
