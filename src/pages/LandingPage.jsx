import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Transparency in Every Transaction</h1>
          <p>SecureFund uses blockchain to ensure every dollar for relief reaches the people who need it most.</p>
          <div className="hero-buttons">
            <a href="#features" className="btn btn-primary">How It Works</a>
            <a href="#contact" className="btn btn-secondary">Get In Touch</a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
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
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-wrapper">
          <div className="section-header">
            <h2>Contact Us</h2>
            <p>Have questions? We'd love to hear from you.</p>
          </div>
          <form className="contact-form">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows="5" required></textarea>
            <button type="submit" className="btn btn-primary">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;