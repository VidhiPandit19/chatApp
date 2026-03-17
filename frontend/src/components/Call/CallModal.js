import React, { useState } from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import './CallUI.css';

const formatDuration = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const CallModal = () => {
  const { callState, endCall, toggleMute, toggleVideo, localVideoRef, remoteVideoRef, callDuration } = useCall();
  const { user } = useAuth();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  if (!callState || callState.status === 'incoming') return null;

  const { type, status, caller, receiver } = callState;
  const other = caller?.id === user?.id ? receiver : caller;
  const isVideo = type === 'video';

  const handleMute = () => { toggleMute(); setMuted(!muted); };
  const handleVideo = () => { toggleVideo(); setVideoOff(!videoOff); };

  return (
    <div className={`call-modal ${isVideo ? 'video-call' : 'voice-call'}`}>
      {isVideo && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          {status === 'calling' && (
            <div className="call-waiting-overlay">
              <div className="call-waiting-card">
                <div className="call-waiting-title">Calling {other?.fullName}...</div>
                <div className="call-waiting-sub">Waiting for answer</div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="call-overlay-content">
        {(!isVideo || status === 'calling') && (
          <div className="call-info-center">
            <div className="call-avatar-wrap large">
              {other?.avatar ? (
                <img src={`http://localhost:5000${other.avatar}`} alt="" className="call-avatar large" />
              ) : (
                <div className="call-avatar-placeholder large">{other?.fullName?.[0] || '?'}</div>
              )}
              {status === 'calling' && <div className="call-pulse-ring" />}
            </div>
            <h2 className="call-name">{other?.fullName}</h2>
            <p className="call-status-text">
              {status === 'calling' ? `Calling...` : status === 'connected' ? formatDuration(callDuration) : status}
            </p>
          </div>
        )}

        {isVideo && status === 'connected' && (
          <div className="call-duration-badge">{formatDuration(callDuration)}</div>
        )}

        <div className="call-controls">
          <button className={`call-ctrl-btn ${muted ? 'active' : ''}`} onClick={handleMute} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          {isVideo && (
            <button className={`call-ctrl-btn ${videoOff ? 'active' : ''}`} onClick={handleVideo} title={videoOff ? 'Turn on camera' : 'Turn off camera'}>
              {videoOff ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M15 8l4.55-2.06A1 1 0 0121 6.94v10.12a1 1 0 01-1.45.88L15 15.73V17a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h9a2 2 0 012 2v1z"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              )}
            </button>
          )}

          <button className="call-btn reject large" onClick={endCall} title="End call">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.36 14.46c-1.32-1.32-3.52-1.32-4.84 0l-1.18 1.18c-.1.1-.26.1-.36 0L12 10.8c-.1-.1-.1-.26 0-.36l1.18-1.18c1.32-1.32 1.32-3.52 0-4.84l-2.1-2.1a2.62 2.62 0 00-3.72 0L5.98 3.7C3.64 6.04 3.64 9.92 5.98 14.36l3.64 3.64C13.96 22.34 17.84 22.34 20.18 20l1.4-1.4a2.62 2.62 0 000-3.72l-2.22-.42z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
