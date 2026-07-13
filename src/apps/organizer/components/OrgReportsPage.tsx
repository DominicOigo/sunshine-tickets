import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Ticket, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useEvents } from '../../../context/EventContext';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import './OrgSubPage.css';

type Period = '7d' | '30d' | '90d';

// Static chart data (replace with real time-series query when Supabase analytics is added)
const CHART_DATA: Record<Period, { revenue: number[]; tickets: number[]; labels: string[] }> = {
  '7d':  { revenue: [5000,8500,12000,9800,15000,18500,22000], tickets: [30,55,80,60,95,120,145], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  '30d': { revenue: [12000,18000,15000,22000,19000,28000,25000,32000,29000,38000,35000,44000], tickets: [80,120,100,150,130,190,165,215,195,255,235,295], labels: Array.from({length:12},(_,i)=>`W${i+1}`) },
  '90d': { revenue: [45000,72000,58000,95000,88000,120000], tickets: [300,480,390,630,585,800], labels: ['Jan','Feb','Mar','Apr','May','Jun'] },
};

const MiniLine: React.FC<{ data: number[]; labels: string[]; color: string }> = ({ data, labels, color }) => {
  const W = 400, H = 100;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - ((v - min) / (max - min || 1)) * H * 0.85 - H * 0.05] as [number, number]);
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const id = `rpt${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <motion.path d={area} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}/>
      <motion.path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}/>
      {labels.map((l, i) => <text key={i} x={pts[i]?.[0] ?? 0} y={H + 14} textAnchor="middle" fill="#555" fontSize="9" fontWeight="700">{l}</text>)}
    </svg>
  );
};

const OrgReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { events } = useEvents();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>('7d');
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    organizerService.getMyEventStats(user.id)
      .then(setStats)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [user]);

  const myEvents = events.filter(e => e.organizerId === user?.id);
  const totalRevenue = myEvents.reduce((s, e) => s + e.tiers.reduce((ts, t) => ts + t.priceInt * t.sold, 0), 0);
  const totalTickets = myEvents.reduce((s, e) => s + e.tiers.reduce((ts, t) => ts + t.sold, 0), 0);

  const d = CHART_DATA[period];

  const kpis = [
    { label: 'Total Revenue',   value: `KES ${(totalRevenue/1000).toFixed(1)}K`, change: '+21.3%', up: true,  color: '#FF9500', icon: <DollarSign size={16}/> },
    { label: 'Tickets Sold',    value: totalTickets.toLocaleString(),             change: '+18.6%', up: true,  color: '#22C55E', icon: <Ticket size={16}/> },
    { label: 'My Events',       value: myEvents.length,                           change: '+2',     up: true,  color: '#2E5BFF', icon: <BarChart3 size={16}/> },
    { label: 'Avg Order Value', value: `KES ${totalTickets > 0 ? Math.round(totalRevenue/totalTickets).toLocaleString() : 0}`, change: '+4.2%', up: true, color: '#00F2FE', icon: <Users size={16}/> },
    { label: 'Refund Rate',     value: '1.2%',   change: '-0.3%', up: false, color: '#EF4444', icon: <TrendingDown size={16}/> },
    { label: 'Conversion Rate', value: '3.8%',   change: '+0.4%', up: true,  color: '#9B59B6', icon: <TrendingUp size={16}/> },
  ];

  const topEvents = [...myEvents].filter(e => e.status === 'published').sort((a, b) => {
    const rev = (e: typeof a) => e.tiers.reduce((s, t) => s + t.priceInt * t.sold, 0);
    return rev(b) - rev(a);
  }).slice(0, 5);

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div><h1>Reports &amp; Analytics</h1><p>Track performance and revenue metrics across your events.</p></div>
        <div className="osp-period-tabs">
          {(['7d','30d','90d'] as Period[]).map(p => (
            <button key={p} className={`osp-period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="osp-kpi-row">
        {kpis.map((k, i) => (
          <motion.div key={i} className="osp-kpi-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="osp-stat-icon" style={{ color: k.color, background: `${k.color}15` }}>{k.icon}</div>
            <span className="osp-stat-label">{k.label}</span>
            <span className="osp-stat-val" style={{ color: k.color }}>{k.value}</span>
            <span className={`osp-kpi-change ${k.up ? 'up' : 'down'}`}>
              {k.up ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {k.change}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="osp-charts-row">
        <div className="osp-glass-panel">
          <div className="osp-panel-hdr"><div><h3>Revenue</h3><div className="osp-chart-total">KES {(d.revenue.reduce((s,v)=>s+v,0)/1000).toFixed(0)}K</div></div></div>
          <MiniLine data={d.revenue} labels={d.labels} color="#FF9500"/>
        </div>
        <div className="osp-glass-panel">
          <div className="osp-panel-hdr"><div><h3>Tickets Sold</h3><div className="osp-chart-total">{d.tickets.reduce((s,v)=>s+v,0).toLocaleString()}</div></div></div>
          <MiniLine data={d.tickets} labels={d.labels} color="#22C55E"/>
        </div>
      </div>

      <div className="osp-glass-panel">
        <div className="osp-panel-hdr"><h3>My Events Performance</h3></div>
        {loading ? <div className="admin-empty-row">Loading stats...</div> : (
          <div className="osp-top-events">
            {topEvents.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No published events yet.</p>}
            {topEvents.map((e, i) => {
              const rev  = e.tiers.reduce((s, t) => s + t.priceInt * t.sold, 0);
              const sold = e.tiers.reduce((s, t) => s + t.sold, 0);
              const cap  = e.tiers.reduce((s, t) => s + t.capacity, 0);
              const pct  = cap > 0 ? Math.round(sold / cap * 100) : 0;
              // Use real DB stat if available
              const dbStat = stats.find(s => s.id === e.id);
              const realRev = dbStat?.gross_revenue ?? rev;
              return (
                <div key={e.id} className="osp-top-event-row">
                  <span className="osp-rank">{i + 1}</span>
                  {e.image && <img src={e.image} alt="" className="osp-event-thumb"/>}
                  <div className="osp-top-info">
                    <span className="osp-cell-title">{e.title}</span>
                    <div className="osp-bar-wrap">
                      <motion.div className="osp-bar" style={{ background: '#FF9500' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}/>
                    </div>
                  </div>
                  <div className="osp-top-stats">
                    <span className="osp-top-tickets">{sold.toLocaleString()} tickets ({pct}%)</span>
                    <span className="osp-td-rev">KES {(realRev/1000).toFixed(1)}K</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgReportsPage;
