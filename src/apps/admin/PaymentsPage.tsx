import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, CreditCard, TrendingUp, RefreshCw, AlertCircle, MoreHorizontal } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './PaymentsPage.css';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  success:  { label: 'Success',  color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  pending:  { label: 'Pending',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)'  },
  failed:   { label: 'Failed',   color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
  refunded: { label: 'Refunded', color: '#00F2FE', bg: 'rgba(0,242,254,0.1)'  },
};

const PER_PAGE = 8;

const PaymentsPage: React.FC = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [methodF,  setMethodF]  = useState('all');
  const [page,     setPage]     = useState(1);

  const load = async () => {
    setLoading(true);
    try { setPayments(await adminService.getPayments(200)); }
    catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter(t => {
    const q = search.toLowerCase();
    return (
      (t.reference?.toLowerCase().includes(q) || (t.orders?.profiles?.full_name ?? '').toLowerCase().includes(q) || (t.mpesa_code ?? '').toLowerCase().includes(q)) &&
      (statusF === 'all' || t.status === statusF) &&
      (methodF === 'all' || t.method === methodF)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalVol   = payments.filter(t => t.status === 'success').reduce((s: number, t: any) => s + t.amount, 0);
  const pendingVol = payments.filter(t => t.status === 'pending').reduce((s: number, t: any) => s + t.amount, 0);

  const stats = [
    { label: 'Total Transactions', value: payments.length,  color: '#2E5BFF', icon: <CreditCard size={16}/> },
    { label: 'Success Rate',       value: payments.length ? `${Math.round(payments.filter(t=>t.status==='success').length/payments.length*100)}%` : '0%', color: '#22C55E', icon: <TrendingUp size={16}/> },
    { label: 'Volume Processed',   value: `KES ${(totalVol/1000).toFixed(0)}K`, color: '#FF9500', icon: <CreditCard size={16}/> },
    { label: 'Pending Volume',     value: `KES ${(pendingVol/1000).toFixed(0)}K`, color: '#FF7020', icon: <RefreshCw size={16}/> },
  ];

  return (
    <div className="pp-shell">
      <div className="pp-heading">
        <div><h1>Payments</h1><p>Monitor all M-Pesa and card transactions.</p></div>
        <button className="pp-export-btn" onClick={() => toast('Export feature coming soon.', 'info')}><Download size={15}/> Export CSV</button>
      </div>

      <div className="pp-stats">
        {stats.map((s, i) => (
          <div key={i} className="admin-glass-panel pp-stat-card">
            <div className="pp-stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <span className="pp-stat-label">{s.label}</span>
            <span className="pp-stat-val" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="pp-toolbar">
        <div className="pp-search">
          <Search size={14}/>
          <input placeholder="Search by ref, customer, M-Pesa code..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <div className="pp-filters">
          <select className="pp-select" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select className="pp-select" value={methodF} onChange={e => { setMethodF(e.target.value); setPage(1); }}>
            <option value="all">All Methods</option>
            <option value="mpesa">M-Pesa</option>
            <option value="card">Card</option>
          </select>
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading payments...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Ref</th><th>Customer</th><th>Event</th><th>Amount</th><th>Method</th><th>M-Pesa Code</th><th>Date</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {paged.length === 0 && <tr><td colSpan={9} className="admin-empty-row">No transactions found.</td></tr>}
                {paged.map((t, i) => {
                  const sm = STATUS_META[t.status] ?? STATUS_META.pending;
                  const customerName = t.orders?.profiles?.full_name ?? '—';
                  const eventTitle   = t.orders?.events?.title ?? '—';
                  return (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td><span className="pp-ref">{t.reference}</span></td>
                      <td>
                        <div className="pp-customer-cell">
                          <div className="pp-avatar">{customerName.charAt(0)}</div>
                          <div>
                            <span className="admin-cell-title">{customerName}</span>
                            <span className="admin-cell-sub">{t.orders?.profiles?.email ?? ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td-muted">{eventTitle}</td>
                      <td className="admin-td-rev">KES {t.amount.toLocaleString()}</td>
                      <td>
                        <span className={`pp-method-badge ${t.method === 'mpesa' ? 'mpesa' : 'card'}`}>
                          {t.method === 'mpesa' ? 'M-Pesa' : 'Card'}
                        </span>
                      </td>
                      <td className="pp-code">{t.mpesa_code ?? '—'}</td>
                      <td className="admin-td-muted">{new Date(t.created_at).toLocaleDateString('en-KE')}</td>
                      <td>
                        <span className="pp-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>
                          {t.status === 'failed' && <AlertCircle size={10}/>} {sm.label}
                        </span>
                      </td>
                      <td><button className="pp-action-btn" onClick={() => toast('Full details require backend.', 'info')}><MoreHorizontal size={14}/></button></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="pp-pagination">
          <span className="pp-count">Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="pp-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pp-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
