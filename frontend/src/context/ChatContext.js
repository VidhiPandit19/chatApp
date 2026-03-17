import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { friendsAPI, messagesAPI } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const typingTimers = useRef({});

  const applyIncomingMessage = useCallback((message, conversationId) => {
    setMessages((prev) => {
      const list = prev[conversationId] || [];
      const existingIndex = list.findIndex((m) => m.id === message.id);
      const nextList = existingIndex >= 0
        ? list.map((m) => (m.id === message.id ? message : m))
        : [...list, message];

      return {
        ...prev,
        [conversationId]: nextList,
      };
    });
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== conversationId) return c;
        const isActive = activeConversation?.id === conversationId;
        return {
          ...c,
          lastMessage: message,
          unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
      });
      return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  }, [activeConversation]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await messagesAPI.getConversations();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Load conversations error:', err);
    }
  }, []);

  const refreshPendingRequestsCount = useCallback(async () => {
    try {
      const { data } = await friendsAPI.getPendingRequests();
      setPendingRequestsCount(data.requests.length);
    } catch (err) {
      console.error('Load pending requests error:', err);
    }
  }, []);

  // Add a new conversation (after friend accept)
  const addConversation = useCallback((conv) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === conv.id);
      if (exists) return prev;
      return [conv, ...prev];
    });
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId, page = 1, options = {}) => {
    setLoading(true);
    try {
      const { data } = await messagesAPI.getMessages(conversationId, page, options);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: page === 1 ? data.messages : [...data.messages, ...(prev[conversationId] || [])],
      }));
      // Reset unread count
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket event setup
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    // New message received
    socket.on('message:received', ({ message, conversationId }) => {
      applyIncomingMessage(message, conversationId);
    });

    // Message edited
    socket.on('message:edited', ({ messageId, content, conversationId }) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) =>
          m.id === messageId ? { ...m, content, isEdited: true } : m
        ),
      }));
    });

    // Message deleted
    socket.on('message:deleted', ({ messageId, conversationId, deleteType }) => {
      if (deleteType === 'everyone') {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((m) =>
            m.id === messageId ? { ...m, deletedForEveryone: true, content: null } : m
          ),
        }));
      } else {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter((m) => m.id !== messageId),
        }));
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId, userId }) => {
      setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
    });
    socket.on('typing:stop', ({ conversationId }) => {
      setTypingUsers((prev) => { const n = { ...prev }; delete n[conversationId]; return n; });
    });

    // Online status
    socket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
      setConversations((prev) =>
        prev.map((c) => c.other?.id === userId ? { ...c, other: { ...c.other, isOnline: true } } : c)
      );
    });
    socket.on('user:offline', ({ userId, lastSeen }) => {
      setOnlineUsers((prev) => { const n = new Set(prev); n.delete(userId); return n; });
      setConversations((prev) =>
        prev.map((c) =>
          c.other?.id === userId ? { ...c, other: { ...c.other, isOnline: false, lastSeen } } : c
        )
      );
    });

    // Message seen
    socket.on('message:seen', ({ conversationId }) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) =>
          m.status !== 'seen' ? { ...m, status: 'seen' } : m
        ),
      }));
    });

    socket.on('message:reacted', ({ messageId, conversationId, emoji, userId, reactions }) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) => {
          if (m.id !== messageId) return m;

          if (Array.isArray(reactions)) {
            return { ...m, reactions };
          }

          const localReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];

          const existingEmoji = localReactions.find((r) => r.emoji === emoji);
          const userAlreadyOnSameEmoji = existingEmoji?.userIds?.includes(userId);

          // Remove this user's reaction from all emojis first (one reaction per user).
          const cleaned = localReactions
            .map((r) => ({ ...r, userIds: (r.userIds || []).filter((id) => id !== userId) }))
            .filter((r) => r.userIds.length > 0);

          // If user clicked same emoji again, treat as toggle-off.
          if (userAlreadyOnSameEmoji) {
            return { ...m, reactions: cleaned };
          }

          const existingAfter = cleaned.find((r) => r.emoji === emoji);
          if (existingAfter) {
            existingAfter.userIds.push(userId);
          } else {
            cleaned.push({ emoji, userIds: [userId] });
          }
          return { ...m, reactions: cleaned };
        }),
      }));
    });

    // Unread count update
    socket.on('conversation:unread', ({ conversationId, unreadCount }) => {
      const isActive = activeConversation?.id === conversationId;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, unreadCount: isActive ? 0 : unreadCount }
            : c
        )
      );
    });

    socket.on('friend:accepted', ({ conversation } = {}) => {
      if (conversation) {
        addConversation(conversation);
      } else {
        loadConversations();
      }
    });

    socket.on('friend:request', () => {
      refreshPendingRequestsCount();
    });

    socket.on('friend:removed', ({ otherUserId }) => {
      setConversations((prev) => prev.filter((c) => c.other?.id !== otherUserId));
      if (activeConversation?.other?.id === otherUserId) {
        setActiveConversation(null);
      }
    });

    socket.on('group:added', ({ conversation }) => {
      if (!conversation) return;
      addConversation(conversation);
      socket.emit('group:join', { groupId: conversation.id });
    });

    socket.on('group:updated', ({ conversation }) => {
      if (!conversation?.id) return;
      setConversations((prev) => prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c)));
      if (activeConversation?.id === conversation.id) {
        setActiveConversation((prev) => (prev ? { ...prev, ...conversation } : prev));
      }
    });

    socket.on('group:removed', ({ groupId }) => {
      if (!groupId) return;
      setConversations((prev) => prev.filter((c) => c.id !== groupId));
      if (activeConversation?.id === groupId) {
        setActiveConversation(null);
      }
    });

    socket.on('user:profile', ({ userId, avatar, fullName, bio }) => {
      if (!userId) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.other?.id === userId
            ? {
              ...c,
              other: {
                ...c.other,
                avatar: avatar ?? c.other.avatar,
                fullName: fullName ?? c.other.fullName,
                bio: bio ?? c.other.bio,
              },
            }
            : c
        )
      );
      if (activeConversation?.other?.id === userId) {
        setActiveConversation((prev) =>
          prev ? {
            ...prev,
            other: {
              ...prev.other,
              avatar: avatar ?? prev.other.avatar,
              fullName: fullName ?? prev.other.fullName,
              bio: bio ?? prev.other.bio,
            },
          } : prev
        );
      }
    });

    return () => {
      socket.off('message:received');
      socket.off('message:edited');
      socket.off('message:deleted');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('message:seen');
      socket.off('conversation:unread');
      socket.off('message:reacted');
      socket.off('friend:accepted');
      socket.off('friend:request');
      socket.off('friend:removed');
      socket.off('group:added');
      socket.off('group:updated');
      socket.off('group:removed');
      socket.off('user:profile');
    };
  }, [user, activeConversation, loadConversations, refreshPendingRequestsCount, addConversation, applyIncomingMessage]);

  useEffect(() => {
    if (!user) return;
    refreshPendingRequestsCount();
  }, [user, refreshPendingRequestsCount]);

  // Typing handlers
  const sendTypingStart = useCallback((conversationId, otherUserId) => {
    const socket = getSocket();
    socket?.emit('typing:start', { conversationId, otherUserId });
    if (typingTimers.current[conversationId]) {
      clearTimeout(typingTimers.current[conversationId]);
    }
    typingTimers.current[conversationId] = setTimeout(() => {
      socket?.emit('typing:stop', { conversationId, otherUserId });
    }, 2000);
  }, []);

  const sendTypingStop = useCallback((conversationId, otherUserId) => {
    const socket = getSocket();
    socket?.emit('typing:stop', { conversationId, otherUserId });
    if (typingTimers.current[conversationId]) {
      clearTimeout(typingTimers.current[conversationId]);
    }
  }, []);

  // Send message via socket
  const sendSocketMessage = useCallback((data) => {
    const socket = getSocket();
    socket?.emit('message:send', data);
  }, []);

  const sendMessageReaction = useCallback((data) => {
    const socket = getSocket();
    socket?.emit('message:react', data);
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversation, setActiveConversation,
      messages, loading, typingUsers, onlineUsers,
      loadConversations, loadMessages, sendSocketMessage,
      sendTypingStart, sendTypingStop, addConversation, totalUnread,
      sendMessageReaction,
      applyIncomingMessage,
      setMessages, setConversations,
      pendingRequestsCount, setPendingRequestsCount, refreshPendingRequestsCount,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};
