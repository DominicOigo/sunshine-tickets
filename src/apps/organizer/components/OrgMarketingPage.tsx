import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Share2, Mail, Users, TrendingUp, Plus, Copy, ExternalLink, Check } from 'lucide-react';
import { useEvents } from '../../../context/EventContext';
import { useToast } from '../../../context/ToastContext';
import './OrgSubPage.css';

const CAMPAIGNS = [
  { id: '1', name: 'Tech Summit Early Bird',    type: 'Email',    sent: 1240, opens: 680,  clicks: 124, status: 'active'   },
  { id: '2', name: 'Diamond Platnumz Social',   type: 'Social',   sent: 0,    opens: 3400, clicks: 890, status: 'active'   },
  { id: '3', name: 'Koroga Festival Promo',     type: 'Email',    sent: 890,  opens: 412,  clicks: 88,  status: 'completed' },
  { id: '4', name: 'Sauti Sol VIP Push',        type: 'Push',     sent: 2100, opens: 1050, clicks: 315, status: 'draft'    },
];

const PROMO_CODES = [
  { code: 'EARLY20', discount: '20% off', uses: 48,  limit: 100, expires: 'Jun 1, 2026' },
  { code: 'VIP500',  discount: 'KES 500', uses: 12,  limit: 50,  expires: 'Jun 15, 2026' },
  { code: 'FRIENDS', discount: '15% off', uses: 7,   limit: 200, expires: 'Jul 1, 2026' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  completed: { label: 'Completed', color: '#888',    bg: 'rgba(255,255,255,0.05)' },
  draft:     { label: 'Draft',     color: '#FF9500', bg: 'rgba(255,149,0,0.1)'  },
};

const OrgMarketingPage: React.FC = () => {
  const { events } = useEvents();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    toast(`Code "${code}" copied!`, 'success');
    setTimeout(() => setCopied(null), 2000);
  };

  const stats = [
    { label: 'Total Reach',    value: '8,430',  color: '#FF9500', icon: <Users size={16}/> },
    { label: 'Conversions',    value: '1,417',  color: '#22C55E', icon: <TrendingUp size={16}/> },
    { label: 'Active Campaigns',value: CAMPAIGNS.filter(c=>c.status==='active').length.toString(), color: '#2E5BFF', icon: <Megaphone size={16}/> },
    { label: 'Promo Codes',    value: PROMO_CODES.length.toString(), color: '#9B59B6', icon: <Share2 size={16}/> },
  ];

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div><h1>Marketing Center</h1><p>Promote your events and reach more attendees.</p></div>
        <button className="osp-primary-btn" onClick={() => toast('Campaign builder requires backend.', 'info')}>
          <Plus size={14}/> New Campaign
        </button>
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

      {/* Campaigns */}
      <div className="osp-glass-panel">
        <div className="osp-panel-hdr">
          <h3>Campaigns</h3>
          <button className="osp-view-all-btn" onClick={() => toast('Full campaign management requires backend.', 'info')}>View all</button>
        </div>
        <div className="osp-table-wrap">
          <table className="osp-table">
            <thead><tr><th>Campaign</th><th>Type</th><th>Sent / Reach</th><th>Opens</th><th>Clicks</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {CAMPAIGNS.map((c, i) => {
                const sm = STATUS_META[c.status];
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td className="osp-cell-title">{c.name}</td>
                    <td>
                      <span className="osp-type-badge">{c.type === 'Email' ? <Mail size={12}/> : c.type === 'Social' ? <Share2 size={12}/> : <Megaphone size={12}/>} {c.type}</span>
                    </td>
                    <td className="osp-td-muted">{(c.sent || c.opens).toLocaleString()}</td>
                    <td className="osp-td-muted">{c.opens.toLocaleString()}</td>
                    <td className="osp-td-rev">{c.clicks.toLocaleString()}</td>
                    <td><span className="osp-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>{sm.label}</span></td>
                    <td><button className="osp-action-btn" onClick={() => toast('Campaign editor requires backend.', 'info')}><ExternalLink size={13}/></button></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo Codes */}
      <div className="osp-glass-panel">
        <div className="osp-panel-hdr">
          <h3>Promo Codes</h3>
          <button className="osp-primary-btn" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
            onClick={() => toast('Promo code creation requires backend.', 'info')}>
            <Plus size={13}/> Create Code
          </button>
        </div>
        <div className="osp-promo-grid">
          {PROMO_CODES.map((p, i) => (
            <motion.div key={i} className="osp-promo-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="osp-promo-top">
                <span className="osp-promo-code">{p.code}</span>
                <button className="osp-copy-btn" onClick={() => copyCode(p.code)}>
                  {copied === p.code ? <Check size={13}/> : <Copy size={13}/>}
                </button>
              </div>
              <div className="osp-promo-discount">{p.discount}</div>
              <div className="osp-promo-meta">
                <span>{p.uses} / {p.limit} used</span>
                <span>Expires {p.expires}</span>
              </div>
              <div className="osp-bar-wrap" style={{ marginTop: '0.5rem' }}>
                <motion.div className="osp-bar" style={{ background: '#9B59B6' }} initial={{ width: 0 }} animate={{ width: `${Math.round(p.uses/p.limit*100)}%` }} transition={{ duration: 0.8, delay: i*0.1 }}/>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Event Share Links */}
      <div className="osp-glass-panel">
        <div className="osp-panel-hdr"><h3>Event Share Links</h3></div>
        <div className="osp-share-list">
          {events.filter(e => e.status === 'published').slice(0, 4).map((e, i) => (
            <div key={e.id} className="osp-share-row">
              {e.image && <img src={e.image} alt="" className="osp-event-thumb"/>}
              <span className="osp-cell-title" style={{ flex: 1 }}>{e.title}</span>
              <span className="osp-share-url">sunshinetickets.co.ke/event/{e.id}</span>
              <button className="osp-copy-btn" onClick={() => copyCode(`sunshinetickets.co.ke/event/${e.id}`)}>
                {copied === `sunshinetickets.co.ke/event/${e.id}` ? <Check size={13}/> : <Copy size={13}/>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrgMarketingPage;
