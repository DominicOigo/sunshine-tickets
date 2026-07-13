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
            className='drawer'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className='drawer__header'>
              <div className="nav-glass__logo">
                <div className="nav-glass__logo-icon"><Sun size={18} /></div>
                <span className="nav-glass__logo-text">Sunshine<span className="gold">Tickets</span></span>
              </div>
              <button onClick={onClose} className='drawer__close'><X size={22} /></button>
            </div>

            <div className='drawer__scroll'>
              <div className='drawer__section'>
                <Link to='/' className='drawer__link drawer__link--active' onClick={onClose}><Home size={20} /> <span>Home</span></Link>
                <Link to='/organizer/auth' className='drawer__link' onClick={onClose}><Users size={20} /> <span>For Organizers</span></Link>
                <Link to='/help' className='drawer__link' onClick={onClose}><HelpCircle size={20} /> <span>Help Center</span></Link>
              </div>

              <div className='drawer__divider' />

              <div className='drawer__section'>
                <Link to='/tickets' className='drawer__link' onClick={onClose}><Ticket size={20} /> <span>My Tickets</span></Link>
                <Link to='/favorites' className='drawer__link' onClick={onClose}><Heart size={20} /> <span>Favorites</span></Link>
                <Link to='/profile' className='drawer__link' onClick={onClose}><User size={20} /> <span>Profile</span></Link>
              </div>

              <div className='drawer__promo'>
                <div className='drawer__promo-text'>
                  <h4>Host Your Event</h4>
                  <p>Reach thousands of fans.</p>
                  <Link to='/organizer/auth' onClick={onClose}>Learn More &rarr;</Link>
                </div>
                <div className='drawer__promo-icon'>
                  <Star size={32} />
                </div>
              </div>

              {/* Footer moved INSIDE scroll area so it's always reachable */}
              <div className='drawer__footer'>
                {user ? (
                  <div className='drawer__profile'>
                    <div className='drawer__profile-user'>
                      <div className='drawer__avatar'>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className='drawer__profile-info'>
                        <span className='drawer__profile-name'>{user.name}</span>
                        <span className='drawer__profile-email'>{user.email}</span>
                      </div>
                    </div>

                    {user.role === 'admin' && (
                      <Link to='/admin' className='drawer__link drawer__link--gold' onClick={onClose}>
                        <Settings size={20} /> Admin Panel
                      </Link>
                    )}
                    {user.role === 'organizer' && (
                      <Link to='/manage' className='drawer__link drawer__link--gold' onClick={onClose}>
                        <LayoutDashboard size={20} /> Organizer Dashboard
                      </Link>
                    )}

                    <button className='drawer__signout' onClick={() => { signOut(); onClose(); }}>
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <button className='drawer__signin' onClick={() => { openAuthModal('signin'); onClose(); }}>
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
