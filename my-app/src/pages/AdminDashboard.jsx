import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../components/AuthContext';

export default function AdminDashboard() {
  const { loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [noticePosting, setNoticePosting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        const token = localStorage.getItem('token');

        // Fetch users map
        const usersRes = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (usersRes.ok) {
          const uMap = await usersRes.json();
          setUsersMap(uMap);
        }

        // Fetch bookings
        const bookingsRes = await fetch('/api/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          // Sort bookings (newest first)
          data.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
            return dateB - dateA;
          });
          setBookings(data);
        }
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to approve booking');
      }
      setBookings(b => b.map(x => x.id === id ? { ...x, status: 'approved' } : x));
    } catch (err) {
      alert("Failed to approve booking: " + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to reject booking');
      }
      setBookings(b => b.map(x => x.id === id ? { ...x, status: 'rejected' } : x));
    } catch (err) {
      alert("Failed to reject booking: " + err.message);
    }
  };

  const postNotice = async (e) => {
    e.preventDefault();
    setNoticePosting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to post notice');
      }
      alert('Notice broadcasted to all users successfully!');
      setTitle(''); 
      setContent('');
    } catch (err) {
      alert('Failed to post notice: ' + err.message);
    } finally {
      setNoticePosting(false);
    }
  };

  // Helper to calculate price
  const calculatePrice = (b) => {
    const basePrice = b.cylinderType === 'Commercial' ? 1600 : 900;
    return basePrice * (b.extra ? 2 : 1);
  };

  // Compute stat metrics
  const pendingApprovals = bookings.filter(b => (b.status || 'pending') === 'pending').length;
  const approvedOrders = bookings.filter(b => b.status === 'approved').length;
  const totalRevenue = bookings.reduce((acc, curr) => {
    if (curr.paymentStatus === 'paid') {
      return acc + calculatePrice(curr);
    }
    return acc;
  }, 0);
  const totalCustomers = Object.keys(usersMap).length || [...new Set(bookings.map(b => b.userId))].length;

  // Filter & Search Bookings
  const filteredBookings = bookings.filter(b => {
    const userProfile = usersMap[b.userId] || {};
    const userName = (userProfile.name || '').toLowerCase();
    const userEmail = (userProfile.email || '').toLowerCase();
    const address = (b.address || '').toLowerCase();
    const type = (b.cylinderType || '').toLowerCase();
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = userName.includes(query) || 
                          userEmail.includes(query) || 
                          address.includes(query) || 
                          type.includes(query) ||
                          b.userId.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'pending' && (b.status || 'pending') === 'pending') ||
                          (statusFilter === 'approved' && b.status === 'approved') ||
                          (statusFilter === 'rejected' && b.status === 'rejected');

    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="loader-container" style={{ minHeight: '80vh' }}>
        <div className="loader-spinner"></div>
        <p className="loader-text">Verifying administrative access...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <header style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: 0 }}>
            <i className="fas fa-user-shield" style={{ color: '#ff4b2b' }}></i>
            Admin Control Center
          </h2>
          <p className="text-muted" style={{ margin: '0.4rem 0 0 0' }}>Manage client bookings, dispatch status updates, and post announcements.</p>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon warning">
              <i className="fas fa-hourglass-half"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending Approvals</span>
              <span className="stat-value">{pendingApprovals}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Approved Orders</span>
              <span className="stat-value">{approvedOrders}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon primary">
              <i className="fas fa-coins"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">₹{totalRevenue}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon secondary">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{totalCustomers}</span>
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
          {/* Bookings Management Panel */}
          <section className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
              <i className="fas fa-tasks" style={{ color: '#00b4db' }}></i>
              Bookings Registry
            </h3>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
              <div className="table-search-box" style={{ flex: 1, margin: 0, minWidth: '200px' }}>
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search by customer name, email, or address..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loadingData ? (
              <div className="loader-container" style={{ padding: '3rem 0' }}>
                <div className="loader-spinner" style={{ width: '40px', height: '40px' }}></div>
                <p className="loader-text" style={{ fontSize: '0.9rem' }}>Loading registry documents...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '3rem 1.5rem' }}>
                <i className="fas fa-folder-open" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                <p style={{ margin: 0 }}>No bookings match the filters.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Delivery Info</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(b => {
                      const userProfile = usersMap[b.userId] || {};
                      return (
                        <tr key={b.id}>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-bright)' }}>{userProfile.name || 'Anonymous Client'}</div>
                            <div className="text-muted small">{userProfile.email || b.userId}</div>
                          </td>
                          <td>
                            <div className="small" style={{ fontWeight: '500' }}>{b.date}</div>
                            <div className="text-muted small" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.address}>
                              {b.address}
                            </div>
                            <div className="text-muted small" style={{ fontStyle: 'italic' }}>
                              {b.cylinderType} {b.extra ? '(+1 Extra)' : ''}
                            </div>
                          </td>
                          <td style={{ fontWeight: '600' }}>₹{calculatePrice(b)}</td>
                          <td>
                            <span className={`badge ${
                              (b.status || 'pending') === 'approved' ? 'badge-approved' : 
                              (b.status || 'pending') === 'rejected' ? 'badge-rejected' : 'badge-pending'
                            }`}>
                              {b.status || 'pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                              {b.paymentStatus || 'unpaid'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              {(b.status || 'pending') !== 'approved' && (
                                <button 
                                  onClick={() => handleApprove(b.id)} 
                                  className="btn btn-success"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                  title="Approve Booking"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                              {(b.status || 'pending') !== 'rejected' && (
                                <button 
                                  onClick={() => handleReject(b.id)} 
                                  className="btn btn-danger"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                  title="Reject Booking"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Broadcast Announcement Board Form */}
          <section className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
              <i className="fas fa-bullhorn" style={{ color: '#ff8c00' }}></i>
              Publish Announcement
            </h3>
            
            <form onSubmit={postNotice}>
              <div className="form-group">
                <label className="form-label">Notice Title</label>
                <input 
                  type="text"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Price Revision or Holiday Schedule"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notice Content</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Enter notice details for all clients to read..."
                  rows="4"
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={noticePosting}>
                {noticePosting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Broadcasting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Post Announcement
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
