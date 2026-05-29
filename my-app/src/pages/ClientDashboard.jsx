import React, { useEffect, useState } from 'react';
import NoticeBoard from '../components/NoticeBoard';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import Navbar from '../components/Navbar';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      if (!user) return;
      try {
        setLoadingBookings(true);
        const token = localStorage.getItem('token');
        const res = await fetch('/api/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await res.json();
        
        // Sort manually (newest first)
        data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
          return dateB - dateA;
        });
        
        setBookings(data);
      } catch (err) {
        console.error("Error loading client bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    }
    
    if (user) {
      loadBookings();
    }
  }, [user]);

  // Compute stat metrics
  const totalCylinders = bookings.reduce((acc, curr) => acc + (curr.extra ? 2 : 1), 0);
  const pendingDeliveries = bookings.filter(b => (b.status || 'pending') === 'pending').length;
  const totalSpend = bookings.reduce((acc, curr) => {
    if (curr.paymentStatus !== 'paid') return acc;
    const basePrice = curr.cylinderType === 'Commercial' ? 1600 : 900;
    const count = curr.extra ? 2 : 1;
    return acc + (basePrice * count);
  }, 0);

  if (authLoading) {
    return (
      <div className="loader-container" style={{ minHeight: '80vh' }}>
        <div className="loader-spinner"></div>
        <p className="loader-text">Loading secure session...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">
        <header style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: 0 }}>
            <i className="fas fa-chart-line" style={{ color: '#ff4b2b' }}></i>
            Client Command Center
          </h2>
          <p className="text-muted" style={{ margin: '0.4rem 0 0 0' }}>Welcome, manage bookings and read agency announcements in real-time.</p>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">
              <i className="fas fa-gas-pump"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Cylinders Booked</span>
              <span className="stat-value">{totalCylinders}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <i className="fas fa-truck-loading"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending Deliveries</span>
              <span className="stat-value">{pendingDeliveries}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <i className="fas fa-wallet"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Spent (Paid)</span>
              <span className="stat-value">₹{totalSpend}</span>
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
          {/* Booking History Table */}
          <section className="glass-card" style={{ padding: '2rem' }}>
            <div className="flex-between mb-3" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-history" style={{ color: '#00b4db' }}></i>
                Booking History
              </h3>
              <Link to="/book" className="btn btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem' }}>
                <i className="fas fa-plus"></i> New Booking
              </Link>
            </div>

            {loadingBookings ? (
              <div className="loader-container" style={{ padding: '2rem 0' }}>
                <div className="loader-spinner" style={{ width: '40px', height: '40px' }}></div>
                <p className="loader-text" style={{ fontSize: '0.9rem' }}>Fetching order records...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '3rem 1.5rem' }}>
                <i className="fas fa-receipt" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                <p style={{ margin: 0 }}>You haven't placed any bookings yet.</p>
                <Link to="/book" className="btn btn-secondary" style={{ marginTop: '1.2rem', padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>
                  Place Your First Order
                </Link>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Delivery Date</th>
                      <th>Cylinder Type</th>
                      <th>Extra Cylinder</th>
                      <th>Delivery Status</th>
                      <th>Payment Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '500' }}>{b.date}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className={b.cylinderType === 'Commercial' ? 'fas fa-store text-muted' : 'fas fa-home text-muted'}></i>
                            {b.cylinderType}
                          </span>
                        </td>
                        <td>{b.extra ? <span className="text-bright" style={{ fontWeight: '600' }}><i className="fas fa-check-circle" style={{ color: '#38ef7d', marginRight: '4px' }}></i>Yes</span> : 'No'}</td>
                        <td>
                          <span className={`badge ${
                            (b.status || 'pending') === 'approved' ? 'badge-approved' : 
                            (b.status || 'pending') === 'rejected' ? 'badge-rejected' : 'badge-pending'
                          }`}>
                            <i className={`fas ${
                              (b.status || 'pending') === 'approved' ? 'fa-check' : 
                              (b.status || 'pending') === 'rejected' ? 'fa-times' : 'fa-clock'
                            }`}></i>
                            {b.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                            <i className={`fas ${b.paymentStatus === 'paid' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                            {b.paymentStatus || 'unpaid'}
                          </span>
                        </td>
                        <td>
                          {b.paymentStatus !== 'paid' && (
                            <Link to={`/payment/${b.id}`} className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}>
                              <i className="fas fa-credit-card"></i> Pay Now
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Announcement Board Notice feed */}
          <section className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
              <i className="fas fa-bullhorn" style={{ color: '#ff8c00' }}></i>
              Notice Board
            </h3>
            <NoticeBoard />
          </section>
        </div>
      </main>
    </div>
  );
}
