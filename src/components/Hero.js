import React from 'react';
import './Hero.css';

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">Transparency in Every Transaction</h1>
        <p className="hero-subtitle">
          SecureFund uses blockchain to ensure every dollar for relief reaches the people who need it most. Unparalleled trust, visibility, and security.
        </p>
        <div className="hero-buttons">
          <a href="#features" className="btn btn-primary">How It Works</a>
          <a href="#contact" className="btn btn-secondary">Get In Touch</a>
        </div>
      </div>
    </section>
  );
}

export default Hero;