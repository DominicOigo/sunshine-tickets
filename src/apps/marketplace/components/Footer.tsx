import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { scrollToHash } from '../../../lib/scrollTo';
import './Footer.css';

function HashLink({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: any }) {
  const handleClick = (e: React.MouseEvent) => {
    const hashIdx = to.indexOf('#');
    if (hashIdx >= 0) {
      const route = to.substring(0, hashIdx) || '/';
      const hash = to.substring(hashIdx);
      if (window.location.pathname === route) {
        e.preventDefault();
        scrollToHash(hash);
        window.history.replaceState(null, '', hash);
        return;
      }
    }
  };
  if (to.includes('#') && (to.startsWith('/') || !to.startsWith('/'))) {
    return <a href={to} onClick={handleClick} {...rest}>{children}</a>;
  }
  return <Link to={to} {...rest}>{children}</Link>;
}

const Footer: React.FC = () => {
  return (
    <footer className="footer-glass">
      <div className="footer-glass__container">
        <div className="footer-glass__grid">
          {/* Brand */}
          <div className="footer-glass__col footer-glass__col--brand">
            <div className="footer-glass__logo">
              <div className="footer-glass__logo-icon"><Sun size={18} /></div>
              Sunshine<span className="gold">Tickets</span>
            </div>
            <p className="footer-glass__desc">
              The premium platform for discovering and booking tickets to the best events across Kenya.
            </p>
            <div className="footer-glass__social">
              <a href="#" className="footer-glass__social-link"><Facebook size={18} /></a>
              <a href="#" className="footer-glass__social-link"><Twitter size={18} /></a>
              <a href="#" className="footer-glass__social-link"><Instagram size={18} /></a>
              <a href="#" className="footer-glass__social-link"><Youtube size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-glass__col">
            <h4 className="footer-glass__heading">Quick Links</h4>
            <Link to="/events" className="footer-glass__link">Browse Events</Link>
            <HashLink to="/#categories" className="footer-glass__link">Categories</HashLink>
            <HashLink to="/#organizers" className="footer-glass__link">Organizers</HashLink>
            <HashLink to="/#about" className="footer-glass__link">About Us</HashLink>
            <HashLink to="/#help" className="footer-glass__link">Help Center</HashLink>
          </div>

          {/* For Organizers */}
          <div className="footer-glass__col">
            <h4 className="footer-glass__heading">For Organizers</h4>
            <Link to="/organizer/auth" className="footer-glass__link">List Your Event</Link>
            <Link to="/organizer/auth" className="footer-glass__link">Pricing</Link>
            <Link to="/organizer/auth" className="footer-glass__link">Resources</Link>
            <Link to="/organizer/auth" className="footer-glass__link">Blog</Link>
            <Link to="/organizer/auth" className="footer-glass__link">Contact Sales</Link>
          </div>

          {/* Newsletter */}
          <div className="footer-glass__col">
            <h4 className="footer-glass__heading">Stay Updated</h4>
            <p className="footer-glass__newsletter-desc">
              Get the latest events and exclusive offers delivered to your inbox.
            </p>
            <form className="footer-glass__newsletter" onSubmit={e => e.preventDefault()}>
              <div className="footer-glass__newsletter-input">
                <Mail size={16} />
                <input type="email" placeholder="Enter your email" />
              </div>
              <button type="submit" className="footer-glass__newsletter-btn">Subscribe</button>
            </form>
            <div className="footer-glass__payments">
              <span className="footer-glass__payments-label">We accept</span>
              <div className="footer-glass__payments-icons">
                <span className="footer-glass__payment-icon">M-Pesa</span>
                <span className="footer-glass__payment-icon">Visa</span>
                <span className="footer-glass__payment-icon">MC</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-glass__bottom">
          <span>&copy; {new Date().getFullYear()} Sunshine Tickets. All rights reserved.</span>
          <div className="footer-glass__bottom-links">
            <HashLink to="/#about" className="footer-glass__bottom-link">Privacy Policy</HashLink>
            <HashLink to="/#about" className="footer-glass__bottom-link">Terms of Service</HashLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
