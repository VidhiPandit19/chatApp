import React, { useEffect, useMemo, useState } from 'react';
import { friendsAPI, groupsAPI } from '../../utils/api';
import { useChat } from '../../context/ChatContext';
import './CreateGroupModal.css';

const CreateGroupModal = ({ onClose }) => {
  const { addConversation } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFriends = async () => {
      setLoading(true);
      try {
        const { data } = await friendsAPI.getFriends();
        setFriends(data.friends || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load friends');
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  const selectedCount = selected.size;
  const canCreate = useMemo(() => name.trim().length > 0 && selectedCount > 0 && !saving, [name, selectedCount, saving]);

  const toggleFriend = (friendId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError('');

    try {
      const { data } = await groupsAPI.create({
        name: name.trim(),
        description: description.trim() || null,
        memberIds: Array.from(selected),
      });

      if (data?.group) addConversation(data.group);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal create-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Group</h2>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <div className="create-group-body">
          <div className="form-group">
            <label>Group name</label>
            <input
              className="input"
              type="text"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekend Project Team"
            />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <input
              className="input"
              type="text"
              maxLength={120}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this group is about"
            />
          </div>

          <div className="group-members-header">
            <span>Select friends</span>
            <span>{selectedCount} selected</span>
          </div>

          <div className="group-members-list">
            {loading && <div className="group-empty">Loading friends...</div>}
            {!loading && friends.length === 0 && (
              <div className="group-empty">No friends available yet.</div>
            )}
            {!loading && friends.map((friend) => {
              const checked = selected.has(friend.id);
              return (
                <button
                  key={friend.id}
                  type="button"
                  className={`group-member-item ${checked ? 'active' : ''}`}
                  onClick={() => toggleFriend(friend.id)}
                >
                  {friend.avatar ? (
                    <img src={`http://localhost:5000${friend.avatar}`} alt="" className="avatar" style={{ width: 36, height: 36 }} />
                  ) : (
                    <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 14 }}>
                      {friend.fullName?.[0] || '?'}
                    </div>
                  )}
                  <div className="group-member-meta">
                    <span className="group-member-name">{friend.fullName}</span>
                    <span className="group-member-username">@{friend.username}</span>
                  </div>
                  <span className={`group-check ${checked ? 'checked' : ''}`}>{checked ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>

          {error && <div className="group-error">{error}</div>}
        </div>

        <div className="create-group-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!canCreate}>
            {saving ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
