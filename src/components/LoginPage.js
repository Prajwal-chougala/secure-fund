// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase'; // Import Firestore
import { doc, getDoc } from 'firebase/firestore';
import './AuthPage.css';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read the role from the URL, default to lowercase 'donor'
  const role = (searchParams.get('role') || 'donor').toLowerCase();
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);

  const handleSubmit = async (e) => {
   e.preventDefault();
    console.log(`--- 1. Attempting login for role: ${role} ---`); 

    try {
      setError('');
      setLoading(true);
      
      const authUser = await login(email, password);
      console.log("--- 2. Firebase Auth login successful. ---"); 
      
      const userRef = doc(db, 'users', authUser.user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userRole = userData.role.toLowerCase();
        console.log(`--- 3. Found user data. Role is: ${userRole} ---`);
        
        // --- THIS IS THE UPDATED ROLE CHECK ---
        
        // Check if the user's role matches the login page they are on
        if (userRole !== role) {
          console.error("--- 4. ROLE MISMATCH! ---"); 
          setError(`You are trying to log in as a ${role}, but this is a ${userRole} account.`);
          setLoading(false);
          return; // Stop execution
        }

        // Redirect to the correct dashboard based on their role
        if (userRole === 'ngo') {
          navigate('/ngo-dashboard');
        } else if (userRole === 'beneficiary') {
          navigate('/beneficiary-dashboard');
        } else if (userRole === 'pendingngo') {
          navigate('/ngo-dashboard'); // Send to NGO dash to see "Pending"
        } else {
          navigate('/donor-dashboard');
        }

      } else {
        console.error("--- 4. NO USER DATA FOUND IN FIRESTORE ---");
        setError('User data not found.');
      }

    } catch (err) {
      console.error("--- 4. CATCH BLOCK ERROR: ---", err);
      setError('Failed to log in. Check your email and password.');
    }
    setLoading(false);
  };

 return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{roleName} Login</h1>
        <p className="auth-subtitle">Welcome back! Please enter your details.</p>
        
        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email Address" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className="auth-switch-link">
          Don't have an account? <Link to={`/signup?role=${role}`}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;