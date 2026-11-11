// src/pages/DonorDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../web3Config';
import { db } from '../firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import './DonorDashboard.css';

const DonorDashboard = () => {
  const { userData, logout } = useAuth(); 
  const navigate = useNavigate();

  // --- Web3 State ---
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonated: 0, campaignsSupported: 0 });
  const [error, setError] = useState('');
  
  // --- UI State ---
  const [balance, setBalance] = useState("0"); 
  const [ngoNameMap, setNgoNameMap] = useState(new Map());
  const [explorerUrl, setExplorerUrl] = useState(""); 
  const [loadingCampaignId, setLoadingCampaignId] = useState(null);

  // --- 1. Load NGO Names ---
  const loadNgoNames = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "NGO"));
      const querySnapshot = await getDocs(q);
      const nameMap = new Map();
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.walletAddress && data.fullName) {
          nameMap.set(data.walletAddress.toLowerCase(), data.fullName);
        }
      });
      setNgoNameMap(nameMap);
    } catch (err) {
      console.error("Failed to load NGO names:", err);
    }
  };

  useEffect(() => { loadNgoNames(); }, []);

  // --- 2. Connect Wallet ---
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

      const balanceWei = await provider.getBalance(userAccount);
      setBalance(parseFloat(ethers.formatEther(balanceWei)).toFixed(4)); 

      const network = await provider.getNetwork();
      if (network.chainId === 11155111n) { 
        setExplorerUrl("https://sepolia.etherscan.io/"); 
      } else {
        setExplorerUrl(""); 
      }
    } catch (err) {
      console.error("Connection failed:", err);
      setError(err.message);
    }
  };

  // --- 3. Load Blockchain Data ---
  const loadBlockchainData = useCallback(async (currentNgoMap) => { 
    if (contract && account) { 
      try {
        // A. Fetch Donation Receipts (Your Tx)
        const donationTxMap = new Map();
        try {
            const donateFilter = contract.filters.DonationReceived(null, null, account);
            const donateEvents = await contract.queryFilter(donateFilter);
            donateEvents.forEach(event => {
                donationTxMap.set(Number(event.args.donationId), event.transactionHash);
            });
        } catch (e) { console.warn("Donation Event Error:", e); }

        // B. Fetch Distribution Events (NGO's Tx)
        const distDataMap = new Map(); // Changed to map to an Object, not just address
        try {
           const distFilter = contract.filters.FundsDistributed(); 
           if(distFilter) {
               const distEvents = await contract.queryFilter(distFilter);
               distEvents.forEach(event => {
                 // Store BOTH the Beneficiary Address AND the Transaction Hash
                 distDataMap.set(Number(event.args.donationId), {
                    beneficiary: event.args.beneficiary,
                    txHash: event.transactionHash
                 });
               });
           }
        } catch (e) { console.warn("Distribution Event Error:", e); }
        
        // C. Load Campaigns
        const allCampaigns = await contract.getAllCampaigns();
        const formattedCampaigns = allCampaigns
          .filter(c => c.active) 
          .map(c => {
            const ownerAddress = c.owner.toLowerCase();
            const ngoName = currentNgoMap.get(ownerAddress) || ownerAddress;
            return {
              id: Number(c.id),
              title: c.title,
              description: c.description,
              goal: ethers.formatEther(c.goal),
              amountRaised: ethers.formatEther(c.amountRaised),
              ngoName: ngoName 
            };
          });
        setCampaigns(formattedCampaigns);

        // D. Load User History
        const donorHistory = await contract.getMyDonations();
        const formattedHistory = donorHistory.map(d => {
          const donationId = Number(d.id);
          const totalAmount = parseFloat(ethers.formatEther(d.amount));
          const usedAmount = parseFloat(ethers.formatEther(d.amountUsed));

          // Calculate Percentage
          const percentage = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;

          // Determine Status
          let statusString = "Pending";
          if (percentage > 0 && percentage < 99.9) statusString = "Partial";
          if (percentage >= 99.9) statusString = "Completed";

          // Get Distribution Data
          const distData = distDataMap.get(donationId);
          
          return {
            id: donationId,
            campaignId: Number(d.campaignId),
            amount: totalAmount,
            amountUsed: usedAmount,
            percentage: percentage.toFixed(0),
            status: statusString,
            
            // Beneficiary Details
            beneficiaryAddress: distData ? distData.beneficiary : null,
            
            // Transaction Hashes
            donationTxHash: donationTxMap.get(donationId), // My Tx
            distributionTxHash: distData ? distData.txHash : null // NGO Tx
          };
        });

        formattedHistory.sort((a, b) => b.id - a.id);
        setMyDonations(formattedHistory);
        
        let total = 0;
        formattedHistory.forEach(d => total += d.amount);
        const supported = new Set(formattedHistory.map(d => d.campaignId)).size;
        setStats({ totalDonated: total.toFixed(4), campaignsSupported: supported });

      } catch (err) {
        console.error("Failed to load blockchain data:", err);
        setError("Failed to load data.");
      }
    }
  }, [account, contract]);

  useEffect(() => {
    if (account && contract) {
      loadBlockchainData(ngoNameMap);
    }
  }, [account, contract, ngoNameMap, loadBlockchainData]); 

  // --- 4. Handle Donation ---
  const handleDonate = async (e, campaignId) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    if (!amount || parseFloat(amount) <= 0) return alert("Enter valid amount");
    setLoadingCampaignId(campaignId); 
    try {
      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.donate(campaignId, { value: amountInWei });
      await tx.wait(); 
      alert("Donation successful!");
      loadBlockchainData(ngoNameMap); 
      e.target.reset(); 
    } catch (err) {
      console.error(err);
      alert("Donation failed.");
    }
    setLoadingCampaignId(null); 
  };

  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch (e) {} };

  // --- 5. Split Lists ---
  const activeDonations = myDonations.filter(d => d.status !== "Completed");
  const completedDonations = myDonations.filter(d => d.status === "Completed");

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userData?.fullName || 'Donor'}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {!account ? (
        <div className="connect-wallet-container">
          <h2>Connect Your Wallet</h2>
          <button onClick={connectWallet} className="donate-now-btn">Connect MetaMask</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <>
          <p className="account-info">Connected Wallet: {account.substring(0, 6)}...{account.substring(38)}</p>

          <div className="stats-container">
            <div className="stat-card"><h2>Your Balance</h2><p>{balance} ETH</p></div>
            <div className="stat-card"><h2>Total Donated</h2><p>{stats.totalDonated} ETH</p></div>
            <div className="stat-card"><h2>Campaigns</h2><p>{stats.campaignsSupported}</p></div>
          </div>

          <div className="campaigns-list">
            <h2>Active Campaigns</h2>
            {campaigns.length === 0 && <p>No active campaigns found.</p>}
            {campaigns.map(campaign => (
              <div key={campaign.id} className="campaign-card">
                <h3>{campaign.title}</h3>
                <p className="ngo-name">By: {campaign.ngoName}</p>
                <p>{campaign.description}</p>
                <p className="goal-status">Raised: {campaign.amountRaised} / {campaign.goal} ETH</p>
                {loadingCampaignId === campaign.id ? (
                  <div className="loading-container"><div className="loading-spinner"></div><p>Processing...</p></div>
                ) : (
                  <form className="donate-form" onSubmit={(e) => handleDonate(e, campaign.id)}>
                    <input name="amount" type="text" placeholder="Amount in ETH" required />
                    <button type="submit">Donate Now</button> 
                  </form>
                )}
              </div>
            ))}
          </div>

          {/* TABLE 1: ACTIVE / QUEUE */}
          <div className="history-table" style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#0056b3' }}>⏳ Active Queue</h2>
            {activeDonations.length === 0 ? <p>No active donations.</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Sr.</th> 
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>My Receipt (In)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDonations.map((donation, index) => (
                    <tr key={donation.id}>
                      <td>{index + 1}</td>
                      <td>{donation.amount} ETH</td>
                      <td>
                        <span className={`status-badge status-${donation.status.toLowerCase()}`}>
                          {donation.status}
                        </span>
                      </td>
                      <td>
                        {donation.percentage}%
                        <div className="progress-bar-bg">
                           <div className="progress-bar-fill" style={{width: `${donation.percentage}%`}}></div>
                        </div>
                      </td>
                      <td>
                        {donation.donationTxHash ? (
                          <a href={`${explorerUrl}tx/${donation.donationTxHash}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                            View Receipt ↗
                          </a>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* TABLE 2: COMPLETED (WITH INTERNAL TX COLUMN) */}
          <div className="history-table" style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#155724' }}>✅ Completed Distributions</h2>
            {completedDonations.length === 0 ? <p>No completed donations.</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Sr.</th> 
                    <th>Amount</th>
                    <th>Beneficiary</th>
                    <th>My Receipt (In)</th>
                    <th>Internal Transfer (Out)</th> {/* NEW COLUMN */}
                  </tr>
                </thead>
                <tbody>
                  {completedDonations.map((donation, index) => (
                    <tr key={donation.id}>
                      <td>{index + 1}</td>
                      <td>{donation.amount} ETH</td>
                      
                      {/* BENEFICIARY */}
                      <td>
                        {donation.beneficiaryAddress ? (
                            <span className="addr-text" title={donation.beneficiaryAddress}>
                                {donation.beneficiaryAddress.substring(0,6)}...
                            </span>
                        ) : (
                            <span className="text-muted">Loading...</span>
                        )}
                      </td>
                      
                      {/* LINK 1: My Donation */}
                      <td>
                        {donation.donationTxHash ? (
                          <a href={`${explorerUrl}tx/${donation.donationTxHash}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                            View Donation ↗
                          </a>
                        ) : "-"}
                      </td>

                      {/* LINK 2: Internal Transfer (NEW) */}
                      <td>
                        {donation.distributionTxHash ? (
                          <a 
                            // We use the Distribution Hash (NGO's Action) directly
                            href={`${explorerUrl}tx/${donation.distributionTxHash}#internal`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="tx-link-success"
                          >
                             View Internal Tx ↗
                          </a>
                        ) : (
                          <span className="text-muted">Pending Link</span>
                        )}
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