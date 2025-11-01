import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import './Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">SecureFund</Link> {/* Use Link for home */}
      </div>

      <div className="hamburger" onClick={toggleMenu}>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>

      <ul className={`navbar-links ${isOpen ? 'active' : ''}`}>
        <li><a href="/#features" onClick={toggleMenu}>How It Works</a></li>
        <li><a href="/#contact" onClick={toggleMenu}>Contact</a></li>
        <li className="dropdown">
          <span className="dropdown-toggle">Login / Sign Up</span>
          <ul className="dropdown-menu">
            <li><Link to="/login?role=donor">Donor</Link></li>
            <li><Link to="/login?role=ngo">NGO</Link></li>
            <li><Link to="/login?role=beneficiary">Beneficiary</Link></li>
            
          </ul>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;