import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import './MessageBubble.css';

const MessageBubble = ({
  message,
  isMine,
  showSenderName = false,
  onReply,
  onEdit,
  onReact,
  onForward,
  onContextMenu,
  onMore,
  onDelete,
  selectionMode,
  isSelected,
  onSelect,
  onStartSelect,
}) => {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const { content, type, fileUrl, fileName, isEdited, deletedForEveryone,
    replyTo, status, createdAt, isForwarded } = message;
  const normalizedType = String(type || '').toLowerCase();
  const isTextLikeType = !normalizedType || normalizedType === 'text';
  const isForwardableFileType = (normalizedType === 'image' || normalizedType === 'file') && Boolean(fileUrl);
  const canForward = (isTextLikeType || isForwardableFileType) && !deletedForEveryone;
  const imageSrc = fileUrl ? `http://localhost:5000${fileUrl}` : '';
  const normalizedContent = String(content || '').toLowerCase();
  const isLegacyGroupSystemText =
    showSenderName &&
    isTextLikeType &&
    (
      normalizedContent.includes(' added ') ||
      normalizedContent.includes(' removed ') ||
      normalizedContent.includes(' left the group') ||
      normalizedContent.includes(' changed group photo') ||
      normalizedContent.includes(' changed the group name') ||
      normalizedContent.includes(' changed the group description') ||
      normalizedContent.includes(' removed the group description') ||
      normalizedContent.includes(' is now admin')
    );
  const callLogText = (() => {
    if (type !== 'call_log') return '';
    const raw = String(content || '').toLowerCase();
    const isVideo = raw.includes('video');
    const medium = isVideo ? 'Video' : 'Voice';

    if (raw.includes(':missed')) return isMine ? `${medium} call not answered` : `Missed ${medium.toLowerCase()} call`;
    if (raw.includes(':declined')) return isMine ? `${medium} call declined` : `You declined ${medium.toLowerCase()} call`;
    if (raw.includes(':connected')) return `${isMine ? 'Outgoing' : 'Incoming'} ${medium.toLowerCase()} call connected`;
    if (raw.includes(':ended')) return `${isMine ? 'Outgoing' : 'Incoming'} ${medium.toLowerCase()} call ended`;
    if (raw.includes(':initiated')) return `${isMine ? 'Outgoing' : 'Incoming'} ${medium.toLowerCase()} call`;

    return content || 'Call update';
  })();
  const senderName = message?.sender?.fullName || message?.sender?.username || 'User';
  const senderInitial = senderName[0]?.toUpperCase() || 'U';
  const senderAvatarUrl = message?.sender?.avatar ? `http://localhost:5000${message.sender.avatar}` : null;

  if (normalizedType === 'system' || isLegacyGroupSystemText) {
    return (
      <div className="system-message-row">
        <span className="system-message-pill">{content || 'Group update'}</span>
      </div>
    );
  }

  useEffect(() => {
    if (!isImageViewerOpen) return;

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsImageViewerOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [isImageViewerOpen]);

  if (deletedForEveryone) {
    return (
      <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
        {!isMine && (
          <div className="message-avatar-wrap" aria-hidden="true">
            {senderAvatarUrl ? (
              <img src={senderAvatarUrl} alt={senderName} className="message-avatar" />
            ) : (
              <div className="message-avatar-fallback">{senderInitial}</div>
            )}
          </div>
        )}
        <div className="message-content">
          <div className="message-bubble deleted-bubble">
            <span>This message was deleted</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`message-row ${isMine ? 'mine' : 'theirs'} fade-in`}
      onContextMenu={onContextMenu}
    >
      {selectionMode && (
        <button className={`select-pill ${isSelected ? 'active' : ''}`} onClick={onSelect} title="Select message">
          <span />
        </button>
      )}

      {!isMine && (
        <div className="message-avatar-wrap" aria-hidden="true">
          {senderAvatarUrl ? (
            <img src={senderAvatarUrl} alt={senderName} className="message-avatar" />
          ) : (
            <div className="message-avatar-fallback">{senderInitial}</div>
          )}
        </div>
      )}

      <div className="message-content">
        <div className={`message-bubble ${isMine ? 'sent' : 'received'} ${normalizedType === 'image' ? 'image' : ''}`}>
          {showSenderName && !isMine && message?.sender?.fullName && (
            <div className="group-sender-name">{message.sender.fullName}</div>
          )}

          {isForwarded && (
            <div className="forwarded-label">Forwarded</div>
          )}

          {/* Reply preview */}
          {replyTo && !replyTo.deletedForEveryone && (
            <div className="reply-preview">
              <span className="reply-sender">{replyTo.sender?.fullName}</span>
              <span className="reply-content">
                {replyTo.type === 'image' ? 'Photo' :
                 replyTo.type === 'file' ? 'File' :
                 replyTo.content?.substring(0, 80) || ''}
              </span>
            </div>
          )}

          {/* Content */}
          {isTextLikeType && <p className="message-text">{content}</p>}
          {normalizedType === 'call_log' && (
            <div className="call-log-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              <span>{callLogText}</span>
            </div>
          )}
          {normalizedType === 'image' && fileUrl && (
            <img
              src={imageSrc}
              alt="shared"
              className="message-image"
              onClick={() => setIsImageViewerOpen(true)}
            />
          )}
          {normalizedType === 'file' && fileUrl && (
            <a href={`http://localhost:5000${fileUrl}`} target="_blank" rel="noreferrer" className="message-file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
              <span>{fileName || 'Download file'}</span>
            </a>
          )}

          {/* Footer */}
          <div className="message-footer">
            {isEdited && <span className="edited-label">edited</span>}
            <span className="message-time">{format(new Date(createdAt), 'HH:mm')}</span>
            {isMine && (
              <span className={`message-status ${status}`}>
                {status === 'seen' ? (
                  <svg width="14" height="10" viewBox="0 0 16 10">
                    <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <path d="M5 5l4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                ) : status === 'delivered' ? (
                  <svg width="14" height="10" viewBox="0 0 16 10">
                    <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <path d="M5 5l4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="10" viewBox="0 0 12 10">
                    <path d="M1 5l4 4L11 1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>

        {Array.isArray(message.reactions) && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((r) => (
              <span key={r.emoji} className="reaction-chip">
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        <div className={`message-actions-inline ${isMine ? 'right' : 'left'}`}>
          <button className="msg-action-btn" onClick={onReply} title="Reply">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
            </svg>
          </button>
          {!selectionMode && (
            <button className="msg-action-btn" onClick={onStartSelect} title="Select">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 12l2 2 4-4"/>
              </svg>
            </button>
          )}
          <button className={`msg-action-btn ${canForward ? '' : 'disabled'}`} onClick={onForward} title="Forward" disabled={!canForward}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 14l5-5-5-5"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
            </svg>
          </button>
          <button className="msg-action-btn" onClick={onMore} title="More">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
            </svg>
          </button>
          <div className="reaction-bar">
            {['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F525}'].map((emoji) => (
              <button key={emoji} className="reaction-btn" onClick={() => onReact(emoji)} title={`React ${emoji}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {normalizedType === 'image' && fileUrl && isImageViewerOpen && (
        <div
          className="message-image-viewer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setIsImageViewerOpen(false)}
        >
          <button
            type="button"
            className="message-image-viewer-close"
            onClick={() => setIsImageViewerOpen(false)}
            aria-label="Close image preview"
          >
            ×
          </button>
          <img
            src={imageSrc}
            alt="shared full view"
            className="message-image-viewer-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
