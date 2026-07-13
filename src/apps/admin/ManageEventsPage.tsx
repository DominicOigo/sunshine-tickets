import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreVertical, Eye, CheckCircle, XCircle, Trash2, X, AlertTriangle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEvents, Event } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from './AdminDashboard';
import './ManageEventsPage.css';

type FilterStatus = 'all' | Event['status'];

// ─── 3-dot menu ──────────────────────────────────────────────────────────────
const RowMenu: React.FC<{
  event: Event;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}> = ({ event, onView, onApprove, onReject, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="mep-menu-wrap" ref={ref}>
      <button className="mep-menu-btn" onClick={() => setOpen(o => !o)}><MoreVertical size={15} /></button>
      <AnimatePresence>
        {open && (
          <motion.div className="mep-dropdown"
            initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}>
            <button onClick={() => { onView(); setOpen(false); }}><Eye size={14} /> View Details</button>
            {event.status === 'pending_approval' && <>
              <button className="mep-dd-approve" onClick={() => { onApprove(); setOpen(false); }}><CheckCircle size={14} /> Approve Event</button>
              <button className="mep-dd-reject"  onClick={() => { onReject();  setOpen(false); }}><XCircle size={14} /> Reject Event</button>
            </>}
            <div className="mep-dd-divider" />
            <button className="mep-dd-delete" onClick={() => { onDelete(); setOpen(false); }}><Trash2 size={14} /> Delete Event</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal: React.FC<{ event: Event; onConfirm: (fb: string) => void; onCancel: () => void }> = ({ event, onConfirm, onCancel }) => {
  const [fb, setFb] = useState('');
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <motion.div className="admin-modal" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="admin-modal-header">
          <AlertTriangle size={18} style={{ color: '#EF4444' }} />
          <h3>Reject Event</h3>
          <button onClick={onCancel}><X size={16} /></button>
        </div>
        <p className="admin-modal-sub">Provide feedback for <strong>{event.title}</strong>.</p>
        <textarea className="admin-modal-textarea" rows={4} placeholder="e.g. Incomplete description..."
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
const ManageEventsPage: React.FC<{ onNavigate: (p: any) => void }> = ({ onNavigate }) => {
  const { events, approveEvent, rejectEvent, deleteEvent } = useEvents();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [rejectTarget, setRejectTarget] = useState<Event | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.title.toLowerCase().includes(q) || e.organizerName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleApprove = (e: Event) => { approveEvent(e.id); toast(`"${e.title}" approved.`, 'success'); };
  const handleReject = (fb: string) => {
    if (!rejectTarget) return;
    rejectEvent(rejectTarget.id, fb); toast(`"${rejectTarget.title}" rejected.`, 'info'); setRejectTarget(null);
  };
  const handleDelete = (e: Event) => { deleteEvent(e.id); toast(`"${e.title}" deleted.`, 'error'); };

  const statusCounts: Record<string, number> = {
    all: events.length,
    published: events.filter(e => e.status === 'published').length,
    pending_approval: events.filter(e => e.status === 'pending_approval').length,
    rejected: events.filter(e => e.status === 'rejected').length,
    draft: events.filter(e => e.status === 'draft').length,
  };

  return (
    <div className="mep-shell">
      <AnimatePresence>{rejectTarget && <RejectModal event={rejectTarget} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />}</AnimatePresence>

      {/* Heading */}
      <div className="mep-heading">
        <div>
          <h1>Manage Events</h1>
          <p>View and manage all events in the platform.</p>
        </div>
        <button className="mep-add-btn" onClick={() => onNavigate('event-approvals')}>
          <Plus size={15} /> Add New Event
        </button>
      </div>

      {/* Toolbar */}
      <div className="mep-toolbar">
        <div className="mep-search">
          <Search size={14} />
          <input placeholder="Search events..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="mep-filters">
          <select className="mep-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as FilterStatus); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="pending_approval">Pending Review</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
          <select className="mep-select"><option>All Categories</option></select>
          <button className="mep-filter-btn"><Filter size={14} /> Filters</button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Event</th><th>Organizer</th><th>Date</th><th>Tickets</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paged.length === 0 && <tr><td colSpan={6} className="admin-empty-row">No events match your filters.</td></tr>}
              {paged.map((e, i) => {
                const sold = e.tiers.reduce((s, t) => s + t.sold, 0);
                return (
                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="admin-event-cell">
                        {e.image && <img src={e.image} alt="" className="admin-event-thumb" />}
                        <div>
                          <span className="admin-cell-title">{e.title}</span>
                          <span className="admin-cell-sub">{e.location.split(',')[0]}</span>
                        </div>
                      </div>
                    </td>
                    <td className="admin-td-muted">{e.organizerName}</td>
                    <td className="admin-td-muted">{e.date}</td>
                    <td className="admin-td-muted">{sold.toLocaleString()}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>
                      <RowMenu
                        event={e}
                        onView={() => navigate(`/event/${e.id}`)}
                        onApprove={() => handleApprove(e)}
                        onReject={() => setRejectTarget(e)}
                        onDelete={() => handleDelete(e)}
                      />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mep-pagination">
          <span className="mep-count">Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} events</span>
          <div className="mep-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`mep-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            {totalPages > 5 && <span className="mep-ellipsis">... {totalPages}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEventsPage;
