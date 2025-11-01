// src/pages/SignupPage.js
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import './AuthPage.css';

function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signup } = useAuth(); 

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- THIS IS THE UPDATED LOGIC ---
  // Read role from URL and default to 'donor' (lowercase)
  const role = (searchParams.get('role') || 'donor').toLowerCase();
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("--- 1. Handle submit started ---"); // <-- CHECKPOINT 1

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      
      console.log("--- 2. Calling signup function from AuthContext... ---"); // <-- CHECKPOINT 2
      
      // We are now passing a lowercase role to the signup function
      // AuthContext will handle turning 'ngo' into 'PendingNGO'
      await signup(email, password, fullName, role);
      
      console.log("--- 3. Signup finished, navigating... ---"); // <-- CHECKPOINT 3
      
      if (role === 'ngo') {
        // We still send them to the NGO dashboard,
        // where they will see the "Pending" message.
        navigate('/ngo-dashboard');
      } else {
        navigate('/donor-dashboard');
      }
    } catch (err) {
      console.error("--- 4. CATCH BLOCK ERROR IN SIGNUPPAGE: ---", err); // <-- CHECKPOINT 4
      setError('Failed to create an account. ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create {roleName} Account</h1>
        {/* Add a message for pending NGOs */}
        {role === 'ngo' && <p className="auth-subtitle" style={{color: 'var(--primary-blue)', fontWeight: '500'}}>Note: NGO accounts require admin approval before you can create campaigns.</p>}
        
        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Full Name" 
            name="fullName"
            id="fullName"
            required 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            name="email"
            id="email"
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            name="password"
            id="password"
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            name="confirmPassword"
            id="confirmPassword"
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch-link">
          Already have an account? <Link to={`/login?role=${role}`}>Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;