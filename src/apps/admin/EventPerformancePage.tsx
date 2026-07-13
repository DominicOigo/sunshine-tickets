import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Ticket, DollarSign, Users, BarChart3, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  published:  { label: 'Published',  color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  draft:      { label: 'Draft',      color: '#888',    bg: 'rgba(255,255,255,0.05)'},
  cancelled:  { label: 'Cancelled',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
  completed:  { label: 'Completed',  color: '#2E5BFF', bg: 'rgba(46,91,255,0.1)'  },
  postponed:  { label: 'Postponed',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)'  },
};

const EventPerformancePage: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getEventPerformance();
      setEvents(data ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    return e.title?.toLowerCase().includes(q);
  });

  const totalEvents = events.length;
  const totalTicketsSold = events.reduce((s: number, e: any) => s + (e.tickets_sold ?? 0), 0);
  const totalRevenue = events.reduce((s: number, e: any) => s + (e.revenue ?? 0), 0);
  const avgCapacity = events.length
    ? events.reduce((s: number, e: any) => s + (e.capacity_pct ?? 0), 0) / events.length
    : 0;

  const stats = [
    { label: 'Total Events',       value: totalEvents.toLocaleString(),                                         color: '#FF7020', icon: <Activity size={16}/>   },
    { label: 'Total Tickets Sold', value: totalTicketsSold.toLocaleString(),                                    color: '#22C55E', icon: <Ticket size={16}/>    },
    { label: 'Total Revenue',      value: `KES ${(totalRevenue / 1000).toFixed(0)}K`,                            color: '#FF9500', icon: <DollarSign size={16}/> },
    { label: 'Avg Capacity %',     value: `${avgCapacity.toFixed(1)}%`,                                         color: '#2E5BFF', icon: <BarChart3 size={16}/>  },
  ];

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Event Performance</h1><p>View detailed performance metrics for all events.</p></div>
      </div>

      <div className="up-stats">
        {stats.map((s, i) => (
          <motion.div key={i} className="admin-glass-panel up-stat-card"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="up-stat-card-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <span className="up-stat-label">{s.label}</span>
            <span className="up-stat-val" style={{ color: s.color }}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="up-toolbar">
        <div className="up-search">
          <Search size={14}/>
          <input placeholder="Search events by title..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading event performance...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Tickets Sold</th>
                  <th>Revenue</th>
                  <th>Avg Price</th>
                  <th>Capacity %</th>
                  <th>Check-in %</th>
                  <th>Unique Buyers</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="admin-empty-row">No event performance data found.</td></tr>
                )}
                {filtered.map((e, i) => {
                  const sm = STATUS_META[e.status] ?? { label: e.status ?? 'Unknown', color: '#888', bg: 'rgba(255,255,255,0.05)' };
                  return (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td><span className="admin-cell-title">{e.title ?? '—'}</span></td>
                      <td className="admin-td-muted">{e.category_name ?? '—'}</td>
                      <td className="admin-td-muted">{e.location ?? '—'}</td>
                      <td>
                        <span className="up-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="admin-td-muted">{e.start_date ? new Date(e.start_date).toLocaleDateString('en-KE') : '—'}</td>
                      <td className="admin-td-muted">{(e.tickets_sold ?? 0).toLocaleString()}</td>
                      <td className="up-td-rev">KES {(e.revenue ?? 0).toLocaleString()}</td>
                      <td className="admin-td-muted">KES {(e.avg_ticket_price ?? 0).toLocaleString()}</td>
                      <td className="admin-td-muted">{e.capacity_pct != null ? `${e.capacity_pct}%` : '—'}</td>
                      <td className="admin-td-muted">{e.checkin_pct != null ? `${e.checkin_pct}%` : '—'}</td>
                      <td className="admin-td-muted">{(e.unique_buyers ?? 0).toLocaleString()}</td>
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

export default EventPerformancePage;
