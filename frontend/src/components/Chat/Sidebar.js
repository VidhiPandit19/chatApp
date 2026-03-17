import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ConversationItem from './ConversationItem';
import SearchUsers from '../Friends/SearchUsers';
import CreateGroupModal from '../Groups/CreateGroupModal';
import './Sidebar.css';

const Sidebar = ({ onShowRequests, onShowProfile, onOpenChat }) => {
  const { user, logout } = useAuth();
  const { conversations, setActiveConversation, totalUnread, pendingRequestsCount } = useChat();
  const [tab, setTab] = useState('chats'); // 'chats' | 'search'
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleSelectConv = (conv) => {
    setActiveConversation(conv);
    onOpenChat();
  };

  return (
    <>
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-user" onClick={() => onShowProfile()}>
          <div className="avatar-wrap">
            {user?.avatar ? (
              <img src={`http://localhost:5000${user.avatar}`} alt="" className="avatar" style={{ width: 40, height: 40 }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 40, height: 40, background: '#25d366', fontSize: 16 }}>
                {user?.fullName?.[0]}
              </div>
            )}
            <span className="online-dot" style={{ width: 12, height: 12 }} />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{user?.fullName}</span>
            <span className="sidebar-status">Online</span>
          </div>
        </div>
        <div className="sidebar-actions">
          <button className="btn-icon" onClick={() => setShowCreateGroup(true)} title="Create Group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="7" r="2.5"/>
              <path d="M7.5 17a4.5 4.5 0 0 1 9 0"/>
              <circle cx="6" cy="9" r="2"/>
              <path d="M2.5 17a3.5 3.5 0 0 1 3.5-3"/>
              <circle cx="18" cy="9" r="2"/>
              <path d="M21.5 17a3.5 3.5 0 0 0-3.5-3"/>
            </svg>
          </button>
          <button className="btn-icon request-btn" onClick={onShowRequests} title="Friend Requests">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            {pendingRequestsCount > 0 && (
              <span className="request-badge">
                {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
              </span>
            )}
          </button>
          <div className="dropdown-wrap">
            <button className="btn-icon" onClick={() => setShowMenu(!showMenu)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { onShowProfile(); setShowMenu(false); }}>Profile</div>
                <div className="dropdown-item danger" onClick={logout}>Sign Out</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button className={`tab-btn ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>
          Chats {totalUnread > 0 && <span className="badge">{totalUnread > 99 ? '99+' : totalUnread}</span>}
        </button>
        <button className={`tab-btn ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
          Find People
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {tab === 'chats' ? (
          conversations.length === 0 ? (
            <div className="sidebar-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p>No conversations yet</p>
              <span>Find people to chat with</span>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('search')}>
                Find Friends
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                onClick={() => handleSelectConv(conv)}
              />
            ))
          )
        ) : (
          <SearchUsers />
        )}
      </div>
    </div>
    {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </>
  );
};

export default Sidebar;
