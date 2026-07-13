import React from 'react';
import { ShieldCheck, Zap, Tag, Headphones, Globe } from 'lucide-react';
import './AboutSection.css';

const FEATURES = [
  { icon: ShieldCheck, title: 'Secure Booking', desc: 'Your payment is protected with end-to-end encryption and verified transactions.' },
  { icon: Zap, title: 'Instant Delivery', desc: 'Get your e-tickets delivered immediately after payment confirmation.' },
  { icon: Tag, title: 'No Hidden Fees', desc: 'What you see is what you pay — transparent pricing with zero surprises.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Our support team is always ready to help, day or night.' },
  { icon: Globe, title: 'Nationwide Events', desc: 'From Nairobi to Mombasa, discover events happening across Kenya.' },
];

const AboutSection: React.FC = () => {
  return (
    <section id="about" className="about-section">
      <div className="about-section__container">
        <div className="about-section__header">
          <span className="about-section__tag">About Us</span>
          <h2 className="about-section__title">The Premium Event Experience</h2>
          <p className="about-section__desc">
            Sunshine Tickets is Kenya's premier event discovery and ticketing platform. 
            We connect event-goers with unforgettable experiences while giving organizers 
            powerful tools to sell tickets and grow their audience.
          </p>
        </div>
        <div className="about-section__grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="about-section__card">
              <div className="about-section__card-icon">
                <f.icon size={22} />
              </div>
              <h3 className="about-section__card-title">{f.title}</h3>
              <p className="about-section__card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
