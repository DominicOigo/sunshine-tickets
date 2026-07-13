import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Filter, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './ActivityLogsPage.css';

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.suspended', label: 'User Suspended' },
  { value: 'user.unsuspended', label: 'User Unsuspended' },
  { value: 'user.deleted', label: 'User Deleted' },
  { value: 'role.created', label: 'Role Created' },
  { value: 'role.updated', label: 'Role Updated' },
  { value: 'role.deleted', label: 'Role Deleted' },
  { value: 'refund.approved', label: 'Refund Approved' },
  { value: 'refund.rejected', label: 'Refund Rejected' },
  { value: 'event.approved', label: 'Event Approved' },
  { value: 'event.rejected', label: 'Event Rejected' },
  { value: 'settings.updated', label: 'Settings Updated' },
];

const formatTimestamp = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const ActivityLogsPage: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = async (s: string, a: string) => {
    setLoading(true);
    try {
      const params: { search?: string; action?: string } = {};
      if (s) params.search = s;
      if (a) params.action = a;
      const data = await adminService.getActivityLogs(params);
      setLogs(data ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load(search, actionFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, actionFilter]);

  const handleRefresh = () => load(search, actionFilter);

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Activity Logs</h1><p>Audit trail of all admin actions on the platform.</p></div>
        <button className="up-add-btn" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-gray)' }} onClick={handleRefresh}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="up-stats">
        <div className="admin-glass-panel up-stat-card">
          <span className="up-stat-label">Total Log Entries</span>
          <span className="up-stat-val" style={{ color: '#2E5BFF' }}>{logs.length}</span>
        </div>
        <div className="admin-glass-panel up-stat-card">
          <span className="up-stat-label">Unique Actions</span>
          <span className="up-stat-val" style={{ color: '#FF7020' }}>{new Set(logs.map(l => l.action)).size}</span>
        </div>
        <div className="admin-glass-panel up-stat-card">
          <span className="up-stat-label">Actors</span>
          <span className="up-stat-val" style={{ color: '#22C55E' }}>{new Set(logs.map(l => l.actor_name)).size}</span>
        </div>
      </div>

      <div className="up-toolbar">
        <div className="up-search">
          <Search size={14} />
          <input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="up-filters">
          <select className="up-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            {actionOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="up-filter-btn"><Filter size={14} /> Filters</button>
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading activity logs...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr>
              </thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={5} className="admin-empty-row">No activity logs found.</td></tr>}
                {logs.map((l, i) => (
                  <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="admin-td-muted" style={{ whiteSpace: 'nowrap' }}>{formatTimestamp(l.created_at)}</td>
                    <td><span className="admin-cell-title">{l.actor_name}</span></td>
                    <td><span className="al-badge">{l.action}</span></td>
                    <td className="admin-td-muted">{l.target}</td>
                    <td className="admin-td-muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.metadata ? (typeof l.metadata === 'string' ? l.metadata : JSON.stringify(l.metadata)) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
