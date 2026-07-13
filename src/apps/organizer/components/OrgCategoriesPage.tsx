import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Sparkles, FolderHeart } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import './OrgSubPage.css';

export const OrgCategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const cats = await organizerService.getCategories();
      const evs = await organizerService.getMyEvents();
      setCategories(cats ?? []);
      setEvents(evs ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>Event Categories</h1>
          <p>Explore the categories you can classify your events under.</p>
        </div>
      </div>

      {loading ? (
        <div className="osp-glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          Loading categories...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {categories.map((c, i) => {
            const count = events.filter(e => e.category_id === c.id).length;
            return (
              <motion.div
                key={c.id}
                className="osp-glass-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  background: 'rgba(12,13,18,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(255,149,0,0.1)',
                    border: '1px solid rgba(255,149,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF9500',
                    flexShrink: 0
                  }}
                >
                  <Tag size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 800 }}>{c.name}</h3>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '2px' }}>
                    slug: <code style={{ color: '#FF7020', background: 'rgba(255,255,255,0.03)', padding: '1px 4px', borderRadius: '4px' }}>{c.slug}</code>
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: count > 0 ? '#22C55E' : 'var(--text-muted)',
                      marginTop: '8px'
                    }}
                  >
                    <FolderHeart size={13} />
                    {count === 1 ? '1 event' : `${count} events`} hosted by you
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
