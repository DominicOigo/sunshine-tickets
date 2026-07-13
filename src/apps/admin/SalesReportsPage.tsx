import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, CreditCard, Ticket, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './SalesReportsPage.css';

const SalesReportsPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<{
    series: { label: string; transactions: number; revenue: number; customers: number; tickets: number }[];
    summary: { total_revenue: number; total_transactions: number; total_customers: number; total_tickets: number };
    byMethod: { method: string; revenue: number; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: { period: string; from?: string; to?: string } = { period };
      if (from) params.from = from;
      if (to) params.to = to;
      setData(await adminService.getSalesReports(params));
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, from, to]);

  const summary = data?.summary;
  const stats = [
    { label: 'Total Revenue',    value: summary ? `KES ${(summary.total_revenue / 1000).toFixed(0)}K` : '—', color: '#FF9500', icon: <DollarSign size={16} /> },
    { label: 'Transactions',     value: summary ? summary.total_transactions.toLocaleString() : '—',        color: '#2E5BFF', icon: <CreditCard size={16} /> },
    { label: 'Customers',        value: summary ? summary.total_customers.toLocaleString() : '—',           color: '#22C55E', icon: <TrendingUp size={16} /> },
    { label: 'Tickets Sold',     value: summary ? summary.total_tickets.toLocaleString() : '—',             color: '#FF7020', icon: <Ticket size={16} /> },
  ];

  const methodMeta: Record<string, { label: string; color: string }> = {
    mpesa: { label: 'M-Pesa', color: '#22C55E' },
    card:  { label: 'Card',   color: '#2E5BFF' },
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div>
          <h1>Sales Reports</h1>
          <p>View revenue and transaction summaries over time.</p>
        </div>
        <button className="up-filter-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="up-stats">
        {stats.map((s, i) => (
          <div key={i} className="admin-glass-panel up-stat-card">
            <div className="up-stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <span className="up-stat-label">{s.label}</span>
            <span className="up-stat-val" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="up-toolbar">
        <select className="up-select" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <div className="up-search">
          <span>From</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="up-search">
          <span>To</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading reports...</div>
        ) : data?.series?.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Date / Label</th><th>Transactions</th><th>Revenue</th><th>Customers</th><th>Tickets</th></tr>
              </thead>
              <tbody>
                {data.series.map((row, i) => (
                  <motion.tr key={row.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td><span className="admin-cell-title">{row.label}</span></td>
                    <td className="admin-td-muted">{row.transactions.toLocaleString()}</td>
                    <td className="admin-td-rev">KES {row.revenue.toLocaleString()}</td>
                    <td className="admin-td-muted">{row.customers.toLocaleString()}</td>
                    <td className="admin-td-muted">{row.tickets.toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>No report data available.</div>
        )}
      </div>

      <div className="admin-glass-panel">
        <div className="admin-panel-header"><h3>Breakdown by Payment Method</h3></div>
        {data?.byMethod?.length ? (
          <div className="up-method-grid">
            {data.byMethod.map((m) => {
              const meta = methodMeta[m.method] ?? { label: m.method, color: '#888' };
              return (
                <div key={m.method} className="up-method-card">
                  <span className="up-method-label" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="up-method-count">{m.count} transactions</span>
                  <span className="up-method-rev">KES {m.revenue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty-row" style={{ padding: '2rem' }}>No payment method data.</div>
        )}
      </div>
    </div>
  );
};

export default SalesReportsPage;
