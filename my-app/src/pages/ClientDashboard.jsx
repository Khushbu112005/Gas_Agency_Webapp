import React, { useEffect, useState } from 'react';
import { auth, db } from '../Firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import NoticeBoard from '../components/NoticeBoard';
import { useNavigate } from 'react-router-dom';

export default function ClientDashboard() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!auth.currentUser) return;
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/'));
  };

  return (
    <div className="centered-container">

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column', // stack heading + logout vertically
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}
      >
        <h2 style={{ marginBottom: '10px' }}>
          <i className="fas fa-user-circle" style={{ marginRight: 10, color: '#764ba2' }}></i>
          Client Dashboard
        </h2>

        <button
          onClick={handleLogout}
          style={{
            background: '#ff4d4f',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      {/* New Booking */}
      <div style={{ marginBottom: 20 }}>
        <a href="/book" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-gas-pump" style={{ marginRight: 8 }}></i> New Booking
          </button>
        </a>
      </div>

      {/* Bookings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>
          <i className="fas fa-list" style={{ marginRight: 8, color: '#667eea' }}></i> Your Bookings
        </h3>
        {bookings.length === 0 ? (
          <div className="small">No bookings yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.date}</td>
                  <td>{b.cylinderType}</td>
                  <td>{b.status || 'pending'}</td>
                  <td>{b.paymentStatus || 'unpaid'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notices */}
      <div className="card">
        <h3>
          <i className="fas fa-bullhorn" style={{ marginRight: 8, color: '#ff6600' }}></i> Notices
        </h3>
        <NoticeBoard />
      </div>

    </div>
  );
}
