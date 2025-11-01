// src/context/AuthContext.js
import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Your firebase.js file
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Create the context
const AuthContext = React.createContext();

// Custom hook to use the context
export function useAuth() {
  return useContext(AuthContext);
}

// The provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);

  // Sign up function
  async function signup(email, password, fullName, role) {
    console.log("--- A. Inside AuthContext signup function ---"); 
    try {
      // --- THIS IS THE UPDATED LOGIC ---
      let finalRole = role.toLowerCase();
      if (finalRole === 'ngo') {
        finalRole = 'PendingNGO'; // Set new NGOs to 'PendingNGO'
        console.log("Role set to PendingNGO");
      }
      // --- END OF UPDATE ---

      console.log("--- B. Calling createUserWithEmailAndPassword... ---"); 
      const authUser = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log("--- C. Auth user created. Calling setDoc to save to Firestore... ---"); 
      const userRef = doc(db, 'users', authUser.user.uid);
      await setDoc(userRef, {
        uid: authUser.user.uid,
        email: email,
        fullName: fullName,
        role: finalRole // Save the finalRole
      });

      console.log("--- D. Firestore setDoc successful. ---"); 
      return authUser;
    } catch (err) {
      console.error("--- E. ERROR INSIDE AUTHCONTEXT: ---", err); 
      throw err; // Re-throw the error so SignupPage can catch it
    }
  }

  // Login function
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout function
  function logout() {
    setUserData(null); 
    return signOut(auth);
  }

  // This effect runs once on mount to check if a user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // If user is logged in, fetch their Firestore data (role, name)
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          // Handle case where auth user exists but no firestore doc
          console.log("No user data found in Firestore!");
        }
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup on unmount
  }, []);

  const value = {
    currentUser,
    userData, // e.g., { fullName: 'John Doe', role: 'Donor' }
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}