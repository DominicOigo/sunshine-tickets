import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Ticket, TrendingUp, DollarSign, RefreshCw, MoreHorizontal } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './OrdersPage.css';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Completed', color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  pending:   { label: 'Pending',   color: '#FF9500', bg: 'rgba(255,149,0,0.1)'  },
  refunded:  { label: 'Refunded',  color: '#00F2FE', bg: 'rgba(0,242,254,0.1)'  },
  failed:    { label: 'Failed',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
  cancelled: { label: 'Cancelled', color: '#888',    bg: 'rgba(255,255,255,0.05)'},
};

const PER_PAGE = 8;

const OrdersPage: React.FC = () => {
  const { toast } = useToast();
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [page,     setPage]     = useState(1);

  const load = async () => {
    setLoading(true);
    try { setOrders(await adminService.getOrders(200)); }
    catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      (o.reference?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.event_title?.toLowerCase().includes(q)) &&
      (statusF === 'all' || o.status === statusF)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalRevenue  = orders.filter(o => o.status === 'confirmed').reduce((s: number, o: any) => s + o.total_amount, 0);
  const totalRefunded = orders.filter(o => o.status === 'refunded').reduce((s: number, o: any) => s + o.total_amount, 0);

  const stats = [
    { label: 'Total Orders',  value: orders.length,                                          color: '#FF7020', icon: <Ticket size={16}/> },
    { label: 'Completed',     value: orders.filter(o => o.status === 'confirmed').length,    color: '#22C55E', icon: <TrendingUp size={16}/> },
    { label: 'Total Revenue', value: `KES ${(totalRevenue / 1000).toFixed(0)}K`,             color: '#FF9500', icon: <DollarSign size={16}/> },
    { label: 'Refunded',      value: `KES ${(totalRefunded / 1000).toFixed(0)}K`,            color: '#EF4444', icon: <RefreshCw size={16}/> },
  ];

  return (
    <div className="op-shell">
      <div className="op-heading">
        <div><h1>Orders &amp; Tickets</h1><p>Track all ticket purchases and order history.</p></div>
        <button className="op-export-btn" onClick={() => toast('Export feature coming soon.', 'info')}><Download size={15}/> Export CSV</button>
      </div>

      <div className="op-stats">
        {stats.map((s, i) => (
          <div key={i} className="admin-glass-panel op-stat-card">
            <div className="op-stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <span className="op-stat-label">{s.label}</span>
            <span className="op-stat-val" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="op-toolbar">
        <div className="op-search">
          <Search size={14}/>
          <input placeholder="Search by order ref, customer, event..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <div className="op-filters">
          <select className="op-select" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="confirmed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <button className="op-filter-btn"><Filter size={14}/> Filters</button>
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading orders...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Order Ref</th><th>Customer</th><th>Event</th><th>Tier</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {paged.length === 0 && <tr><td colSpan={9} className="admin-empty-row">No orders found.</td></tr>}
                {paged.map((o, i) => {
                  const sm = STATUS_META[o.status] ?? STATUS_META.pending;
                  return (
                    <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td><span className="op-ref">{o.reference}</span></td>
                      <td>
                        <div className="op-customer-cell">
                          <div className="op-avatar">{(o.customer_name ?? '?').charAt(0)}</div>
                          <div>
                            <span className="admin-cell-title">{o.customer_name ?? '—'}</span>
                            <span className="admin-cell-sub">{o.customer_email ?? ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td-muted">{o.event_title ?? '—'}</td>
                      <td className="admin-td-muted">{o.tier_name ?? '—'}</td>
                      <td className="admin-td-muted">{o.quantity}</td>
                      <td className="admin-td-rev">KES {(o.total_amount ?? 0).toLocaleString()}</td>
                      <td className="admin-td-muted">{new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                      <td>
                        <span className="op-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>{sm.label}</span>
                      </td>
                      <td><button className="op-action-btn" onClick={() => toast('Full details require backend.', 'info')}><MoreHorizontal size={14}/></button></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="op-pagination">
          <span className="op-count">Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="op-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`op-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
