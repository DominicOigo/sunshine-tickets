import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Ticket, Users, BarChart3 } from 'lucide-react';
import { LineChart, Donut } from './AdminDashboard';
import { adminService } from '../../lib/adminService';
import './AnalyticsPage.css';

type Period = '7d' | '30d' | '90d' | '1y';

interface TrendPoint { label: string; value: number }

const TRAFFIC_SOURCES = [
  { label: 'Direct',         value: 38, color: '#FF9500' },
  { label: 'Social Media',   value: 29, color: '#2E5BFF' },
  { label: 'Organic Search', value: 18, color: '#22C55E' },
  { label: 'Referral',       value: 15, color: '#00F2FE' },
];

const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30d');
  const [trends, setTrends] = useState<{ revenue: TrendPoint[]; tickets: TrendPoint[]; users: TrendPoint[] } | null>(null);
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [topLocations, setTopLocations] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ conversion_rate: number; churn_rate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminService.getAnalyticsTrends(period),
      adminService.getTopEvents(),
      adminService.getTopLocations(),
      adminService.getAnalyticsMeta(),
    ])
      .then(([t, e, l, m]) => { setTrends(t); setTopEvents(e); setTopLocations(l); setMeta(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const dRev = trends?.revenue ?? [];
  const dTix = trends?.tickets ?? [];
  const dUsr = trends?.users ?? [];
  const labels = dRev.map(r => {
    const d = new Date(r.label);
    return period === '7d' ? d.toLocaleDateString('en-KE', { weekday: 'short' }) : `${d.getDate()}/${d.getMonth()+1}`;
  });
  const revData = dRev.map(r => r.value);
  const tixData = dTix.map(r => r.value);
  const usrData = dUsr.map(r => r.value);
  const totalRevenue = revData.reduce((s, v) => s + v, 0);
  const totalTickets = tixData.reduce((s, v) => s + v, 0);
  const totalUsers   = usrData.reduce((s, v) => s + v, 0);

  const conversionRate = meta?.conversion_rate ?? 0;
  const churnRate = meta?.churn_rate ?? 0;

  const kpis = [
    { label: 'Total Revenue',    value: `KES ${(totalRevenue/1000).toFixed(0)}K`,                         change: `${totalRevenue.toLocaleString()} total`, up: true,  icon: <DollarSign size={18}/>, color: '#FF9500' },
    { label: 'Tickets Sold',     value: totalTickets.toLocaleString(),                                     change: `${totalTickets.toLocaleString()} total`, up: true,  icon: <Ticket size={18}/>,    color: '#22C55E' },
    { label: 'New Users',        value: totalUsers.toLocaleString(),                                       change: `${totalUsers.toLocaleString()} total`, up: true,  icon: <Users size={18}/>,     color: '#2E5BFF' },
    { label: 'Avg Order Value',  value: `KES ${Math.round(totalRevenue/(totalTickets||1)).toLocaleString()}`, change: 'Per ticket', up: true, icon: <BarChart3 size={18}/>, color: '#00F2FE' },
    { label: 'Conversion Rate',  value: `${conversionRate}%`,  change: `${conversionRate}% of users purchase`, up: conversionRate > 2,  icon: <TrendingUp size={18}/>,   color: '#FF7020' },
    { label: 'Churn Rate',       value: `${churnRate}%`,  change: `${churnRate}% inactive over 90 days`,  up: churnRate < 10, icon: <TrendingDown size={18}/>, color: '#EF4444' },
  ];

  return (
    <div className="ap-shell">
      {/* Heading */}
      <div className="ap-heading">
        <div>
          <h1>Analytics Overview</h1>
          <p>Platform-wide performance metrics and insights.</p>
        </div>
        <div className="ap-period-tabs">
          {(['7d','30d','90d','1y'] as Period[]).map(p => (
            <button key={p} className={`ap-period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div> : (
        <>
          {/* KPIs */}
          <div className="ap-kpi-row">
            {kpis.map((k, i) => (
              <motion.div key={i} className="admin-glass-panel ap-kpi-card"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="ap-kpi-icon" style={{ color: k.color, background: `${k.color}15` }}>{k.icon}</div>
                <span className="ap-kpi-label">{k.label}</span>
                <span className="ap-kpi-value">{k.value}</span>
                <span className={`ap-kpi-change ${k.up ? 'up' : 'down'}`}>
                  {k.up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>} {k.change}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Revenue & Tickets charts */}
          <div className="ap-charts-row">
            <div className="admin-glass-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Revenue</h3>
                  <div className="ap-chart-total">KES {(totalRevenue/1000).toFixed(0)}K</div>
                </div>
              </div>
              <LineChart data={revData} labels={labels} color="#FF9500" height={130} />
            </div>
            <div className="admin-glass-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Tickets Sold</h3>
                  <div className="ap-chart-total">{totalTickets.toLocaleString()}</div>
                </div>
              </div>
              <LineChart data={tixData} labels={labels} color="#22C55E" height={130} />
            </div>
            <div className="admin-glass-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>New Users</h3>
                  <div className="ap-chart-total">{totalUsers.toLocaleString()}</div>
                </div>
              </div>
              <LineChart data={usrData} labels={labels} color="#2E5BFF" height={130} />
            </div>
          </div>

          {/* Bottom row: top events + locations + traffic */}
          <div className="ap-bottom-row">
            {/* Top Events */}
            <div className="admin-glass-panel">
              <div className="admin-panel-header"><h3>Top Events by Revenue</h3></div>
              <div className="ap-top-events">
                {topEvents.length === 0 && <div className="admin-empty-row" style={{ padding: '2rem' }}>No event data yet.</div>}
                {topEvents.map((e: any, i: number) => (
                  <div key={i} className="ap-event-row">
                    <span className="ap-rank">{i + 1}</span>
                    <div className="ap-event-info">
                      <span className="ap-event-name">{e.name}</span>
                      <div className="ap-bar-wrap">
                        <motion.div className="ap-bar" style={{ background: '#FF9500' }}
                          initial={{ width: 0 }} animate={{ width: `${e.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                      </div>
                    </div>
                    <div className="ap-event-stats">
                      <span className="ap-event-tickets">{e.tickets.toLocaleString()} tickets</span>
                      <span className="ap-event-rev">KES {(e.revenue/1000).toFixed(0)}K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="admin-glass-panel ap-donut-panel">
              <div className="admin-panel-header"><h3>Traffic Sources</h3></div>
              <div className="ap-donut-wrap">
                <Donut segments={TRAFFIC_SOURCES} />
              </div>
              <div className="ap-donut-legend">
                {TRAFFIC_SOURCES.map((s, i) => (
                  <div key={i} className="ap-legend-row">
                    <span className="ap-legend-dot" style={{ background: s.color }} />
                    <span className="ap-legend-label">{s.label}</span>
                    <span className="ap-legend-val">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Locations */}
            <div className="admin-glass-panel">
              <div className="admin-panel-header"><h3>Top Locations</h3></div>
              <div className="ap-locations">
                {topLocations.length === 0 && <div className="admin-empty-row" style={{ padding: '2rem' }}>No location data yet.</div>}
                {topLocations.map((l: any, i: number) => (
                  <div key={i} className="ap-location-row">
                    <span className="ap-location-name">{l.name}</span>
                    <div className="ap-bar-wrap">
                      <motion.div className="ap-bar" style={{ background: '#2E5BFF' }}
                        initial={{ width: 0 }} animate={{ width: `${l.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                    </div>
                    <span className="ap-location-pct">{l.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
