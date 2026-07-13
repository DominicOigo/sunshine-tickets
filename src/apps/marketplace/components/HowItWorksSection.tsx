import React from 'react';
import { Search, CalendarCheck, Ticket } from 'lucide-react';
import './HowItWorksSection.css';

const STEPS = [
  { icon: Search, step: '1', title: 'Browse Events', desc: 'Discover concerts, festivals, sports, and more. Filter by category, date, or location to find your perfect experience.' },
  { icon: CalendarCheck, step: '2', title: 'Select & Checkout', desc: 'Choose your ticket tier, pick quantity, and proceed to secure checkout. Add merch to complete your experience.' },
  { icon: Ticket, step: '3', title: 'Get Your Tickets', desc: 'Pay with M-Pesa STK Push and receive your e-tickets instantly via email. No printing needed — just show your QR code at the door.' },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="howitworks-section">
      <div className="howitworks-section__container">
        <div className="howitworks-section__header">
          <span className="howitworks-section__tag">How It Works</span>
          <h2 className="howitworks-section__title">Get Tickets in 3 Easy Steps</h2>
          <p className="howitworks-section__desc">From browsing to the event, we make it seamless.</p>
        </div>
        <div className="howitworks-section__steps">
          {STEPS.map((s, i) => (
            <div key={i} className="howitworks-section__step">
              <div className="howitworks-section__step-number">{s.step}</div>
              <div className="howitworks-section__step-icon">
                <s.icon size={24} />
              </div>
              <h3 className="howitworks-section__step-title">{s.title}</h3>
              <p className="howitworks-section__step-desc">{s.desc}</p>
              {i < STEPS.length - 1 && <div className="howitworks-section__connector" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
