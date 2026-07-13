import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Ticket, DollarSign, Users, RefreshCw, MoreHorizontal, Filter } from 'lucide-react';
import { useEvents } from '../../../context/EventContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import { ordersService } from '../../../lib/ordersService';
import './OrgSubPage.css';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  pending:   { label: 'Pending',   color: '#FF9500', bg: 'rgba(255,149,0,0.1)'  },
  refunded:  { label: 'Refunded',  color: '#00F2FE', bg: 'rgba(0,242,254,0.1)'  },
  failed:    { label: 'Failed',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
};

const PER_PAGE = 8;

const OrgOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { events } = useEvents();
  const { toast } = useToast();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);

  const myEventIds = new Set(events.filter(e => e.organizerId === user?.id).map(e => e.id));

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await organizerService.getMyOrders(user.id);
      setOrders(all.filter((o: any) => myEventIds.has(o.event_id)));
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, events.length]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return o.reference?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.event_title?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalRevenue  = orders.filter(o => o.status === 'confirmed').reduce((s: number, o: any) => s + o.total_amount, 0);
  const totalAttendees = orders.reduce((s: number, o: any) => s + o.quantity, 0);
  const checkedIn     = orders.filter(o => o.checked_in).reduce((s: number, o: any) => s + o.quantity, 0);

  const stats = [
    { label: 'Total Orders',  value: orders.length,                           color: '#FF9500', icon: <Ticket size={16}/> },
    { label: 'Attendees',     value: totalAttendees,                          color: '#2E5BFF', icon: <Users size={16}/> },
    { label: 'Revenue',       value: `KES ${(totalRevenue/1000).toFixed(1)}K`,color: '#22C55E', icon: <DollarSign size={16}/> },
    { label: 'Checked In',    value: checkedIn,                               color: '#00F2FE', icon: <RefreshCw size={16}/> },
  ];

  const checkIn = async (orderId: string) => {
    try {
      await ordersService.checkIn(orderId);
      toast('Attendee checked in.', 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div><h1>Orders &amp; Attendees</h1><p>Manage ticket orders and track attendee check-ins.</p></div>
        <button className="osp-export-btn" onClick={() => toast('Export coming soon.', 'info')}><Download size={14}/> Export</button>
      </div>

      <div className="osp-stats">
        {stats.map((s, i) => (
          <div key={i} className="osp-stat-card">
            <div className="osp-stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <span className="osp-stat-label">{s.label}</span>
            <span className="osp-stat-val" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="osp-toolbar">
        <div className="osp-search">
          <Search size={14}/>
          <input placeholder="Search orders, attendees..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <button className="osp-filter-btn"><Filter size={14}/> Filters</button>
      </div>

      <div className="osp-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading orders...</div> : (
          <div className="osp-table-wrap">
            <table className="osp-table">
              <thead><tr><th>Order</th><th>Attendee</th><th>Event</th><th>Tier</th><th>Qty</th><th>Total</th><th>Check-in</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {paged.length === 0 && <tr><td colSpan={9} className="admin-empty-row">No orders found.</td></tr>}
                {paged.map((o, i) => {
                  const sm = STATUS_META[o.status] ?? STATUS_META.pending;
                  return (
                    <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td><span className="osp-ref">{o.reference}</span></td>
                      <td>
                        <div className="osp-user-cell">
                          <div className="osp-avatar">{(o.customer_name ?? '?').charAt(0)}</div>
                          <div>
                            <span className="osp-cell-title">{o.customer_name ?? '—'}</span>
                            <span className="osp-cell-sub">{o.customer_email ?? ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="osp-td-muted">{o.event_title ?? '—'}</td>
                      <td className="osp-td-muted">{o.tier_name ?? '—'}</td>
                      <td className="osp-td-muted">{o.quantity}</td>
                      <td className="osp-td-rev">KES {(o.total_amount ?? 0).toLocaleString()}</td>
                      <td>
                        {o.checked_in
                          ? <span className="osp-checkin-badge in">Checked In</span>
                          : <button className="osp-filter-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', height: 'auto' }} onClick={() => checkIn(o.id)}>Check In</button>
                        }
                      </td>
                      <td><span className="osp-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>{sm.label}</span></td>
                      <td><button className="osp-action-btn"><MoreHorizontal size={14}/></button></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="osp-pagination">
          <span className="osp-count">Showing {Math.min((page-1)*PER_PAGE+1,filtered.length)}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}</span>
          <div className="osp-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`osp-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgOrdersPage;
