/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setRole(data.user.role);
          } else {
            // Token is invalid/expired
            localStorage.removeItem('token');
            setUser(null);
            setRole(null);
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          // If server is unreachable, we don't immediately clear token to prevent logging out
        }
      }
      setLoading(false);
    }
    verifySession();
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setRole(userData.role);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
