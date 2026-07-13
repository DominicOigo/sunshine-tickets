import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, BarChart3, Settings,
  Search, Bell, LogOut, Menu, X, ChevronDown, ChevronRight,
  DollarSign, Ticket, AlertTriangle, TrendingUp, TrendingDown,
  ShieldCheck, Activity, Package, CreditCard, ReceiptText,
  Megaphone, Mail, MessageSquare, UserCheck, Tag, FolderOpen,
  Server, Plug, FileText, ClipboardList, HardDrive, Sun, CheckCircle, XCircle, Image as ImageIcon,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import EventApprovalsPage from './EventApprovalsPage';
import ManageEventsPage from './ManageEventsPage';
import UsersPage from './UsersPage';
import OrdersPage from './OrdersPage';
import PaymentsPage from './PaymentsPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import { RefundsPage, AdminPayoutsPage, OrganizersPage, RolesPage, NotificationsPage, AnnouncementsPage, AuditLogsPage, GatewaysPage, HeroSlidesPage, ChatMessagesPage } from './AdminSubPages';
import CategoriesPage from './CategoriesPage';
import EmailLogsPage from './EmailLogsPage';
import SalesReportsPage from './SalesReportsPage';
import EventPerformancePage from './EventPerformancePage';
import UserAnalyticsPage from './UserAnalyticsPage';
import ActivityLogsPage from './ActivityLogsPage';
import BackupRestorePage from './BackupRestorePage';
import './AdminDashboard.css';

// ─── Types ──────────────────────────────────────────────────────────────────
type Page =
  | 'dashboard'
  | 'manage-events' | 'event-approvals' | 'categories' | 'tags'
  | 'users' | 'organizers' | 'verifications' | 'roles'
  | 'orders' | 'payments' | 'refunds' | 'payouts' | 'invoices'
  | 'notifications' | 'messages' | 'announcements' | 'email-logs'
  | 'analytics' | 'sales-reports' | 'event-performance' | 'user-analytics' | 'revenue-analytics' | 'custom-reports'
  | 'system-settings' | 'gateways' | 'integrations' | 'audit-logs' | 'activity-logs' | 'backup'
  | 'hero-slides';

// ─── Sparkline ───────────────────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const w = 56, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / (max - min || 1)) * h * 0.8 - h * 0.1,
  ] as [number, number]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Donut ───────────────────────────────────────────────────────────────────
export const Donut: React.FC<{ segments: { value: number; color: string; label: string }[] }> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 52, cx = 64, cy = 64, stroke = 14, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <motion.circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-offset}
            style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="16" fontWeight="800">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#666" fontSize="9" fontWeight="700">EVENTS</text>
    </svg>
  );
};

// ─── Line Chart ───────────────────────────────────────────────────────────────
export const LineChart: React.FC<{ data: number[]; labels: string[]; color: string; height?: number }> = ({ data, labels, color, height = 120 }) => {
  const W = 400, H = height;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - min) / (max - min || 1)) * H * 0.85 - H * 0.05,
  ] as [number, number]);
  const linePath = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const id = `lc${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} y1={H - f * H * 0.85 - H * 0.05} x2={W} y2={H - f * H * 0.85 - H * 0.05} stroke="rgba(255,255,255,0.04)" />
      ))}
      <motion.path d={areaPath} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <motion.path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p[0]} cy={p[1]} r="4" fill={color}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.05 }}
          style={{ transformOrigin: `${p[0]}px ${p[1]}px` }}
        />
      ))}
      {labels.filter((_, i) => i % 2 === 0).map((l, j) => {
        const i = j * 2;
        return <text key={i} x={pts[i]?.[0] ?? 0} y={H + 16} textAnchor="middle" fill="#555" fontSize="9" fontWeight="700">{l}</text>;
      })}
    </svg>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    published:        { label: 'Approved',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    pending_approval: { label: 'Pending Review',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
    rejected:         { label: 'Rejected',        color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    draft:            { label: 'Draft',           color: '#666',    bg: 'rgba(255,255,255,0.05)' },
  };
  const s = map[status] ?? { label: status, color: '#666', bg: 'rgba(255,255,255,0.05)' };
  return (
    <span className="admin-status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────
import { adminService } from '../../lib/adminService';
import { getAdminConversations } from '../../lib/chatService';

const RECENT_ACTIVITY = [
  { icon: 'event', text: 'Event "Tech Summit 2026" submitted for approval', time: '2m ago', color: '#FF9500' },
  { icon: 'org',   text: 'Organizer "ABC Events" verified successfully',    time: '15m ago', color: '#22C55E' },
  { icon: 'event', text: 'Event "Music Festival" approved by you',          time: '35m ago', color: '#22C55E' },
  { icon: 'pay',   text: 'Payment of KES 1,250 processed successfully',     time: '1h ago',  color: '#2E5BFF' },
  { icon: 'ref',   text: 'Refund of KES 850 processed for Order #ORD-88421',time: '2h ago',  color: '#EF4444' },
  { icon: 'user',  text: 'User John Doe suspended by you',                  time: '3h ago',  color: '#888' },
];

const ALERTS = [
  { text: '32 events pending approval',       sub: 'Review and take action',               time: '2m ago',  color: '#FF9500' },
  { text: 'Low disk space alert',             sub: 'Only 15% disk space remaining',         time: '1h ago',  color: '#EF4444' },
  { text: 'Payment gateway is healthy',       sub: 'All transactions are processing normally', time: '2h ago', color: '#22C55E' },
  { text: 'High traffic detected',            sub: '23% more traffic than usual',           time: '3h ago',  color: '#2E5BFF' },
  { text: '5 refund requests',               sub: 'Requires your attention',               time: '4h ago',  color: '#FF9500' },
];

// ─── Sidebar nav structure ────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'EVENTS',
    items: [
      { id: 'dashboard' as Page,        label: 'Dashboard',        icon: <LayoutDashboard size={16} /> },
      { id: 'manage-events' as Page,    label: 'Manage Events',    icon: <Calendar size={16} /> },
      { id: 'event-approvals' as Page,  label: 'Event Approvals',  icon: <ShieldCheck size={16} />, badge: true },
      { id: 'categories' as Page,       label: 'Categories',       icon: <FolderOpen size={16} /> },
      { id: 'hero-slides' as Page,      label: 'Hero Slideshow',   icon: <ImageIcon size={16} /> },
    ],
  },
  {
    label: 'USERS & ORGANIZERS',
    items: [
      { id: 'users' as Page,            label: 'Users',            icon: <Users size={16} /> },
      { id: 'organizers' as Page,       label: 'Organizers',       icon: <UserCheck size={16} /> },
      { id: 'roles' as Page,            label: 'Roles & Permissions', icon: <Tag size={16} /> },
    ],
  },
  {
    label: 'SALES & FINANCE',
    items: [
      { id: 'orders' as Page,           label: 'Orders & Tickets', icon: <Ticket size={16} /> },
      { id: 'payments' as Page,         label: 'Payments',         icon: <CreditCard size={16} /> },
      { id: 'refunds' as Page,          label: 'Refunds',          icon: <ReceiptText size={16} /> },
      { id: 'payouts' as Page,          label: 'Payouts',          icon: <DollarSign size={16} /> },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      { id: 'notifications' as Page,    label: 'Notifications',    icon: <Bell size={16} />, badge: true },
      { id: 'messages' as Page,         label: 'Messages',         icon: <MessageSquare size={16} />, badge: true },
      { id: 'announcements' as Page,    label: 'Announcements',    icon: <Megaphone size={16} /> },
      { id: 'email-logs' as Page,       label: 'Email Logs',       icon: <Mail size={16} /> },
    ],
  },
  {
    label: 'ANALYTICS & REPORTS',
    items: [
      { id: 'analytics' as Page,        label: 'Overview',         icon: <BarChart3 size={16} /> },
      { id: 'sales-reports' as Page,    label: 'Sales Reports',    icon: <TrendingUp size={16} /> },
      { id: 'event-performance' as Page,label: 'Event Performance',icon: <Activity size={16} /> },
      { id: 'user-analytics' as Page,   label: 'User Analytics',   icon: <Users size={16} /> },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'system-settings' as Page,  label: 'System Settings',  icon: <Settings size={16} /> },
      { id: 'gateways' as Page,         label: 'Payment Gateways', icon: <Plug size={16} /> },
      { id: 'audit-logs' as Page,       label: 'Audit Logs',       icon: <FileText size={16} /> },
      { id: 'activity-logs' as Page,    label: 'Activity Logs',    icon: <ClipboardList size={16} /> },
      { id: 'backup' as Page,           label: 'Backup & Restore', icon: <HardDrive size={16} /> },
    ],
  },
];

// ─── Placeholder for unbuilt pages ────────────────────────────────────────────
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="admin-coming-soon">
    <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
    <h3>{title}</h3>
    <p>This section will be built in a future update.</p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const page = useMemo(() => {
    const parts = location.pathname.split('/');
    if (parts.length <= 2 || !parts[2]) return 'dashboard';
    return parts[2] as Page;
  }, [location.pathname]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{ totalUsers: number; totalOrders: number; totalRevenue: number } | null>(null);
  const [trends, setTrends] = useState<{ revenue: number[]; tickets: number[]; users: number[]; events: number[]; refunds: number[]; labels: string[] } | null>(null);

  const { events, approveEvent, rejectEvent, deleteEvent, loading: eventsLoading } = useEvents();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [openChatCount, setOpenChatCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await adminService.getNotifications();
      setNotifications(data ?? []);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const loadChatCount = async () => {
    try {
      const convs = await getAdminConversations();
      setOpenChatCount((convs ?? []).filter(c => c.status === 'open').length);
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
    loadChatCount();
    const interval = setInterval(() => { loadNotifications(); loadChatCount(); }, 8000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    adminService.getDashboardStats().then(setStats).catch(console.error);
    adminService.getAnalyticsTrends('1y').then(d => {
      if (d) {
        setTrends({
          revenue: d.revenue.map((r: any) => r.value),
          tickets: d.tickets.map((r: any) => r.value),
          users:   d.users.map((r: any) => r.value),
          events:  d.events?.map((r: any) => r.value) ?? [],
          refunds: d.refunds?.map((r: any) => r.value) ?? [],
          labels:  d.revenue.map((r: any) => {
            const dt = new Date(r.label);
            return dt.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });
          }),
        });
      }
    }).catch(console.error);
  }, []);

  const pendingCount = events.filter(e => e.status === 'pending_approval').length;
  const publishedCount = events.filter(e => e.status === 'published').length;
  const totalRevenue = useMemo(() =>
    events.reduce((s, e) => s + e.tiers.reduce((ts, t) =>
      ts + (t.priceInt ?? parseInt(t.price.replace(/[^0-9]/g, ''), 10)) * t.sold, 0), 0), [events]);
  const totalTicketsSold = useMemo(() =>
    events.reduce((s, e) => s + e.tiers.reduce((ts, t) => ts + t.sold, 0), 0), [events]);

  const handleSignOut = () => { signOut(); navigate('/'); };

  const toggleGroup = (label: string) =>
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  const navigate2Page = (p: Page) => {
    navigate(p === 'dashboard' ? '/admin' : `/admin/${p}`);
    setSidebarOpen(false);
  };

  const last10 = (arr: number[]) => {
    const n = arr.length;
    if (n < 2) return [...arr, ...Array(10 - n).fill(0)].slice(-10);
    return arr.slice(-10);
  };
  const revSpark = trends ? last10(trends.revenue) : Array(10).fill(0);
  const tixSpark = trends ? last10(trends.tickets) : Array(10).fill(0);
  const usrSpark = trends ? last10(trends.users)   : Array(10).fill(0);
  const evtSpark = trends ? last10(trends.events)  : Array(10).fill(0);
  const refSpark = trends ? last10(trends.refunds) : Array(10).fill(0);
  const refundTotal = refSpark.reduce((s, v) => s + v, 0);

  const kpis = [
    { label: 'Total Events',       value: events.length.toLocaleString(),                  change: `${events.length} total`, up: true,  icon: <Calendar size={18}/>,      color: '#FF7020', spark: evtSpark },
    { label: 'Pending Approvals',  value: String(pendingCount),                             change: `${pendingCount > 0 ? pendingCount + ' pending' : 'All clear'}`, up: pendingCount === 0, icon: <AlertTriangle size={18}/>, color: '#FF9500', spark: evtSpark.map((_, i) => Math.round(evtSpark[i] * 0.3)) },
    { label: 'Tickets Sold',       value: (stats ? stats.totalOrders : totalTicketsSold).toLocaleString(), change: `${trends ? trends.tickets.reduce((s, v) => s + v, 0).toLocaleString() : '...'} total`, up: true,  icon: <Ticket size={18}/>,        color: '#00F2FE', spark: tixSpark },
    { label: 'Total Revenue',      value: `KES ${(stats ? stats.totalRevenue : totalRevenue).toLocaleString()}`, change: `${trends ? 'KES ' + (trends.revenue.reduce((s, v) => s + v, 0)/1000).toFixed(0) + 'K' : '...'}`, up: true,  icon: <DollarSign size={18}/>,     color: '#22C55E', spark: revSpark },
    { label: 'New Users',          value: String(stats ? stats.totalUsers : 0),             change: `${trends ? trends.users.reduce((s, v) => s + v, 0).toLocaleString() : '...'} total`,  up: true,  icon: <Users size={18}/>,         color: '#2E5BFF', spark: usrSpark },
    { label: 'Refunds',            value: refundTotal > 0 ? `KES ${refundTotal.toLocaleString()}` : 'KES 0', change: `${refundTotal > 0 ? 'KES ' + refundTotal.toLocaleString() : 'None'}`, up: false, icon: <ReceiptText size={18}/>,    color: '#EF4444', spark: refSpark },
  ];

  const donutSegs = [
    { value: publishedCount,                                               color: '#22C55E', label: 'Live' },
    { value: pendingCount,                                                 color: '#FF9500', label: 'Pending' },
    { value: events.filter(e => e.status === 'rejected').length,           color: '#EF4444', label: 'Rejected' },
    { value: events.filter(e => e.status === 'draft').length,              color: '#444',    label: 'Draft' },
  ].filter(s => s.value > 0);

  const topEvents = [...events]
    .filter(e => e.status === 'published')
    .sort((a, b) => {
      const rev = (e: typeof a) => e.tiers.reduce((s, t) => s + (t.priceInt ?? 0) * t.sold, 0);
      return rev(b) - rev(a);
    })
    .slice(0, 5);

  // ── Active page label ──
  const activeLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === page)?.label ?? 'Dashboard';

  return (
    <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Overlay */}
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="admin-sidebar-brand">
          <Link to="/" className="admin-brand-link">
            <span className="admin-brand-icon"><Sun size={20} style={{ color: '#FF9500' }}/></span>
            <div>
              <span className="admin-brand-name">Sunshine</span>
              <span className="admin-brand-sub">Tickets</span>
            </div>
          </Link>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}><X size={16} /></button>
        </div>

        {/* Nav groups */}
        <div className="admin-sidebar-scroll">
          {NAV_GROUPS.map(group => {
            const collapsed = collapsedGroups.has(group.label);
            return (
              <div key={group.label} className="admin-nav-group">
                <button className="admin-nav-group-label" onClick={() => toggleGroup(group.label)}>
                  {group.label}
                  <ChevronDown size={12} className={`admin-group-chevron ${collapsed ? 'collapsed' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          className={`admin-nav-item ${page === item.id ? 'active' : ''}`}
                          onClick={() => navigate2Page(item.id)}
                        >
                          <span className="admin-nav-icon">{item.icon}</span>
                          <span className="admin-nav-label">{item.label}</span>
                          {item.badge && pendingCount > 0 && item.id === 'event-approvals' && (
                            <span className="admin-nav-badge">{pendingCount}</span>
                          )}
                          {item.badge && item.id === 'notifications' && unreadNotifCount > 0 && (
                            <span className="admin-nav-badge">{unreadNotifCount}</span>
                          )}
                          {item.badge && item.id === 'messages' && openChatCount > 0 && (
                            <span className="admin-nav-badge">{openChatCount}</span>
                          )}
                          {page === item.id && <motion.div className="admin-nav-indicator" layoutId="navInd" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* User chip */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user" onClick={handleSignOut} title="Sign out">
            <div className="admin-user-avatar">{(user?.name ?? 'A').charAt(0).toUpperCase()}</div>
            <div className="admin-user-info">
              <strong>{user?.name ?? 'Admin User'}</strong>
              <span>Super Administrator</span>
            </div>
            <LogOut size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="admin-header-search">
            <Search size={14} />
            <input
              placeholder="Search events, users, orders, payments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="admin-kbd">⌘K</span>
          </div>
          <div className="admin-header-actions">
            <div className="admin-notif-wrapper" style={{ position: 'relative' }}>
              <button className="admin-notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={18} />
                {unreadNotifCount > 0 && <span className="admin-notif-badge">{unreadNotifCount}</span>}
              </button>
              {notifOpen && (
                <div className="admin-notif-dropdown" style={{
                  position: 'absolute', right: 0, top: '45px', width: '320px',
                  background: '#0F1014', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  zIndex: 1000, overflow: 'hidden'
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16171D' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>Notifications</span>
                    {unreadNotifCount > 0 && (
                      <span style={{ fontSize: '0.7rem', color: '#00f2fe', background: 'rgba(0,242,254,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {unreadNotifCount} New
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={async () => {
                            setNotifOpen(false);
                            try {
                              await adminService.markNotificationAsRead(n.id);
                              loadNotifications();
                            } catch (err) {}
                            if (n.link === '/admin/organizers') {
                              navigate2Page('organizers');
                            } else if (n.link === '/admin/users') {
                              navigate2Page('users');
                            }
                          }}
                          style={{
                            padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
                            cursor: 'pointer', transition: 'background 0.2s',
                            background: n.is_read ? 'transparent' : 'rgba(0, 242, 254, 0.04)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(0, 242, 254, 0.04)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: n.is_read ? '500' : '700', color: n.is_read ? '#A0A1A5' : '#FF7020' }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#666' }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#8A8D95', margin: 0, lineHeight: '1.4' }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-header-user" onClick={() => navigate2Page('system-settings')}>
              <div className="admin-header-avatar">{(user?.name ?? 'A').charAt(0).toUpperCase()}</div>
              <div className="admin-header-user-info">
                <span className="admin-header-username">{user?.name ?? 'Admin User'}</span>
                <span className="admin-header-role">Super Admin</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >

              {/* ══ DASHBOARD ══ */}
              {page === 'dashboard' && (
                <div className="admin-dashboard-page">
                  {/* Page heading */}
                  <div className="admin-page-header">
                    <div>
                      <h1>Welcome back, {(user?.name ?? 'Admin').split(' ')[0]}!</h1>
                      <p>{eventsLoading ? 'Loading data...' : "Here's what's happening on Sunshine Tickets."}</p>
                    </div>
                    <div className="admin-date-badge">
                      <Calendar size={14} />
                      May 18 – May 24, 2024
                    </div>
                  </div>

                  {/* KPI row */}
                  <div className="admin-kpi-row">
                    {kpis.map((k, i) => (
                      <motion.div key={i} className="admin-kpi-card"
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                        <div className="admin-kpi-top">
                          <div className="admin-kpi-icon" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
                          <span className="admin-kpi-label">{k.label}</span>
                        </div>
                        <div className="admin-kpi-value">{k.value}</div>
                        <div className="admin-kpi-bottom">
                          <span className={`admin-kpi-change ${k.up ? 'up' : 'down'}`}>
                            {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            <span>{k.change}</span>
                          </span>
                          <div className="admin-kpi-spark"><Sparkline data={k.spark} color={k.color} /></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Row: Pending Approvals + Recent Activity + System Overview */}
                  <div className="admin-mid-row">
                    {/* Pending Approvals */}
                    <div className="admin-glass-panel admin-pending-panel">
                      <div className="admin-panel-header">
                        <div>
                          <h3>Pending Event Approvals</h3>
                        </div>
                        <button className="admin-view-all" onClick={() => navigate2Page('event-approvals')}>View all</button>
                      </div>
                      <table className="admin-table">
                        <thead><tr><th>Event</th><th>Organizer</th><th>Submitted</th><th>Category</th><th>Actions</th></tr></thead>
                        <tbody>
                          {events.filter(e => e.status === 'pending_approval').slice(0, 5).map(e => (
                            <tr key={e.id}>
                              <td>
                                <div className="admin-event-cell">
                                  {e.image && <img src={e.image} alt="" className="admin-event-thumb" />}
                                  <div>
                                    <span className="admin-cell-title">{e.title}</span>
                                    <span className="admin-cell-sub">{e.location.split(',')[0]}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="admin-td-muted">{e.organizerName}</td>
                              <td className="admin-td-muted">{e.date}</td>
                              <td className="admin-td-muted">Event</td>
                              <td>
                                <div className="admin-row-actions">
                                  <button className="admin-act-approve" onClick={() => { approveEvent(e.id); toast(`"${e.title}" approved.`, 'success'); }} title="Approve"><CheckCircle size={13}/></button>
                                  <button className="admin-act-reject" onClick={() => navigate2Page('event-approvals')} title="Reject"><XCircle size={13}/></button>
                                  <button className="admin-act-view" onClick={() => navigate(`/event/${e.id}`)} title="View"><ChevronRight size={13}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {pendingCount === 0 && <tr><td colSpan={5} className="admin-empty-row">No pending approvals</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {/* Recent Activity */}
                    <div className="admin-glass-panel admin-activity-panel">
                      <div className="admin-panel-header">
                        <h3>Recent Activity</h3>
                        <button className="admin-view-all">View all</button>
                      </div>
                      <div className="admin-activity-list">
                        {RECENT_ACTIVITY.map((a, i) => (
                          <div key={i} className="admin-activity-row">
                            <div className="admin-activity-dot" style={{ background: a.color }} />
                            <div className="admin-activity-text">
                              <span>{a.text}</span>
                              <span className="admin-activity-time">{a.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* System Overview */}
                    <div className="admin-glass-panel admin-system-panel">
                      <div className="admin-panel-header">
                        <div>
                          <h3>System Overview</h3>
                          <p>View system health and status</p>
                        </div>
                      </div>
                      <div className="admin-system-grid">
                        <div className="admin-sys-item">
                          <div className="admin-sys-icon" style={{ color: '#22C55E', background: 'rgba(34,197,94,0.1)' }}><Activity size={14}/></div>
                          <span className="admin-sys-label">System Status</span>
                          <span className="admin-sys-value" style={{ color: '#22C55E' }}>All Systems Operational</span>
                        </div>
                        <div className="admin-sys-item">
                          <div className="admin-sys-icon" style={{ color: '#FF7020', background: 'rgba(255,112,32,0.1)' }}><Server size={14}/></div>
                          <span className="admin-sys-label">Server Load</span>
                          <span className="admin-sys-value">32%</span>
                        </div>
                        <div className="admin-sys-item">
                          <div className="admin-sys-icon" style={{ color: '#FF9500', background: 'rgba(255,149,0,0.1)' }}><HardDrive size={14}/></div>
                          <span className="admin-sys-label">Storage Usage</span>
                          <span className="admin-sys-value">45% <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>320 GB / 700 GB</span></span>
                        </div>
                        <div className="admin-sys-item">
                          <div className="admin-sys-icon" style={{ color: '#2E5BFF', background: 'rgba(46,91,255,0.1)' }}><Users size={14}/></div>
                          <span className="admin-sys-label">Active Sessions</span>
                          <span className="admin-sys-value">248 <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>users online</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row: Revenue chart + Tickets chart + Sales by category */}
                  <div className="admin-charts-row">
                    <div className="admin-glass-panel">
                      <div className="admin-panel-header">
                        <div>
                          <h3>Revenue Overview</h3>
                          <div className="admin-chart-kpi">KES {(totalRevenue/1000).toFixed(0)}K <span className="admin-chart-kpi-sub">Total Revenue</span></div>
                          <span className="admin-kpi-change up" style={{ fontSize: '0.75rem', marginTop: '2px', display: 'flex', gap: '4px', alignItems: 'center' }}><TrendingUp size={11}/>+16.3% from last month</span>
                        </div>
                        <select className="admin-period-select"><option>This Month</option></select>
                      </div>
                      <LineChart data={trends?.revenue ?? []} labels={trends?.labels ?? []} color="#FF9500" height={130} />
                    </div>
                    <div className="admin-glass-panel">
                      <div className="admin-panel-header">
                        <div>
                          <h3>Tickets Sold Overview</h3>
                          <div className="admin-chart-kpi">{totalTicketsSold.toLocaleString()} <span className="admin-chart-kpi-sub">Total Tickets Sold</span></div>
                          <span className="admin-kpi-change up" style={{ fontSize: '0.75rem', marginTop: '2px', display: 'flex', gap: '4px', alignItems: 'center' }}><TrendingUp size={11}/>+12.9% from last month</span>
                        </div>
                        <select className="admin-period-select"><option>This Month</option></select>
                      </div>
                      <LineChart data={trends?.tickets ?? []} labels={trends?.labels ?? []} color="#22C55E" height={130} />
                    </div>
                    <div className="admin-glass-panel admin-donut-panel">
                      <div className="admin-panel-header"><h3>Sales by Category</h3></div>
                      <div className="admin-donut-wrap">
                        <Donut segments={donutSegs.length ? donutSegs : [{ value: 1, color: '#333', label: 'None' }]} />
                      </div>
                      <div className="admin-donut-legend">
                        {donutSegs.map((s, i) => (
                          <div key={i} className="admin-legend-row">
                            <span className="admin-legend-dot" style={{ background: s.color }} />
                            <span className="admin-legend-label">{s.label}</span>
                            <span className="admin-legend-val">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row: Quick Actions + Top Selling Events + Alerts */}
                  <div className="admin-bottom-row">
                    <div className="admin-glass-panel admin-quick-actions">
                      <div className="admin-panel-header"><h3>Quick Actions</h3></div>
                      <div className="admin-qa-grid">
                        {[
                          { label: 'Add New Event',       icon: <Calendar size={16}/>,     color: '#FF7020', action: () => navigate2Page('manage-events') },
                          { label: 'Create Announcement', icon: <Megaphone size={16}/>,    color: '#2E5BFF', action: () => navigate2Page('announcements') },
                          { label: 'Verify Organizer',    icon: <UserCheck size={16}/>,    color: '#22C55E', action: () => navigate2Page('organizers') },
                          { label: 'Manage Users',        icon: <Users size={16}/>,        color: '#00F2FE', action: () => navigate2Page('users') },
                          { label: 'View Reports',        icon: <BarChart3 size={16}/>,    color: '#FF9500', action: () => navigate2Page('analytics') },
                          { label: 'System Settings',     icon: <Settings size={16}/>,     color: '#888',    action: () => navigate2Page('system-settings') },
                          { label: 'Export Data',         icon: <FileText size={16}/>,     color: '#FF7020', action: () => toast('Export feature coming soon.', 'info') },
                          { label: 'Clear Cache',         icon: <HardDrive size={16}/>,    color: '#EF4444', action: () => toast('Cache cleared.', 'success') },
                        ].map((qa, i) => (
                          <button key={i} className="admin-qa-btn" onClick={qa.action}>
                            <div className="admin-qa-icon" style={{ color: qa.color, background: `${qa.color}15` }}>{qa.icon}</div>
                            <span>{qa.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="admin-glass-panel admin-top-events">
                      <div className="admin-panel-header">
                        <h3>Top Selling Events</h3>
                        <button className="admin-view-all" onClick={() => navigate2Page('manage-events')}>View all</button>
                      </div>
                      <div className="admin-top-events-list">
                        {topEvents.map((e, i) => {
                          const rev = e.tiers.reduce((s, t) => s + (t.priceInt ?? 0) * t.sold, 0);
                          const sold = e.tiers.reduce((s, t) => s + t.sold, 0);
                          return (
                            <div key={e.id} className="admin-top-event-row">
                              <span className="admin-top-num">{i + 1}</span>
                              {e.image && <img src={e.image} alt="" className="admin-top-thumb" />}
                              <div className="admin-top-info">
                                <span className="admin-cell-title">{e.title}</span>
                                <span className="admin-cell-sub">{e.location.split(',')[0]}</span>
                              </div>
                              <div className="admin-top-stats">
                                <span className="admin-top-tickets">{sold.toLocaleString()} tickets</span>
                                <span className="admin-top-rev">KES {(rev/1000).toFixed(0)}K</span>
                              </div>
                            </div>
                          );
                        })}
                        {topEvents.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No published events yet.</p>}
                      </div>
                    </div>

                    <div className="admin-glass-panel admin-alerts-panel">
                      <div className="admin-panel-header">
                        <h3>Alerts & Notifications</h3>
                        <button className="admin-view-all">View all</button>
                      </div>
                      <div className="admin-alerts-list">
                        {ALERTS.map((a, i) => (
                          <div key={i} className="admin-alert-row">
                            <div className="admin-alert-dot" style={{ background: a.color }} />
                            <div className="admin-alert-text">
                              <span className="admin-alert-title">{a.text}</span>
                              <span className="admin-alert-sub">{a.sub}</span>
                            </div>
                            <span className="admin-alert-time">{a.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Events */}
                  <div className="admin-glass-panel">
                    <div className="admin-panel-header">
                      <div><h3>Recent Events</h3></div>
                      <button className="admin-view-all" onClick={() => navigate2Page('manage-events')}>View all events →</button>
                    </div>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr><th>Event</th><th>Organizer</th><th>Date</th><th>Location</th><th>Tickets</th><th>Revenue</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {events.slice(0, 5).map(e => {
                            const rev = e.tiers.reduce((s, t) => s + (t.priceInt ?? 0) * t.sold, 0);
                            const sold = e.tiers.reduce((s, t) => s + t.sold, 0);
                            return (
                              <tr key={e.id}>
                                <td>
                                  <div className="admin-event-cell">
                                    {e.image && <img src={e.image} alt="" className="admin-event-thumb" />}
                                    <div>
                                      <span className="admin-cell-title">{e.title}</span>
                                      <span className="admin-cell-sub">{e.location.split(',')[0]}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="admin-td-muted">{e.organizerName}</td>
                                <td className="admin-td-muted">{e.date}</td>
                                <td className="admin-td-muted">{e.location.split(',').slice(-2).join(',').trim()}</td>
                                <td className="admin-td-muted">{sold.toLocaleString()}</td>
                                <td className="admin-td-rev">KES {(rev/1000).toFixed(0)}K</td>
                                <td><StatusBadge status={e.status} /></td>
                                <td>
                                  <div className="admin-row-actions">
                                    <button className="admin-act-view" onClick={() => navigate(`/event/${e.id}`)}><ChevronRight size={13}/></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ SUB-PAGES ══ */}
              {page === 'event-approvals' && <EventApprovalsPage onNavigate={navigate2Page} />}
              {page === 'manage-events'   && <ManageEventsPage   onNavigate={navigate2Page} />}
              {page === 'users'           && <UsersPage          searchQuery={searchQuery} />}
              {page === 'orders'          && <OrdersPage />}
              {page === 'payments'        && <PaymentsPage />}
              {page === 'analytics'       && <AnalyticsPage />}
              {page === 'system-settings' && <SettingsPage />}
              {page === 'refunds'         && <RefundsPage />}
              {page === 'payouts'         && <AdminPayoutsPage />}
              {page === 'organizers'      && <OrganizersPage />}
              {page === 'roles'           && <RolesPage />}
              {page === 'notifications'   && <NotificationsPage />}
              {page === 'messages'        && <ChatMessagesPage />}
              {page === 'announcements'   && <AnnouncementsPage />}
              {page === 'audit-logs'      && <AuditLogsPage />}
              {page === 'gateways'          && <GatewaysPage />}
              {page === 'hero-slides'       && <HeroSlidesPage />}
              {page === 'categories'        && <CategoriesPage />}
              {page === 'email-logs'        && <EmailLogsPage />}
              {page === 'sales-reports'     && <SalesReportsPage />}
              {page === 'event-performance' && <EventPerformancePage />}
              {page === 'user-analytics'    && <UserAnalyticsPage />}
              {page === 'activity-logs'     && <ActivityLogsPage />}
              {page === 'backup'            && <BackupRestorePage />}

              {/* ── Stubs for remaining pages ── */}
              {!['dashboard','event-approvals','manage-events','users','orders','payments','analytics','system-settings','refunds','payouts','organizers','roles','notifications','messages','announcements','audit-logs','gateways','hero-slides','categories','email-logs','sales-reports','event-performance','user-analytics','activity-logs','backup'].includes(page) && (
                <ComingSoon title={activeLabel} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
