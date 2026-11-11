// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../web3Config';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('verification');
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  
  // FIX: We are now using this 'loading' state in the render below
  const [loading, setLoading] = useState(false);

  // --- 1. Load Pending NGOs ---
  const loadPendingNGOs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "PendingNGO"));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingNGOs(list);
    } catch (err) {
      console.error("Failed to load NGOs:", err);
    }
    setLoading(false);
  };

  // --- 2. Load ALL Campaigns ---
  const loadAllCampaigns = async () => {
    // We don't set global loading here to avoid flickering if switching tabs fast, 
    // but you can add a separate loading state for campaigns if desired.
    try {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        const campaigns = await contract.getAllCampaigns();
        const formatted = campaigns.map(c => ({
            id: Number(c.id),
            owner: c.owner,
            title: c.title,
            goal: ethers.formatEther(c.goal),
            raised: ethers.formatEther(c.amountRaised),
            active: c.active
        }));
        setAllCampaigns(formatted);
    } catch (err) {
        console.error("Failed to load campaigns:", err);
    }
  };

  useEffect(() => {
    if (userData?.role !== 'admin') {
       // navigate('/login'); 
    }
    loadPendingNGOs();
    loadAllCampaigns();
  }, [userData]); // Removed navigate dependency to prevent loops

  // --- ACTIONS ---
  const handleApprove = async (ngoId, name) => {
    if (window.confirm(`Verify ${name}?`)) {
        try {
            await updateDoc(doc(db, "users", ngoId), { role: "NGO", isVerified: true });
            loadPendingNGOs();
        } catch (err) { alert("Failed."); }
    }
  };

  const handleReject = async (ngoId) => {
     if (window.confirm("Reject application?")) {
         try {
             await updateDoc(doc(db, "users", ngoId), { role: "Rejected" });
             loadPendingNGOs();
         } catch (err) { console.error(err); }
     }
  };

  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch (e) {} };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-right">
            <span>Welcome, Administrator</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="stats-panel">
         <div className="stat-box">
             <h3>Pending Approvals</h3>
             <p>{pendingNGOs.length}</p>
         </div>
         <div className="stat-box">
             <h3>Total Campaigns</h3>
             <p>{allCampaigns.length}</p>
         </div>
      </div>

      <div className="admin-tabs">
          <button 
            className={activeTab === 'verification' ? 'active-tab' : ''} 
            onClick={() => setActiveTab('verification')}
          >
            NGO Verification
          </button>
          <button 
            className={activeTab === 'campaigns' ? 'active-tab' : ''} 
            onClick={() => setActiveTab('campaigns')}
          >
            Monitor Campaigns
          </button>
      </div>

      {/* --- TAB CONTENT: VERIFICATION --- */}
      {activeTab === 'verification' && (
        <div className="verification-section">
            <h2>NGO Verification Queue</h2>
            
            {/* FIX: NOW USING THE LOADING STATE HERE */}
            {loading ? (
                <p>Loading pending requests...</p>
            ) : (
                <>
                    {pendingNGOs.length === 0 ? (
                        <div className="empty-state">No pending requests.</div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Wallet</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {pendingNGOs.map(ngo => (
                                    <tr key={ngo.id}>
                                        <td>{ngo.fullName}</td>
                                        <td>{ngo.email}</td>
                                        <td><span className="wallet-font">{ngo.walletAddress || "N/A"}</span></td>
                                        <td>
                                            <button className="btn-approve" onClick={() => handleApprove(ngo.id, ngo.fullName)}>Approve</button>
                                            <button className="btn-reject" onClick={() => handleReject(ngo.id)}>Reject</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
      )}

      {/* --- TAB CONTENT: CAMPAIGNS --- */}
      {activeTab === 'campaigns' && (
        <div className="verification-section">
            <h2>Platform Campaigns (Blockchain Data)</h2>
            {allCampaigns.length === 0 ? <div className="empty-state">No campaigns created yet.</div> : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Owner (NGO)</th>
                            <th>Raised / Goal</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allCampaigns.map(camp => (
                            <tr key={camp.id}>
                                <td>{camp.id}</td>
                                <td>{camp.title}</td>
                                <td><span className="wallet-font">{camp.owner.substring(0,8)}...</span></td>
                                <td>{camp.raised} / {camp.goal} ETH</td>
                                <td>
                                    <span style={{
                                        color: camp.active ? 'green' : 'red', 
                                        fontWeight: 'bold'
                                    }}>
                                        {camp.active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;