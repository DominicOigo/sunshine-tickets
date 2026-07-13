import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Calendar, MapPin, Eye, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import { request } from '../../../lib/api';
import './OrgSubPage.css';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  published:        { label: 'On Sale',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  pending_approval: { label: 'Pending Review', color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  rejected:         { label: 'Rejected',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  draft:            { label: 'Draft',          color: '#888',    bg: 'rgba(255,255,255,0.05)' },
};

interface OrgMyEventsPageProps {
  onTriggerCreate: () => void;
}

export const OrgMyEventsPage: React.FC<OrgMyEventsPageProps> = ({ onTriggerCreate }) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await organizerService.getMyEvents();
      setEvents(data ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete event "${title}"?`)) {
      try {
        await request(`/events/${id}`, { method: 'DELETE' });
        toast('Event deleted successfully.', 'success');
        load();
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>My Events</h1>
          <p>View, manage, and monitor the performance of all your events.</p>
        </div>
        <button className="osp-primary-btn" onClick={onTriggerCreate}>
          <Plus size={15} /> Create Event
        </button>
      </div>

      <div className="osp-toolbar">
        <div className="osp-search">
          <Search size={14} />
          <input
            placeholder="Search events by title or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="osp-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="osp-empty" style={{ padding: '4rem' }}>
            Loading events...
          </div>
        ) : (
          <div className="osp-table-wrap">
            <table className="osp-table">
              <thead>
                <tr>
                  <th>Event Details</th>
                  <th>Date &amp; Time</th>
                  <th>Location</th>
                  <th>Ticket Tiers</th>
                  <th>Capacity / Sold</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="osp-empty">
                      No events found. Create your first event to get started!
                    </td>
                  </tr>
                ) : (
                  filtered.map((e, i) => {
                    const sm = STATUS_META[e.status] ?? STATUS_META.draft;
                    const totalCapacity = e.tiers?.reduce((s: number, t: any) => s + t.capacity, 0) || 0;
                    const totalSold = e.tiers?.reduce((s: number, t: any) => s + t.sold, 0) || 0;

                    return (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <td>
                          <div className="osp-user-cell">
                            {e.image_url ? (
                              <img src={e.image_url} alt="" className="osp-event-thumb" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                            ) : (
                              <div className="osp-avatar">{e.title.charAt(0)}</div>
                            )}
                            <div>
                              <span className="osp-cell-title" style={{ fontSize: '0.85rem' }}>{e.title}</span>
                              <span className="osp-cell-sub">{e.category_name || 'Other'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="osp-td-muted">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(e.start_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="osp-td-muted">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {e.location.split(',')[0]}
                          </div>
                        </td>
                        <td className="osp-td-muted">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {e.tiers && e.tiers.length > 0 ? (
                              e.tiers.map((t: any) => (
                                <span key={t.id} style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'white' }}>
                                  {t.name} (KES {t.price})
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>No Tiers</span>
                            )}
                          </div>
                        </td>
                        <td className="osp-td-muted">
                          <strong>{totalSold}</strong> / {totalCapacity}
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0}% filled
                          </span>
                        </td>
                        <td>
                          <span
                            className="osp-status-badge"
                            style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}
                          >
                            {sm.label}
                          </span>
                          {e.admin_feedback && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#EF4444', marginTop: '4px' }} title={e.admin_feedback}>
                              <ShieldAlert size={10} /> Feedback
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              className="osp-action-btn"
                              title="Delete Permanently"
                              onClick={() => handleDelete(e.id, e.title)}
                              style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.1)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
