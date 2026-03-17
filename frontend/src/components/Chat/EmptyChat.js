import React from 'react';
import './EmptyChat.css';

const EmptyChat = () => (
  <div className="empty-chat">
    <div className="empty-chat-content">
      <div className="empty-chat-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="rgba(74,141,255,0.12)"/>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="#4a8dff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
      <h2>Welcome to ChatApp</h2>
      <p>Pick a conversation from the sidebar or start a new one to begin messaging.</p>
      <ul className="empty-features">
        <li><span className="empty-feature-dot" />Private 1:1 and group conversations</li>
        <li><span className="empty-feature-dot" />Voice and video calls with WebRTC</li>
        <li><span className="empty-feature-dot" />Live online status and typing updates</li>
        <li><span className="empty-feature-dot" />Photo and file sharing support</li>
      </ul>
    </div>
  </div>
);

export default EmptyChat;
