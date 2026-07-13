import React from 'react';
import { MapPin, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import './EventCard.css';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  day: string;
  location: string;
  price: string;
  image: string;
  badge?: string;
  availability: number;
  trending?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ id, title, date, day, location, price, image, badge, availability, trending }) => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('Sign in to save events to your favorites.', 'info');
      openAuthModal('signin');
      return;
    }
    toast('Added to favorites!', 'success');
  };

  return (
    <div onClick={() => navigate(`/event/${id}`)} style={{ cursor: 'pointer' }}>
      <motion.div 
        className='card-exact'
        whileHover={{ y: -8 }}
      >
        <div className='card-exact__visual'>
          <div className='card-exact__img' style={{backgroundImage: 'url(' + image + ')'}} />
          <div className='card-exact__overlay' />
          
          <div className='card-exact__top'>
            <div className='card-exact__date-box'>
              <span className='month'>{date.split(' ')[0]}</span>
              <span className='day-num'>{date.split(' ')[1]}</span>
              <span className='day-name'>{day}</span>
            </div>
            
            <div className='card-exact__badges'>
              {badge && (
                <div className={`badge-pill ${badge.toLowerCase().replace(' ', '-')}`}>
                  <span className={`badge-dot ${badge.toLowerCase().includes('few') || badge.toLowerCase().includes('limited') || badge.toLowerCase().includes('new') ? 'cyan' : 'orange'}`} />
                  {badge}
                </div>
              )}
              {trending && (
                <div className='badge-pill trending'>
                  <span className='badge-dot orange' />
                  Trending
                </div>
              )}
            </div>
            
            <button className='card-exact__wishlist' onClick={handleWishlist}>
              <Heart size={18} fill={user ? 'rgba(255, 112, 32, 0.2)' : 'none'} />
            </button>
          </div>

          <div className='card-exact__content'>
            <h3 className='card-exact__title'>{title}</h3>
            <div className='card-exact__location'>
              <MapPin size={14} className='orange-icon' />
              <span>{location}</span>
            </div>
          </div>
        </div>

        <div className='card-exact__footer'>
          <div className='card-exact__price-group'>
            <span className='label'>From</span>
            <span className='value'>{price}</span>
          </div>
          
          <div className='card-exact__availability'>
            <div className='avail-header'><span>{availability}%-Left</span></div>
            <div className='avail-bar-bg'><div className='avail-bar-fill' style={{width: availability + '%'}}></div></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EventCard;
