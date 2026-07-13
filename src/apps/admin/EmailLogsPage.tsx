import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, RefreshCw, Filter } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './EmailLogsPage.css';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  sent:     { label: 'Sent',     color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  failed:   { label: 'Failed',   color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
  bounced:  { label: 'Bounced',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)'  },
  pending:  { label: 'Pending',  color: '#2E5BFF', bg: 'rgba(46,91,255,0.1)'  },
};

const PER_PAGE = 8;

const EmailLogsPage: React.FC = () => {
  const { toast } = useToast();
  const [emails,   setEmails]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [page,     setPage]     = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search)  params.search = search;
      if (from)    params.from   = from;
      if (to)      params.to     = to;
      const data = await adminService.getEmailLogs(params);
      setEmails(data);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalPages = Math.ceil(emails.length / PER_PAGE);
  const paged = emails.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = [
    { label: 'Total Emails', value: emails.length, color: '#2E5BFF' },
    { label: 'Sent',         value: emails.filter(e => e.status === 'sent').length, color: '#22C55E' },
    { label: 'Failed',       value: emails.filter(e => e.status === 'failed').length, color: '#EF4444' },
    { label: 'Bounced',      value: emails.filter(e => e.status === 'bounced').length, color: '#FF9500' },
  ];

  const handleSearch = () => {
    setPage(1);
    load();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Email Logs</h1><p>View all emails sent from the platform.</p></div>
        <button className="up-add-btn" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-gray)' }} onClick={load}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      <div className="up-stats">
        {stats.map((s, i) => (
          <div key={i} className="admin-glass-panel up-stat-card">
            <span className="up-stat-label">{s.label}</span>
            <span className="up-stat-val" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="up-toolbar">
        <div className="up-search">
          <Search size={14}/>
          <input placeholder="Search by recipient or subject..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}/>
        </div>
        <div className="up-filters">
          <input type="date" className="up-select" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} style={{ maxWidth: 140, colorScheme: 'dark' }} />
          <input type="date" className="up-select" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} style={{ maxWidth: 140, colorScheme: 'dark' }} />
          <button className="up-filter-btn" onClick={handleSearch}><Filter size={14}/> Filter</button>
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading email logs...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Recipient</th><th>Subject</th><th>Status</th><th>Sent At</th></tr>
              </thead>
              <tbody>
                {paged.length === 0 && <tr><td colSpan={4} className="admin-empty-row">No email logs match your filters.</td></tr>}
                {paged.map((e, i) => {
                  const sm = STATUS_META[e.status] ?? STATUS_META.sent;
                  return (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td><span className="admin-cell-title">{e.recipient}</span></td>
                      <td className="admin-td-muted">{e.subject}</td>
                      <td>
                        <span className="up-status-badge" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>{sm.label}</span>
                      </td>
                      <td className="admin-td-muted">{new Date(e.sent_at).toLocaleString('en-KE')}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="up-pagination">
          <span className="up-count">Showing {Math.min((page - 1) * PER_PAGE + 1, emails.length)}–{Math.min(page * PER_PAGE, emails.length)} of {emails.length} emails</span>
          <div className="up-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`up-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailLogsPage;
