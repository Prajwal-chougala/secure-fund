// src/pages/BeneficiaryDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ethers } from 'ethers'; // For wallet validation
import './NGODashboard.css'; // Re-use the same CSS

const BeneficiaryDashboard = () => {
  const { userData, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [myApplications, setMyApplications] = useState([]);
  const [approvedNGOs, setApprovedNGOs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for the new application form
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [wallet, setWallet] = useState('');
  const [selectedNgo, setSelectedNgo] = useState('');

  // 1. Load data on mount
  useEffect(() => {
    if (currentUser) {
      loadMyApplications();
      loadApprovedNGOs();
      checkAndSaveWallet(); // Check if user has a wallet saved
    }
  }, [currentUser]);

  // 2. Check and save wallet address
  const checkAndSaveWallet = async () => {
    if (!userData.walletAddress) {
      try {
        if (!window.ethereum) throw new Error("MetaMask not found.");
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request connection
        const signer = await provider.getSigner();
        const userAccount = await signer.getAddress();
        
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          walletAddress: userAccount.toLowerCase()
        });
        setWallet(userAccount.toLowerCase());
        alert("Your wallet has been connected and saved to your profile.");
      } catch (err) {
        setError("You must connect a MetaMask wallet to create applications. Please refresh and try again. " + err.message);
      }
    } else {
      setWallet(userData.walletAddress);
    }
  };

  // 3. Load all NGOs to populate the dropdown
  const loadApprovedNGOs = async () => {
    const q = query(collection(db, "users"), where("role", "==", "NGO"));
    const querySnapshot = await getDocs(q);
    const ngos = querySnapshot.docs.map(doc => ({
      id: doc.id, // This is the NGO's UID
      ...doc.data()
    }));
    setApprovedNGOs(ngos);
  };

  // 4. Load all applications for this user
  const loadMyApplications = async () => {
    setLoading(true);
    const q = query(collection(db, "applications"), where("beneficiaryId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    const apps = querySnapshot.docs.map(doc => doc.data());
    setMyApplications(apps);
    setLoading(false);
  };

  // 5. Handle form submission
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedNgo || !title || !story) {
      return setError("Please fill out all fields.");
    }
    if (!ethers.isAddress(wallet)) {
      return setError("Your wallet address is not valid. Please reconnect.");
    }

    setLoading(true);
    setError('');

    try {
      const selectedNgoData = approvedNGOs.find(n => n.id === selectedNgo);
      
      await addDoc(collection(db, "applications"), {
        beneficiaryId: currentUser.uid,
        beneficiaryName: userData.fullName,
        beneficiaryWallet: wallet,
        ngoId: selectedNgoData.id,
        ngoName: selectedNgoData.fullName,
        title: title,
        story: story,
        status: "Pending"
      });

      alert("Application submitted successfully!");
      setTitle('');
      setStory('');
      setSelectedNgo('');
      loadMyApplications(); // Refresh the list
    } catch (err) {
      console.error("Failed to submit application:", err);
      setError("Failed to submit application.");
    }
    setLoading(false);
  };

  // 6. Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Beneficiary Dashboard ({userData?.fullName})</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="campaign-card">
        <h2>Create a New Fund Request</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="create-campaign-form" onSubmit={handleSubmitApplication}>
          <input 
            type="text" 
            placeholder="Application Title (e.g., 'School Books')" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
          <input 
            type="text" 
            placeholder="Your Story / Request Details" 
            value={story}
            onChange={(e) => setStory(e.target.value)}
            required 
          />
          <select 
            value={selectedNgo} 
            onChange={(e) => setSelectedNgo(e.target.value)}
            required
          >
            <option value="">-- Select an NGO to apply to --</option>
            {approvedNGOs.map(ngo => (
              <option key={ngo.id} value={ngo.id}>{ngo.fullName}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Your Wallet Address" 
            value={wallet}
            readOnly
            disabled
          />
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>

      <div className="history-table">
        <h2>My Applications</h2>
        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr>
                <th>NGO</th>
                <th>Request Title</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.length === 0 ? (
                <tr><td colSpan="3">You have not submitted any applications.</td></tr>
              ) : (
                myApplications.map((app, index) => (
                  <tr key={index}>
                    <td>{app.ngoName}</td>
                    <td>{app.title}</td>
                    <td>
                      <span className={app.status === 'Approved' ? 'status-distributed' : 'status-pending'}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BeneficiaryDashboard;