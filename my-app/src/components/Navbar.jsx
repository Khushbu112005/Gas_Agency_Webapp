import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase";

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">Gas Agency System</div><h2 className="logo">
  <i className="fas fa-fire"></i> Gas Agency System
</h2>

      <ul className="nav-links">
        {role === "client" && (
          <>
            <li><Link to="/client-dashboard" className="nav-link">Dashboard</Link></li>
            <li><Link to="/book" className="nav-link">Book Cylinder</Link></li>
          </>
        )}
        {role === "admin" && (
          <li><Link to="/admin-dashboard" className="nav-link">Admin Panel</Link></li>
        )}
        <li>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}
