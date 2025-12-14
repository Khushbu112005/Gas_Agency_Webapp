import React, { useEffect, useState } from 'react';
import { db } from '../Firebase';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';

export default function AdminDashboard(){
  const [bookings, setBookings] = useState([]);
  const [title,setTitle] = useState('');
  const [content,setContent] = useState('');

  useEffect(()=>{
    async function load(){
      const snap = await getDocs(collection(db,'bookings'));
      setBookings(snap.docs.map(d=>({id:d.id,...d.data()})));
    }
    load();
  },[]);

  const handleApprove = async (id) => {
    await updateDoc(doc(db,'bookings',id), { status: 'approved' });
    setBookings(b => b.map(x => x.id===id ? {...x, status:'approved'} : x));
  };
  const handleReject = async (id) => {
    await updateDoc(doc(db,'bookings',id), { status: 'rejected' });
    setBookings(b => b.map(x => x.id===id ? {...x, status:'rejected'} : x));
  };

  const postNotice = async (e) => {
    e.preventDefault();
    await addDoc(collection(db,'notices'), { title, content, date: new Date() });
    alert('Notice posted');
    setTitle(''); setContent('');
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <div className="card" style={{marginBottom:12}}>
        <h3>Bookings</h3>
        <table className="table">
          <thead><tr><th>User</th><th>Address</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {bookings.map(b=>(
              <tr key={b.id}>
                <td className="small">{b.userId}</td>
                <td>{b.address}</td>
                <td>{b.cylinderType}</td>
                <td>{b.status || 'pending'}</td>
                <td>
                  <button onClick={()=>handleApprove(b.id)} style={{marginRight:8}}>Approve</button>
                  <button onClick={()=>handleReject(b.id)} className="secondary">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Post Notice</h3>
        <form onSubmit={postNotice}>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea value={content} onChange={e=>setContent(e.target.value)} required />
          </div>
          <button type="submit">Post</button>
        </form>
      </div>
    </div>
  );
}
