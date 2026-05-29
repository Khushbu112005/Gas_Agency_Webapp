import React, { useEffect, useState } from 'react';
import { db } from '../Firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      try {
        const q = query(collection(db, 'notices'), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        setNotices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching notices:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, []);

  const formatNoticeDate = (dateVal) => {
    if (!dateVal) return 'Unknown Date';
    // If it's a Firestore Timestamp
    if (typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    // If it's a JS Date or string
    try {
      return new Date(dateVal).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="loader-container" style={{ padding: '1rem 0' }}>
        <div className="loader-spinner" style={{ width: '32px', height: '32px' }}></div>
        <p className="loader-text" style={{ fontSize: '0.85rem' }}>Loading notice feed...</p>
      </div>
    );
  }

  return (
    <div>
      {notices.length === 0 ? (
        <p className="text-muted small text-center" style={{ padding: '1.5rem 0' }}>
          <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
          No notices posted yet by admin.
        </p>
      ) : (
        <ul className="notice-list">
          {notices.map(n => (
            <li key={n.id} className="notice-item">
              <div className="notice-title">
                <i className="fas fa-bullhorn"></i>
                {n.title}
              </div>
              <div className="notice-content">{n.content}</div>
              <div className="notice-meta">
                <span>
                  <i className="far fa-calendar-alt" style={{ marginRight: '5px' }}></i>
                  {formatNoticeDate(n.date)}
                </span>
                <span>
                  <i className="far fa-user" style={{ marginRight: '5px' }}></i>
                  Administrator
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
