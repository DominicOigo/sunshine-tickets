import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock } from 'lucide-react';
import './SearchOverlay.css';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className='search-full-exact'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className='search-full__header'>
            <div className='search-full__input-box'>
              <Search size={20} className='icon-gray' />
              <input type='text' autoFocus placeholder='Search events, artists, venues...' />
            </div>
            <button onClick={onClose} className='search-full__close'><X size={24} /></button>
          </div>

          <div className='search-full__body'>
            <div className='search-full__section'>
              <h4 className='section-tag'>Popular Searches</h4>
              <div className='chip-row'>
                {['Concerts', 'Festivals', 'Nairobi', 'Comedy', 'Reggae', 'Sports'].map(chip => (
                  <button key={chip} className='search-chip'>{chip}</button>
                ))}
              </div>
            </div>

            <div className='search-full__section'>
              <div className='section-split'>
                <h4 className='section-tag'>Recent Searches</h4>
                <button className='btn-clear'>Clear All</button>
              </div>
              <ul className='recent-list'>
                {[
                  { id: 1, text: 'Sauti Sol Live' },
                  { id: 2, text: 'Koroga Festival' },
                  { id: 3, text: 'Diamond Platnumz' }
                ].map(item => (
                  <li key={item.id} className='recent-row'>
                    <div className='recent-main'>
                      <Clock size={16} className='icon-gray' />
                      <span>{item.text}</span>
                    </div>
                    <button className='btn-remove'><X size={14} /></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;