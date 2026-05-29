import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      loginUser(data.token, data.user);

      if (data.user?.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <i className="fas fa-fire"></i>
          <h2>Welcome Back</h2>
          <p>Login to manage your gas bookings</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <i className="far fa-envelope" style={{ position: 'absolute', left: '14px', top: '15px', color: 'rgba(255,255,255,0.4)' }}></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{ position: 'absolute', left: '14px', top: '15px', color: 'rgba(255,255,255,0.4)' }}></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Authenticating...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Login
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </div>
      </div>
    </div>
  );
}
