import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import './ProfileModal.css';

const ProfileModal = ({ onClose }) => {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName || '', bio: user?.bio || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', otp: '' });
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [otpCooldownSec, setOtpCooldownSec] = useState(0);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    if (otpCooldownSec <= 0) return undefined;
    const timer = window.setInterval(() => {
      setOtpCooldownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldownSec]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.updateProfile(form);
      updateUser(data.user);
      getSocket()?.emit('user:profile', {
        fullName: data.user?.fullName,
        bio: data.user?.bio,
        avatar: data.user?.avatar,
      });
      showMsg('success', 'Profile updated!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    setLoading(true);
    try {
      const { data } = await usersAPI.updateAvatar(fd);
      updateUser({ avatar: data.avatar });
      getSocket()?.emit('user:profile', { avatar: data.avatar });
      showMsg('success', 'Avatar updated!');
    } catch (err) {
      showMsg('error', 'Avatar upload failed');
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.otp) {
      return showMsg('error', 'Fill current password, new password, and OTP');
    }
    setLoading(true);
    try {
      await usersAPI.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '', otp: '' });
      showMsg('success', 'Password changed!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Change failed');
    } finally { setLoading(false); }
  };

  const handleRequestOtp = async () => {
    if (otpCooldownSec > 0) return;
    setLoading(true);
    try {
      const { data } = await usersAPI.requestPasswordOtp();
      if (data?.retryAfterSec) {
        setOtpCooldownSec(data.retryAfterSec);
      }
      showMsg('success', 'OTP sent to your email');
    } catch (err) {
      if (err.response?.data?.retryAfterSec) {
        setOtpCooldownSec(err.response.data.retryAfterSec);
      }
      showMsg('error', err.response?.data?.message || 'OTP request failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>My Profile</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Profile</button>
          <button className={`tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>Security</button>
        </div>

        <div className="profile-content">
          {msg.text && (
            <div className={`profile-msg ${msg.type}`}>{msg.text}</div>
          )}

          {tab === 'profile' ? (
            <>
              {/* Avatar */}
              <div className="avatar-section">
                <div className="profile-avatar-wrap" onClick={() => fileRef.current?.click()}>
                  {user?.avatar ? (
                    <img src={`http://localhost:5000${user.avatar}`} alt="" className="profile-avatar" />
                  ) : (
                    <div className="profile-avatar-placeholder">{user?.fullName?.[0]}</div>
                  )}
                  <div className="avatar-overlay">📷 Change</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                <div className="profile-names">
                  <span className="profile-fullname">{user?.fullName}</span>
                  <span className="profile-username">@{user?.username}</span>
                  <span className="profile-email">{user?.email}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={form.fullName} className="input"
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <input type="text" value={form.bio} className="input"
                  placeholder="Tell people about yourself..." maxLength={200}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}
                onClick={handleProfileSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwords.currentPassword} className="input"
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwords.newPassword} className="input"
                  placeholder="At least 6 characters"
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label>OTP (sent to email)</label>
                <input type="text" value={passwords.otp} className="input"
                  placeholder="6-digit code"
                  onChange={(e) => setPasswords({ ...passwords, otp: e.target.value })} />
              </div>
              <button className="btn btn-secondary" style={{ width: '100%' }}
                onClick={handleRequestOtp} disabled={loading || otpCooldownSec > 0}>
                {loading ? 'Sending OTP...' : otpCooldownSec > 0 ? `Resend OTP in ${otpCooldownSec}s` : 'Send OTP'}
              </button>
              {otpCooldownSec > 0 && (
                <div className="otp-cooldown-note">Please wait before requesting another OTP.</div>
              )}
              <button className="btn btn-primary" style={{ width: '100%' }}
                onClick={handlePasswordChange} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button className="btn btn-danger" style={{ width: '100%', marginTop: 8 }} onClick={logout}>
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
