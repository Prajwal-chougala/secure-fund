// src/pages/DonorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../web3Config'; // <-- IMPORTING OUR CONFIG
import './DonorDashboard.css';

const DonorDashboard = () => {
  const { userData, logout } = useAuth(); // Use userData from your context
  const navigate = useNavigate();

  // Web3 State
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonated: 0, campaignsSupported: 0 });
  const [error, setError] = useState('');

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

  // --- 2. LOAD ALL BLOCKCHAIN DATA ---
  const loadBlockchainData = async () => {
    if (contract) {
      try {
        // --- A. Load All Campaigns ---
        const allCampaigns = await contract.getAllCampaigns();
        const formattedCampaigns = allCampaigns
          .filter(c => c.active) // Only show active campaigns
          .map(c => ({
            id: Number(c.id),
            title: c.title,
            description: c.description,
            goal: ethers.formatEther(c.goal),
            amountRaised: ethers.formatEther(c.amountRaised)
          }));
        setCampaigns(formattedCampaigns);

        // --- B. Load This User's Donation History ---
        const donorHistory = await contract.getMyDonations();
        const formattedHistory = donorHistory.map(d => ({
          id: Number(d.id),
          campaignId: Number(d.campaignId),
          amount: ethers.formatEther(d.amount),
          distributed: d.distributed,
          beneficiary: d.beneficiary
        }));
        setMyDonations(formattedHistory);
        
        // --- C. Calculate Stats ---
        let total = 0;
        formattedHistory.forEach(d => {
          total += parseFloat(d.amount);
        });
        const supported = new Set(formattedHistory.map(d => d.campaignId)).size;
        setStats({ totalDonated: total.toFixed(4), campaignsSupported: supported });

      } catch (err) {
        console.error("Failed to load blockchain data:", err);
        setError("Failed to load blockchain data. Is the contract address correct?");
      }
    }
  };

  // Load data as soon as the contract is connected
  useEffect(() => {
    loadBlockchainData();
  }, [contract]);

  // --- 3. HANDLE DONATION ---
  const handleDonate = async (e, campaignId) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.donate(campaignId, { value: amountInWei });
      
      alert("Processing your donation... Please wait for the transaction to confirm.");
      await tx.wait(); // Wait for the transaction to be mined
      
      alert("Donation successful! Thank you for your contribution.");
      loadBlockchainData(); // Refresh all data on the page
      e.target.reset(); // Clear the input field

    } catch (err) {
      console.error("Donation failed:", err);
      alert("Donation failed. See console for details (you might have rejected the transaction).");
    }
  };

  // --- 4. HANDLE LOGOUT (from your original file) ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // --- 5. RENDER THE COMPONENT ---
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userData?.fullName || 'Donor'}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* --- Show Connect Button if not connected --- */}
      {!account ? (
        <div className="connect-wallet-container">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your MetaMask wallet to view campaigns and your donation history.</p>
          <button onClick={connectWallet} className="donate-now-btn">Connect MetaMask</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        /* --- Show Dashboard if connected --- */
        <>
          <p className="account-info">Connected Wallet: {account.substring(0, 6)}...{account.substring(38)}</p>

          <div className="stats-container">
            <div className="stat-card">
              <h2>Total Donated</h2>
              <p>{stats.totalDonated} ETH</p>
            </div>
            <div className="stat-card">
              <h2>Campaigns Supported</h2>
              <p>{stats.campaignsSupported}</p>
            </div>
          </div>

          {/* --- Section for All Campaigns --- */}
          <div className="campaigns-list">
            <h2>Active Campaigns</h2>
            {/* ... */}
            {campaigns.map(campaign => (
              <div key={campaign.id} className="campaign-card">
                <h3>{campaign.title}</h3>
                <p>{campaign.description}</p>
                <p className="goal-status">
                  Raised: {campaign.amountRaised} / {campaign.goal} ETH
                </p>
                
                {/* --- THIS IS THE DONATE OPTION --- */}
                <form className="donate-form" onSubmit={(e) => handleDonate(e, campaign.id)}>
                  <input name="amount" type="text" placeholder="Amount in ETH" required />
                  <button type="submit">Donate Now</button>
                </form>

              </div>
            ))}
          </div>

          {/* --- Section for Donation History --- */}
          <div className="history-table">
            <h2>Your Donation History</h2>
            {myDonations.length === 0 ? (
              <p>No donations made yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Beneficiary</th>
                  </tr>
                </thead>
                <tbody>
                  {myDonations.map(donation => (
                    <tr key={donation.id}>
                      <td>{donation.amount} ETH</td>
                      <td>
                        <span className={donation.distributed ? 'status-distributed' : 'status-pending'}>
                          {donation.distributed ? "Distributed" : "Pending"}
                        </span>
                      </td>
                      <td>
                        {donation.distributed ? 
                          // You can make this a link to Etherscan/SepoliaScan
                          `${donation.beneficiary.substring(0, 10)}...` : 
                          "N/A"}
                      </td>
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

export default DonorDashboard;