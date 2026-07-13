import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { request } from '../lib/api';
import { useAuth } from './AuthContext';
import type { EventStatus } from '../lib/database.types';

export interface TicketTier {
  id:         string;
  name:       string;
  price:      string;   // formatted e.g. "KES 2,500"
  priceInt:   number;   // raw integer in KES
  capacity:   number;
  sold:       number;
  is_active:  boolean;
}

export interface Event {
  id:             string;
  title:          string;
  date:           string;
  day:            string;
  startDate?:     string;   // ISO string for DB
  location:       string;
  coordinates:    { lat: number; lng: number };
  price:          string;   // lowest tier price
  image:          string;
  badge?:         string;
  availability:   number;   // % tickets remaining
  trending?:      boolean;
  status:         EventStatus;
  organizerId:    string;
  organizerName:  string;
  organizerEmail: string;
  description:    string;
  tiers:          TicketTier[];
  merch:          { name: string; price: string; stock: number }[];
  adminFeedback?: string;
  categoryId?:    string;
}

interface EventContextType {
  events:       Event[];
  loading:      boolean;
  error:        string | null;
  createEvent:  (data: Omit<Event, 'id' | 'status' | 'availability' | 'organizerEmail'>) => Promise<Event>;
  approveEvent: (id: string) => Promise<void>;
  rejectEvent:  (id: string, feedback: string) => Promise<void>;
  deleteEvent:  (id: string) => Promise<void>;
  refetch:      () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

// Format a DB event row + tiers into the frontend Event shape
function formatEvent(row: any, tiers: any[], organizerName: string, merch: any[] = []): Event {
  const date = new Date(row.start_date);
  const dateStr = date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }).toUpperCase();
  const dayStr  = date.toLocaleDateString('en-KE', { weekday: 'short' }).toUpperCase();

  const formattedTiers: TicketTier[] = tiers.map(t => ({
    id:        t.id,
    name:      t.name,
    price:     `KES ${t.price.toLocaleString()}`,
    priceInt:  t.price,
    capacity:  t.capacity,
    sold:      t.sold,
    is_active: t.is_active,
  }));

  const totalCap  = formattedTiers.reduce((s, t) => s + t.capacity, 0);
  const totalSold = formattedTiers.reduce((s, t) => s + t.sold, 0);
  const lowestPrice = formattedTiers.length > 0
    ? Math.min(...formattedTiers.map(t => t.priceInt))
    : 0;

  return {
    id:            row.id,
    title:         row.title,
    date:          dateStr,
    day:           dayStr,
    startDate:     row.start_date,
    location:      row.location,
    coordinates:   row.coordinates ?? { lat: -1.2921, lng: 36.8219 },
    price:         `KES ${lowestPrice.toLocaleString()}`,
    image:         row.image_url ?? '',
    availability:  totalCap > 0 ? Math.round(((totalCap - totalSold) / totalCap) * 100) : 100,
    trending:      row.is_trending,
    status:        row.status,
    organizerId:   row.organizer_id,
    organizerName,
    organizerEmail: row.organizer_email ?? '',
    description:   row.description,
    tiers:         formattedTiers,
    merch:         merch.map(m => ({ name: m.name, price: `KES ${m.price.toLocaleString()}`, stock: m.stock })),
    adminFeedback: row.admin_feedback ?? undefined,
    categoryId:    row.category_id ?? undefined,
  };
}

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/events';
      if (user?.role === 'admin') {
        url = '/events/all';
      } else if (user?.role === 'organizer') {
        url = '/events/mine';
      }
      const rows = await request(url);
      const formatted = (rows ?? []).map((row: any) =>
        formatEvent(row, row.tiers ?? [], row.organizer_name ?? 'Unknown Organizer', row.merch ?? [])
      );
      setEvents(formatted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const createEvent = async (data: Omit<Event, 'id' | 'status' | 'availability' | 'organizerEmail'>): Promise<Event> => {
    const payload = {
      title:        data.title,
      description:  data.description,
      location:     data.location,
      coordinates:  data.coordinates,
      image_url:    data.image || null,
      start_date:   data.startDate ?? new Date().toISOString(),
      category_id:  data.categoryId || null,
      tiers: data.tiers.map((t, i) => ({
        name:       t.name,
        price:      t.priceInt ?? parseInt(t.price.replace(/[^0-9]/g, ''), 10),
        capacity:   t.capacity,
        sort_order: i,
      })),
      merch: (data.merch ?? []).map(m => ({
        name:      m.name,
        price:     parseInt(m.price.replace(/[^0-9]/g, ''), 10),
        stock:     m.stock,
      }))
    };

    const row = await request('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    await fetchEvents();
    return formatEvent(row, row.tiers ?? [], data.organizerName, row.merch ?? []);
  };

  const approveEvent = async (id: string) => {
    await request(`/events/${id}/approve`, { method: 'PATCH' });
    await fetchEvents();
  };

  const rejectEvent = async (id: string, feedback: string) => {
    await request(`/events/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ feedback })
    });
    await fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    await request(`/events/${id}`, { method: 'DELETE' });
    await fetchEvents();
  };

  return (
    <EventContext.Provider value={{ events, loading, error, createEvent, approveEvent, rejectEvent, deleteEvent, refetch: fetchEvents }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
};
