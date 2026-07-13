import React from 'react';
import { ShieldCheck, Zap, Tag, Headphones, Globe } from 'lucide-react';
import './WhyChooseUs.css';

const FEATURES = [
  { icon: ShieldCheck, title: 'Secure Booking', desc: 'Your payment is protected with end-to-end encryption and verified transactions.' },
  { icon: Zap, title: 'Instant Delivery', desc: 'Get your e-tickets delivered immediately after payment confirmation.' },
  { icon: Tag, title: 'No Hidden Fees', desc: 'What you see is what you pay — transparent pricing with zero surprises.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Our support team is always ready to help, day or night.' },
  { icon: Globe, title: 'Nationwide Events', desc: 'From Nairobi to Mombasa, discover events happening across Kenya.' },
];

const WhyChooseUs: React.FC = () => {
  return (
    <section id="about" className="whychoose-section">
      <div className="whychoose-section__container">
        <div className="whychoose-section__header">
          <span className="whychoose-section__tag">Why Choose Us</span>
          <h2 className="whychoose-section__title">The Premium Event Experience</h2>
          <p className="whychoose-section__desc">We make finding and booking events effortless, secure, and delightful.</p>
        </div>
        <div className="whychoose-section__grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="whychoose-section__card">
              <div className="whychoose-section__card-icon">
                <f.icon size={22} />
              </div>
              <h3 className="whychoose-section__card-title">{f.title}</h3>
              <p className="whychoose-section__card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
