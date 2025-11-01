import React from 'react';
import './Features.css';

function Features() {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>A simple, transparent, and secure process from start to finish.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⛓️</div>
            <h3>Immutable Ledger</h3>
            <p>Every donation is recorded on a secure blockchain, creating a permanent and unchangeable record of funds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Real-Time Tracking</h3>
            <p>Donors, NGOs, and beneficiaries can track the flow of funds in real-time, ensuring complete transparency.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Verified Delivery</h3>
            <p>Funds are released directly to verified beneficiaries, eliminating fraud and administrative waste.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;