// src/pages/NGODashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../web3Config'; 
import './NGODashboard.css'; 

const NGODashboard = () => {
  const { userData, logout } = useAuth(); // Use userData from your context
  const navigate = useNavigate();

  // Web3 State
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [donationsToMe, setDonationsToMe] = useState([]);
  const [stats, setStats] = useState({ totalReceived: 0, totalDistributed: 0 });
  const [error, setError] = useState('');

  // --- HANDLE LOGOUT ---
  // Moved this function up so it can be used by the "Pending" screen
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // --- 1. CONNECT TO METAMASK ---
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
        setMyCampaigns(ngoCampaigns); // <-- Save your campaigns to state

        // --- B. Load All Donations for This NGO's Campaigns ---
        let allDonations = [];
        let totalRaised = 0;
        let totalDist = 0;

        for (const campaign of ngoCampaigns) {
          const campaignDonations = await contract.getDonationsByCampaign(campaign.id);
          campaignDonations.forEach(d => {
            const amount = parseFloat(ethers.formatEther(d.amount));
            allDonations.push({
              id: Number(d.id), // <-- CORRECTED
              campaignId: Number(d.campaignId), // <-- CORRECTED
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
        setDonationsToMe(allDonations); // <-- Save all donations to state
        setStats({ totalReceived: totalRaised.toFixed(4), totalDistributed: totalDist.toFixed(4) });

      } catch (err) {
        console.error("Failed to load blockchain data:", err);
        setError("Failed to load blockchain data. Is the contract address correct?");
      }
    }
  };

  // Load data as soon as the contract is connected
  useEffect(() => {
    loadBlockchainData();
  }, [contract, account, userData]); // Added userData as a dependency

  // --- 3. HANDLE CREATE CAMPAIGN ---
  const handleCreateCampaign = async (e) => {
    // ... (this function is unchanged) ...
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
      await tx.wait(); // Wait for the transaction to be mined
      
      alert("Campaign created successfully!");
      loadBlockchainData(); // Refresh all data on the page
      e.target.reset(); // Clear the form

    } catch (err) {
      console.error("Campaign creation failed:", err);
      alert("Campaign creation failed. See console for details.");
    }
  };

  // --- 4. HANDLE DISTRIBUTE (NGO WITHDRAW) ---
  const handleDistribute = async (e, donationId) => {
    // ... (this function is unchanged) ...
    e.preventDefault();
    const beneficiary = e.target.beneficiary.value;
    if (!ethers.isAddress(beneficiary)) {
      alert("Please enter a valid Ethereum beneficiary address.");
      return;
    }

    try {
      const tx = await contract.distribute(donationId, beneficiary);
      
      alert("Processing distribution... Please wait for the transaction.");
      await tx.wait();
      
      alert("Donation distributed successfully!");
      loadBlockchainData(); // Refresh data

    } catch (err) {
      console.error("Distribution failed:", err);
      alert("Distribution failed. See console for details.");
    }
  };


  // --- 6. RENDER THE COMPONENT ---

  // --- THIS IS THE NEW ROLE CHECK ---
  if (userData?.role === 'PendingNGO') {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>NGO Dashboard ({userData?.fullName})</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <div className="connect-wallet-container"> {/* Re-using this card style */}
          <h2>Your Account is Pending Approval</h2>
          <p>An admin will review your application shortly. Once approved, you will be able to connect your wallet and create campaigns.</p>
        </div>
      </div>
    );
  }
  // --- END OF NEW ROLE CHECK ---


  // This is the original dashboard. It will only show if role is 'NGO'
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

          <div className="stats-container">
            {/* ... (stats cards) ... */}
            <div className="stat-card">
              <h2>Total Received</h2>
              <p>{stats.totalReceived} ETH</p>
            </div>
            <div className="stat-card">
              <h2>Total Distributed</h2>
              <p>{stats.totalDistributed} ETH</p>
            </div>
          </div>

          <div className="campaign-card">
            {/* ... (create campaign form) ... */}
            <h2>Create New Campaign</h2>
            <form className="create-campaign-form" onSubmit={handleCreateCampaign}>
              <input name="title" type="text" placeholder="Campaign Title" required />
              <input name="description" type="text" placeholder="Campaign Description" required />
              <input name="goal" type="text" placeholder="Goal (in ETH)" required />
              <button type="submit">Create Campaign</button>
            </form>
          </div>
          
          <div className="history-table">
            {/* ... (my created campaigns) ... */}
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

          <div className="history-table">
            {/* ... (donations to distribute) ... */}
            <h2>Donations to Distribute</h2>
            {donationsToMe.filter(d => !d.distributed).length === 0 ? (
              <p>No pending donations to distribute.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>From Donor</th>
                    <th>Distribute to Beneficiary</th>
                  </tr>
                </thead>
                <tbody>
                  {donationsToMe.filter(d => !d.distributed).map(donation => (
                    <tr key={donation.id}>
                      <td>{donation.amount} ETH</td>
                      <td>{donation.donor.substring(0, 30)}...</td>
                      <td>
                        <form className="distribute-form-inline" onSubmit={(e) => handleDistribute(e, donation.id)}>
                          <input 
                            name="beneficiary" 
                            type="text" 
                            placeholder="0xBeneficiaryAddress..." 
                            required 
                          />
                          <button type="submit" className="distribute-btn">
                            Distribute
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="history-table">
            {/* ... (my distribution history) ... */}
            <h2>My Distribution History</h2>
            {donationsToMe.filter(d => d.distributed).length === 0 ? (
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
                  {donationsToMe.filter(d => d.distributed).map(donation => (
                    <tr key={donation.id}>
                      <td>{donation.amount} ETH</td>
                      <td>{donation.donor.substring(0, 30)}...</td>
                      <td>{donation.beneficiary.substring(0, 30)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </>
      )}
    </div>
  );
};

export default NGODashboard;