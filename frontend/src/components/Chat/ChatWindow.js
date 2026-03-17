import React, { useEffect, useRef, useState, useCallback } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { friendsAPI } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import GroupInfoModal from '../Groups/GroupInfoModal';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = ({ onBack }) => {
  const { activeConversation, messages, loadMessages, loading, conversations,
    typingUsers, sendTypingStart, sendTypingStop,
    setConversations, setActiveConversation, sendMessageReaction } = useChat();
  const { user } = useAuth();
  const { initiateCall } = useCall();
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [showHeaderProfile, setShowHeaderProfile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const bottomRef = useRef(null);
  const messagesEndRef = useRef(null);

  const convId = activeConversation?.id;
  const isGroup = !!activeConversation?.isGroup;
  const groupInfo = activeConversation?.group;
  const other = activeConversation?.other;
  const convMessages = messages[convId] || [];

  useEffect(() => {
    if (convId) {
      if (isGroup) {
        getSocket()?.emit('group:join', { groupId: convId });
      }
      loadMessages(convId, 1, { isGroup });
      if (!isGroup) {
        // Mark direct-chat messages as seen.
        const socket = getSocket();
        socket?.emit('message:seen', { conversationId: convId, senderId: other?.id });
      }
    }
  }, [convId, isGroup]);

  useEffect(() => {
    if (isGroup) return;
    if (!convId || !other?.id || convMessages.length === 0) return;
    const last = convMessages[convMessages.length - 1];
    if (last?.senderId === other.id && last.status !== 'seen') {
      const socket = getSocket();
      socket?.emit('message:seen', { conversationId: convId, senderId: other.id });
    }
  }, [convId, other?.id, convMessages, isGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length]);

  useEffect(() => {
    const id = setInterval(() => setTimeTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [convId]);

  const handleDeleteMessage = async (msg, type) => {
    try {
      const socket = getSocket();
      if (type === 'everyone') {
        socket?.emit('message:delete', {
          messageId: msg.id, conversationId: convId,
          deleteType: 'everyone', otherUserId: other?.id,
        });
      } else {
        socket?.emit('message:delete', {
          messageId: msg.id, conversationId: convId,
          deleteType: 'me', otherUserId: other?.id,
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
    setContextMenu(null);
    if (selectionMode) clearSelection();
  };

  const handleEditMessage = async (msgId, content) => {
    const socket = getSocket();
    socket?.emit('message:edit', {
      messageId: msgId, content, conversationId: convId, otherUserId: other?.id,
    });
    setEditingMessage(null);
    if (selectionMode) clearSelection();
  };

  const handleReact = useCallback((msg, emoji) => {
    if (!convId) return;
    sendMessageReaction({
      messageId: msg.id,
      conversationId: convId,
      emoji,
      otherUserId: other?.id,
    });
    if (selectionMode) clearSelection();
  }, [convId, other?.id, sendMessageReaction]);

  const toggleSelect = (msgId) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(msgId)) n.delete(msgId);
      else n.add(msgId);
      return n;
    });
  };

  const clearSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const startSelection = (msg) => {
    setSelectionMode(true);
    setSelectedIds(new Set([msg.id]));
  };

  const selectedMessages = convMessages.filter((m) => selectedIds.has(m.id));
  const canDeleteEveryone = selectedMessages.length > 0 && selectedMessages.every((m) => m.senderId === user?.id);

  const handleDeleteSelected = (type) => {
    selectedMessages.forEach((m) => handleDeleteMessage(m, type));
    clearSelection();
  };

  const handleRemoveFriend = async () => {
    if (isGroup) return;
    if (!other?.id) return;
    if (!window.confirm(`Remove ${other.fullName} from friends?`)) return;
    try {
      await friendsAPI.removeFriend(other.id);
      getSocket()?.emit('friend:remove', { otherUserId: other.id });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      setActiveConversation(null);
    } catch (err) {
      console.error('Remove friend error:', err);
    }
  };

  const isTyping = typingUsers[convId];
  const formatLastSeen = (lastSeen, tick) => {
    if (!lastSeen) return null;
    const last = new Date(lastSeen);
    const diffMs = Date.now() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'last seen just now';
    if (diffMins < 60) {
      const label = diffMins === 1 ? 'minute' : 'minutes';
      return `last seen ${diffMins} ${label} ago`;
    }
    return `last seen ${format(last, 'hh:mm a')}`;
  };

  const groupMessages = () => {
    const groups = [];
    let lastDate = null;
    convMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        groups.push({ type: 'date', date: msg.createdAt });
        lastDate = msgDate;
      }
      groups.push({ type: 'message', message: msg });
    });
    return groups;
  };

  const handleForward = (msg) => {
    if (!msg || msg.deletedForEveryone || msg.type !== 'text' || !msg.content) return;
    setForwardingMessage(msg);
    if (selectionMode) clearSelection();
  };

  const handleForwardTo = (targetConv) => {
    if (!forwardingMessage || !targetConv?.id) return;
    const socket = getSocket();
    socket?.emit('message:send', {
      conversationId: targetConv.id,
      content: forwardingMessage.content,
      type: 'text',
    });
    setForwardingMessage(null);
  };

  const handleGroupConversationUpdated = (updatedConv) => {
    if (!updatedConv?.id) return;
    setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? { ...c, ...updatedConv } : c)));
    if (activeConversation?.id === updatedConv.id) {
      setActiveConversation((prev) => (prev ? { ...prev, ...updatedConv } : prev));
    }
  };

  const handleGroupLeft = () => {
    if (!convId) return;
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setActiveConversation(null);
  };

  const displayName = isGroup ? (groupInfo?.name || 'Group') : other?.fullName;
  const avatarInitial = isGroup
    ? (groupInfo?.name?.[0] || 'G')
    : (other?.fullName?.[0] || '?');

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button className="btn-icon mobile-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="chat-header-user">
          <div className="avatar-wrap" style={{ position: 'relative' }}>
            {((!isGroup && other?.avatar) || (isGroup && groupInfo?.avatar)) ? (
              <img
                src={`http://localhost:5000${isGroup ? groupInfo?.avatar : other?.avatar}`}
                alt=""
                className="avatar clickable-avatar"
                style={{ width: 40, height: 40 }}
                onClick={() => setShowAvatarViewer(true)}
              />
            ) : (
              <div
                className="avatar-placeholder clickable-avatar"
                style={{ width: 40, height: 40, background: '#3182ce' }}
                onClick={() => setShowAvatarViewer(true)}
              >
                {avatarInitial}
              </div>
            )}
            {!isGroup && other?.isOnline && <span className="online-dot" />}
          </div>
          <div className="chat-header-meta" onClick={() => isGroup ? setShowGroupInfo(true) : setShowHeaderProfile(true)}>
            <div className="chat-header-name">{displayName}</div>
            <div className="chat-header-status">
              {isTyping ? (
                <span className="typing-status">typing...</span>
              ) : isGroup ? (
                <span className="lastseen-status">{groupInfo?.memberCount || 0} members</span>
              ) : other?.isOnline ? (
                <span className="online-status">Online</span>
              ) : other?.lastSeen ? (
                <span className="lastseen-status">
                  {formatLastSeen(other.lastSeen, timeTick)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          {!isGroup && <button className="btn-icon call-btn voice" onClick={() => initiateCall(other, 'voice', convId)} title="Voice Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </button>}
          {!isGroup && <button className="btn-icon call-btn video" onClick={() => initiateCall(other, 'video', convId)} title="Video Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>}
          {!isGroup && <button className="btn-icon" onClick={handleRemoveFriend} title="Remove friend">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-3-3.87"/>
              <path d="M4 21v-2a4 4 0 013-3.87"/>
              <circle cx="12" cy="7" r="4"/>
              <line x1="18" y1="8" x2="23" y2="8"/>
            </svg>
          </button>}
        </div>
      </div>

      {/* Messages */}
      <div
        className="messages-container"
        ref={bottomRef}
        onClick={(e) => {
          if (!selectionMode) return;
          if (e.target === e.currentTarget) clearSelection();
        }}
      >
        {selectionMode && (
          <div className="selection-overlay">
            <div className="selection-actions">
              <span className="selection-count">{selectedMessages.length} selected</span>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteSelected('me')}>
                Delete for me
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteSelected('everyone')} disabled={!canDeleteEveryone}>
                Delete for everyone
              </button>
              <button className="btn btn-secondary btn-sm" onClick={clearSelection}>Cancel</button>
            </div>
          </div>
        )}
        {loading && <div className="messages-loading"><div className="spinner" /></div>}

        {groupMessages().map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${i}`} className="date-divider">
                <span>{new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
            );
          }
          const msg = item.message;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === user?.id}
              showSenderName={isGroup}
              onReply={() => { setReplyTo(msg); if (selectionMode) clearSelection(); }}
              onEdit={() => setEditingMessage(msg)}
              onReact={(emoji) => handleReact(msg, emoji)}
              onForward={() => handleForward(msg)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, msg });
              }}
              onMore={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({ x: rect.right + 8, y: rect.top, msg });
                if (selectionMode) clearSelection();
              }}
              onDelete={handleDeleteMessage}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(msg.id)}
              onSelect={() => toggleSelect(msg.id)}
              onStartSelect={() => startSelection(msg)}
            />
          );
        })}

        {isTyping && (
          <div className="typing-row">
            <div className="typing-indicator">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}>
                    <div className="context-emoji-row">
            {['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F525}'].map((emoji) => (
              <button key={emoji} className="context-emoji-btn" onClick={() => { handleReact(contextMenu.msg, emoji); setContextMenu(null); }}>
                {emoji}
              </button>
            ))}
          </div>

          {!selectionMode && (
            <div className="context-menu-item" onClick={() => {
              startSelection(contextMenu.msg);
              setContextMenu(null);
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 12l2 2 4-4"/>
              </svg>Select
            </div>
          )}
          <div className={`context-menu-item ${contextMenu.msg.type !== 'text' || contextMenu.msg.deletedForEveryone ? 'disabled' : ''}`} onClick={() => {
            if (contextMenu.msg.type !== 'text' || contextMenu.msg.deletedForEveryone) return;
            handleForward(contextMenu.msg);
            setContextMenu(null);
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 14l5-5-5-5"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
            </svg>Forward
          </div>

          <div className="context-menu-item" onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); if (selectionMode) clearSelection(); }}>

            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
            </svg>Reply
          </div>
          <div className="context-menu-item" onClick={() => { handleReact(contextMenu.msg, '👍'); setContextMenu(null); }}>
            <span>👍 React</span>
          </div>
          {contextMenu.msg.senderId === user?.id && contextMenu.msg.type === 'text' && (
            <div className="context-menu-item" onClick={() => { setEditingMessage(contextMenu.msg); setContextMenu(null); if (selectionMode) clearSelection(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>Edit
            </div>
          )}
          <div className="context-menu-item" onClick={() => handleDeleteMessage(contextMenu.msg, 'me')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>Delete for me
          </div>
          {contextMenu.msg.senderId === user?.id && (
            <div className="context-menu-item danger" onClick={() => handleDeleteMessage(contextMenu.msg, 'everyone')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>Delete for everyone
            </div>
          )}
        </div>
      )}

      {forwardingMessage && (
        <div className="modal-overlay" onClick={() => setForwardingMessage(null)}>
          <div className="modal forward-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Forward to...</h2>
              <button className="btn-icon" onClick={() => setForwardingMessage(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="forward-list">
              {conversations
                .filter((c) => c.id !== convId)
                .map((c) => (
                  <button key={c.id} className="forward-item" onClick={() => handleForwardTo(c)}>
                    {(c.other?.avatar && !c.isGroup) || (c.isGroup && c.group?.avatar) ? (
                      <img src={`http://localhost:5000${c.isGroup ? c.group?.avatar : c.other?.avatar}`} alt="" className="avatar" style={{ width: 36, height: 36 }} />
                    ) : (
                      <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 14 }}>
                        {c.isGroup ? (c.group?.name?.[0] || 'G') : (c.other?.fullName?.[0] || '?')}
                      </div>
                    )}
                    <span className="forward-name">{c.isGroup ? (c.group?.name || 'Group') : (c.other?.fullName || 'Unknown')}</span>
                  </button>
                ))}
              {conversations.filter((c) => c.id !== convId).length === 0 && (
                <div className="forward-empty">No other conversations</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAvatarViewer && !isGroup && (
        <div className="avatar-viewer-overlay" onClick={() => setShowAvatarViewer(false)}>
          <div className="avatar-viewer" onClick={(e) => e.stopPropagation()}>
            {other?.avatar ? (
              <img src={`http://localhost:5000${other.avatar}`} alt="" className="avatar-viewer-img" />
            ) : (
              <div className="avatar-viewer-placeholder">{other?.fullName?.[0]}</div>
            )}
          </div>
        </div>
      )}

      {showHeaderProfile && (
        <div className="avatar-viewer-overlay" onClick={() => setShowHeaderProfile(false)}>
          <div className="profile-preview" onClick={(e) => e.stopPropagation()}>
            {!isGroup && other?.avatar ? (
              <img src={`http://localhost:5000${other.avatar}`} alt="" className="profile-preview-img" />
            ) : (
              <div className="profile-preview-placeholder">{avatarInitial}</div>
            )}
            <div className="profile-preview-name">{displayName || 'Unknown'}</div>
            {!isGroup && <div className="profile-preview-username">@{other?.username || 'unknown'}</div>}
            {isGroup
              ? <div className="profile-preview-bio">Group chat</div>
              : (other?.bio && <div className="profile-preview-bio">{other.bio}</div>)}
          </div>
        </div>
      )}

      {showGroupInfo && isGroup && (
        <GroupInfoModal
          conversation={activeConversation}
          onClose={() => setShowGroupInfo(false)}
          onConversationUpdated={handleGroupConversationUpdated}
          onLeftGroup={handleGroupLeft}
        />
      )}

      {/* Input */}
      <MessageInput
        conversationId={convId}
        otherId={other?.id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onEditSubmit={handleEditMessage}
        onTypingStart={() => sendTypingStart(convId, other?.id)}
        onTypingStop={() => sendTypingStop(convId, other?.id)}
        isGroup={isGroup}
      />
    </div>
  );
};

export default ChatWindow;
