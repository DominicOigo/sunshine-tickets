import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import EventCard from './EventCard';
import { useEvents } from '../../../context/EventContext';
import './EventGrid.css';

const EventGrid: React.FC = () => {
  const { events } = useEvents();
  
  // Only show approved/published events on the public landing page
  const publishedEvents = events.filter((event) => event.status === 'published');

  return (
    <section className='trending-section'>
      <div className='trending-header'>
        <div className='trending-title-group'>
          <Flame size={24} className='flame-icon' />
          <h2 className='trending-title'>Trending Events</h2>
          <span className='trending-sub'>The hottest events this week</span>
        </div>
        <a href='#' className='view-all-link'>View All Events &rarr;</a>
      </div>

      <div className='trending-grid'>
        {publishedEvents.map(event => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>
    </section>
  );
};

export default EventGrid;