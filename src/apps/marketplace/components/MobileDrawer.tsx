import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Home, Users, HelpCircle, Ticket, Heart, User, Star, LogOut, Settings, LayoutDashboard, Sun } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './MobileDrawer.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, openAuthModal, signOut } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className='drawer-overlay' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div 
            className='drawer-v3'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className='drawer-v3__header'>
              <div className="nav-glass__logo">
                <div className="nav-glass__logo-icon"><Sun size={18} /></div>
                <span className="nav-glass__logo-text">Sunshine<span className="gold">Tickets</span></span>
              </div>
              <button onClick={onClose} className='drawer-v3__close'><X size={24} /></button>
            </div>

            <div className='drawer-v3__body'>
              <div className='drawer-v3__group'>
                <Link to='/' className='drawer-item--boxed active' onClick={onClose}><Home size={20} /> <span>Home</span></Link>
                <Link to='/organizer/auth' className='drawer-item' onClick={onClose}><Users size={20} /> <span>For Organizers</span></Link>
                <Link to='/help' className='drawer-item' onClick={onClose}><HelpCircle size={20} /> <span>Help Center</span></Link>
              </div>

              <div className='drawer-v3__separator' />

              <div className='drawer-v3__group'>
                <Link to='/tickets' className='drawer-item' onClick={onClose}><Ticket size={20} /> <span>My Tickets</span></Link>
                <Link to='/favorites' className='drawer-item' onClick={onClose}><Heart size={20} /> <span>Favorites</span></Link>
                <Link to='/profile' className='drawer-item' onClick={onClose}><User size={20} /> <span>Profile</span></Link>
              </div>

              <div className='drawer-promo-card'>
                <div className='promo-card-left'>
                  <h4>Host Your Event</h4>
                  <p>Reach thousands of fans.</p>
                  <Link to='/organizer/auth' onClick={onClose}>Learn More &rarr;</Link>
                </div>
                <div className='promo-card-right'>
                  <Star size={32} className='star-neon' />
                </div>
              </div>
            </div>

            <div className='drawer-v3__footer'>
              {user ? (
                <div className='drawer-profile-info' style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                  <div className='drawer-profile-user'>
                    <div className='drawer-avatar'>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className='drawer-details'>
                      <span className='name'>{user.name}</span>
                      <span className='email'>{user.email}</span>
                    </div>
                  </div>

                  {user.role === 'admin' && (
                    <Link to='/admin' className='drawer-item' style={{ width: '100%', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-gold)' }} onClick={onClose}>
                      <Settings size={20} /> Admin Panel
                    </Link>
                  )}
                  {user.role === 'organizer' && (
                    <Link to='/manage' className='drawer-item' style={{ width: '100%', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-gold)' }} onClick={onClose}>
                      <LayoutDashboard size={20} /> Organizer Dashboard
                    </Link>
                  )}

                  <button className='btn-footer-signout' style={{ width: '100%' }} onClick={() => { signOut(); onClose(); }}>
                    <LogOut size={20} /> Sign Out
                  </button>
                </div>
              ) : (
                <button className='btn-footer-signin' onClick={() => { openAuthModal('signin'); onClose(); }}>
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
