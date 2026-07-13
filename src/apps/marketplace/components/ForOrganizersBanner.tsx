import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Globe, Users, CreditCard, Shield } from 'lucide-react';
import './ForOrganizersBanner.css';

const ForOrganizersBanner: React.FC = () => {
  return (
    <section id="for-organizers" className="for-org-banner">
      <div className="for-org-banner__container">
        <div className="for-org-banner__content">
          <span className="for-org-banner__tag">For Organizers</span>
          <h2 className="for-org-banner__title">Sell Tickets & Grow Your Audience</h2>
          <p className="for-org-banner__desc">
            Join hundreds of event creators using Sunshine Tickets to sell tickets, manage attendee lists,
            and grow their events with powerful analytics and built-in marketing tools.
          </p>
          <div className="for-org-banner__benefits">
            {[
              { icon: BarChart3, text: 'Real-time sales analytics' },
              { icon: Globe, text: 'Reach thousands of attendees' },
              { icon: Users, text: 'Attendee management tools' },
              { icon: CreditCard, text: 'M-Pesa & card payments' },
              { icon: Shield, text: 'Secure & instant payouts' },
            ].map((b, i) => (
              <div key={i} className="for-org-banner__benefit">
                <b.icon size={16} />
                <span>{b.text}</span>
              </div>
            ))}
          </div>
          <div className="for-org-banner__actions">
            <Link to="/organizer/auth" className="for-org-banner__btn-primary">
              Start Selling Tickets <ArrowRight size={18} />
            </Link>
            <Link to="/organizer/auth" className="for-org-banner__btn-secondary">
              Talk to Sales
            </Link>
          </div>
        </div>
        <div className="for-org-banner__visual">
          <div className="for-org-banner__graphic">
            <div className="for-org-banner__graphic-card for-org-banner__graphic-card--1">
              <BarChart3 size={20} />
            </div>
            <div className="for-org-banner__graphic-card for-org-banner__graphic-card--2">
              <Users size={20} />
            </div>
            <div className="for-org-banner__graphic-card for-org-banner__graphic-card--3">
              <CreditCard size={20} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForOrganizersBanner;
