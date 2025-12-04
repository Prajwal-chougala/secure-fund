// src/pages/NGODashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../web3Config';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'; 
import './NGODashboard.css'; 

const NGODashboard = () => {
  const { userData, logout, currentUser } = useAuth(); 
  const navigate = useNavigate();

  // --- VIEW STATE ---
  const [view, setView] = useState('dashboard');

  // --- WEB3 STATE ---
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [myCampaigns, setMyCampaigns] = useState([]); // FIXED: Now used in 'dashboard' view
  const [donationsToMe, setDonationsToMe] = useState([]);
  const [stats, setStats] = useState({ totalReceived: 0, totalDistributed: 0 });
  const [error, setError] = useState('');

  // --- APPLICATIONS STATE ---
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // --- DISTRIBUTION STATE ---
  const [distributeAmount, setDistributeAmount] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");

  // --- 1. HANDLE LOGOUT ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // --- 2. CONNECT WALLET ---
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not found.");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAccount = await signer.getAddress();
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);

      setAccount(userAccount);
      setContract(contractInstance);
      setError('');

      if (userData?.uid) {
        const userRef = doc(db, 'users', userData.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && !userSnap.data().walletAddress) {
          await updateDoc(userRef, { walletAddress: userAccount.toLowerCase() });
        }
      }
    } catch (err) {
      console.error("Connection failed:", err);
      setError(err.message);
    }
  };

  // --- 3. LOAD BLOCKCHAIN DATA ---
  const loadBlockchainData = useCallback(async () => {
    if (contract && account && userData?.role === 'NGO') {
      try {
        // A. Load Campaigns
        const allCampaigns = await contract.getAllCampaigns();
        const ngoCampaigns = allCampaigns
          .filter(c => c.owner.toLowerCase() === account.toLowerCase())
          .map(c => ({
            id: Number(c.id),
            title: c.title,
            goal: ethers.formatEther(c.goal),
            amountRaised: ethers.formatEther(c.amountRaised),
            active: c.active
          }));
        setMyCampaigns(ngoCampaigns);

        // B. Load Donations via Events
        const donateFilter = contract.filters.DonationReceived();
        const donateEvents = await contract.queryFilter(donateFilter);
        const myCampaignIds = ngoCampaigns.map(c => c.id);
        
        let relevantDonations = [];
        let totalRaised = 0;
        let totalDist = 0;

        for (let event of donateEvents) {
            const cId = Number(event.args.campaignId);
            if (myCampaignIds.includes(cId)) {
                const dStruct = await contract.donations(event.args.donationId);
                const amount = parseFloat(ethers.formatEther(dStruct.amount));
                const used = parseFloat(ethers.formatEther(dStruct.amountUsed));

                relevantDonations.push({
                    id: Number(dStruct.id),
                    campaignId: cId,
                    donor: dStruct.donor,
                    amount: amount,
                    amountUsed: used,
                    fullyDistributed: used >= amount
                });

                totalRaised += amount;
                totalDist += used;
            }
        }

        setDonationsToMe(relevantDonations);
        setStats({ totalReceived: totalRaised.toFixed(4), totalDistributed: totalDist.toFixed(4) });

      } catch (err) {
        console.error("Failed to load blockchain data:", err);
        setError("Failed to load data.");
      }
    }
  }, [contract, account, userData]);

  // --- 4. LOAD APPLICATIONS (FIXED: Wrapped in useCallback) ---
  const loadApplications = useCallback(async () => {
    if (!currentUser) return;
    setLoadingApps(true);
    try {
      const q = query(collection(db, "applications"), where("ngoId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    } catch (err) {
      console.error("Failed to load applications:", err);
    }
    setLoadingApps(false);
  }, [currentUser]);

  useEffect(() => {
    if (userData?.role === 'NGO') {
      if (contract && account) loadBlockchainData();
      loadApplications();
    }
  }, [contract, account, userData, loadBlockchainData, loadApplications]); // FIXED Dependency


  // --- 5. CREATE CAMPAIGN ---
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    const description = e.target.description.value;
    const goal = e.target.goal.value;

    if (!title || !goal) return alert("Fill all fields");

    try {
      const goalInWei = ethers.parseEther(goal);
      const tx = await contract.createCampaign(title, description, goalInWei);
      alert("Creating campaign...");
      await tx.wait(); 
      alert("Campaign created!");
      loadBlockchainData(); 
      e.target.reset();
    } catch (err) {
      console.error(err);
      alert("Creation failed.");
    }
  };

  // --- 6. DISTRIBUTE FUNDS ---
  const handleDistribute = async (donationId, campaignId) => {
    const application = applications.find(app => app.id === selectedAppId);
    
    if (!application || !application.beneficiaryWallet) {
      alert("Please select a valid beneficiary application.");
      return;
    }
    if (!distributeAmount || parseFloat(distributeAmount) <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    
    if (window.confirm(`Send ${distributeAmount} ETH to ${application.beneficiaryName}?`)) {
      try {
        const amountWei = ethers.parseEther(distributeAmount);

        const tx = await contract.distributeFunds(
            campaignId, 
            donationId, 
            application.beneficiaryWallet, 
            amountWei
        );
        
        alert("Processing distribution...");
        await tx.wait();
        
        alert("Funds Distributed Successfully!");
        
        const appRef = doc(db, "applications", application.id);
        await updateDoc(appRef, { status: "Funded", donationId: donationId });

        setDistributeAmount("");
        setSelectedAppId("");
        loadBlockchainData();
        loadApplications();

      } catch (err) {
        console.error("Distribution failed:", err);
        alert("Distribution failed. " + (err.reason || "Check console."));
      }
    }
  };

  // --- 7. APPROVE/REJECT ---
  const handleApprove = async (appId) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status: "Approved" });
      loadApplications();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (appId) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status: "Rejected" });
      loadApplications();
    } catch (err) { console.error(err); }
  };

  // --- 8. RENDER VIEW ---
  const _renderCurrentView = () => {
    const pendingApps = applications.filter(app => app.status === 'Pending');
    const approvedApps = applications.filter(app => app.status === 'Approved');
    
    // FIXED: Now we use 'completedApps' in the history tab
    const completedApps = applications.filter(app => ['Funded', 'Rejected'].includes(app.status));
    
    const availableDonations = donationsToMe.filter(d => !d.fullyDistributed);
    const historyDonations = donationsToMe.filter(d => d.amountUsed > 0);

    switch (view) {
      case 'create':
        return (
          <div className="campaign-card">
            <h2>Create New Campaign</h2>
            <form className="create-campaign-form" onSubmit={handleCreateCampaign}>
              <input name="title" type="text" placeholder="Campaign Title" required />
              <input name="description" type="text" placeholder="Description" required />
              <input name="goal" type="number" step="0.01" placeholder="Goal (ETH)" required />
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
                  <tr><th>Beneficiary</th><th>Request</th><th>Story</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {pendingApps.length === 0 ? <tr><td colSpan="4">No pending applications.</td></tr> : 
                    pendingApps.map(app => (
                      <tr key={app.id}>
                        <td>{app.beneficiaryName}</td>
                        <td>{app.title}</td>
                        <td>{app.story}</td>
                        <td>
                          <button onClick={() => handleApprove(app.id)} className="approve-btn">Approve</button>
                          <button onClick={() => handleReject(app.id)} className="reject-btn">Reject</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>
        );

      case 'distribute':
        return (
          <div className="history-table">
            <h2>Distribute Funds (Partial Supported)</h2>
            {availableDonations.length === 0 ? <p>No funds available to distribute.</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Donation ID</th>
                    <th>Available / Total</th>
                    <th>Distribute To (Approved App)</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableDonations.map(donation => (
                    <tr key={donation.id}>
                      <td>#{donation.id}</td>
                      <td>{(donation.amount - donation.amountUsed).toFixed(4)} / {donation.amount} ETH</td>
                      <td>
                        <select 
                            value={selectedAppId} 
                            onChange={(e) => setSelectedAppId(e.target.value)}
                            className="table-input"
                        >
                            <option value="">-- Select Beneficiary --</option>
                            {approvedApps.map(app => (
                                <option key={app.id} value={app.id}>
                                    {app.beneficiaryName} ({app.title})
                                </option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <input 
                            type="number" 
                            placeholder="0.00" 
                            className="table-input"
                            style={{width: '80px'}}
                            value={distributeAmount}
                            onChange={(e) => setDistributeAmount(e.target.value)}
                        />
                      </td>
                      <td>
                        <button 
                            className="distribute-btn"
                            onClick={() => handleDistribute(donation.id, donation.campaignId)}
                        >
                            Send
                        </button>
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
              <h2>Distribution History</h2>
              {historyDonations.length === 0 ? <p>No blockchain history yet.</p> : (
                <table>
                  <thead><tr><th>ID</th><th>Total Received</th><th>Used so far</th></tr></thead>
                  <tbody>
                    {historyDonations.map(d => (
                      <tr key={d.id}>
                        <td>#{d.id}</td>
                        <td>{d.amount} ETH</td>
                        <td>{d.amountUsed} ETH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* FIXED: Using 'completedApps' here */}
            <div className="history-table" style={{marginTop: '2rem'}}>
              <h2>Application History</h2>
              {completedApps.length === 0 ? <p>No application history.</p> : (
                 <table>
                   <thead><tr><th>Applicant</th><th>Status</th></tr></thead>
                   <tbody>
                     {completedApps.map(app => (
                       <tr key={app.id}>
                         <td>{app.beneficiaryName}</td>
                         <td>
                           <span className={app.status === 'Funded' ? 'status-success' : 'status-fail'}>
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
              <div className="stat-card"><h2>Total Received</h2><p>{stats.totalReceived} ETH</p></div>
              <div className="stat-card"><h2>Total Distributed</h2><p>{stats.totalDistributed} ETH</p></div>
            </div>

            {/* FIXED: Using 'myCampaigns' here */}
            <div className="history-table">
              <h2>My Active Campaigns</h2>
              {myCampaigns.length === 0 ? <p>No campaigns found.</p> : (
                <table>
                  <thead><tr><th>ID</th><th>Title</th><th>Goal</th><th>Raised</th></tr></thead>
                  <tbody>
                    {myCampaigns.map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.title}</td>
                        <td>{c.goal} ETH</td>
                        <td>{c.amountRaised} ETH</td>
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

  // --- 9. MAIN RENDER ---
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>NGO Dashboard ({userData?.fullName})</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {!account ? (
        <div className="connect-wallet-container">
          <h2>Connect Wallet</h2>
          <button onClick={connectWallet} className="donate-now-btn">Connect MetaMask</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <>
          <p className="account-info">Wallet: {account}</p>
          <nav className="ngo-nav">
            {['dashboard', 'create', 'applications', 'distribute', 'history'].map(tab => (
                <button key={tab} className={view === tab ? 'active' : ''} onClick={() => setView(tab)}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
          </nav>
          <div className="ngo-view-container">{_renderCurrentView()}</div>
        </>
      )}
    </div>
  );
};

export default NGODashboard;