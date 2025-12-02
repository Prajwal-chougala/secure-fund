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

  // Web3 State
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonated: 0, campaignsSupported: 0 });
  const [error, setError] = useState('');
  
  // State for Wallet Balance, NGO Names & Etherscan
  const [provider, setProvider] = useState(null); 
  const [balance, setBalance] = useState("0"); 
  const [ngoNameMap, setNgoNameMap] = useState(new Map());
  const [explorerUrl, setExplorerUrl] = useState(""); 
  
  const [loadingCampaignId, setLoadingCampaignId] = useState(null);

  // --- Load the NGO "phonebook" from Firebase ---
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

  useEffect(() => {
    loadNgoNames();
  }, []);

  // --- 1. CONNECT TO METAMASK ---
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not found. Please install it.");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider); 
      
      const signer = await provider.getSigner();
      const userAccount = await signer.getAddress();
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);

      setAccount(userAccount);
      setContract(contractInstance);
      setError('');

      const balanceWei = await provider.getBalance(userAccount);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth).toFixed(4)); 

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

  // --- 2. LOAD BLOCKCHAIN DATA ---
  const loadBlockchainData = useCallback(async (currentNgoMap) => { 
    if (contract && account) { 
      try {
        // 1. Fetch Donation Events
        const donationTxMap = new Map();
        try {
            const donateFilter = contract.filters.DonationReceived(null, null, account);
            const donateEvents = await contract.queryFilter(donateFilter);
            donateEvents.forEach(event => {
                donationTxMap.set(Number(event.args.donationId), event.transactionHash);
            });
        } catch (e) {
            console.warn("Could not fetch donation events:", e);
        }
        
        // 2. Load Campaigns
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

        // 3. Load History
        const donorHistory = await contract.getMyDonations();
        const formattedHistory = donorHistory.map(d => {
          const donationId = Number(d.id);
          
          return {
            id: donationId,
            campaignId: Number(d.campaignId),
            amount: ethers.formatEther(d.amount),
            distributed: d.distributed, 
            beneficiary: d.beneficiary,
            donationTxHash: donationTxMap.get(donationId) 
          };
        });

        // 4. SORTING: Newest First
        formattedHistory.sort((a, b) => b.id - a.id);

        setMyDonations(formattedHistory);
        
        // Stats
        let total = 0;
        formattedHistory.forEach(d => total += parseFloat(d.amount));
        const supported = new Set(formattedHistory.map(d => d.campaignId)).size;
        setStats({ totalDonated: total.toFixed(4), campaignsSupported: supported });

      } catch (err) {
        console.error("Failed to load blockchain data:", err);
        setError("Failed to load data. See console.");
      }
    }
  }, [account, contract]);

  useEffect(() => {
    if (account && contract) {
      loadBlockchainData(ngoNameMap);
    }
  }, [account, contract, ngoNameMap, loadBlockchainData]); 

  // --- 3. HANDLE DONATION ---
  const handleDonate = async (e, campaignId) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setLoadingCampaignId(campaignId); 

    try {
      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.donate(campaignId, { value: amountInWei });
      
      await tx.wait(); 
      
      alert("Donation successful! Thank you for your contribution.");
      loadBlockchainData(ngoNameMap); 
      e.target.reset(); 

      if (provider && account) {
        const balanceWei = await provider.getBalance(account);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(parseFloat(balanceEth).toFixed(4));
      }

    } catch (err) {
      console.error("Donation failed:", err);
      if (err.code === 'ACTION_REJECTED') {
        alert("Transaction cancelled.");
      } else {
        alert("Donation failed. See console for details.");
      }
    }
    
    setLoadingCampaignId(null); 
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // --- FILTER DONATIONS ---
  const pendingDonations = myDonations.filter(d => !d.distributed);
  const distributedDonations = myDonations.filter(d => d.distributed);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userData?.fullName || 'Donor'}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {!account ? (
        <div className="connect-wallet-container">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your MetaMask wallet to view campaigns and your donation history.</p>
          <button onClick={connectWallet} className="donate-now-btn">Connect MetaMask</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <>
          <p className="account-info">Connected Wallet: {account.substring(0, 6)}...{account.substring(38)}</p>

          <div className="stats-container">
            <div className="stat-card">
              <h2>Your Wallet Balance</h2>
              <p>{balance} ETH</p>
            </div>
            <div className="stat-card">
              <h2>Total Donated</h2>
              <p>{stats.totalDonated} ETH</p>
            </div>
            <div className="stat-card">
              <h2>Campaigns Supported</h2>
              <p>{stats.campaignsSupported}</p>
            </div>
          </div>

          <div className="campaigns-list">
            <h2>Active Campaigns</h2>
            {campaigns.length === 0 && <p>No active campaigns found.</p>}
            {campaigns.map(campaign => (
              <div key={campaign.id} className="campaign-card">
                <h3>{campaign.title}</h3>
                <p className="ngo-name">By: {campaign.ngoName}</p>
                <p>{campaign.description}</p>
                <p className="goal-status">
                  Raised: {campaign.amountRaised} / {campaign.goal} ETH
                </p>
                
                {loadingCampaignId === campaign.id ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Processing transaction...</p>
                  </div>
                ) : (
                  <form className="donate-form" onSubmit={(e) => handleDonate(e, campaign.id)}>
                    <input name="amount" type="text" placeholder="Amount in ETH" required />
                    <button type="submit">Donate Now</button> 
                  </form>
                )}
              </div>
            ))}
          </div>

          {/* --- SECTION 1: PENDING DONATIONS --- */}
          <div className="history-table" style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#856404' }}>⚠️ Pending Transactions (In Queue)</h2>
            <p className="section-desc">These funds are held in the Smart Contract and waiting for the NGO to distribute them.</p>
            
            {pendingDonations.length === 0 ? (
              <p>No pending donations.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Sr. No.</th> 
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Proof of Donation</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDonations.map((donation, index) => (
                    <tr key={donation.id}>
                      <td>{index + 1}</td>
                      <td>{donation.amount} ETH</td>
                      <td>
                        <span className="status-badge status-pending">
                          Pending NGO Action
                        </span>
                      </td>
                      <td>
                        {donation.donationTxHash && explorerUrl ? (
                          <a href={`${explorerUrl}tx/${donation.donationTxHash}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                            View Receipt ↗
                          </a>
                        ) : "Processing..."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

         {/* --- SECTION 2: COMPLETED DONATIONS --- */}
          <div className="history-table" style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#155724' }}>✅ Completed Distributions</h2>
            <p className="section-desc">These funds have successfully reached the beneficiary's wallet.</p>

            {distributedDonations.length === 0 ? (
              <p>No completed distributions yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Sr. No.</th> 
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Beneficiary</th>
                    <th>Proof of Donation</th>
                    <th>Beneficiary Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {distributedDonations.map((donation, index) => (
                    <tr key={donation.id}>
                      <td>{index + 1}</td>
                      <td>{donation.amount} ETH</td>
                      <td>
                        <span className="status-badge status-success">
                          Distributed
                        </span>
                      </td>
                      <td>
                        {`${donation.beneficiary.substring(0, 6)}...${donation.beneficiary.substring(38)}`}
                      </td>
                      <td>
                        {donation.donationTxHash && explorerUrl ? (
                          <a href={`${explorerUrl}tx/${donation.donationTxHash}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                            View Receipt ↗
                          </a>
                        ) : "Link"}
                      </td>
                      <td>
                        {explorerUrl ? (
                          /* UPDATED LINK: Added #internaltx to the end */
                          <a 
                            href={`${explorerUrl}address/${donation.beneficiary}#internaltx`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="tx-link-success"
                          >
                             View Transfer ↗
                          </a>
                        ) : "-"}
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