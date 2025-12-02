// src/pages/NGODashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../web3Config';
import { db } from '../firebase'; // Import Firestore
// Import all necessary Firestore functions
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'; 
import './NGODashboard.css'; 

const NGODashboard = () => {
  // --- FIX: Added currentUser, which is needed to load applications ---
  const { userData, logout, currentUser } = useAuth(); 
  const navigate = useNavigate();

  // --- NEW STATE ---
  const [view, setView] = useState('dashboard'); // 'dashboard', 'create', 'applications', 'distribute', 'history'

  // Web3 State
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [donationsToMe, setDonationsToMe] = useState([]);
  const [stats, setStats] = useState({ totalReceived: 0, totalDistributed: 0 });
  const [error, setError] = useState('');

  // Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // --- HANDLE LOGOUT ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // --- 1. CONNECT TO METAMASK & SAVE ADDRESS ---
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not found. Please install it.");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAccount = await signer.getAddress();
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);

      setAccount(userAccount);
      setContract(contractInstance);
      setError('');

      // --- Save wallet address to Firebase profile ---
      if (userData?.uid) {
        const userRef = doc(db, 'users', userData.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && !userSnap.data().walletAddress) {
          await updateDoc(userRef, {
            walletAddress: userAccount.toLowerCase() // Save address as lowercase
          });
          console.log("Wallet address saved to Firebase profile.");
        }
      }
      // --- End of save wallet ---

    } catch (err) {
      console.error("Connection failed:", err);
      setError(err.message);
    }
  };

  // --- 2. LOAD ALL NGO-SPECIFIC BLOCKCHAIN DATA ---
  const loadBlockchainData = async () => {
    // This function will only run if the role is 'NGO'
    if (contract && account && userData?.role === 'NGO') {
      try {
        // --- A. Load All Campaigns ---
        const allCampaigns = await contract.getAllCampaigns();
        
        // Filter to find campaigns owned by this NGO
        const ngoCampaigns = allCampaigns
          .filter(c => c.owner.toLowerCase() === account.toLowerCase())
          .map(c => ({
            id: Number(c.id),
            title: c.title,
            description: c.description,
            goal: ethers.formatEther(c.goal),
            amountRaised: ethers.formatEther(c.amountRaised),
            amountDistributed: ethers.formatEther(c.amountDistributed),
            active: c.active
          }));
        setMyCampaigns(ngoCampaigns);

        // --- B. Load All Donations for This NGO's Campaigns ---
        let allDonations = [];
        let totalRaised = 0;
        let totalDist = 0;

        for (const campaign of ngoCampaigns) {
          const campaignDonations = await contract.getDonationsByCampaign(campaign.id);
          campaignDonations.forEach(d => {
            const amount = parseFloat(ethers.formatEther(d.amount));
            allDonations.push({
              id: Number(d.id), 
              campaignId: Number(d.campaignId), 
              donor: d.donor,
              amount: amount,
              distributed: d.distributed,
              beneficiary: d.beneficiary
            });
            
            // Calculate stats
            totalRaised += amount;
            if (d.distributed) {
              totalDist += amount;
            }
          });
        }
        setDonationsToMe(allDonations);
        setStats({ totalReceived: totalRaised.toFixed(4), totalDistributed: totalDist.toFixed(4) });

      } catch (err) {
        console.error("Failed to load blockchain data:", err);
        setError("Failed to load blockchain data. Is the contract address correct?");
      }
    }
  };

  // --- 3. ADDED: loadApplications FUNCTION ---
  const loadApplications = async () => {
    if (!currentUser) return;
    setLoadingApps(true);
    try {
      const q = query(collection(db, "applications"), where("ngoId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(apps);
    } catch (err) {
      console.error("Failed to load applications:", err);
      setError("Failed to load applications.");
    }
    setLoadingApps(false);
  };

  // Load data as soon as the contract is connected
  useEffect(() => {
    if (userData?.role === 'NGO') {
      if (contract && account) {
        loadBlockchainData();
      }
      loadApplications();
    }
  }, [contract, account, userData]); // Added userData as a dependency

  // --- 4. HANDLE CREATE CAMPAIGN ---
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    const description = e.target.description.value;
    const goal = e.target.goal.value;

    if (!title || !description || !goal || parseFloat(goal) <= 0) {
      alert("Please fill in all fields with a valid goal.");
      return;
    }

    try {
      const goalInWei = ethers.parseEther(goal);
      const tx = await contract.createCampaign(title, description, goalInWei);
      
      alert("Creating your campaign... Please wait for the transaction to confirm.");
      await tx.wait(); 
      
      alert("Campaign created successfully!");
      loadBlockchainData(); 
      e.target.reset(); 

    } catch (err) {
      console.error("Campaign creation failed:", err);
      alert("Campaign creation failed. See console for details.");
    }
  };

  // --- 5. CORRECTED: handleDistribute FUNCTION ---
  // This now matches the logic from the 'distribute' tab's dropdown
  const handleDistribute = async (donationId, application) => {
    
    if (!application || !application.beneficiaryWallet) {
      alert("Invalid application selected.");
      return;
    }
    if (!ethers.isAddress(application.beneficiaryWallet)) {
      alert("This beneficiary has an invalid wallet address.");
      return;
    }
    
    if (window.confirm(`Distribute donation ID ${donationId} to ${application.beneficiaryName}?`)) {
      try {
        // Use the beneficiary wallet from the application object
        const tx = await contract.distribute(donationId, application.beneficiaryWallet);
        
        alert("Processing distribution... Please wait for the transaction.");
        await tx.wait();
        
        alert("Donation distributed successfully!");
        
        // Update the application status in Firebase
        const appRef = doc(db, "applications", application.id);
        await updateDoc(appRef, {
          status: "Funded",
          donationId: donationId // Link the donation to the app
        });

        loadBlockchainData(); // Refresh blockchain data
        loadApplications(); // Refresh applications list

      } catch (err) {
        console.error("Distribution failed:", err);
        alert("Distribution failed. See console.");
        loadBlockchainData(); // Reload data even on failure
      }
    }
  };

  // --- 6. ADDED: handleApprove FUNCTION ---
  const handleApprove = async (appId) => {
    try {
      const appRef = doc(db, "applications", appId);
      await updateDoc(appRef, { status: "Approved" });
      alert("Application Approved!");
      loadApplications(); // Refresh list
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  // --- 7. ADDED: handleReject FUNCTION ---
  const handleReject = async (appId) => {
    try {
      const appRef = doc(db, "applications", appId);
      await updateDoc(appRef, { status: "Rejected" });
      alert("Application Rejected.");
      loadApplications(); // Refresh list
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  // --- 9. RENDER THE CURRENT VIEW ---
  // This function acts as your sub-page router
  const _renderCurrentView = () => {
    // Filter lists for convenience
    const pendingApps = applications.filter(app => app.status === 'Pending');
    const approvedApps = applications.filter(app => app.status === 'Approved');
    const completedApps = applications.filter(app => app.status === 'Funded' || app.status === 'Rejected');
    const pendingDonations = donationsToMe.filter(d => !d.distributed);
    const completedDonations = donationsToMe.filter(d => d.distributed);

    switch (view) {
      case 'create':
        return (
          <div className="campaign-card">
            <h2>Create New Campaign</h2>
            <form className="create-campaign-form" onSubmit={handleCreateCampaign}>
              <input name="title" type="text" placeholder="Campaign Title" required />
              <input name="description" type="text" placeholder="Campaign Description" required />
              <input name="goal" type="text" placeholder="Goal (in ETH)" required />
              <button type="submit">Create Campaign</button>
            </form>
          </div>
        );

      case 'applications':
        return (
          <div className="history-table">
            <h2>Pending Beneficiary Applications</h2>
            {loadingApps ? <p>Loading...</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Beneficiary</th>
                    <th>Request</th>
                    <th>Story</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApps.length === 0 ? (
                    <tr><td colSpan="4">No pending applications.</td></tr>
                  ) : (
                    pendingApps.map(app => (
                      <tr key={app.id}>
                        <td>{app.beneficiaryName}</td>
                        <td>{app.title}</td>
                        <td>{app.story}</td>
                        <td>
                          <button onClick={() => handleApprove(app.id)} className="distribute-btn">Approve</button>
                          <button onClick={() => handleReject(app.id)} className="logout-btn" style={{marginTop: '0.5rem'}}>Reject</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        );

      case 'distribute':
        return (
          <div className="history-table">
            <h2>Donations to Distribute</h2>
            {pendingDonations.length === 0 ? (
              <p>No pending donations to distribute.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>From Donor</th>
                    <th>Distribute to (Approved Beneficiary)</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDonations.map(donation => (
                    <tr key={donation.id}>
                      <td>{donation.amount} ETH</td>
                      <td>{donation.donor.substring(0, 10)}...</td>
                      <td>
                        {approvedApps.length === 0 ? (
                          <p>No approved beneficiaries to send to.</p>
                        ) : (
                          <select 
                            onChange={(e) => {
                              if (e.target.value === "") return; // Do nothing on default option
                              const app = approvedApps.find(a => a.id === e.target.value);
                              if (app) handleDistribute(donation.id, app);
                            }}
                            defaultValue=""
                          >
                            <option value="">-- Select Beneficiary --</option>
                            {approvedApps.map(app => (
                              <option key={app.id} value={app.id}>
                                {app.beneficiaryName} ({app.title})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      
      case 'history':
        return (
          <>
            <div className="history-table">
              <h2>My Distribution History</h2>
              {completedDonations.length === 0 ? (
                <p>You have not distributed any donations yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>From Donor</th>
                      <th>To Beneficiary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedDonations.map(donation => (
                      <tr key={donation.id}>
                        <td>{donation.amount} ETH</td>
                        <td>{donation.donor.substring(0, 10)}...</td>
                        <td>{donation.beneficiary.substring(0, 10)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="history-table">
              <h2>Completed Applications</h2>
              {completedApps.length === 0 ? (
                <p>No other application history.</p>
              ) : (
                <table>
                  <thead>
                    <tr><th>Beneficiary</th><th>Request</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {completedApps.map(app => (
                      <tr key={app.id}>
                        <td>{app.beneficiaryName}</td>
                        <td>{app.title}</td>
                        <td>
                          <span className={app.status === 'Funded' ? 'status-distributed' : 'status-pending'}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        );

      case 'dashboard':
      default:
        return (
          <>
            <div className="stats-container">
              <div className="stat-card">
                <h2>Total Received</h2>
                <p>{stats.totalReceived} ETH</p>
              </div>
              <div className="stat-card">
                <h2>Total Distributed</h2>
                <p>{stats.totalDistributed} ETH</p>
              </div>
            </div>

            <div className="history-table">
              <h2>My Created Campaigns</h2>
              {myCampaigns.length === 0 ? (
                <p>You have not created any campaigns yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Amount Raised</th>
                      <th>Amount Distributed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myCampaigns.map(campaign => (
                      <tr key={campaign.id}>
                        <td>{campaign.id}</td>
                        <td>{campaign.title}</td>
                        <td>
                          <span className={campaign.active ? 'status-distributed' : 'status-pending'}>
                            {campaign.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{campaign.amountRaised} ETH</td>
                        <td>{campaign.amountDistributed} ETH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        );
    }
  };


  // --- 10. RENDER THE COMPONENT ---

  // --- Check if NGO is still pending approval ---
  if (userData?.role === 'PendingNGO') {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>NGO Dashboard ({userData?.fullName})</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <div className="connect-wallet-container"> 
          <h2>Your Account is Pending Approval</h2>
          <p>An admin will review your application shortly. Once approved, you will be able to connect your wallet and create campaigns.</p>
        </div>
      </div>
    );
  }
  // --- End of pending check ---


  // This is the full dashboard for an approved 'NGO'
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>NGO Dashboard ({userData?.fullName || 'NGO Admin'})</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* --- Show Connect Button if not connected --- */}
      {!account ? (
        <div className="connect-wallet-container">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your MetaMask wallet to manage your campaigns.</p>
          <button onClick={connectWallet} className="donate-now-btn">Connect MetaMask</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        /* --- Show Dashboard if connected --- */
        <>
          <p className="account-info">Connected Wallet: {account.substring(0, 6)}...{account.substring(38)}</p>

          {/* --- NEW: Sub-Navigation Tabs --- */}
          <nav className="ngo-nav">
            <button 
              className={view === 'dashboard' ? 'active' : ''} 
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={view === 'create' ? 'active' : ''} 
              onClick={() => setView('create')}
            >
              Create Campaign
            </button>
            <button 
              className={view === 'applications' ? 'active' : ''} 
              onClick={() => setView('applications')}
            >
              Approve Applications
            </button>
           <button 
              className={view === 'distribute' ? 'active' : ''} 
              onClick={() => setView('distribute')}
            >
              Distribute Funds
            </button>
            <button 
              className={view === 'history' ? 'active' : ''} 
              onClick={() => setView('history')}
            >
              History
            </button>
          </nav>

          {/* --- Render the selected view --- */}
          <div className="ngo-view-container">
            {_renderCurrentView()}
          </div>
        </>
      )}
    </div>
  );
};

export default NGODashboard;