import React from 'react';
import { Music, Map, Trophy, Film, Ghost, Users, MoreHorizontal, ChevronDown, Calendar, SlidersHorizontal } from 'lucide-react';
import './CategoryBar.css';

const CATEGORIES = [
  { icon: <Music size={18} />, label: 'Concerts' },
  { icon: <Map size={18} />, label: 'Festivals' },
  { icon: <Trophy size={18} />, label: 'Sports' },
  { icon: <Film size={18} />, label: 'Theatre' },
  { icon: <Ghost size={18} />, label: 'Comedy' },
  { icon: <Users size={18} />, label: 'Conferences' },
  { icon: <MoreHorizontal size={18} />, label: 'More' },
];

const CategoryBar: React.FC = () => {
  return (
    <div className='category-bar-v2'>
      <div className='category-bar-container'>
        <div className='categories-list'>
          <button className='category-item active'>
            <div className='category-icon-wrapper'>
              <div className='dot-grid' />
            </div>
            <span>All Events</span>
          </button>
          
          {CATEGORIES.map((cat, i) => (
            <button key={i} className='category-item'>
              <span className='cat-icon'>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className='category-filters'>
          <button className='filter-dropdown'>
            <Map size={16} />
            <span>Location</span>
            <ChevronDown size={14} />
          </button>
          <button className='filter-dropdown'>
            <Calendar size={16} />
            <span>May 20 - Jun 30</span>
            <ChevronDown size={14} />
          </button>
          <button className='filter-dropdown sort-dropdown'>
            <span className='sort-label'>Sort:</span>
            <strong>Popular</strong>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;