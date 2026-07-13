import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useEvents } from '../../../context/EventContext';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import './OrgSubPage.css';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  completed:  { label: 'Paid',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  pending:    { label: 'Pending',    color: '#FF9500', bg: 'rgba(255,149,0,0.1)'  },
  processing: { label: 'Processing', color: '#2E5BFF', bg: 'rgba(46,91,255,0.1)'  },
  failed:     { label: 'Failed',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
};

const OrgPayoutsPage: React.FC = () => {
  const { user } = useAuth();
  const { events } = useEvents();
  const { toast } = useToast();
  const [payouts,    setPayouts]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try { setPayouts(await organizerService.getMyPayouts(user.id)); }
    catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const totalPaid    = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + p.net_amount, 0);
  const totalPending = payouts.filter(p => p.status !== 'completed').reduce((s, p) => s + p.net_amount, 0);

  // Calculate available revenue from confirmed orders not yet paid out
  const totalRevenue = events
    .filter(e => e.organizerId === user?.id)
    .reduce((s, e) => s + e.tiers.reduce((ts, t) => ts + t.priceInt * t.sold, 0), 0);
  const available = Math.max(0, totalRevenue - totalPaid);

  const requestPayout = async () => {
    const myEvents = events.filter(e => e.organizerId === user?.id && e.status === 'published');
    if (!user || myEvents.length === 0 || available <= 0) {
      toast('No funds available for payout.', 'info'); return;
    }
    setRequesting(true);
    try {
      await organizerService.requestPayout(user.id, myEvents[0].id, available);
      toast('Payout request submitted. Admin will process within 2–3 business days.', 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setRequesting(false); }
  };

  const stats = [
    { label: 'Total Paid Out',  value: `KES ${(totalPaid/1000).toFixed(1)}K`,    color: '#22C55E', icon: <CheckCircle size={16}/> },
    { label: 'Pending Payout',  value: `KES ${(totalPending/1000).toFixed(1)}K`, color: '#FF9500', icon: <Clock size={16}/> },
    { label: 'Platform Fee 5%', value: `KES ${payouts.reduce((s,p)=>s+p.fee_amount,0).toLocaleString()}`, color: '#EF4444', icon: <DollarSign size={16}/> },
    { label: 'Available',       value: `KES ${(available/1000).toFixed(1)}K`,    color: '#2E5BFF', icon: <TrendingUp size={16}/> },
  ];

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div><h1>Payouts</h1><p>Track your earnings and payout history.</p></div>
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

      <div className="osp-glass-panel osp-payout-cta">
        <div>
          <strong>Available for Payout</strong>
          <span>KES {(available/1000).toFixed(1)}K ready to be transferred</span>
        </div>
        <button className="osp-primary-btn" onClick={requestPayout} disabled={requesting || available <= 0}>
          {requesting ? 'Requesting...' : 'Request Payout'}
        </button>
      </div>

      <div className="osp-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading payouts...</div> : (
          <div className="osp-table-wrap">
            <table className="osp-table">
              <thead><tr><th>Reference</th><th>Event</th><th>Gross</th><th>Fee (5%)</th><th>Net</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {payouts.length === 0 && <tr><td colSpan={8} className="admin-empty-row">No payouts yet. Request your first payout above.</td></tr>}
                {payouts.map((p, i) => {
                  const sm = STATUS_META[p.status] ?? STATUS_META.pending;
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <td><span className="osp-ref">{p.reference}</span></td>
                      <td className="osp-td-muted">{p.events?.title ?? '—'}</td>
                      <td className="osp-td-muted">KES {p.gross_amount.toLocaleString()}</td>
                      <td style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 700 }}>− KES {p.fee_amount.toLocaleString()}</td>
                      <td className="osp-td-rev">KES {p.net_amount.toLocaleString()}</td>
                      <td className="osp-td-muted">{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                      <td><span className="osp-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>{sm.label}</span></td>
                      <td><button className="osp-action-btn"><MoreHorizontal size={14}/></button></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgPayoutsPage;
