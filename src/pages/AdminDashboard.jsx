// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../web3Config';
import { db } from '../firebase'; // <-- Import Firestore
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'; // <-- Import Firestore functions
import './NGODashboard.css'; 

const AdminDashboard = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  // Web3 State (for campaign management)
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [web3Error, setWeb3Error] = useState('');
  const [isContractAdmin, setIsContractAdmin] = useState(false);

  // Firebase State (for user management)
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [approvedNGOs, setApprovedNGOs] = useState([]); // <-- NEW STATE
  const [loadingNGOs, setLoadingNGOs] = useState(true);
  const [firebaseError, setFirebaseError] = useState('');

  // --- 1. FIREBASE DATA (Load immediately on page load) ---
  const loadFirebaseUsers = async () => {
    setLoadingNGOs(true);
    setFirebaseError('');
    try {
      const usersRef = collection(db, "users");

      // Query 1: Get Pending NGOs
      const pendingQuery = query(usersRef, where("role", "==", "PendingNGO"));
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingList = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingNGOs(pendingList);

      // Query 2: Get Approved NGOs
      const approvedQuery = query(usersRef, where("role", "==", "NGO"));
      const approvedSnapshot = await getDocs(approvedQuery);
      const approvedList = approvedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApprovedNGOs(approvedList);

    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setFirebaseError("Failed to fetch user lists. Check console.");
    }
    setLoadingNGOs(false);
  };

  // --- This useEffect now runs on its own, without waiting for MetaMask ---
  useEffect(() => {
    // We only load data if we know the user is an Admin
    if (userData?.role === 'Admin') {
      loadFirebaseUsers();
    }
  }, [userData]); // Re-run if userData changes

  // --- 2. HANDLE APPROVE NGO (Firebase Action) ---
  const handleApproveNGO = async (userId) => {
    if (window.confirm("Are you sure you want to approve this NGO?")) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          role: "NGO" // Change role from 'PendingNGO' to 'NGO'
        });
        alert("NGO approved successfully!");
        // Refresh both user lists
        loadFirebaseUsers(); 
      } catch (err) {
        console.error("Failed to approve NGO:", err);
        alert("Failed to approve NGO. See console.");
      }
    }
  };


  // --- 3. BLOCKCHAIN FUNCTIONS (Wallet Connection, Campaign Loading, etc.) ---
  // --- All functions below this line are unchanged ---

  // --- CONNECT TO METAMASK ---
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not found. Please install it.");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAccount = await signer.getAddress();
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);

      setAccount(userAccount);
      setContract(contractInstance);
      setWeb3Error('');
    } catch (err)
      {
      console.error("Connection failed:", err);
      setWeb3Error(err.message);
    }
  };

  // --- LOAD BLOCKCHAIN DATA (Campaigns) ---
  const loadBlockchainData = async () => {
    if (contract && account) {
      try {
        // Security Check: Is the connected wallet the *contract* admin?
        const contractAdminAddress = await contract.i_admin();
        if (contractAdminAddress.toLowerCase() !== account.toLowerCase()) {
          setWeb3Error("Warning: This wallet is not the contract admin. You can view campaigns but cannot deactivate them.");
          setIsContractAdmin(false);
        } else {
          setIsContractAdmin(true);
        }

        // Fetch all campaigns
        const campaigns = await contract.getAllCampaigns();
        const formattedCampaigns = campaigns.map(c => ({
          id: Number(c.id),
          title: c.title,
          owner: c.owner,
          amountRaised: ethers.formatEther(c.amountRaised),
          active: c.active
        }));
        setAllCampaigns(formattedCampaigns);

      } catch (err) {
        console.error("Failed to load blockchain data:", err);
        setWeb3Error("Failed to load blockchain data.");
      }
    }
  };

  // --- This useEffect only handles blockchain data ---
  useEffect(() => {
    if (account && contract) {
      loadBlockchainData();
    }
  }, [contract, account]);

  // --- HANDLE DEACTIVATE CAMPAIGN (Blockchain Action) ---
  const handleDeactivate = async (campaignId) => {
    if (!isContractAdmin) {
      alert("Error: Your connected wallet is not the contract admin.");
      return;
    }

    if (window.confirm("Are you sure you want to deactivate this campaign? This action cannot be undone.")) {
      try {
        const tx = await contract.deactivateCampaign(campaignId);
        alert("Deactivating campaign... Please wait for the transaction.");
        await tx.wait();
        alert("Campaign deactivated successfully.");
        loadBlockchainData(); // Refresh the list
      } catch (err) {
        console.error("Deactivation failed:", err);
        alert("Deactivation failed. See console for details.");
      }
    }
  };

  // --- HANDLE LOGOUT ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // --- RENDER THE COMPONENT ---
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Site Admin Dashboard ({userData?.fullName})</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* --- SECTION 1: NGO APPROVALS (Firebase - No Wallet Needed) --- */}
      <div className="history-table">
        <h2>Pending NGO Approvals</h2>
        {firebaseError && <p className="error-message">{firebaseError}</p>}
        {loadingNGOs ? (
          <p>Loading...</p>
        ) : pendingNGOs.length === 0 ? (
          <p>No NGOs pending approval.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingNGOs.map(ngo => (
                <tr key={ngo.id}>
                  <td>{ngo.fullName}</td>
                  <td>{ngo.email}</td>
                  <td>
                    <button 
                      onClick={() => handleApproveNGO(ngo.id)}
                      className="distribute-btn" // Re-using the green button style
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- NEW SECTION: APPROVED NGOs --- */}
      <div className="history-table">
        <h2>Approved NGOs</h2>
        {firebaseError && <p className="error-message">{firebaseError}</p>}
        {loadingNGOs ? (
          <p>Loading...</p>
        ) : approvedNGOs.length === 0 ? (
          <p>No NGOs have been approved yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {approvedNGOs.map(ngo => (
                <tr key={ngo.id}>
                  <td>{ngo.fullName}</td>
                  <td>{ngo.email}</td>
                  <td>{ngo.id.substring(0, 15)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- SECTION 3: CAMPAIGN MANAGEMENT (Blockchain - Wallet Needed) --- */}
      <div className="history-table">
        <h2>All Campaigns on Platform (Blockchain)</h2>
        {!account ? (
          <div className="connect-wallet-container" style={{padding: 0, boxShadow: 'none'}}>
            <p>Connect your MetaMask wallet to manage campaigns.</p>
            <button onClick={connectWallet} className="donate-now-btn">Connect MetaMask</button>
            {web3Error && <p className="error-message">{web3Error}</p>}
          </div>
        ) : (
          <>
            <p className="account-info">Connected Wallet: {account.substring(0, 6)}...{account.substring(38)}</p>
            {web3Error && <p className="error-message">{web3Error}</p>}
            
            {allCampaigns.length === 0 ? (
              <p>No campaigns found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Raised</th>
                    <th>NGO Owner</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allCampaigns.map(campaign => (
                    <tr key={campaign.id}>
                      <td>{campaign.id}</td>
                      <td>{campaign.title}</td>
                      <td>
                        <span className={campaign.active ? 'status-distributed' : 'status-pending'}>
                          {campaign.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{campaign.amountRaised} ETH</td>
                      <td>{campaign.owner.substring(0, 10)}...</td>
                      <td>
                        {campaign.active && (
                          <button 
                            onClick={() => handleDeactivate(campaign.id)} 
                            className="distribute-btn"
                            disabled={!isContractAdmin}
                            style={{backgroundColor: 'var(--danger-red)'}} // Use red for deactivate
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;