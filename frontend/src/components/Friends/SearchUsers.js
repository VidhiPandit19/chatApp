import React, { useState, useCallback, useEffect } from 'react';
import { usersAPI, friendsAPI } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { useChat } from '../../context/ChatContext';
import './SearchUsers.css';

const SearchUsers = () => {
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingActionLoading, setPendingActionLoading] = useState({});
  const { addConversation } = useChat();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.list();
      setAllUsers(data.users);
      setResults(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const { data } = await friendsAPI.getPendingRequests();
      setPending(data.requests);
    } catch (err) { console.error(err); }
    finally { setPendingLoading(false); }
  }, []);

  useEffect(() => {
    loadPending();
    const socket = getSocket();
    socket?.on('friend:request', () => loadPending());
    socket?.on('friend:accepted', () => loadAll());
    socket?.on('friend:removed', () => loadAll());
    return () => {
      socket?.off('friend:request');
      socket?.off('friend:accepted');
      socket?.off('friend:removed');
    };
  }, [loadPending, loadAll]);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults(allUsers); return; }
    setLoading(true);
    try {
      const { data } = await usersAPI.search(q);
      setResults(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [allUsers]);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    const t = setTimeout(() => search(q), 400);
    return () => clearTimeout(t);
  };

  const sendRequest = async (userId) => {
    setActionLoading((p) => ({ ...p, [userId]: true }));
    try {
      const { data } = await friendsAPI.sendRequest(userId);
      getSocket()?.emit('friend:request', { receiverId: userId, friendship: data.friendship });
      setAllUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, friendshipStatus: 'pending', isRequester: true } : u
      ));
      setResults((prev) => prev.map((u) =>
        u.id === userId ? { ...u, friendshipStatus: 'pending', isRequester: true } : u
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading((p) => ({ ...p, [userId]: false }));
    }
  };

  const cancelRequest = async (userId) => {
    setActionLoading((p) => ({ ...p, [userId]: true }));
    try {
      await friendsAPI.cancelRequest(userId);
      setAllUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, friendshipStatus: null } : u
      ));
      setResults((prev) => prev.map((u) =>
        u.id === userId ? { ...u, friendshipStatus: null } : u
      ));
    } catch (err) { console.error(err); }
    finally { setActionLoading((p) => ({ ...p, [userId]: false })); }
  };

  const acceptRequest = async (friendship) => {
    setPendingActionLoading((p) => ({ ...p, [friendship.id]: 'accept' }));
    try {
      const { data } = await friendsAPI.acceptRequest(friendship.id);
      getSocket()?.emit('friend:accept', {
        requesterId: friendship.requester.id,
        friendship: data.friendship,
        conversation: data.conversation,
      });
      if (data.conversation) addConversation(data.conversation);
      setPending((prev) => prev.filter((r) => r.id !== friendship.id));
      setAllUsers((prev) => prev.filter((u) => u.id !== friendship.requester.id));
      setResults((prev) => prev.filter((u) => u.id !== friendship.requester.id));
    } catch (err) { console.error(err); }
    finally {
      setPendingActionLoading((p) => { const n = { ...p }; delete n[friendship.id]; return n; });
    }
  };

  const rejectRequest = async (friendship) => {
    setPendingActionLoading((p) => ({ ...p, [friendship.id]: 'reject' }));
    try {
      await friendsAPI.rejectRequest(friendship.id);
      setPending((prev) => prev.filter((r) => r.id !== friendship.id));
      setAllUsers((prev) => prev.map((u) =>
        u.id === friendship.requester.id ? { ...u, friendshipStatus: null, isRequester: null } : u
      ));
      setResults((prev) => prev.map((u) =>
        u.id === friendship.requester.id ? { ...u, friendshipStatus: null, isRequester: null } : u
      ));
    } catch (err) { console.error(err); }
    finally {
      setPendingActionLoading((p) => { const n = { ...p }; delete n[friendship.id]; return n; });
    }
  };

  const renderAction = (u) => {
    const loading = actionLoading[u.id];
    if (u.friendshipStatus === 'accepted') {
      return <span className="friend-badge">✓ Friends</span>;
    }
    if (u.friendshipStatus === 'pending' && u.isRequester) {
      return <button className="btn btn-secondary btn-sm" onClick={() => cancelRequest(u.id)} disabled={loading}>Cancel</button>;
    }
    if (u.friendshipStatus === 'pending' && !u.isRequester) {
      return <span className="pending-badge">Pending</span>;
    }
    return (
      <button className="btn btn-primary btn-sm" onClick={() => sendRequest(u.id)} disabled={loading}>
        {loading ? '...' : '+ Add'}
      </button>
    );
  };

  const pendingIncomingIds = new Set(pending.map((r) => r.requester?.id));
  const displayResults = results.filter((u) => {
    if (u.friendshipStatus === 'accepted') return false;
    if (pendingIncomingIds.has(u.id)) return false;
    return true;
  });

  return (
    <div className="search-users">
      <div className="search-input-wrap">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text" value={query} onChange={handleChange}
          placeholder="Search by name or username..." className="search-input"
        />
      </div>

      {loading && <div className="search-loading"><div className="spinner" style={{ width: 24, height: 24 }} /></div>}

      <div className="search-section">
        <div className="section-title">Pending requests</div>
        {pendingLoading ? (
          <div className="search-loading"><div className="spinner" style={{ width: 22, height: 22 }} /></div>
        ) : pending.length === 0 ? (
          <div className="search-empty">No pending requests</div>
        ) : (
          <div className="pending-list">
            {pending.map((req) => (
              <div key={req.id} className="pending-item">
                <div className="pending-user">
                  {req.requester.avatar ? (
                    <img src={`http://localhost:5000${req.requester.avatar}`} alt="" className="avatar" style={{ width: 40, height: 40 }} />
                  ) : (
                    <div className="avatar-placeholder" style={{ width: 40, height: 40, background: '#3182ce', fontSize: 16 }}>
                      {req.requester.fullName[0]}
                    </div>
                  )}
                  <div>
                    <div className="pending-name">{req.requester.fullName}</div>
                    <div className="pending-username">@{req.requester.username}</div>
                  </div>
                </div>
                <div className="pending-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={pendingActionLoading[req.id] === 'accept'}
                    onClick={() => acceptRequest(req)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pendingActionLoading[req.id] === 'reject'}
                    onClick={() => rejectRequest(req)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="search-section">
        <div className="section-title">All students</div>
        {displayResults.length === 0 && query.length >= 2 && !loading && (
          <div className="search-empty">No users found for "{query}"</div>
        )}

        <div className="search-results">
          {displayResults.map((u) => (
            <div key={u.id} className="search-user-item">
              <div className="search-user-avatar">
                {u.avatar ? (
                  <img src={`http://localhost:5000${u.avatar}`} alt="" className="avatar" style={{ width: 44, height: 44 }} />
                ) : (
                  <div className="avatar-placeholder" style={{ width: 44, height: 44, background: '#805ad5', fontSize: 17 }}>
                    {u.fullName[0]}
                  </div>
                )}
                {u.isOnline && <span className="online-dot" />}
              </div>
              <div className="search-user-info">
                <span className="search-user-name">{u.fullName}</span>
                <span className="search-user-username">@{u.username}</span>
                {/* Bio hidden here to keep add list compact */}
              </div>
              <div className="search-user-action">{renderAction(u)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchUsers;
