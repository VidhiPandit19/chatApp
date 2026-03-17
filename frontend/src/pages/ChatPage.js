import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import EmptyChat from '../components/Chat/EmptyChat';
import FriendRequests from '../components/Friends/FriendRequests';
import CallModal from '../components/Call/CallModal';
import IncomingCall from '../components/Call/IncomingCall';
import ProfileModal from '../components/Chat/ProfileModal';
import { useCall } from '../context/CallContext';
import './ChatPage.css';

const ChatPage = () => {
  const { loadConversations, activeConversation } = useChat();
  const { callState } = useCall();
  const [showRequests, setShowRequests] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className={`sidebar-wrapper ${mobileChatOpen ? 'mobile-hidden' : ''}`}>
        <Sidebar
          onShowRequests={() => setShowRequests(true)}
          onShowProfile={() => setShowProfile(true)}
          onOpenChat={() => setMobileChatOpen(true)}
        />
      </div>

      {/* Chat area */}
      <div className={`chat-area-wrapper ${!mobileChatOpen && !activeConversation ? 'desktop-empty' : ''}`}>
        {activeConversation ? (
          <ChatWindow onBack={() => { setMobileChatOpen(false); }} />
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Modals */}
      {showRequests && <FriendRequests onClose={() => setShowRequests(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* Call UI */}
      {callState?.status === 'incoming' && <IncomingCall />}
      {callState && callState.status !== 'incoming' && <CallModal />}
    </div>
  );
};

export default ChatPage;
