import React, { useEffect, useState } from 'react';
import { db } from '../Firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    async function fetchNotices() {
      const q = query(collection(db, 'notices'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setNotices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchNotices();
  }, []);

  return (
    <div>
      {notices.length === 0 ? (
        <p className="small">No notices available.</p>
      ) : (
        <ul>
          {notices.map(n => (
            <li key={n.id}>
              <strong>{n.title}</strong> — {n.message}
              <br />
              <small>{n.date}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
