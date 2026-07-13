import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Heart, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './EventsPage.css';

interface Tier {
  id: string; name: string; price: number; sort_order: number;
}

interface EventItem {
  id: string; title: string; slug: string;
  start_date: string; location: string;
  category_name: string; category_slug: string;
  image_url: string; status: string; tiers: Tier[];
  organizer_name: string; organizer_id: string;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
  });
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFav = useCallback((e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!user) { toast('Sign in to save favorites', 'info'); openAuthModal('signin'); return; }
    setFavorites(prev => prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]);
  }, [user, openAuthModal, toast]);

  const categoryFilter = searchParams.get('category');
  const organizerFilter = searchParams.get('organizer');

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => setEvents(data?.filter((e: EventItem) => e.status === 'published') || []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = events;
    if (categoryFilter) {
      list = list.filter(e => e.category_slug === categoryFilter);
    }
    if (organizerFilter) {
      list = list.filter(e => e.organizer_id === organizerFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => e.title.toLowerCase().includes(q) || e.organizer_name.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q));
    }
    return list;
  }, [events, categoryFilter, organizerFilter, search]);

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const clearFilters = () => navigate('/events');

  return (
    <div className="events-page">
      <div className="events-page__container">
        <div className="events-page__header">
          <button className="events-page__back" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Home
          </button>
          <h1 className="events-page__title">
            {categoryFilter ? `Category: ${categoryFilter}` : organizerFilter ? 'Organizer Events' : 'All Events'}
          </h1>
          <div className="events-page__search">
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {(categoryFilter || organizerFilter) && (
              <button className="events-page__clear-filters" onClick={clearFilters}>
                <X size={16} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="events-page__empty">
            <p>No events found.</p>
            <button onClick={clearFilters}>View All Events</button>
          </div>
        ) : (
          <div className="events-page__grid">
            {filtered.map(event => (
              <div
                key={event.id}
                className="events-page__card"
                onClick={() => navigate(`/event/${event.slug || event.id}`)}
              >
                <div className="events-page__card-img">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} />
                  ) : (
                    <div className="events-page__card-placeholder" />
                  )}
                  <div className="events-page__card-badge">{event.category_name || 'Event'}</div>
                  <button className={`events-page__card-fav ${favorites.includes(event.id) ? 'is-fav' : ''}`} onClick={e => toggleFav(e, event.id)}>
                    <Heart size={16} />
                  </button>
                  <div className="events-page__card-price">
                    {event.tiers?.length ? `KSh ${event.tiers[0].price?.toLocaleString()}` : 'Free'}
                  </div>
                </div>
                <div className="events-page__card-body">
                  <h3 className="events-page__card-title">{event.title}</h3>
                  <div className="events-page__card-meta">
                    <span><Calendar size={13} /> {formatDate(event.start_date)}</span>
                    <span><MapPin size={13} /> {event.location}</span>
                  </div>
                  <div className="events-page__card-footer">
                    <span className="events-page__card-organizer">{event.organizer_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
