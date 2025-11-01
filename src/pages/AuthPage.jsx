import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

import { auth, db } from '../firebase'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('Donor');
  const [error, setError] = useState('');
  
  // --- 1. ADD A LOADING STATE ---
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true); // <-- Start loading

    const fullName = e.target.fullName?.value; 
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          
          // Successful login is handled by redirecting
          if (userData.role === 'Donor') {
            navigate('/donor-dashboard');
          } else if (userData.role === 'NGO') {
            navigate('/ngo-dashboard');
          } else if (userData.role === 'Admin') {
            navigate('/admin-panel');
          } else {
            navigate('/'); 
          }
        } else {
           console.error("No user data found in Firestore!");
           setError("Login successful, but no user role found.");
           setLoading(false); // Stop loading on error
        }
      } else {
        // --- SIGNUP LOGIC ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          fullName: fullName,
          email: email,
          role: role,
          createdAt: new Date()
        });
        
        console.log("User created and data stored in Firestore!");
        navigate('/donor-dashboard'); // Redirect after signup
      }
    } catch (err) {
      // --- 2. CATCH SPECIFIC LOGIN ERRORS ---
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message); // Show other errors
      }
      console.error("Authentication error:", err.code, err.message);
      setLoading(false); // Stop loading on any error
    }
  };
  
  const handleMetaMaskConnect = () => {
    console.log('Connecting with MetaMask...');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        <div className="role-selector">
          <button className={role === 'Donor' ? 'active' : ''} onClick={() => setRole('Donor')}>Donor</button>
          <button className={role === 'NGO' ? 'active' : ''} onClick={() => setRole('NGO')}>NGO</button>
          <button className={role === 'Admin' ? 'active' : ''} onClick={() => setRole('Admin')}>Admin</button>
        </div>
        
        <form onSubmit={handleAuth}>
          {!isLogin && <input name="fullName" type="text" placeholder="Full Name" required />}
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          
          {/* --- 3. UPDATE THE BUTTON --- */}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Working...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        {error && <p style={{color: 'red', marginTop: '1rem'}}>{error}</p>}
        
        <div className="separator">OR</div>
        <button onClick={handleMetaMaskConnect} className="metamask-btn">Connect with MetaMask</button>
        
        <p className="toggle-auth" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;