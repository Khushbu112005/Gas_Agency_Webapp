import React, { useState } from 'react';
import { db, auth } from '../Firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function BookingForm() {
  const [address, setAddress] = useState('');
  const [cylinderType, setCylinderType] = useState('Domestic');
  const [date, setDate] = useState('');
  const [extra, setExtra] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please login');
      return;
    }
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
      alert('Booking submitted. Proceed to payment.');
      navigate(`/payment/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Booking Form</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Delivery Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          style={styles.input}
        />

        <select
          value={cylinderType}
          onChange={(e) => setCylinderType(e.target.value)}
          style={styles.input}
        >
          <option value="Domestic">Domestic</option>
          <option value="Commercial">Commercial</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={styles.input}
        />

        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={extra}
            onChange={(e) => setExtra(e.target.checked)}
          />
          Extra Cylinder
        </label>

        <button type="submit" style={styles.button}>
          Book Now
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '10px',
    margin: '8px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  checkbox: {
    margin: '10px 0',
  },
  button: {
    padding: '10px',
    background: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};
