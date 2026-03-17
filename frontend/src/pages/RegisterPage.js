import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const [form, setForm] = useState({ username: '', fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#25d366"/>
            <path d="M24 10C16.268 10 10 16.268 10 24c0 2.516.66 4.874 1.81 6.924L10 38l7.244-1.79A13.92 13.92 0 0024 38c7.732 0 14-6.268 14-14S31.732 10 24 10z" fill="white"/>
            <path d="M20 18.5c-.4-1-.7-.95-1.04-.97-.27-.02-.58-.02-.89-.02-.31 0-.81.12-1.23.58-.42.46-1.6 1.57-1.6 3.83s1.64 4.44 1.87 4.75c.23.31 3.19 5.05 7.85 6.88 3.89 1.53 4.68 1.23 5.52 1.15.85-.08 2.73-1.11 3.12-2.19.38-1.07.38-1.99.27-2.18-.12-.19-.43-.31-.9-.54-.46-.23-2.73-1.35-3.15-1.5-.42-.15-.73-.23-1.04.23-.31.46-1.19 1.5-1.46 1.81-.27.31-.54.35-1 .12-.46-.23-1.95-.72-3.72-2.29-1.37-1.22-2.3-2.73-2.57-3.19-.27-.46-.03-.71.2-.94.2-.2.46-.54.69-.81.23-.27.31-.46.46-.77.15-.31.08-.58-.04-.81-.12-.23-1.04-2.49-1.42-3.4z" fill="#25d366"/>
          </svg>
          <h1>Create Account</h1>
          <p>Join ChatApp today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input type="text" name="username" value={form.username} onChange={handleChange}
                placeholder="johndoe123" className="input" required minLength={3} />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                placeholder="John Doe" className="input" required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" className="input" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="At least 6 characters" className="input" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="btn-spinner" />Creating Account...</> : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;
