import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, X, AlertTriangle, Eye, Calendar, Ticket, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEvents, Event } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from './AdminDashboard';
import './EventApprovalsPage.css';

type ApprovalTab = 'overview' | 'ticket-types' | 'organizer' | 'additional';

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal: React.FC<{ event: Event; onConfirm: (fb: string) => void; onCancel: () => void }> = ({ event, onConfirm, onCancel }) => {
  const [fb, setFb] = useState('');
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <motion.div className="admin-modal" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="admin-modal-header">
          <AlertTriangle size={18} style={{ color: '#EF4444' }} />
          <h3>Reject Event</h3>
          <button onClick={onCancel}><X size={16} /></button>
        </div>
        <p className="admin-modal-sub">Provide feedback for <strong>{event.title}</strong>. The organizer will see this.</p>
        <textarea className="admin-modal-textarea" rows={4} placeholder="e.g. Incomplete description, missing venue details..."
          value={fb} onChange={e => setFb(e.target.value)} />
        <div className="admin-modal-actions">
          <button className="admin-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="admin-btn-danger" onClick={() => onConfirm(fb)} disabled={!fb.trim()}>
            <XCircle size={14} /> Reject Event
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const EventApprovalsPage: React.FC<{ onNavigate: (p: any) => void }> = ({ onNavigate: _onNavigate }) => {
  const { events, approveEvent, rejectEvent } = useEvents();
  const { toast } = useToast();
  const navigate = useNavigate();

  const pending = events.filter(e => e.status === 'pending_approval');
  const [selected, setSelected] = useState<Event | null>(pending[0] ?? null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ApprovalTab>('overview');
  const [rejectTarget, setRejectTarget] = useState<Event | null>(null);

  const filtered = pending.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.organizerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = (e: Event) => {
    approveEvent(e.id);
    toast(`"${e.title}" approved and published.`, 'success');
    setSelected(pending.filter(p => p.id !== e.id)[0] ?? null);
  };

  const handleReject = (fb: string) => {
    if (!rejectTarget) return;
    rejectEvent(rejectTarget.id, fb);
    toast(`"${rejectTarget.title}" rejected.`, 'info');
    setSelected(pending.filter(p => p.id !== rejectTarget.id)[0] ?? null);
    setRejectTarget(null);
  };

  return (
    <div className="approvals-shell">
      <AnimatePresence>{rejectTarget && <RejectModal event={rejectTarget} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />}</AnimatePresence>

      {/* Page heading */}
      <div className="approvals-heading">
        <div>
          <h1>Event Approvals</h1>
          <p>Review and take action on pending event submissions.</p>
        </div>
      </div>

      <div className="approvals-layout">
        {/* ── Left: list ── */}
        <div className="approvals-list-panel admin-glass-panel">
          <div className="approvals-list-header">
            <span className="approvals-count">Pending Events ({pending.length})</span>
            <div className="approvals-search">
              <Search size={13} />
              <input placeholder="Search pending events..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="approvals-list">
            {filtered.length === 0 && (
              <div className="approvals-empty">
                <CheckCircle size={32} style={{ color: '#22C55E', marginBottom: '0.5rem' }} />
                <p>No pending events.</p>
              </div>
            )}
            {filtered.map(e => (
              <button
                key={e.id}
                className={`approvals-list-item ${selected?.id === e.id ? 'active' : ''}`}
                onClick={() => { setSelected(e); setTab('overview'); }}
              >
                {e.image && <img src={e.image} alt="" className="approvals-item-thumb" />}
                <div className="approvals-item-info">
                  <strong>{e.title}</strong>
                  <span>{e.organizerName}</span>
                  <span className="approvals-item-meta">{e.location.split(',')[0]} · Submitted {e.date}</span>
                </div>
                <span className="approvals-item-dot" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: detail ── */}
        <div className="approvals-detail">
          {!selected ? (
            <div className="admin-glass-panel approvals-empty-detail">
              <p>Select an event from the list to review.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {/* Detail header */}
                <div className="admin-glass-panel approvals-detail-header">
                  {selected.image && <img src={selected.image} alt="" className="approvals-banner" />}
                  <div className="approvals-detail-meta">
                    <div className="approvals-detail-top">
                      <div>
                        <h2>{selected.title}</h2>
                        <div className="approvals-detail-badges">
                          <StatusBadge status={selected.status} />
                          <span className="approvals-meta-chip"><Calendar size={11}/> {selected.date}</span>
                          <span className="approvals-meta-chip"><Ticket size={11}/> {selected.tiers.reduce((s,t)=>s+t.capacity,0).toLocaleString()} Tickets Expected</span>
                          <span className="approvals-meta-chip"><Tag size={11}/> Conference</span>
                        </div>
                      </div>
                    </div>
                    <div className="approvals-detail-actions">
                      <button className="approvals-btn-approve" onClick={() => handleApprove(selected)}>
                        <CheckCircle size={16} /> Approve Event
                      </button>
                      <button className="approvals-btn-reject" onClick={() => setRejectTarget(selected)}>
                        <XCircle size={16} /> Reject Event
                      </button>
                      <button className="approvals-btn-view" onClick={() => navigate(`/event/${selected.id}`)}>
                        <Eye size={16} /> View Full Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="approvals-tabs">
                  {(['overview','ticket-types','organizer','additional'] as ApprovalTab[]).map(t => (
                    <button key={t} className={`approvals-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                      {t === 'ticket-types' ? 'Ticket Types' : t === 'additional' ? 'Additional Info' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                    {tab === 'overview' && (
                      <div className="approvals-overview-grid">
                        <div className="admin-glass-panel">
                          <h4>Event Information</h4>
                          <dl className="approvals-dl">
                            <dt>Event Name</dt><dd>{selected.title}</dd>
                            <dt>Category</dt><dd>Conference</dd>
                            <dt>Date</dt><dd>{selected.date}</dd>
                            <dt>Time</dt><dd>9:00 AM – 6:00 PM</dd>
                            <dt>Venue</dt><dd>{selected.location}</dd>
                          </dl>
                          <p className="approvals-desc">{selected.description}</p>
                        </div>
                        <div className="admin-glass-panel">
                          <h4>Organizer Information</h4>
                          <div className="approvals-org-row">
                            <div className="approvals-org-avatar">{selected.organizerName.charAt(0)}</div>
                            <div>
                              <strong>{selected.organizerName}</strong>
                              <span className="approvals-org-since">Verified Organizer · Member since Jan 2023</span>
                            </div>
                          </div>
                          <dl className="approvals-dl" style={{ marginTop: '1rem' }}>
                            <dt>Email</dt><dd>{selected.organizerEmail || 'N/A'}</dd>
                            <dt>Events Hosted</dt><dd>{events.filter(e => e.organizerId === selected.organizerId).length}</dd>
                          </dl>
                        </div>
                      </div>
                    )}

                    {tab === 'ticket-types' && (
                      <div className="admin-glass-panel">
                        <h4 style={{ marginBottom: '1rem' }}>Ticket Tiers</h4>
                        <table className="admin-table">
                          <thead><tr><th>Tier</th><th>Price</th><th>Capacity</th><th>Sold</th><th>Available</th></tr></thead>
                          <tbody>
                            {selected.tiers.map((t, i) => (
                              <tr key={i}>
                                <td className="admin-cell-title">{t.name}</td>
                                <td className="admin-td-rev">{t.price}</td>
                                <td className="admin-td-muted">{t.capacity.toLocaleString()}</td>
                                <td className="admin-td-muted">{t.sold.toLocaleString()}</td>
                                <td className="admin-td-muted">{(t.capacity - t.sold).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {tab === 'organizer' && (
                      <div className="admin-glass-panel">
                        <h4 style={{ marginBottom: '1rem' }}>Organizer Profile</h4>
                        <div className="approvals-org-row" style={{ marginBottom: '1.25rem' }}>
                          <div className="approvals-org-avatar">{selected.organizerName.charAt(0)}</div>
                          <div>
                            <strong style={{ color: 'white', fontWeight: 800 }}>{selected.organizerName}</strong>
                            <span className="approvals-org-since">Verified Organizer · Member since Jan 2023</span>
                          </div>
                        </div>
                        <dl className="approvals-dl">
                          <dt>Email</dt><dd>{selected.organizerEmail || 'N/A'}</dd>
                          <dt>Total Events</dt><dd>{events.filter(e => e.organizerId === selected.organizerId).length}</dd>
                          <dt>Total Revenue</dt><dd>KES {(events.filter(e=>e.organizerId===selected.organizerId).reduce((s,e)=>s+e.tiers.reduce((ts,t)=>ts+(t.priceInt ?? 0)*t.sold,0),0)/1000).toFixed(0)}K</dd>
                        </dl>
                      </div>
                    )}

                    {tab === 'additional' && (
                      <div className="admin-glass-panel">
                        <h4 style={{ marginBottom: '1rem' }}>Additional Information</h4>
                        <dl className="approvals-dl">
                          <dt>Event ID</dt><dd style={{ fontFamily: 'monospace' }}>{selected.id}</dd>
                          <dt>Organizer ID</dt><dd style={{ fontFamily: 'monospace' }}>{selected.organizerId}</dd>
                          <dt>Availability</dt><dd>{selected.availability}%</dd>
                          <dt>Trending</dt><dd>{selected.trending ? 'Yes' : 'No'}</dd>
                          {selected.adminFeedback && <><dt>Previous Feedback</dt><dd>{selected.adminFeedback}</dd></>}
                        </dl>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventApprovalsPage;
