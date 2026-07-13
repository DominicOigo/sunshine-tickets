import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import './TrendingEvents.css';

interface Tier {
  id: string; name: string; price: number; sort_order: number;
}

interface Event {
  id: string; title: string; slug: string;
  start_date: string; location: string;
  category_name: string; category_slug: string;
  image_url: string; status: string; tiers: Tier[];
  organizer_name: string; organizer_id: string;
}

type ViewMode = 'trending' | 'upcoming' | 'all';

const TrendingEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [mode, setMode] = useState<ViewMode>('trending');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
  });
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => setEvents(data?.filter((e: Event) => e.status === 'published') || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFav = useCallback((e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!user) { toast('Sign in to save favorites', 'info'); openAuthModal('signin'); return; }
    setFavorites(prev => prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]);
  }, [user, openAuthModal, toast]);

  const sorted = [...events].sort((a, b) => {
    const da = new Date(a.start_date).getTime();
    const db = new Date(b.start_date).getTime();
    if (mode === 'trending') return db - da;
    if (mode === 'upcoming') return da - db;
    return 0;
  });

  const display = sorted.slice(0, 8);

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section id="events" className="trending-section">
      <div className="trending-section__container">
        <div className="trending-section__header">
          <div>
            <span className="trending-section__tag">Events</span>
            <h2 className="trending-section__title">
              {mode === 'trending' ? 'Trending Events' : mode === 'upcoming' ? 'Upcoming Events' : 'All Events'}
            </h2>
          </div>
          <div className="trending-section__tabs">
            {(['trending', 'upcoming', 'all'] as ViewMode[]).map(m => (
              <button
                key={m}
                className={`trending-section__tab ${mode === m ? 'active' : ''}`}
                onClick={() => setMode(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="trending-section__scroll">
          <div className="trending-section__grid">
            {display.map(event => (
              <div
                key={event.id}
                className="trending-section__card"
                onClick={() => navigate(`/event/${event.slug || event.id}`)}
              >
                <div className="trending-section__card-img">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} />
                  ) : (
                    <div className="trending-section__card-placeholder" />
                  )}
                  <div className="trending-section__card-badge">{event.category_name || 'Event'}</div>
                  <button className={`trending-section__card-fav ${favorites.includes(event.id) ? 'is-fav' : ''}`} onClick={e => toggleFav(e, event.id)}>
                    <Heart size={16} />
                  </button>
                  <div className="trending-section__card-price">
                    {event.tiers?.length ? `KSh ${event.tiers[0].price?.toLocaleString()}` : 'Free'}
                  </div>
                </div>
                <div className="trending-section__card-body">
                  <h3 className="trending-section__card-title">{event.title}</h3>
                  <div className="trending-section__card-meta">
                    <span><Calendar size={13} /> {formatDate(event.start_date)}</span>
                    <span><MapPin size={13} /> {event.location}</span>
                  </div>
                  <div className="trending-section__card-footer">
                    <span className="trending-section__card-organizer">{event.organizer_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="trending-section__view-all">
          <button className="trending-section__view-all-btn" onClick={() => navigate('/events')}>
            View All Events <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrendingEvents;
