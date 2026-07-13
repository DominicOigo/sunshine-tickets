import React from 'react';
import { Star, Users, MapPin, Headphones, Layout } from 'lucide-react';
import './StatsBar.css';

const StatsBar: React.FC = () => {
  return (
    <div className='stats-bar-v2'>
      <div className='stats-bar-container'>
        <div className='stat-item'>
          <Star size={24} className='stat-icon' />
          <div className='stat-text'>
            <strong>10K+</strong>
            <span>Events Hosted</span>
          </div>
        </div>
        
        <div className='stat-item'>
          <Users size={24} className='stat-icon' />
          <div className='stat-text'>
            <strong>2M+</strong>
            <span>Happy Customers</span>
          </div>
        </div>
        
        <div className='stat-item active'>
          <div className='stat-highlight-bg' />
          <Star size={24} className='stat-icon orange' />
          <div className='stat-text'>
            <strong>98%</strong>
            <span>Satisfaction Rate</span>
          </div>
        </div>
        
        <div className='stat-item'>
          <MapPin size={24} className='stat-icon' />
          <div className='stat-text'>
            <strong>50+</strong>
            <span>Cities Covered</span>
          </div>
        </div>
        
        <div className='stat-item'>
          <Headphones size={24} className='stat-icon' />
          <div className='stat-text'>
            <strong>24/7</strong>
            <span>Customer Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;