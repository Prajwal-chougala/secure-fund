// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import all pages and components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import './App.css';

// --- IMPORT THE NEW COMPONENTS ---
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import AdminLoginPage from './pages/AdminLoginPage';

function LandingPageLayout() {
  return (
    <>
      <Hero />
      <Features />
      <Contact />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPageLayout />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            {/* --- NEW ADMIN LOGIN ROUTE --- */}
            {/* This is the special, no-signup login page */}
            <Route path="/admin-login" element={<AdminLoginPage />} />
            
            <Route
              path="/donor-dashboard"
              element={
                <ProtectedRoute>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo-dashboard"
              element={
                <ProtectedRoute>
                  <NGODashboard />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/admin" // This is the dashboard itself
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;