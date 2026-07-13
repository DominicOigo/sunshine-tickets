import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, User as UserIcon, LogOut, LayoutDashboard, Ticket,
  Briefcase, Menu, ChevronDown, ShoppingBag,
} from 'lucide-react';
import NavLogo from './NavLogo';
import MobileDrawer from './MobileDrawer';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { scrollToHash } from '../../../lib/scrollTo';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Events',     path: '/events' },
  { label: 'Categories', path: '/#categories' },
  { label: 'About Us',   path: '/#about' },
  { label: 'Help',       path: '/#help' },
] as const;

const NavLink: React.FC<{ label: string; path: string }> = ({ label, path }) => {
  const isHash = path.includes('#');
  if (isHash) {
    const hash = path.substring(path.indexOf('#'));
    return (
      <a href={path} className="nav-glass__link"
        onClick={e => {
          e.preventDefault();
          scrollToHash(hash);
          window.history.replaceState(null, '', hash);
        }}>
        {label}
      </a>
    );
  }
  return <Link to={path} className="nav-glass__link">{label}</Link>;
};

const ProfileDropdown: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="nav-glass__dropdown">
      <div className="nav-glass__dropdown-header">
        <span className="nav-glass__dropdown-name">{user!.name}</span>
        <span className="nav-glass__dropdown-email">{user!.email}</span>
      </div>
      <div className="nav-glass__dropdown-items">
        <Link to="/tickets" className="nav-glass__dropdown-item" onClick={() => navigate('/tickets')}>
          <Ticket size={16} /> My Tickets
        </Link>
        <Link to="/profile" className="nav-glass__dropdown-item" onClick={() => navigate('/profile')}>
          <UserIcon size={16} /> Profile
        </Link>
        {user!.role === 'organizer' && (
          <Link to="/manage" className="nav-glass__dropdown-item">
            <LayoutDashboard size={16} /> Organizer Dashboard
          </Link>
        )}
        <button className="nav-glass__dropdown-item nav-glass__dropdown-item--danger" onClick={signOut}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { user, openAuthModal } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setProfileOpen(false); }, [location]);

  return (
    <>
      <nav className={`nav-glass ${scrolled ? 'nav-glass--scrolled' : ''}`}>
        <div className="nav-glass__container">

          {/* Left: Logo */}
          <NavLogo />

          {/* Center: Nav Links */}
          <div className="nav-glass__links">
            {NAV_LINKS.map(link => (
              <NavLink key={link.label} label={link.label} path={link.path} />
            ))}
          </div>

          {/* Right: Search + Actions */}
          <div className="nav-glass__right">
            {/* Search */}
            <button className="nav-glass__search" onClick={() => navigate('/events')}>
              <Search size={16} className="nav-glass__search-icon" />
              <span className="nav-glass__search-text">Search events, artists, venues...</span>
            </button>

            {/* For Organizers */}
            <Link to={user?.role === 'organizer' ? '/manage' : '/organizer/auth'} className="nav-glass__org-btn">
              <Briefcase size={16} />
              <span>For Organizers</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="nav-glass__cart-btn" aria-label="Shopping cart">
              <ShoppingBag size={18} />
              {itemCount > 0 && <span className="nav-glass__cart-badge">{itemCount}</span>}
            </Link>

            {/* Auth */}
            <div className="nav-glass__auth" ref={dropdownRef}>
              {user ? (
                <div className="nav-glass__profile">
                  <button className="nav-glass__avatar-btn" onClick={() => setProfileOpen(v => !v)}>
                    <div className="nav-glass__avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <span className="nav-glass__username">{user.name}</span>
                    <ChevronDown size={12} className="nav-glass__chevron" />
                  </button>
                  {profileOpen && <ProfileDropdown />}
                </div>
              ) : (
                <button className="nav-glass__login-btn" onClick={() => openAuthModal('signin')}>
                  <UserIcon size={16} />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button className="nav-glass__menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default Navbar;
