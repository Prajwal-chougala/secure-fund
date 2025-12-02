// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- IMPORT YOUR PAGES ---
// Make sure these paths match your folder structure
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import BeneficiaryDashboard from './pages/BeneficiaryDashboard';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';


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
            {/* --- Public Routes --- */}
            <Route path="/" element={<LandingPageLayout />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />

            {/* --- Protected Routes --- */}
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
              path="/beneficiary-dashboard"
              element={
                <ProtectedRoute>
                  <BeneficiaryDashboard />
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