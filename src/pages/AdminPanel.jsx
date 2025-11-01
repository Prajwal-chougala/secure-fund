import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css'; 

const AdminPanel = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
        <h1>Admin Panel ({currentUser?.fullName})</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="admin-section">
        <h2>Pending NGO Approvals</h2>
        <div className="list-item">
          <span>Charity Foundation Inc.</span>
          <button className="btn-approve">Approve</button>
        </div>
        <div className="list-item">
          <span>Global Relief Org</span>
          <button className="btn-approve">Approve</button>
        </div>
      </div>
      
      <div className="admin-section">
        <h2>System Actions</h2>
        <button className="btn-action">Verify All Donations</button>
        <button className="btn-action">Withdraw Funds to NGO Wallets</button>
      </div>
    </div>
  );
};

export default AdminPanel;