// src/components/About.js
import React from 'react';

function About() {
  return (
    <section id="about" className="content-section about-section">
      <h2>How It Works</h2>
      <p style={{ maxWidth: '600px', lineHeight: '1.6' }}>
        Our platform leverages blockchain to track every donation from the donor to the beneficiary. This eliminates fraud, reduces overhead, and builds unprecedented trust in the relief process.
      </p>
    </section>
  );
}

export default About;