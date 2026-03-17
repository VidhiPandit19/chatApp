import React, { useEffect, useMemo, useRef, useState } from 'react';
import { groupsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { friendsAPI } from '../../utils/api';
import './GroupInfoModal.css';

const GroupInfoModal = ({ conversation, onClose, onConversationUpdated, onLeftGroup }) => {
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [groupConv, setGroupConv] = useState(conversation);
  const [name, setName] = useState(conversation?.group?.name || '');
  const [description, setDescription] = useState(conversation?.group?.description || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [friends, setFriends] = useState([]);
  const [addQuery, setAddQuery] = useState('');
  const [openMemberMenuId, setOpenMemberMenuId] = useState(null);

  const normalize = (value) => String(value || '').trim().toLowerCase();

  const groupId = conversation?.id;
  const group = groupConv?.group;
  const members = Array.isArray(group?.members) ? group.members : [];
  const isAdmin = !!group && group.adminId === user?.id;

  const sortedMembers = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => {
      if (a.id === group?.adminId) return -1;
      if (b.id === group?.adminId) return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });
    return list;
  }, [members, group?.adminId]);

  useEffect(() => {
    const load = async () => {
      if (!groupId) return;
      setLoading(true);
      try {
        const { data } = await groupsAPI.getById(groupId);
        if (data?.group) {
          setGroupConv(data.group);
          setName(data.group.group?.name || '');
          setDescription(data.group.group?.description || '');
        }
      } catch (err) {
        setMsg(err.response?.data?.message || 'Failed to load group info');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [groupId]);

  useEffect(() => {
    const loadFriends = async () => {
      if (!isAdmin) return;
      try {
        const { data } = await friendsAPI.getFriends();
        setFriends(data.friends || []);
      } catch (err) {
        // Ignore friend-loading errors in modal.
      }
    };
    loadFriends();
  }, [isAdmin]);

  useEffect(() => {
    const handleOutsideClick = () => setOpenMemberMenuId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const applyUpdatedConversation = (nextConv) => {
    if (!nextConv) return;
    setGroupConv(nextConv);
    setName(nextConv.group?.name || '');
    setDescription(nextConv.group?.description || '');
    setOpenMemberMenuId(null);
    onConversationUpdated?.(nextConv);
  };

  const handleSaveBasics = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setMsg('');
    try {
      const { data } = await groupsAPI.update(groupId, {
        name: name.trim(),
        description: description.trim() || null,
      });
      if (data?.group) applyUpdatedConversation(data.group);
      setMsg('Group info updated');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFile = async (event) => {
    if (!isAdmin) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('avatar', file);

    setLoading(true);
    setMsg('');
    try {
      const { data } = await groupsAPI.updateAvatar(groupId, fd);
      if (data?.group) applyUpdatedConversation(data.group);
      setMsg('Group photo updated');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update group photo');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (memberId, fullName) => {
    if (!isAdmin || !memberId) return;
    if (!window.confirm(`Make ${fullName || 'this member'} the next admin?`)) return;

    setLoading(true);
    setMsg('');
    try {
      const { data } = await groupsAPI.transferAdmin(groupId, memberId);
      if (data?.group) applyUpdatedConversation(data.group);
      setMsg('Admin updated');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to transfer admin');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    setLoading(true);
    setMsg('');
    try {
      await groupsAPI.leave(groupId);
      onLeftGroup?.();
      onClose?.();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const memberIds = new Set(members.map((m) => String(m.id)));
  const addableFriends = friends.filter((f) => !memberIds.has(String(f.id)));
  const normalizedQuery = normalize(addQuery).replace(/^@/, '');
  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);
  const filteredAddableFriends = queryParts.length === 0
    ? addableFriends
    : addableFriends.filter((f) => {
      const searchable = [f.fullName, f.username, f.name, f.email]
        .map((part) => normalize(part))
        .join(' ');
      return queryParts.every((part) => searchable.includes(part));
    });

  const handleAddMember = async (targetUserId) => {
    if (!isAdmin || !targetUserId) return;
    setLoading(true);
    setMsg('');
    try {
      const { data } = await groupsAPI.addMember(groupId, targetUserId);
      if (data?.group) applyUpdatedConversation(data.group);
      setMsg('Member added');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, fullName) => {
    if (!isAdmin || !memberId) return;
    if (!window.confirm(`Remove ${fullName || 'this member'} from group?`)) return;
    setLoading(true);
    setMsg('');
    try {
      const { data } = await groupsAPI.removeMember(groupId, memberId);
      if (data?.group) applyUpdatedConversation(data.group);
      setMsg('Member removed');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal group-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Group Info</h2>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <div className="group-info-body">
          <div className="group-hero">
            <div className={`group-hero-avatar-wrap ${isAdmin ? 'is-editable' : ''}`} onClick={() => isAdmin && fileRef.current?.click()}>
              {group?.avatar ? (
                <img src={`http://localhost:5000${group.avatar}`} alt="" className="group-hero-avatar" />
              ) : (
                <div className="group-hero-avatar-placeholder">{group?.name?.[0] || 'G'}</div>
              )}
              {isAdmin && <span className="group-hero-avatar-edit">Change</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />

            <div className="group-hero-meta">
              <span className="group-hero-name">{group?.name || 'Group'}</span>
              <span className="group-hero-sub">{group?.memberCount || members.length} members</span>
            </div>
          </div>

          <div className="group-form-grid">
            <div className="form-group">
              <label>Group name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin || loading} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input className="input" value={description || ''} onChange={(e) => setDescription(e.target.value)} disabled={!isAdmin || loading} placeholder="Say something about this group" />
            </div>
          </div>

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleSaveBasics} disabled={loading || !name.trim()}>
              Save Group Info
            </button>
          )}

          {isAdmin && (
            <div className="group-admin-row">
              <div className="group-add-panel">
                <div className="group-members-title">Add Members</div>
                <input
                  className="input"
                  placeholder="Search friend by name or username"
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  disabled={loading || addableFriends.length === 0}
                />

                <div className="group-add-list">
                  {addableFriends.length === 0 && (
                    <div className="group-empty-row">No friends available to add</div>
                  )}
                  {addableFriends.length > 0 && filteredAddableFriends.length === 0 && (
                    <div className="group-empty-row">No friend matched "{addQuery}"</div>
                  )}

                  {filteredAddableFriends.map((friend) => (
                    <div key={friend.id} className="group-add-row">
                      <div className="group-member-left">
                        {friend.avatar ? (
                          <img src={`http://localhost:5000${friend.avatar}`} alt="" className="avatar" style={{ width: 30, height: 30 }} />
                        ) : (
                          <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: 12 }}>
                            {friend.fullName?.[0] || '?'}
                          </div>
                        )}
                        <div className="group-member-text">
                          <span className="group-member-fullname">{friend.fullName}</span>
                          <span className="group-member-username">@{friend.username}</span>
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleAddMember(friend.id)} disabled={loading}>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="group-members-title">Members</div>
          <div className="group-members-info-list">
            {loading && members.length === 0 && <div className="group-empty-row">Loading...</div>}
            {sortedMembers.map((member) => {
              const isCurrentAdmin = member.id === group?.adminId;
              const isMe = member.id === user?.id;

              return (
                <div key={member.id} className="group-member-row">
                  <div className="group-member-left">
                    {member.avatar ? (
                      <img src={`http://localhost:5000${member.avatar}`} alt="" className="avatar" style={{ width: 34, height: 34 }} />
                    ) : (
                      <div className="avatar-placeholder" style={{ width: 34, height: 34, fontSize: 13 }}>
                        {member.fullName?.[0] || '?'}
                      </div>
                    )}
                    <div className="group-member-text">
                      <span className="group-member-fullname">{member.fullName}{isMe ? ' (You)' : ''}</span>
                      <span className="group-member-username">@{member.username}</span>
                    </div>
                  </div>

                  <div className="group-member-actions">
                    {isCurrentAdmin && <span className="member-chip admin">Admin</span>}
                    {!isCurrentAdmin && isAdmin && !isMe && (
                      <div className="member-menu-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-icon member-menu-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMemberMenuId((prev) => (prev === member.id ? null : member.id));
                          }}
                          disabled={loading}
                          title="Member actions"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="5" r="1.8" />
                            <circle cx="12" cy="12" r="1.8" />
                            <circle cx="12" cy="19" r="1.8" />
                          </svg>
                        </button>
                        {openMemberMenuId === member.id && (
                          <div className="member-menu-popover">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleMakeAdmin(member.id, member.fullName)}
                              disabled={loading}
                            >
                              Make Admin
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveMember(member.id, member.fullName)}
                              disabled={loading}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {msg && <div className="group-inline-msg">{msg}</div>}
        </div>

        <div className="group-info-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-danger" onClick={handleLeaveGroup} disabled={loading}>Leave Group</button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
