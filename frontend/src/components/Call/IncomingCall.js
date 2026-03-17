import React from 'react';
import { useCall } from '../../context/CallContext';
import './CallUI.css';

const IncomingCall = () => {
  const { callState, answerCall, rejectCall } = useCall();
  if (!callState || callState.status !== 'incoming') return null;

  const { callId, type, caller, offer } = callState;

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card pop-in">
        <div className="call-pulse-ring" />
        <div className="call-avatar-wrap">
          {caller?.avatar ? (
            <img src={`http://localhost:5000${caller.avatar}`} alt="" className="call-avatar" />
          ) : (
            <div className="call-avatar-placeholder">{caller?.fullName?.[0] || '?'}</div>
          )}
        </div>
        <div className="incoming-call-info">
          <h3>{caller?.fullName || 'Unknown'}</h3>
          <p>Incoming {type} call...</p>
          <div className="call-type-icon">
            {type === 'video' ? '📹' : '📞'}
          </div>
        </div>
        <div className="call-buttons">
          <button
            className="call-btn reject"
            onClick={() => rejectCall(callId, caller?.id)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.36 14.46c-1.32-1.32-3.52-1.32-4.84 0l-1.18 1.18c-.1.1-.26.1-.36 0L12 10.8c-.1-.1-.1-.26 0-.36l1.18-1.18c1.32-1.32 1.32-3.52 0-4.84l-2.1-2.1a2.62 2.62 0 00-3.72 0L5.98 3.7C3.64 6.04 3.64 9.92 5.98 14.36l3.64 3.64C13.96 22.34 17.84 22.34 20.18 20l1.4-1.4a2.62 2.62 0 000-3.72l-2.22-.42z"/>
            </svg>
          </button>
          <button
            className="call-btn accept"
            onClick={() => answerCall(callId, caller?.id, type, offer)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.12.45 2.33.69 3.48.69a1 1 0 011 1V20a1 1 0 01-1 1C9.61 21 3 14.39 3 6a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.24 2.46.69 3.58a1 1 0 01-.57 1.21z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
