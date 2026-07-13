import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, PlusCircle, Tag, ShoppingCart, UserCheck,
  Gift, DollarSign, ReceiptText, FileText, Megaphone, BarChart3,
  User, Users, Settings, LogOut, Menu, X, Search, Bell, MessageSquare,
  ChevronDown, Eye, MoreHorizontal, TrendingUp, TrendingDown, Plus,
  Ticket, Activity, Share2, Compass, ShieldCheck, CheckCircle, Sun, Sparkles,
  CreditCard,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEvents, Event } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CreateEventWizard from './components/CreateEventWizard';
import AccountSettings from './components/AccountSettings';
import ProductionIntelligence from './components/ProductionIntelligence';
import TierSwitching from './components/TierSwitching';
import FanLinkEngine from './components/FanLinkEngine';
import OrgOrdersPage from './components/OrgOrdersPage';
import OrgPayoutsPage from './components/OrgPayoutsPage';
import OrgReportsPage from './components/OrgReportsPage';
import OrgMarketingPage from './components/OrgMarketingPage';
import { OrgMyEventsPage } from './components/OrgMyEventsPage';
import { OrgCategoriesPage } from './components/OrgCategoriesPage';
import { OrgCheckInPage } from './components/OrgCheckInPage';
import { OrgDiscountsPage } from './components/OrgDiscountsPage';
import { OrgTransactionsPage } from './components/OrgTransactionsPage';
import { OrgTaxDocsPage } from './components/OrgTaxDocsPage';
import { OrgAnnouncementsPage } from './components/OrgAnnouncementsPage';
import { OrgProfilePage } from './components/OrgProfilePage';
import { OrgTeamPage } from './components/OrgTeamPage';
import { OrgPaymentMethodsPage } from './components/OrgPaymentMethodsPage';
import './OrganizerDashboard.css';

type OrgPage =
  | 'dashboard'
  | 'my-events' | 'create-event' | 'categories'
  | 'orders' | 'check-in' | 'discounts'
  | 'payouts' | 'transactions' | 'tax-docs'
  | 'marketing' | 'announcements' | 'reports'
  | 'profile' | 'team' | 'account-settings'
  | 'payment-methods'
  | 'intelligence' | 'tier-switching' | 'fan-link';

// ── Bar chart (7-day) ──────────────────────────────────────────────────────
const BarChart: React.FC<{ data: number[]; labels: string[]; color: string }> = ({ data, labels, color }) => {
  const max = Math.max(...data, 1);
  const W = 400, H = 120;
  const barW = W / data.length * 0.5;
  const gap  = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * H * 0.85;
        const x  = i * gap + gap * 0.25;
        const y  = H - bh;
        return (
          <g key={i}>
            <motion.rect x={x} y={y} width={barW} height={bh} rx="3" fill={color}
              initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              style={{ transformOrigin: `${x + barW / 2}px ${H}px` }}
            />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fill="#555" fontSize="9" fontWeight="700">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Line chart ─────────────────────────────────────────────────────────────
const LineChart: React.FC<{ data: number[]; labels: string[]; color: string }> = ({ data, labels, color }) => {
  const W = 400, H = 120;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - min) / (max - min || 1)) * H * 0.85 - H * 0.05,
  ] as [number, number]);
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const id   = `lg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.05 }}
          style={{ transformOrigin: `${p[0]}px ${p[1]}px` }} />
      ))}
      {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0).map((l, j) => {
        const i = j * Math.ceil(labels.length / 7);
        return <text key={i} x={pts[i]?.[0] ?? 0} y={H + 14} textAnchor="middle" fill="#555" fontSize="9" fontWeight="700">{l}</text>;
      })}
    </svg>
  );
};

// ── Donut ──────────────────────────────────────────────────────────────────
const Donut: React.FC<{ segments: { value: number; color: string; label: string }[]; center: string; sub: string }> = ({ segments, center, sub }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 56, cx = 70, cy = 70, stroke = 16, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <motion.circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset}
            style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{center}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#666" fontSize="9" fontWeight="700">{sub}</text>
    </svg>
  );
};

// ── Profile completion ring ─────────────────────────────────────────────────
const ProfileRing: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF9500" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${(pct / 100) * circ} ${circ}` }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="14" fontWeight="800">{pct}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#666" fontSize="7" fontWeight="700">COMPLETE</text>
    </svg>
  );
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  published:        { label: 'On Sale',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  pending_approval: { label: 'Pending Review', color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  rejected:         { label: 'Rejected',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  draft:            { label: 'Draft',          color: '#888',    bg: 'rgba(255,255,255,0.05)' },
};

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'dashboard' as OrgPage,      label: 'Dashboard',         icon: <LayoutDashboard size={15}/> },
    ],
  },
  {
    label: 'EVENTS',
    items: [
      { id: 'my-events' as OrgPage,      label: 'My Events',         icon: <Calendar size={15}/> },
      { id: 'create-event' as OrgPage,   label: 'Create Event',      icon: <PlusCircle size={15}/> },
      { id: 'categories' as OrgPage,     label: 'Categories',        icon: <Tag size={15}/> },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { id: 'orders' as OrgPage,         label: 'Orders & Attendees',icon: <ShoppingCart size={15}/> },
      { id: 'check-in' as OrgPage,       label: 'Check-in',          icon: <UserCheck size={15}/> },
      { id: 'discounts' as OrgPage,      label: 'Discounts & Promo Codes', icon: <Gift size={15}/> },
    ],
  },
  {
    label: 'PAYOUTS & FINANCE',
    items: [
      { id: 'payouts' as OrgPage,        label: 'Payouts',           icon: <DollarSign size={15}/> },
      { id: 'transactions' as OrgPage,   label: 'Transactions',      icon: <ReceiptText size={15}/> },
      { id: 'tax-docs' as OrgPage,       label: 'Tax Documents',     icon: <FileText size={15}/> },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { id: 'marketing' as OrgPage,      label: 'Marketing Center',  icon: <Megaphone size={15}/> },
      { id: 'announcements' as OrgPage,  label: 'Announcements',     icon: <Bell size={15}/> },
      { id: 'reports' as OrgPage,        label: 'Reports & Analytics', icon: <BarChart3 size={15}/> },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { id: 'profile' as OrgPage,        label: 'Organizer Profile', icon: <User size={15}/> },
      { id: 'team' as OrgPage,           label: 'Team Members',      icon: <Users size={15}/> },
      { id: 'payment-methods' as OrgPage,  label: 'Payment Methods',  icon: <CreditCard size={15}/> },
      { id: 'account-settings' as OrgPage, label: 'Account Settings',icon: <Settings size={15}/> },
    ],
  },
];

const WEEK_LABELS = ['May 18','May 19','May 20','May 21','May 22','May 23','May 24'];
const REVENUE_WEEK = [5000, 8500, 12000, 9800, 15000, 18500, 22000];
const TICKETS_WEEK = [120, 210, 320, 280, 420, 580, 680];
const CHANNEL_SEGS = [
  { label: 'Website',    value: 2420, color: '#FF9500' },
  { label: 'Mobile App', value: 1120, color: '#2E5BFF' },
  { label: 'Facebook',   value: 680,  color: '#9B59B6' },
  { label: 'Instagram',  value: 420,  color: '#22C55E' },
  { label: 'Other',      value: 222,  color: '#555' },
];
const NOTIFICATIONS = [
  { icon: <ShoppingCart size={16}/>, color: '#FF9500', title: 'New Order #ORD-8421', sub: '2 VIP tickets for Tech Summit 2026', time: '2m ago' },
  { icon: <DollarSign size={16}/>,   color: '#22C55E', title: 'Payout Sent', sub: 'Your payout of $4,250.00 was sent successfully.', time: '1h ago' },
  { icon: <Activity size={16}/>,     color: '#2E5BFF', title: 'Check-in Alert', sub: 'High check-in rate for Summer Music Festival', time: '3h ago' },
  { icon: <CheckCircle size={16}/>,  color: '#00F2FE', title: 'Event Approval', sub: 'Startup Expo 2026 has been approved', time: '1d ago' },
];

const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="od-coming-soon">
    <Calendar size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
    <h3>{title}</h3>
    <p>This section will be available soon.</p>
  </div>
);

const OrganizerDashboard: React.FC = () => {
  const location = useLocation();
  const page = useMemo(() => {
    const parts = location.pathname.split('/');
    if (parts.length <= 2 || !parts[2]) return 'dashboard';
    return parts[2] as OrgPage;
  }, [location.pathname]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wizardOpen, setWizardOpen]   = useState(false);
  const [eventsTab, setEventsTab]     = useState<'upcoming'|'on-sale'|'completed'|'drafts'|'cancelled'>('upcoming');

  const { events } = useEvents();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const myEvents = useMemo(() => events.filter(e => e.organizerId === user?.id), [events, user]);
  const totalRevenue   = useMemo(() => myEvents.reduce((s, e) => s + e.tiers.reduce((ts, t) => ts + (t.priceInt ?? 0)*t.sold, 0), 0), [myEvents]);
  const totalTickets   = useMemo(() => myEvents.reduce((s, e) => s + e.tiers.reduce((ts, t) => ts + t.sold, 0), 0), [myEvents]);
  const pendingPayout  = Math.round(totalRevenue * 0.155);
  const checkedIn      = Math.round(totalTickets * 0.483);

  const kpis = [
    { label: 'Total Events',      value: myEvents.length,                       sub: `${myEvents.filter(e=>e.status==='published').length} upcoming`, color: '#FF9500', icon: <Calendar size={18}/> },
    { label: 'Tickets Sold',      value: totalTickets.toLocaleString(),         sub: <span className="od-kpi-up"><TrendingUp size={11}/> 18.6% vs last week</span>, color: '#22C55E', icon: <Ticket size={18}/> },
    { label: 'Total Revenue',     value: `KES ${(totalRevenue).toLocaleString()}`, sub: <span className="od-kpi-up"><TrendingUp size={11}/> 21.3% vs last week</span>, color: '#9B59B6', icon: <DollarSign size={18}/> },
    { label: 'Pending Payout',    value: `KES ${pendingPayout.toLocaleString()}`, sub: 'Available for payout', color: '#FF7020', icon: <ReceiptText size={18}/> },
    { label: 'Attendees Checked-in', value: checkedIn.toLocaleString(),        sub: 'This week', color: '#2E5BFF', icon: <UserCheck size={18}/> },
  ];

  const topEvent = myEvents.filter(e => e.status === 'published').sort((a, b) => {
    const rev = (e: Event) => e.tiers.reduce((s,t) => s+(t.priceInt ?? 0)*t.sold, 0);
    return rev(b) - rev(a);
  })[0];
  const topEventSold     = topEvent ? topEvent.tiers.reduce((s,t)=>s+t.sold,0) : 0;
  const topEventCap      = topEvent ? topEvent.tiers.reduce((s,t)=>s+t.capacity,0) : 0;
  const topEventRevenue  = topEvent ? topEvent.tiers.reduce((s,t)=>s+(t.priceInt ?? 0)*t.sold,0) : 0;

  const activeLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === page)?.label ?? 'Dashboard';

  const nav = (p: OrgPage) => {
    navigate(p === 'dashboard' ? '/manage' : `/manage/${p}`);
    setSidebarOpen(false);
  };

  return (
    <div className={`od-shell ${sidebarOpen ? 'od-sidebar-open' : ''}`}>
      {sidebarOpen && <div className="od-overlay" onClick={() => setSidebarOpen(false)} />}
      <AnimatePresence>{wizardOpen && <CreateEventWizard onClose={() => setWizardOpen(false)} />}</AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`od-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="od-sidebar-brand">
          <Link to="/" className="od-brand-link">
            <span className="od-brand-sun"><Sun size={18} style={{ color: '#FF9500' }}/></span>
            <div>
              <span className="od-brand-name">Sunshine</span>
              <span className="od-brand-sub">Tickets</span>
            </div>
          </Link>
          <button className="od-sidebar-close" onClick={() => setSidebarOpen(false)}><X size={16}/></button>
        </div>

        <div className="od-sidebar-scroll">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="od-nav-group">
              <span className="od-nav-group-label">{group.label}</span>
              {group.items.map(item => (
                <button key={item.id} className={`od-nav-item ${page === item.id ? 'active' : ''}`}
                  onClick={() => item.id === 'create-event' ? setWizardOpen(true) : nav(item.id)}>
                  <span className="od-nav-icon">{item.icon}</span>
                  <span className="od-nav-label">{item.label}</span>
                  {page === item.id && <motion.div className="od-nav-indicator" layoutId="odNavInd" />}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Boost banner */}
        <div className="od-boost-banner">
          <div className="od-boost-top">
            <span className="od-boost-title">Boost Your Event</span>
            <p className="od-boost-sub">Promote your events and reach more people.</p>
          </div>
          <button className="od-boost-btn" onClick={() => nav('marketing')}>Go to Marketing Center</button>
        </div>

        <div className="od-sidebar-footer">
          <div className="od-sidebar-user">
            <div className="od-user-avatar">{(user?.name ?? 'O').charAt(0)}</div>
            <div className="od-user-info">
              <strong>{user?.name ?? 'ABC Events'}</strong>
              <span>Organizer</span>
            </div>
            <button className="od-logout-btn" onClick={() => { signOut(); navigate('/'); }} title="Sign out">
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="od-main">
        {/* Header */}
        <header className="od-header">
          <button className="od-hamburger" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button>
          <div className="od-header-search">
            <Search size={14}/>
            <input placeholder="Search events, orders, attendees..."/>
            <span className="od-kbd">⌘ K</span>
          </div>
          <div className="od-header-actions">
            <button className="od-create-btn" onClick={() => setWizardOpen(true)}>
              <Plus size={14}/> Create Event
            </button>
            <button className="od-icon-btn od-notif-btn">
              <Bell size={18}/>
              <span className="od-notif-dot"/>
            </button>
            <button className="od-icon-btn"><MessageSquare size={18}/></button>
            <div className="od-header-user">
              <div className="od-header-avatar">
                {user?.name ? user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'OG'}
              </div>
              <div className="od-header-user-info">
                <span className="od-header-username">{user?.name ?? 'ABC Events'}</span>
                <span className="od-header-role">Organizer</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }}/>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="od-content">
          <AnimatePresence mode="wait">
            <motion.div key={page}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>

              {page === 'dashboard' && (
                <div className="od-dashboard">

                  {/* Page heading */}
                  <div className="od-page-heading">
                    <div>
                      <h1>Welcome back, {user?.name ?? 'ABC Events'}!</h1>
                      <p>Here's what's happening with your events.</p>
                    </div>
                    <button className="od-date-badge">
                      <Calendar size={14}/> May 18 – May 24, 2024 <ChevronDown size={13}/>
                    </button>
                  </div>

                  {/* ── 2-col layout: left content + right panel ── */}
                  <div className="od-layout">
                    <div className="od-left">

                      {/* KPI cards */}
                      <div className="od-kpi-row">
                        {kpis.map((k, i) => (
                          <motion.div key={i} className="od-kpi-card"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                            <div className="od-kpi-icon" style={{ background: `${k.color}18`, color: k.color }}>{k.icon}</div>
                            <span className="od-kpi-label">{k.label}</span>
                            <span className="od-kpi-value">{k.value}</span>
                            <div className="od-kpi-sub">{k.sub}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Charts row */}
                      <div className="od-charts-row">
                        {/* Sales Overview */}
                        <div className="od-glass-panel">
                          <div className="od-panel-hdr">
                            <div>
                              <h3>Sales Overview</h3>
                              <div className="od-chart-big">KES {totalRevenue.toLocaleString()}.00</div>
                              <span className="od-kpi-up"><TrendingUp size={11}/> 21.3% vs May 11 – May 17, 2024</span>
                            </div>
                            <select className="od-period-sel"><option>This Week</option></select>
                          </div>
                          <LineChart data={REVENUE_WEEK} labels={WEEK_LABELS} color="#FF9500"/>
                        </div>

                        {/* Tickets Sold */}
                        <div className="od-glass-panel">
                          <div className="od-panel-hdr">
                            <div>
                              <h3>Tickets Sold</h3>
                              <div className="od-chart-big">{totalTickets.toLocaleString()}</div>
                              <span className="od-kpi-up"><TrendingUp size={11}/> 18.6% vs May 11 – May 17, 2024</span>
                            </div>
                            <select className="od-period-sel"><option>This Week</option></select>
                          </div>
                          <BarChart data={TICKETS_WEEK} labels={WEEK_LABELS} color="#FF9500"/>
                        </div>

                        {/* Top Performing Event */}
                        <div className="od-glass-panel od-top-event-panel">
                          <div className="od-panel-hdr">
                            <h3>Top Performing Event</h3>
                            <select className="od-period-sel"><option>This Week</option></select>
                          </div>
                          {topEvent ? (
                            <>
                              <div className="od-top-event-card">
                                {topEvent.image && <img src={topEvent.image} alt="" className="od-top-event-img"/>}
                                <div>
                                  <strong>{topEvent.title}</strong>
                                  <div className="od-top-event-meta">
                                    <Calendar size={11}/> {topEvent.date}
                                  </div>
                                  <div className="od-top-event-meta">{topEvent.location.split(',')[0]}</div>
                                </div>
                              </div>
                              <div className="od-top-stats">
                                <div className="od-top-stat-row">
                                  <span>Tickets Sold</span>
                                  <div>
                                    <strong>{topEventSold.toLocaleString()}</strong>
                                    <span className="od-kpi-up" style={{ marginLeft: 8 }}><TrendingUp size={10}/> 22.5%</span>
                                  </div>
                                </div>
                                <div className="od-top-stat-row">
                                  <span>Revenue</span>
                                  <div>
                                    <strong>KES {(topEventRevenue/1000).toFixed(0)}K</strong>
                                    <span className="od-kpi-up" style={{ marginLeft: 8 }}><TrendingUp size={10}/> 24.1%</span>
                                  </div>
                                </div>
                              </div>
                              <button className="od-view-report-btn" onClick={() => nav('reports')}>View Event Report</button>
                            </>
                          ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No published events yet.</p>
                          )}
                        </div>
                      </div>

                      {/* My Events table */}
                      <div className="od-glass-panel od-events-panel">
                        <div className="od-panel-hdr">
                          <h3>My Events</h3>
                          <button className="od-view-all-btn" onClick={() => nav('my-events')}>View All Events</button>
                        </div>
                        {/* Tabs */}
                        <div className="od-events-tabs">
                          {([
                            ['upcoming', `Upcoming (${myEvents.filter(e=>e.status==='published').length})`],
                            ['on-sale',  `On Sale (${myEvents.filter(e=>e.status==='published').length})`],
                            ['completed','Completed (0)'],
                            ['drafts',   `Drafts (${myEvents.filter(e=>e.status==='draft').length})`],
                            ['cancelled',`Cancelled (${myEvents.filter(e=>e.status==='rejected').length})`],
                          ] as [typeof eventsTab, string][]).map(([tab, label]) => (
                            <button key={tab} className={`od-events-tab ${eventsTab === tab ? 'active' : ''}`}
                              onClick={() => setEventsTab(tab)}>{label}</button>
                          ))}
                        </div>
                        <div className="od-table-wrap">
                          <table className="od-table">
                            <thead>
                              <tr><th>Event</th><th>Date</th><th>Location</th><th>Tickets Sold</th><th>Revenue</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                              {myEvents.slice(0, 6).map((e, i) => {
                                const sold = e.tiers.reduce((s,t)=>s+t.sold,0);
                                const cap  = e.tiers.reduce((s,t)=>s+t.capacity,0);
                                const rev  = e.tiers.reduce((s,t)=>s+(t.priceInt ?? 0)*t.sold,0);
                                const sm   = STATUS_META[e.status] ?? STATUS_META.draft;
                                return (
                                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.04 }}>
                                    <td>
                                      <div className="od-event-cell">
                                        {e.image && <img src={e.image} alt="" className="od-event-thumb"/>}
                                        <div>
                                          <span className="od-cell-title">{e.title}</span>
                                          <span className="od-cell-sub">{e.organizerName}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="od-td-muted">{e.date}</td>
                                    <td className="od-td-muted">{e.location.split(',')[0]}</td>
                                    <td className="od-td-muted">{sold.toLocaleString()} / {cap.toLocaleString()}<br/><span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{cap > 0 ? Math.round(sold/cap*100) : 0}%</span></td>
                                    <td className="od-td-rev">KES {(rev/1000).toFixed(1)}K</td>
                                    <td>
                                      <span className="od-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>{sm.label}</span>
                                    </td>
                                    <td>
                                      <div className="od-row-actions">
                                        <button className="od-act-btn" title="View" onClick={() => navigate(`/event/${e.id}`)}><Eye size={13}/></button>
                                        <button className="od-act-btn" title="More"><MoreHorizontal size={13}/></button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Sales by Channel */}
                      <div className="od-glass-panel">
                        <div className="od-panel-hdr">
                          <h3>Sales by Channel</h3>
                          <select className="od-period-sel"><option>This Week</option></select>
                        </div>
                        <div className="od-channel-layout">
                          <div className="od-donut-wrap">
                            <Donut segments={CHANNEL_SEGS} center={totalTickets.toLocaleString()} sub="Total Tickets"/>
                          </div>
                          <div className="od-channel-legend">
                            {CHANNEL_SEGS.map((s, i) => {
                              const pct = Math.round(s.value / CHANNEL_SEGS.reduce((sum, x) => sum + x.value, 0) * 100);
                              return (
                                <div key={i} className="od-channel-row">
                                  <span className="od-channel-dot" style={{ background: s.color }}/>
                                  <span className="od-channel-label">{s.label}</span>
                                  <span className="od-channel-val">{s.value.toLocaleString()} ({pct}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <button className="od-view-report-btn" style={{ marginTop: '1rem' }} onClick={() => nav('reports')}>View Full Report</button>
                      </div>

                    </div>

                    {/* ── Right panel ── */}
                    <div className="od-right">

                      {/* Notifications */}
                      <div className="od-glass-panel">
                        <div className="od-panel-hdr">
                          <h3>Notifications</h3>
                          <button className="od-view-all-btn">View all</button>
                        </div>
                        <div className="od-notifs-list">
                          {NOTIFICATIONS.map((n, i) => (
                            <div key={i} className="od-notif-row">
                              <div className="od-notif-icon" style={{ color: n.color, background: `${n.color}15` }}>{n.icon}</div>
                              <div className="od-notif-text">
                                <strong>{n.title}</strong>
                                <span>{n.sub}</span>
                              </div>
                              <span className="od-notif-time">{n.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="od-glass-panel">
                        <div className="od-panel-hdr"><h3>Quick Actions</h3></div>
                        <div className="od-qa-grid">
                          {[
                            { label: 'Create Event',      icon: <Plus size={15}/>,         color: '#FF9500', action: () => setWizardOpen(true) },
                            { label: 'View My Events',    icon: <Calendar size={15}/>,     color: '#2E5BFF', action: () => nav('my-events') },
                            { label: 'Orders & Attendees',icon: <ShoppingCart size={15}/>, color: '#22C55E', action: () => nav('orders') },
                            { label: 'Marketing Center',  icon: <Megaphone size={15}/>,    color: '#9B59B6', action: () => nav('marketing') },
                            { label: 'Payouts',           icon: <DollarSign size={15}/>,   color: '#FF7020', action: () => nav('payouts') },
                            { label: 'Reports',           icon: <BarChart3 size={15}/>,    color: '#00F2FE', action: () => nav('reports') },
                          ].map((qa, i) => (
                            <button key={i} className="od-qa-btn" onClick={qa.action}>
                              <div className="od-qa-icon" style={{ color: qa.color, background: `${qa.color}15` }}>{qa.icon}</div>
                              <span>{qa.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Organizer Summary */}
                      <div className="od-glass-panel">
                        <div className="od-panel-hdr"><h3>Organizer Summary</h3></div>
                        <div className="od-summary-layout">
                          <ProfileRing pct={
                            [!!user?.name, !!user?.email, !!user?.phone, !!user?.avatar_url].filter(Boolean).length * 25
                          }/>
                          <div className="od-summary-checklist">
                            {[
                              { label: 'Profile Name',    done: !!user?.name },
                              { label: 'Email Verified',  done: !!user?.email },
                              { label: 'Phone Number',    done: !!user?.phone },
                              { label: 'Profile Photo',   done: !!user?.avatar_url },
                            ].map((item, i) => (
                              <div key={i} className="od-summary-item">
                                <div className={`od-summary-check ${item.done ? 'done' : ''}`}>
                                  {item.done && <CheckCircle size={12}/>}
                                </div>
                                <span className={item.done ? 'od-summary-done' : 'od-summary-todo'}>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Promote banner */}
                      <div className="od-promote-banner">
                        <div className="od-promote-stars"><Sparkles size={14} style={{ color: 'rgba(255,255,255,0.3)' }}/></div>
                        <h4>Get more tickets sold!</h4>
                        <p>Boost your event visibility with promoted listings and ads.</p>
                        <button className="od-promote-btn" onClick={() => nav('marketing')}>Promote Event</button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Sub pages */}
              {page === 'account-settings' && <AccountSettings />}
              {page === 'intelligence'      && <ProductionIntelligence event={myEvents.find(e => e.status === 'published') ?? null} />}
              {page === 'tier-switching'    && <TierSwitching />}
              {page === 'fan-link'          && <FanLinkEngine />}
              {page === 'orders'            && <OrgOrdersPage />}
              {page === 'payouts'           && <OrgPayoutsPage />}
              {page === 'reports'           && <OrgReportsPage />}
              {page === 'marketing'         && <OrgMarketingPage />}
              {page === 'my-events'         && <OrgMyEventsPage onTriggerCreate={() => setWizardOpen(true)} />}
              {page === 'categories'        && <OrgCategoriesPage />}
              {page === 'check-in'          && <OrgCheckInPage />}
              {page === 'discounts'         && <OrgDiscountsPage />}
              {page === 'transactions'      && <OrgTransactionsPage />}
              {page === 'tax-docs'          && <OrgTaxDocsPage />}
              {page === 'announcements'     && <OrgAnnouncementsPage />}
              {page === 'profile'           && <OrgProfilePage />}
              {page === 'team'              && <OrgTeamPage />}
              {page === 'payment-methods'   && <OrgPaymentMethodsPage />}

              {!['dashboard','account-settings','intelligence','tier-switching','fan-link','orders','payouts','reports','marketing','my-events','categories','check-in','discounts','transactions','tax-docs','announcements','profile','team','payment-methods'].includes(page) && (
                <ComingSoon title={activeLabel} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
