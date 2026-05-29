import React, { useState } from 'react';
import { db, auth } from '../Firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../components/AuthContext';

export default function BookingForm() {
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [cylinderType, setCylinderType] = useState('Domestic'); // Domestic or Commercial
  const [date, setDate] = useState('');
  const [extra, setExtra] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please login first.');
      navigate('/');
      return;
    }
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        userId: auth.currentUser.uid,
        address,
        cylinderType,
        date,
        extra,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
      });
      alert('Booking submitted successfully! Proceeding to pay.');
      navigate(`/payment/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to place booking: ' + err.message);
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
          <header className="text-center mb-3">
            <h2 style={{ margin: 0, fontSize: '1.75rem', background: 'linear-gradient(135deg, #fff 30%, #ff4b2b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <i className="fas fa-gas-pump" style={{ marginRight: '8px', WebkitTextFillColor: 'initial', color: '#ff4b2b' }}></i>
              Book Gas Cylinder
            </h2>
            <p className="text-muted" style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem' }}>Fill out the details to place a delivery request.</p>
          </header>

          <form onSubmit={handleSubmit}>
            {/* Cylinder Type Selection Grid */}
            <div className="form-group">
              <label className="form-label">Cylinder Category</label>
              <div className="cylinder-grid">
                <div 
                  className={`cylinder-option ${cylinderType === 'Domestic' ? 'active' : ''}`}
                  onClick={() => setCylinderType('Domestic')}
                >
                  <i className="fas fa-house-chimney"></i>
                  <span>Domestic</span>
                  <small className="text-muted">For Household (₹900)</small>
                </div>

                <div 
                  className={`cylinder-option ${cylinderType === 'Commercial' ? 'active' : ''}`}
                  onClick={() => setCylinderType('Commercial')}
                >
                  <i className="fas fa-building-user"></i>
                  <span>Commercial</span>
                  <small className="text-muted">For Industrial (₹1600)</small>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-map-location-dot" style={{ position: 'absolute', left: '14px', top: '15px', color: 'rgba(255,255,255,0.4)' }}></i>
                <textarea
                  placeholder="Enter full physical address for delivery..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows="3"
                  style={{ paddingLeft: '2.5rem', resize: 'none' }}
                />
              </div>
            </div>

            {/* Delivery Date */}
            <div className="form-group">
              <label className="form-label">Preferred Delivery Date</label>
              <div style={{ position: 'relative' }}>
                <i className="far fa-calendar-plus" style={{ position: 'absolute', left: '14px', top: '15px', color: 'rgba(255,255,255,0.4)', zIndex: 10 }}></i>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={today}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Extra Cylinder Option */}
            <div className="form-group" style={{ margin: '1rem 0' }}>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={extra}
                  onChange={(e) => setExtra(e.target.checked)}
                />
                <div className="checkbox-custom"></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Request Extra Cylinder (+1 Cylinder)</span>
                  <small className="text-muted" style={{ fontWeight: 'normal' }}>Doubles delivery quantity for double cost.</small>
                </div>
              </label>
            </div>

            {/* Price Preview Card */}
            <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
              <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                <span className="text-muted">Estimated Total:</span>
                <span className="text-bright" style={{ fontWeight: '700', fontSize: '1.25rem' }}>
                  ₹{(cylinderType === 'Commercial' ? 1600 : 900) * (extra ? 2 : 1)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-gap">
              <Link to="/client-dashboard" className="btn btn-secondary" style={{ flex: 1 }}>
                <i className="fas fa-arrow-left"></i> Back
              </Link>
              <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Book Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
