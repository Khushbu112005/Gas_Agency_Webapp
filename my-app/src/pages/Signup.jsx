import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../Firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      // Save details to Firestore with role = 'client'
      await setDoc(doc(db, 'users', res.user.uid), {
        name,
        email,
        role: 'client',
        createdAt: new Date()
      });
      alert('Account registration successful!');
      navigate('/client-dashboard');
    } catch (err) {
      console.error(err);
      alert('Signup failed: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <i className="fas fa-user-plus"></i>
          <h2>Create Account</h2>
          <p>Register to book and track cylinders</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <i className="far fa-user" style={{ position: 'absolute', left: '14px', top: '15px', color: 'rgba(255,255,255,0.4)' }}></i>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <i className="far fa-envelope" style={{ position: 'absolute', left: '14px', top: '15px', color: 'rgba(255,255,255,0.4)' }}></i>
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Registering...
              </>
            ) : (
              <>
                <i className="fas fa-user-check"></i> Sign Up
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/">Log in here</Link>
        </div>
      </div>
    </div>
  );
}
