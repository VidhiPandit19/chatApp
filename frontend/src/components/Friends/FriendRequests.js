import React, { useEffect, useState } from 'react';
import { friendsAPI } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { useChat } from '../../context/ChatContext';
import './FriendRequests.css';

const FriendRequests = ({ onClose }) => {
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [tab, setTab] = useState('received');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const { addConversation, setPendingRequestsCount } = useChat();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, s] = await Promise.all([
          friendsAPI.getPendingRequests(),
          friendsAPI.getSentRequests(),
        ]);
        setPending(p.data.requests);
        setSent(s.data.requests);
        setPendingRequestsCount(p.data.requests.length);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();

    // Listen for new incoming requests
    const socket = getSocket();
    socket?.on('friend:request', ({ friendship }) => {
      friendsAPI.getPendingRequests().then(({ data }) => {
        setPending(data.requests);
        setPendingRequestsCount(data.requests.length);
      });
    });
    return () => socket?.off('friend:request');
  }, [setPendingRequestsCount]);

  const accept = async (friendship) => {
    setActionLoading((p) => ({ ...p, [friendship.id]: 'accept' }));
    try {
      const { data } = await friendsAPI.acceptRequest(friendship.id);
      getSocket()?.emit('friend:accept', {
        requesterId: friendship.requester.id,
        friendship: data.friendship,
        conversation: data.conversation,
      });
      if (data.conversation) addConversation(data.conversation);
      setPending((prev) => {
        const next = prev.filter((r) => r.id !== friendship.id);
        setPendingRequestsCount(next.length);
        return next;
      });
    } catch (err) { console.error(err); }
    finally { setActionLoading((p) => { const n = { ...p }; delete n[friendship.id]; return n; }); }
  };

  const reject = async (friendship) => {
    setActionLoading((p) => ({ ...p, [friendship.id]: 'reject' }));
    try {
      await friendsAPI.rejectRequest(friendship.id);
      setPending((prev) => {
        const next = prev.filter((r) => r.id !== friendship.id);
        setPendingRequestsCount(next.length);
        return next;
      });
    } catch (err) { console.error(err); }
    finally { setActionLoading((p) => { const n = { ...p }; delete n[friendship.id]; return n; }); }
  };

  const cancel = async (friendship) => {
    setActionLoading((p) => ({ ...p, [friendship.id]: 'cancel' }));
    try {
      await friendsAPI.cancelRequest(friendship.receiver.id);
      setSent((prev) => prev.filter((r) => r.id !== friendship.id));
    } catch (err) { console.error(err); }
    finally { setActionLoading((p) => { const n = { ...p }; delete n[friendship.id]; return n; }); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal requests-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Friend Requests</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
            Received {pending.length > 0 && <span className="badge">{pending.length}</span>}
          </button>
          <button className={`tab-btn ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
            Sent {sent.length > 0 && <span className="badge">{sent.length}</span>}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="requests-list">
            {tab === 'received' ? (
              pending.length === 0 ? (
                <div className="requests-empty">No pending requests</div>
              ) : (
                pending.map((req) => (
                  <div key={req.id} className="request-item">
                    <div className="request-user">
                      {req.requester.avatar ? (
                        <img src={`http://localhost:5000${req.requester.avatar}`} alt="" className="avatar" style={{ width: 44, height: 44 }} />
                      ) : (
                        <div className="avatar-placeholder" style={{ width: 44, height: 44, background: '#3182ce', fontSize: 17 }}>
                          {req.requester.fullName[0]}
                        </div>
                      )}
                      <div>
                        <div className="request-name">{req.requester.fullName}</div>
                        <div className="request-username">@{req.requester.username}</div>
                      </div>
                    </div>
                    <div className="request-actions">
                      <button className="btn btn-primary btn-sm"
                        disabled={actionLoading[req.id] === 'accept'}
                        onClick={() => accept(req)}>Accept</button>
                      <button className="btn btn-secondary btn-sm"
                        disabled={actionLoading[req.id] === 'reject'}
                        onClick={() => reject(req)}>Reject</button>
                    </div>
                  </div>
                ))
              )
            ) : (
              sent.length === 0 ? (
                <div className="requests-empty">No sent requests</div>
              ) : (
                sent.map((req) => (
                  <div key={req.id} className="request-item">
                    <div className="request-user">
                      {req.receiver.avatar ? (
                        <img src={`http://localhost:5000${req.receiver.avatar}`} alt="" className="avatar" style={{ width: 44, height: 44 }} />
                      ) : (
                        <div className="avatar-placeholder" style={{ width: 44, height: 44, background: '#e53e3e', fontSize: 17 }}>
                          {req.receiver.fullName[0]}
                        </div>
                      )}
                      <div>
                        <div className="request-name">{req.receiver.fullName}</div>
                        <div className="request-username">@{req.receiver.username}</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm"
                      disabled={actionLoading[req.id] === 'cancel'}
                      onClick={() => cancel(req)}>Cancel</button>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
