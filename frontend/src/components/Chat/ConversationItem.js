import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import './ConversationItem.css';

const ConversationItem = ({ conversation, onClick }) => {
  const { activeConversation, typingUsers } = useChat();
  const { user } = useAuth();
  const { other, group, isGroup, lastMessage, unreadCount, updatedAt } = conversation;
  const isActive = activeConversation?.id === conversation.id;
  const isTyping = typingUsers[conversation.id];
  const isOnline = other?.isOnline;
  const displayName = isGroup ? (group?.name || 'Group') : (other?.fullName || 'Unknown');

  const getMessagePreview = () => {
    if (isTyping) return <span className="typing-preview">typing...</span>;
    if (!lastMessage) return <span className="msg-placeholder">Start a conversation</span>;
    if (lastMessage.deletedForEveryone) return <span className="msg-deleted">🚫 Message deleted</span>;
    const isMine = lastMessage.sender?.id === user?.id;
    const prefix = isMine ? 'You: ' : '';
    if (lastMessage.type === 'image') return `${prefix}📷 Photo`;
    if (lastMessage.type === 'file') return `${prefix}📎 File`;
    if (lastMessage.type === 'call_log') {
      const raw = String(lastMessage.content || '').toLowerCase();
      const isVideo = raw.includes('video');
      const medium = isVideo ? 'video' : 'voice';

      let status = isMine ? `Outgoing ${medium} call` : `Incoming ${medium} call`;
      if (raw.includes(':missed')) status = isMine ? `${medium} call not answered` : `Missed ${medium} call`;
      else if (raw.includes(':declined')) status = isMine ? `${medium} call declined` : `You declined ${medium} call`;
      else if (raw.includes(':connected')) status = `${isMine ? 'Outgoing' : 'Incoming'} ${medium} call connected`;
      else if (raw.includes(':ended')) status = `${isMine ? 'Outgoing' : 'Incoming'} ${medium} call ended`;

      return `${prefix}📞 ${status}`;
    }
    if (lastMessage.type === 'system') return `ℹ️ ${lastMessage.content || 'Group activity'}`;
    if (isGroup && !isMine && lastMessage.sender?.fullName) {
      return `${lastMessage.sender.fullName}: ${lastMessage.content || ''}`;
    }
    return `${prefix}${lastMessage.content || ''}`;
  };

  return (
    <div className={`conv-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="conv-avatar-wrap">
        {(other?.avatar && !isGroup) || (isGroup && group?.avatar) ? (
          <img src={`http://localhost:5000${isGroup ? group?.avatar : other?.avatar}`} alt="" className="avatar" style={{ width: 48, height: 48 }} />
        ) : (
          <div className="avatar-placeholder" style={{
            width: 48, height: 48,
            background: stringToColor(isGroup ? (group?.name || 'G') : (other?.username || 'U')),
          }}>
            {isGroup ? (group?.name?.[0] || 'G') : (other?.fullName?.[0] || '?')}
          </div>
        )}
        {!isGroup && isOnline && <span className="online-dot" />}
      </div>

      <div className="conv-info">
        <div className="conv-top">
          <span className="conv-name">{displayName}</span>
          <span className="conv-time">
            {updatedAt ? formatDistanceToNow(new Date(updatedAt), { addSuffix: false }) : ''}
          </span>
        </div>
        <div className="conv-bottom">
          <span className="conv-preview">{getMessagePreview()}</span>
          {unreadCount > 0 && (
            <span className="conv-unread">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const stringToColor = (str) => {
  const colors = ['#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce','#805ad5','#d53f8c','#2c7a7b'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default ConversationItem;
