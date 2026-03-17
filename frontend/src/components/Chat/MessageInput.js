import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { getSocket } from '../../utils/socket';
import './MessageInput.css';

const MessageInput = ({
  conversationId, otherId, replyTo, onCancelReply,
  editingMessage, onCancelEdit, onEditSubmit,
  onTypingStart, onTypingStop,
  isGroup = false,
}) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const { sendSocketMessage, applyIncomingMessage } = useChat();
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      textRef.current?.focus();
    } else {
      setText('');
    }
  }, [editingMessage]);

  useEffect(() => {
    if (text.trim().length === 0 && isTypingRef.current) {
      onTypingStop();
      isTypingRef.current = false;
    }
  }, [text, onTypingStop]);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const handleChange = (e) => {
    const next = e.target.value;
    setText(next);
    if (next.trim().length === 0) {
      if (isTypingRef.current) {
        onTypingStop();
        isTypingRef.current = false;
      }
      return;
    }
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (editingMessage) {
      if (!text.trim()) return;
      onEditSubmit(editingMessage.id, text.trim());
      setText('');
      return;
    }

    if (!text.trim() && !file) return;

    onTypingStop();
    isTypingRef.current = false;

    if (file) {
      // File upload via HTTP (REST)
      const { messagesAPI } = await import('../../utils/api');
      try {
        const { data } = await messagesAPI.sendMessage(conversationId, {
          content: text.trim() || null,
          replyToId: replyTo?.id,
          file,
        }, { isGroup });
        if (data?.message) {
          const socket = getSocket();
          if (socket?.connected) {
            socket.emit('message:sync', {
              messageId: data.message.id,
              conversationId,
            });
          } else {
            // Fallback when socket is temporarily disconnected.
            applyIncomingMessage(data.message, conversationId);
          }
        }
      } catch (err) {
        console.error('File send error:', err);
      }
      setFile(null);
      setFilePreview(null);
    } else {
      sendSocketMessage({
        conversationId,
        content: text.trim(),
        type: 'text',
        replyToId: replyTo?.id,
      });
    }

    setText('');
    if (replyTo) onCancelReply();
    textRef.current?.focus();
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="message-input-area">
      {/* Reply preview */}
      {replyTo && (
        <div className="reply-bar">
          <div className="reply-bar-content">
            <span className="reply-bar-name">↩ Replying to {replyTo.sender?.fullName}</span>
            <span className="reply-bar-text">
              {replyTo.type === 'image' ? '📷 Photo' : replyTo.content?.substring(0, 60)}
            </span>
          </div>
          <button className="btn-icon" onClick={onCancelReply}>✕</button>
        </div>
      )}

      {/* Edit mode */}
      {editingMessage && (
        <div className="reply-bar edit-bar">
          <div className="reply-bar-content">
            <span className="reply-bar-name">✏️ Editing message</span>
            <span className="reply-bar-text">{editingMessage.content?.substring(0, 60)}</span>
          </div>
          <button className="btn-icon" onClick={() => { onCancelEdit(); setText(''); }}>✕</button>
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="file-preview-bar">
          {filePreview ? (
            <img src={filePreview} alt="" className="file-preview-img" />
          ) : (
            <div className="file-preview-name">📎 {file.name}</div>
          )}
          <button className="btn-icon" onClick={removeFile}>✕</button>
        </div>
      )}

      {/* Input row */}
      <div className="input-row">
        <button className="btn-icon attach-btn" onClick={() => fileRef.current?.click()} title="Attach file">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />

        <textarea
          ref={textRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
          className="message-textarea"
          rows={1}
        />

        <button
          className={`send-btn ${(text.trim() || file) ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() && !file}
        >
          {editingMessage ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
