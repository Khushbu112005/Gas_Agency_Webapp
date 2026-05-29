import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar-pane">
      <Link to={role === "admin" ? "/admin-dashboard" : "/client-dashboard"} className="navbar-brand">
        <i className="fas fa-fire"></i>
        <span>Gas Agency System</span>
      </Link>

      <ul className="navbar-links">
        {role === "client" && (
          <>
            <li>
              <Link 
                to="/client-dashboard" 
                className={`navbar-link ${location.pathname === '/client-dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/book" 
                className={`navbar-link ${location.pathname === '/book' ? 'active' : ''}`}
              >
                Book Cylinder
              </Link>
            </li>
          </>
        )}
        {role === "admin" && (
          <li>
            <Link 
              to="/admin-dashboard" 
              className={`navbar-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}
            >
              Admin Panel
            </Link>
          </li>
        )}
      </ul>

      <div className="navbar-user-info">
        <span className={`navbar-user-tag ${role === 'admin' ? 'admin' : ''}`}>
          <i className={role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user'}></i>
          {user.email}
        </span>
        <button className="btn btn-danger" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </nav>
  );
}
