import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';

interface TopBuyer {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
  total_spent: number;
  orders: number;
}

interface UserSegments {
  totalUsers: number;
  byRole: { role: string; count: number }[];
  signupTrend: { label: string; value: number }[];
  spendSummary: { total_spent: number; active_buyers: number; avg_lifetime: number };
  topBuyers: TopBuyer[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#FF9500',
  organizer: '#2E5BFF',
  customer: '#22C55E',
};

const UserAnalyticsPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<UserSegments | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUserSegments();
      setData(res);
    } catch (e: any) {
      toast(e.message || 'Failed to load user analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const spendSummary = data?.spendSummary;
  const totalSpent = spendSummary?.total_spent ?? 0;
  const activeBuyers = spendSummary?.active_buyers ?? 0;
  const avgLifetime = spendSummary?.avg_lifetime ?? 0;

  const statCards = [
    { label: 'Total Users', value: data?.totalUsers ?? 0, icon: <Users size={18} />, color: '#2E5BFF' },
    { label: 'Active Buyers', value: activeBuyers, icon: <UserCheck size={18} />, color: '#22C55E' },
    { label: 'Avg Lifetime Value', value: `KES ${(avgLifetime).toLocaleString()}`, icon: <TrendingUp size={18} />, color: '#FF9500' },
    { label: 'Total Spent', value: `KES ${(totalSpent).toLocaleString()}`, icon: <DollarSign size={18} />, color: '#00F2FE' },
  ];

  const byRole = data?.byRole ?? [];
  const totalRoles = byRole.reduce((s, r) => s + r.count, 0);

  const signupTrend = data?.signupTrend ?? [];

  const topBuyers = data?.topBuyers ?? [];

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>User Analytics</h1><p>User segments, signup trends, and top buyers.</p></div>
        <button className="up-add-btn" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-gray)' }} onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading user analytics...</div>
      ) : (
        <>
          <div className="up-stats">
            {statCards.map((s, i) => (
              <motion.div key={i} className="admin-glass-panel up-stat-card"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <span className="up-stat-label">{s.label}</span>
                <span className="up-stat-val" style={{ color: s.color }}>{s.value}</span>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <motion.div className="admin-glass-panel" style={{ padding: '1.25rem' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Users by Role</h3>
              {byRole.length === 0 ? (
                <div className="admin-empty-row" style={{ padding: '1.5rem' }}>No role data available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {byRole.map((r) => {
                    const pct = totalRoles > 0 ? ((r.count / totalRoles) * 100).toFixed(1) : '0';
                    return (
                      <div key={r.role}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--text-gray)', textTransform: 'capitalize' }}>{r.role}</span>
                          <span style={{ color: 'var(--text-light)' }}>{r.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <motion.div style={{ height: '100%', borderRadius: 4, background: ROLE_COLORS[r.role] || '#888' }}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div className="admin-glass-panel" style={{ padding: '1.25rem' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Signup Trend</h3>
              {signupTrend.length === 0 ? (
                <div className="admin-empty-row" style={{ padding: '1.5rem' }}>No signup data available.</div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Month</th><th>Signups</th></tr>
                    </thead>
                    <tbody>
                      {signupTrend.map((row, i) => (
                        <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                          <td className="admin-cell-title">{row.label}</td>
                          <td className="admin-td-muted">{row.value.toLocaleString()}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>

          <motion.div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden', marginTop: '1.25rem' }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ padding: '1.25rem 1.25rem 0' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Top Buyers</h3>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {topBuyers.length === 0 && (
                    <tr><td colSpan={6} className="admin-empty-row">No buyer data yet.</td></tr>
                  )}
                  {topBuyers.map((b, i) => (
                    <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="admin-td-muted">{i + 1}</td>
                      <td><span className="admin-cell-title">{b.full_name}</span></td>
                      <td className="admin-td-muted">{b.email}</td>
                      <td className="admin-td-muted">{b.orders}</td>
                      <td className="admin-td-muted">KES {b.total_spent.toLocaleString()}</td>
                      <td className="admin-td-muted">{new Date(b.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default UserAnalyticsPage;
