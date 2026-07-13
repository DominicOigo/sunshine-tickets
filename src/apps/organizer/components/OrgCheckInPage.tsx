import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RefreshCw, QrCode, Ticket, Scan,
  CheckCircle, Camera, ChevronDown
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import { ordersService } from '../../../lib/ordersService';
import './OrgSubPage.css';

export const OrgCheckInPage: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    organizerService.getMyEvents()
      .then(data => {
        const published = data?.filter((e: any) => e.status === 'published') || [];
        setEvents(published);
        if (published.length > 0) setSelectedEventId(published[0].id);
      })
      .catch(e => toast(e.message, 'error'));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadAttendees = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const data = await organizerService.getOrdersByEvent(selectedEventId);
      setAttendees(data || []);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAttendees(); }, [selectedEventId]);

  const handleCheckIn = async (orderId: string) => {
    try {
      await ordersService.checkIn(orderId);
      toast('Attendee checked in.', 'success');
      loadAttendees();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const attendee = attendees.find(a => a.reference?.toLowerCase() === manualCode.trim().toLowerCase());
    if (!attendee) { toast('Ticket code not found.', 'error'); return; }
    if (attendee.checked_in) { toast('Already checked in.', 'error'); setManualCode(''); return; }
    setScanning(true);
    setTimeout(async () => {
      try {
        await ordersService.checkIn(attendee.id);
        toast(`Access Granted — ${attendee.customer_name}`, 'success');
        setManualCode('');
        loadAttendees();
      } catch (err: any) { toast(err.message, 'error'); }
      finally { setScanning(false); }
    }, 1200);
  };

  const filtered = attendees.filter(a => {
    const q = search.toLowerCase();
    return (a.reference?.toLowerCase().includes(q)) ||
      (a.customer_name?.toLowerCase().includes(q)) ||
      (a.customer_email?.toLowerCase().includes(q));
  });

  const checkedInCount = attendees.filter(a => a.checked_in).length;
  const totalCount = attendees.length;
  const progressPct = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;
  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Camera size={20} style={{ color: 'var(--primary-gold)' }} />
            Gate Check-In
          </h1>
          <p>Scan tickets, search attendees, and manage real-time entry.</p>
        </div>

        <div ref={dropdownRef} style={{ position: 'relative', minWidth: 180 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-gray)', marginBottom: '0.25rem' }}>EVENT</div>
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="osp-event-select"
            style={{ borderColor: showDropdown ? 'rgba(253,184,19,0.3)' : undefined }}
          >
            <span className="osp-event-select-text">{selectedEvent?.title || 'Select an event'}</span>
            <ChevronDown size={14} className="osp-chevron" />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="osp-dropdown"
              >
                {events.map(e => (
                  <button
                    key={e.id}
                    onClick={() => { setSelectedEventId(e.id); setShowDropdown(false); }}
                    className={`osp-dropdown-item ${selectedEventId === e.id ? 'active' : ''}`}
                  >
                    {e.title}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="osp-checkin-layout">
        {/* ═══ LEFT: Attendee List ═══ */}
        <div className="osp-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="osp-toolbar" style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="osp-search" style={{ maxWidth: 'none', flex: 1 }}>
              <Search size={14} />
              <input
                placeholder="Search by name, email, or ref..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="osp-action-btn" onClick={loadAttendees} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{
            padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--text-gray)'
          }}>
            <span>{search ? `${filtered.length} of ${totalCount}` : `${totalCount} attendee${totalCount !== 1 ? 's' : ''}`}</span>
            <span style={{ color: '#22C55E', fontWeight: 700 }}>{checkedInCount} checked in</span>
          </div>

          {loading ? (
            <div className="osp-empty" style={{ padding: '3rem' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="osp-empty" style={{ padding: '3rem' }}>
              {search ? 'No matches found.' : 'No attendees yet.'}
            </div>
          ) : (
            <div className="osp-checkin-list">
              {filtered.map((a, i) => {
                const isIn = a.checked_in;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="osp-checkin-row"
                  >
                    <div className="osp-user-cell" style={{ flex: 1, minWidth: 0 }}>
                      <div className={`osp-avatar ${isIn ? 'checked' : ''}`}>
                        {(a.customer_name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="osp-cell-title">
                          {a.customer_name || '—'}
                          {isIn && <CheckCircle size={11} style={{ color: '#22C55E', flexShrink: 0, marginLeft: 6 }} />}
                        </div>
                        <div className="osp-checkin-meta">
                          <span>{a.tier_name}</span>
                          <span className="osp-ref">{a.reference}</span>
                        </div>
                      </div>
                    </div>
                    {isIn ? (
                      <span className="osp-checkin-badge in">Checked In</span>
                    ) : (
                      <button onClick={() => handleCheckIn(a.id)} className="osp-checkin-btn">
                        Check In
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Scanner + Progress ═══ */}
        <div className="osp-checkin-side">
          <div className="osp-glass-panel">
            <div className="osp-panel-hdr" style={{ marginBottom: '0.6rem' }}>
              <h3>Entry Progress</h3>
              <span className="osp-checkin-pct">{progressPct}%</span>
            </div>
            <div className="osp-checkin-numbers">
              <span className="osp-checkin-big">{checkedInCount}</span>
              <span className="osp-checkin-total">/ {totalCount}</span>
            </div>
            <div className="osp-progress-bar">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`osp-progress-fill ${progressPct === 100 ? 'full' : ''}`}
              />
            </div>
          </div>

          <div className="osp-glass-panel">
            <div className="osp-panel-hdr" style={{ marginBottom: '1rem' }}>
              <h3>Ticket Scanner</h3>
              <Scan size={14} style={{ color: 'var(--primary-gold)' }} />
            </div>

            <div className={`osp-scanner-frame ${scanning ? 'scanning' : ''}`}>
              <div className="osp-scanner-corners">
                <div className="osp-corner tl" />
                <div className="osp-corner tr" />
                <div className="osp-corner bl" />
                <div className="osp-corner br" />
              </div>
              <QrCode size={48} className="osp-scanner-icon" />
              <div className={`osp-scan-line ${scanning ? 'active' : ''}`} />
            </div>

            <form onSubmit={handleManualScan} className="osp-scanner-form">
              <div className="osp-search" style={{ maxWidth: 'none' }}>
                <Ticket size={13} />
                <input
                  type="text"
                  placeholder="Ticket ref (e.g. ORD-B2F89A)"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  className="osp-code-input"
                />
              </div>
              <motion.button
                type="submit"
                disabled={scanning || !manualCode.trim()}
                whileTap={!scanning && manualCode.trim() ? { scale: 0.97 } : {}}
                className={`osp-scan-btn ${!manualCode.trim() || scanning ? 'disabled' : ''}`}
              >
                {scanning ? (
                  <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Scanning...</>
                ) : (
                  <><Scan size={14} /> Scan Ticket</>
                )}
              </motion.button>
            </form>

            <div className="osp-scanner-footer">
              {scanning ? 'Scanning ticket...' : 'Enter a ticket reference manually'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
