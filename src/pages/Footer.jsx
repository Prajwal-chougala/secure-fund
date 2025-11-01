import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer id="footer" className="footer-section">
      <div className="footer-content">
        <div className="footer-about">
          <h3>SecureFund</h3>
          <p>Bringing transparency to charitable giving through blockchain technology.</p>
        </div>
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/#features">How It Works</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} SecureFund. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;