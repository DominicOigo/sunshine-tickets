import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Bell, Calendar, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import './OrgSubPage.css';

export const OrgAnnouncementsPage: React.FC = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await organizerService.getAnnouncements();
      setAnnouncements(data ?? []);
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
          <h1>System Announcements</h1>
          <p>Important updates, platform announcements, and administrative circulars.</p>
        </div>
      </div>

      <div className="osp-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {loading ? (
          <div className="osp-empty" style={{ padding: '3rem' }}>
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="osp-empty" style={{ padding: '4rem' }}>
            <Megaphone size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p>No platform announcements have been posted yet.</p>
          </div>
        ) : (
          announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,149,0,0.1)',
                  border: '1px solid rgba(255,149,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF9500',
                  flexShrink: 0
                }}
              >
                <Bell size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{a.title}</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={11} />
                    {new Date(a.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--text-gray)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {a.body}
                </p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,112,32,0.1)', color: '#FF7020', fontWeight: 'bold' }}>
                    Audience: {a.audience.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-gray)' }}>
                    Official platform release
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
export default OrgAnnouncementsPage;
