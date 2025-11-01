// src/pages/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase'; // Import Firestore
import { doc, getDoc } from 'firebase/firestore';
import './AuthPage.css'; // We can re-use the same styles

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from our context

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      
      // 1. Securely log the user in using Firebase
      const authUser = await login(email, password);
      
      // 2. Check their role in the database
      const userRef = doc(db, 'users', authUser.user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists() && docSnap.data().role === 'Admin') {
        // 3. Success: User is an admin, send to the admin dashboard
        navigate('/admin');
      } else {
        // 4. Failure: User is not an admin, or has no role
        setError('This is not a valid Admin account.');
        // (We log them out here for extra security, optional)
        // await logout(); 
      }
    } catch (err) {
      setError('Failed to log in. Check your email and password.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Admin Login</h1>
        <p className="auth-subtitle">Please enter your admin credentials.</p>
        
        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email Address" 
            name="email"
            id="admin-email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            name="password"
            id="admin-password"
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        {/* --- NO SIGNUP LINK --- */}

      </div>
    </div>
  );
}

export default AdminLoginPage;