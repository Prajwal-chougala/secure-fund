import React from 'react';
import './Contact.css';

function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="contact-wrapper">
          <div className="section-header">
            <h2>Contact Us</h2>
            <p>Have questions? We'd love to hear from you.</p>
          </div>
          <form className="contact-form">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows="5" required></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Contact;