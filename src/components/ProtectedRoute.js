// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // If user is not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  return children; // If logged in, show the component
};

export default ProtectedRoute;