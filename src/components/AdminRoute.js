// src/components/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();

  if (!currentUser) {
    // 1. If user is not logged in, send them to the login page.
    return <Navigate to="/login" />;
  }

  // 2. If user data is still loading, wait. (Optional, but good practice)
  if (!userData) {
    return <div>Loading user data...</div>; 
  }

  // 3. If user is logged in, but their role is NOT 'Admin', send them away.
  if (userData.role !== 'Admin') {
    console.warn("ACCESS DENIED: User is not an admin.");
    // Send them to their default dashboard (e.g., donor)
    return <Navigate to="/donor-dashboard" />; 
  }

  // 4. If user is logged in AND their role is 'Admin', show the page.
  return children;
};

export default AdminRoute;