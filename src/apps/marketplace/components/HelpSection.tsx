import React from 'react';
import { Mail, MessageCircle, FileText, Shield } from 'lucide-react';
import './HelpSection.css';

const openChat = (e: React.MouseEvent) => {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('opencode-chat'));
  document.getElementById('chat-widget')?.scrollIntoView({ behavior: 'smooth' });
};

const HELP_ITEMS = [
  { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with our support team in real-time.', action: 'Start Chat', onClick: openChat },
  { icon: Mail, title: 'Email Us', desc: 'Send us a message and we will get back within 24 hours.', action: 'hello@sunsinetickets.co.ke', link: 'mailto:hello@sunsinetickets.co.ke' },
  { icon: FileText, title: 'FAQs', desc: 'Find answers to commonly asked questions about tickets, payments, and events.', action: 'View FAQs', link: '/#about' },
  { icon: Shield, title: 'Report an Issue', desc: 'Having trouble with an order or event? Let us know and we will resolve it.', action: 'Report Now', link: 'mailto:support@sunsinetickets.co.ke' },
];

const HelpSection: React.FC = () => {
  return (
    <section id="help" className="help-section">
      <div className="help-section__container">
        <div className="help-section__header">
          <span className="help-section__tag">Help & Support</span>
          <h2 className="help-section__title">We are Here to Help</h2>
          <p className="help-section__desc">Have a question? Reach out to us through any of the channels below.</p>
        </div>
        <div className="help-section__grid">
          {HELP_ITEMS.map((item, i) => (
            item.onClick ? (
              <button key={i} onClick={item.onClick} className="help-section__card help-section__card-btn">
                <div className="help-section__card-icon">
                  <item.icon size={24} />
                </div>
                <h3 className="help-section__card-title">{item.title}</h3>
                <p className="help-section__card-desc">{item.desc}</p>
                <span className="help-section__card-action">{item.action} &rarr;</span>
              </button>
            ) : (
              <a key={i} href={item.link} className="help-section__card">
                <div className="help-section__card-icon">
                  <item.icon size={24} />
                </div>
                <h3 className="help-section__card-title">{item.title}</h3>
                <p className="help-section__card-desc">{item.desc}</p>
                <span className="help-section__card-action">{item.action} &rarr;</span>
              </a>
            )
          ))}
        </div>
      </div>
    </section>
  );
};

export default HelpSection;
