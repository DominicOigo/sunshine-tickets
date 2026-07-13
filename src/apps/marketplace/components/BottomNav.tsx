import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Search, Ticket, User } from 'lucide-react';
import './BottomNav.css';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Ticket, label: 'Tickets', path: '/tickets' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <button key={item.path} className={`bottom-nav__item ${isActive ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
