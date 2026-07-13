import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Clock, CheckCircle, MoreHorizontal,
  Download, UserCheck, Shield, Tag, Bell, Megaphone, FileText,
  Plug, AlertTriangle, RefreshCw, Search, Plus, Filter,
  X, Check, Activity, Globe, Trash2, UserX, Image as ImageIcon,
  ChevronUp, ChevronDown, Eye, EyeOff, MessageSquare, Send, Loader,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService, HeroSlide } from '../../lib/adminService';
import {
  getAdminConversations, getAdminConversation, adminSendMessage, closeConversation,
  type Conversation, type Message, getSocket, disconnectSocket
} from '../../lib/chatService';

// ── Shared ─────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className="admin-status-badge" style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>{label}</span>
);

// ── Refunds Page ───────────────────────────────────────────────────────────
export const RefundsPage: React.FC = () => {
  const { toast } = useToast();
  const [refunds,  setRefunds]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRefunds(await adminService.getRefunds()); }
    catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const total    = refunds.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
  const pending  = refunds.filter(r => r.status === 'pending').length;

  const STATUS: Record<string, { label: string; color: string }> = {
    approved: { label: 'Approved', color: '#22C55E' },
    pending:  { label: 'Pending',  color: '#FF9500' },
    rejected: { label: 'Rejected', color: '#EF4444' },
  };

  const handle = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.updateRefundStatus(id, status);
      await adminService.log(`refund.${status}`, `Refund ${id}`);
      toast(`Refund ${status}.`, status === 'approved' ? 'success' : 'info');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  return (
    <div className="up-shell">
      <div className="up-heading"><div><h1>Refunds</h1><p>Review and process refund requests.</p></div></div>
      <div className="up-stats">
        {[
          { label: 'Total Refunds',    value: refunds.length,                          color: '#FF9500' },
          { label: 'Pending Review',   value: pending,                                 color: '#FF7020' },
          { label: 'Total Refunded',   value: `KES ${(total/1000).toFixed(1)}K`,       color: '#EF4444' },
          { label: 'Approval Rate',    value: refunds.length ? `${Math.round(refunds.filter(r=>r.status==='approved').length/refunds.length*100)}%` : '0%', color: '#22C55E' },
        ].map((s, i) => <div key={i} className="admin-glass-panel up-stat-card"><span className="up-stat-label">{s.label}</span><span className="up-stat-val" style={{ color: s.color }}>{s.value}</span></div>)}
      </div>
      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading...</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Ref</th><th>Order</th><th>Customer</th><th>Event</th><th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {refunds.length === 0 && <tr><td colSpan={8} className="admin-empty-row">No refund requests.</td></tr>}
                {refunds.map((r, i) => {
                  const sm = STATUS[r.status] ?? STATUS.pending;
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <td><span style={{ fontFamily: 'monospace', color: '#FF9500', fontWeight: 700 }}>{r.reference}</span></td>
                      <td className="admin-td-muted">{r.orders?.reference ?? '—'}</td>
                      <td className="admin-cell-title">{r.profiles?.full_name ?? '—'}</td>
                      <td className="admin-td-muted">{r.orders?.events?.title ?? '—'}</td>
                      <td className="admin-td-rev">KES {r.amount.toLocaleString()}</td>
                      <td className="admin-td-muted">{r.reason}</td>
                      <td><StatusBadge label={sm.label} color={sm.color}/></td>
                      <td>
                        <div className="admin-row-actions">
                          {r.status === 'pending' && <>
                            <button className="admin-act-approve" onClick={() => handle(r.id, 'approved')} title="Approve"><Check size={12}/></button>
                            <button className="admin-act-reject"  onClick={() => handle(r.id, 'rejected')} title="Reject"><X size={12}/></button>
                          </>}
                          <button className="admin-act-view" onClick={() => toast('Details require backend.', 'info')}><MoreHorizontal size={13}/></button>
                        </div>
                      </td>
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

// ── Admin Payouts Page ─────────────────────────────────────────────────────
export const AdminPayoutsPage: React.FC = () => {
  const { toast } = useToast();
  const [payouts,  setPayouts]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    setLoading(true);
    try { setPayouts(await adminService.getPayouts()); }
    catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalPaid = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + p.net_amount, 0);

  const STATUS: Record<string, { label: string; color: string }> = {
    completed:  { label: 'Paid',       color: '#22C55E' },
    pending:    { label: 'Pending',    color: '#FF9500' },
    processing: { label: 'Processing', color: '#2E5BFF' },
    failed:     { label: 'Failed',     color: '#EF4444' },
  };

  const process = async (id: string) => {
    try {
      await adminService.updatePayoutStatus(id, 'completed');
      toast('Payout marked as completed.', 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Payouts</h1><p>Manage organizer payout disbursements.</p></div>
        <button className="up-add-btn" onClick={() => toast('Export coming soon.', 'info')}><Download size={14}/> Export</button>
      </div>
      <div className="up-stats">
        {[
          { label: 'Total Disbursed', value: `KES ${(totalPaid/1000).toFixed(0)}K`,                                color: '#22C55E' },
          { label: 'Pending',         value: payouts.filter(p => p.status !== 'completed').length,                 color: '#FF9500' },
          { label: 'Platform Fees',   value: `KES ${payouts.reduce((s,p)=>s+p.fee_amount,0).toLocaleString()}`,    color: '#EF4444' },
          { label: 'Paid Out',        value: payouts.filter(p => p.status === 'completed').length,                 color: '#2E5BFF' },
        ].map((s, i) => <div key={i} className="admin-glass-panel up-stat-card"><span className="up-stat-label">{s.label}</span><span className="up-stat-val" style={{ color: s.color }}>{s.value}</span></div>)}
      </div>
      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading...</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Ref</th><th>Organizer</th><th>Event</th><th>Gross</th><th>Fee</th><th>Net</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {payouts.length === 0 && <tr><td colSpan={8} className="admin-empty-row">No payouts yet.</td></tr>}
                {payouts.map((p, i) => {
                  const sm = STATUS[p.status] ?? STATUS.pending;
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <td><span style={{ fontFamily: 'monospace', color: '#FF9500', fontWeight: 700 }}>{p.reference}</span></td>
                      <td className="admin-cell-title">{p.profiles?.full_name ?? '—'}</td>
                      <td className="admin-td-muted">{p.events?.title ?? '—'}</td>
                      <td className="admin-td-muted">KES {p.gross_amount.toLocaleString()}</td>
                      <td style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 700 }}>− KES {p.fee_amount.toLocaleString()}</td>
                      <td className="admin-td-rev">KES {p.net_amount.toLocaleString()}</td>
                      <td><StatusBadge label={sm.label} color={sm.color}/></td>
                      <td>
                        {p.status === 'pending' && (
                          <button className="admin-act-approve" onClick={() => process(p.id)} title="Mark paid"><Check size={12}/></button>
                        )}
                      </td>
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

// ── Organizers Page ────────────────────────────────────────────────────────
export const OrganizersPage: React.FC = () => {
  const { toast } = useToast();
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalTab, setModalTab] = useState<'events' | 'orders' | 'payouts'>('events');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrganizers();
      setOrganizers(data ?? []);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const loadDetails = async (id: string) => {
    setDetailsLoading(true);
    try {
      const data = await adminService.getOrganizerDetails(id);
      setDetails(data);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = organizers.filter(o =>
    o.full_name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  const verify = async (id: string, name: string) => {
    try {
      await adminService.verifyOrganizer(id);
      toast(`${name} verified successfully.`, 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const unverify = async (id: string, name: string) => {
    try {
      await adminService.unverifyOrganizer(id);
      toast(`${name} deactivated/unverified.`, 'info');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const toggleSuspend = async (id: string, name: string, isSuspended: boolean) => {
    try {
      await adminService.suspendUser(id, !isSuspended);
      toast(`${name} ${!isSuspended ? 'suspended' : 'unsuspended'}.`, 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const remove = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete organizer "${name}"?`)) {
      try {
        await adminService.deleteUser(id);
        toast(`${name} permanently removed.`, 'success');
        load();
      } catch (e: any) { toast(e.message, 'error'); }
    }
  };

  const handleVerifyDetails = async () => {
    if (!details) return;
    await verify(details.organizer.id, details.organizer.full_name);
    loadDetails(details.organizer.id);
  };

  const handleUnverifyDetails = async () => {
    if (!details) return;
    await unverify(details.organizer.id, details.organizer.full_name);
    loadDetails(details.organizer.id);
  };

  const handleSuspendDetails = async () => {
    if (!details) return;
    await toggleSuspend(details.organizer.id, details.organizer.full_name, details.organizer.is_suspended);
    loadDetails(details.organizer.id);
  };

  const handleDeleteDetails = async () => {
    if (!details) return;
    await remove(details.organizer.id, details.organizer.full_name);
    setSelectedOrgId(null);
    setDetails(null);
  };

  return (
    <div className="up-shell">
      <div className="up-heading"><div><h1>Organizers</h1><p>Manage and verify event organizers.</p></div></div>
      <div className="up-stats">
        {[
          { label: 'Total',     value: organizers.length,                                   color: '#FF7020' },
          { label: 'Verified',  value: organizers.filter(o => o.is_verified).length,        color: '#22C55E' },
          { label: 'Suspended', value: organizers.filter(o => o.is_suspended).length,       color: '#EF4444' },
          { label: 'Unverified',value: organizers.filter(o => !o.is_verified).length,       color: '#FF9500' },
        ].map((s, i) => <div key={i} className="admin-glass-panel up-stat-card"><span className="up-stat-label">{s.label}</span><span className="up-stat-val" style={{ color: s.color }}>{s.value}</span></div>)}
      </div>
      <div className="up-toolbar">
        <div className="up-search"><Search size={14}/><input placeholder="Search organizers..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      </div>
      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading...</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Organizer</th><th>Email</th><th>Verified</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6} className="admin-empty-row">No organizers found.</td></tr>}
                {filtered.map((o, i) => (
                  <motion.tr 
                    key={o.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.04 }}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
                        setSelectedOrgId(o.id);
                        loadDetails(o.id);
                      }
                    }}
                  >
                    <td><div className="admin-event-cell"><div className="up-avatar">{o.full_name.charAt(0)}</div><span className="admin-cell-title">{o.full_name}</span></div></td>
                    <td className="admin-td-muted">{o.email}</td>
                    <td><StatusBadge label={o.is_verified ? 'Verified' : 'Unverified'} color={o.is_verified ? '#22C55E' : '#FF9500'}/></td>
                    <td><StatusBadge label={o.is_suspended ? 'Suspended' : 'Active'} color={o.is_suspended ? '#EF4444' : '#22C55E'}/></td>
                    <td className="admin-td-muted">{new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                    <td>
                      <div className="admin-row-actions">
                        {!o.is_verified ? (
                          <button className="admin-act-approve" onClick={() => verify(o.id, o.full_name)} title="Approve & Verify">
                            <UserCheck size={12}/>
                          </button>
                        ) : (
                          <button className="admin-act-reject" onClick={() => unverify(o.id, o.full_name)} title="Deactivate / Unverify">
                            <UserX size={12}/>
                          </button>
                        )}
                        <button 
                          className="admin-act-view" 
                          style={{ color: o.is_suspended ? '#22C55E' : '#FF9500' }}
                          onClick={() => toggleSuspend(o.id, o.full_name, o.is_suspended)} 
                          title={o.is_suspended ? 'Unsuspend' : 'Suspend'}
                        >
                          <Shield size={12}/>
                        </button>
                        <button 
                          className="admin-act-reject" 
                          style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          onClick={() => remove(o.id, o.full_name)} 
                          title="Delete Permanently"
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Organizer Detail Modal */}
      {selectedOrgId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '2rem'
        }}>
          <div className="admin-glass-panel" style={{
            width: '100%', maxWidth: '950px', background: '#0F1014',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#16171D'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>Organizer Full Details</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#666' }}>Full account audit and hosting overview</p>
              </div>
              <button onClick={() => { setSelectedOrgId(null); setDetails(null); setModalTab('events'); }} style={{
                color: 'var(--text-gray)', padding: '6px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer'
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {detailsLoading || !details ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ border: '3px solid rgba(255,112,32,0.1)', borderTop: '3px solid #FF7020', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite' }}></div>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>Loading details and event history...</span>
                </div>
              ) : (
                <>
                  {/* Stats & Overview Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {/* Basic details */}
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Profile Information</span>
                      <strong style={{ display: 'block', fontSize: '1rem', color: 'white', marginTop: '0.5rem' }}>{details.organizer.full_name}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '2px' }}>@{details.organizer.username}</span>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{details.organizer.email}</span>
                    </div>

                    {/* Business Details */}
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Business Details</span>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'white', marginTop: '0.5rem' }}>{details.organizer.business_name || 'Individual Host'}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '2px' }}>M-Pesa: {details.organizer.payout_phone || 'None'}</span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <StatusBadge label={details.organizer.is_verified ? 'Verified' : 'Unverified'} color={details.organizer.is_verified ? '#22C55E' : '#FF9500'}/>
                        <StatusBadge label={details.organizer.is_suspended ? 'Suspended' : 'Active'} color={details.organizer.is_suspended ? '#EF4444' : '#22C55E'}/>
                      </div>
                    </div>

                    {/* Performance summaries */}
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Earnings Summary</span>
                      <strong style={{ display: 'block', fontSize: '1.25rem', color: '#22C55E', marginTop: '0.5rem' }}>KES {details.stats.totalRevenue.toLocaleString()}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '2px' }}>{details.stats.totalTicketsSold} tickets sold</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across {details.stats.totalEvents} events</span>
                    </div>
                  </div>

                  {/* Administrative Action Controls */}
                  <div style={{
                    padding: '1rem', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>Quick Administrative Actions</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!details.organizer.is_verified ? (
                        <button onClick={handleVerifyDetails} style={{ background: '#22C55E', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          Approve / Verify
                        </button>
                      ) : (
                        <button onClick={handleUnverifyDetails} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          Deactivate
                        </button>
                      )}
                      
                      <button onClick={handleSuspendDetails} style={{ background: details.organizer.is_suspended ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${details.organizer.is_suspended ? '#22C55E' : '#EF4444'}`, color: details.organizer.is_suspended ? '#22C55E' : '#EF4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        {details.organizer.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>

                      <button onClick={handleDeleteDetails} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        Delete Permanently
                      </button>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0px' }}>
                    {[
                      { id: 'events', label: `Events (${details.events.length})` },
                      { id: 'orders', label: `Ticket Sales / Orders (${details.orders.length})` },
                      { id: 'payouts', label: `Payouts (${details.payouts.length})` }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setModalTab(t.id as any)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: modalTab === t.id ? '#FF7020' : 'var(--text-muted)',
                          borderBottom: modalTab === t.id ? '2px solid #FF7020' : '2px solid transparent',
                          padding: '0.6rem 1.2rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div>
                    {modalTab === 'events' && (
                      <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Event Title</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Type / Category</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Location</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Date</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Status</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)', textAlign: 'right' }}>Tickets Sold</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)', textAlign: 'right' }}>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.events.length === 0 ? (
                              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No events hosted yet.</td></tr>
                            ) : (
                              details.events.map((e: any) => (
                                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '0.75rem 1rem', color: 'white', fontWeight: 600 }}>{e.title}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>{e.category_name || 'Other'}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{e.location}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{new Date(e.start_date).toLocaleDateString('en-KE')}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{
                                      fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                      background: e.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(255,149,0,0.1)',
                                      color: e.status === 'published' ? '#22C55E' : '#FF9500'
                                    }}>{e.status}</span>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'white' }}>{e.tickets_sold}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#22C55E', fontWeight: 'bold' }}>KES {e.revenue.toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {modalTab === 'orders' && (
                      <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Order Ref</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Customer</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Event</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)', textAlign: 'right' }}>Qty</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)', textAlign: 'right' }}>Total</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Status</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.orders.length === 0 ? (
                              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No ticket sales yet.</td></tr>
                            ) : (
                              details.orders.map((o: any) => (
                                <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '0.75rem 1rem', color: '#FF9500', fontWeight: 'bold', fontFamily: 'monospace' }}>{o.reference}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'white' }}>
                                    <div>{o.customer_name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{o.customer_email}</div>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'white' }}>{o.event_title}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'white' }}>{o.quantity}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#22C55E', fontWeight: 'bold' }}>KES {o.total_amount.toLocaleString()}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{
                                      fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                      background: o.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                      color: o.status === 'confirmed' ? '#22C55E' : '#EF4444'
                                    }}>{o.status}</span>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {modalTab === 'payouts' && (
                      <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Ref</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Event</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)', textAlign: 'right' }}>Gross</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)', textAlign: 'right' }}>Fee</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)', textAlign: 'right' }}>Net</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>M-Pesa</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Status</th>
                              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-gray)' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.payouts.length === 0 ? (
                              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No payouts history.</td></tr>
                            ) : (
                              details.payouts.map((p: any) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '0.75rem 1rem', color: '#FF9500', fontWeight: 'bold', fontFamily: 'monospace' }}>{p.reference}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'white' }}>{p.event_title || '—'}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>KES {p.gross_amount.toLocaleString()}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#EF4444' }}>− KES {p.fee_amount.toLocaleString()}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#22C55E', fontWeight: 'bold' }}>KES {p.net_amount.toLocaleString()}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'white' }}>{p.mpesa_phone || '—'}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{
                                      fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                      background: p.status === 'completed' ? 'rgba(34,197,94,0.1)' : p.status === 'pending' ? 'rgba(255,149,0,0.1)' : 'rgba(239,68,68,0.1)',
                                      color: p.status === 'completed' ? '#22C55E' : p.status === 'pending' ? '#FF9500' : '#EF4444'
                                    }}>{p.status}</span>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'flex-end', background: '#16171D'
            }}>
              <button onClick={() => { setSelectedOrgId(null); setDetails(null); setModalTab('events'); }} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'white', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer'
              }}>
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Roles & Permissions ────────────────────────────────────────────────────
export const RolesPage: React.FC = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: '', color: '#888', users: 0 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRoles();
      setRoles(data ?? []);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', permissions: '', color: '#888', users: 0 });
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description || '', permissions: (r.permissions || []).join(', '), color: r.color, users: r.users });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Name is required.', 'error'); return; }
    setSaving(true);
    try {
      const permissions = form.permissions.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (editing) {
        await adminService.updateRole(editing.id, { name: form.name, description: form.description, permissions, color: form.color, users: form.users });
        toast('Role updated.', 'success');
      } else {
        await adminService.createRole({ name: form.name, description: form.description, permissions, color: form.color, users: form.users });
        toast('Role created.', 'success');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete role "${name}"?`)) {
      try {
        await adminService.deleteRole(id);
        toast('Role deleted.', 'success');
        load();
      } catch (e: any) { toast(e.message, 'error'); }
    }
  };

  return (
    <div className="up-shell">
      <div className="up-heading"><div><h1>Roles &amp; Permissions</h1><p>Manage admin roles and access control.</p></div>
        <button className="up-add-btn" onClick={openNew}><Plus size={14}/> New Role</button>
      </div>

      {showForm && (
        <motion.div className="admin-glass-panel" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', marginBottom: '1rem' }}>{editing ? 'Edit Role' : 'New Role'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Name</label>
              <input className="admin-form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Role name" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Color</label>
              <input className="admin-form-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="#888" />
            </div>
            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-form-label">Description</label>
              <input className="admin-form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Role description" />
            </div>
            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-form-label">Permissions (comma-separated)</label>
              <input className="admin-form-input" value={form.permissions} onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))} placeholder="Events, Users, Finance" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Users Count</label>
              <input className="admin-form-input" type="number" value={form.users} onChange={e => setForm(f => ({ ...f, users: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button className="up-add-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Role' : 'Create Role')}</button>
            <button className="admin-btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem', gridColumn: '1 / -1' }}>Loading...</div> :
          roles.length === 0 ? <div className="admin-empty-row" style={{ padding: '3rem', gridColumn: '1 / -1' }}>No roles yet. Create one to get started.</div> :
          roles.map((r, i) => (
            <motion.div key={r.id} className="admin-glass-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }}/>
                  <strong style={{ color: 'white', fontWeight: 800 }}>{r.name}</strong>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.15rem 0.55rem', borderRadius: 5 }}>{r.users} users</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                {(r.permissions || []).map((p: string, j: number) => <span key={j} style={{ fontSize: '0.7rem', fontWeight: 700, color: r.color, background: `${r.color}10`, border: `1px solid ${r.color}25`, padding: '0.15rem 0.55rem', borderRadius: 5 }}>{p}</span>)}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="admin-btn-ghost" style={{ flex: 1, textAlign: 'center' }} onClick={() => openEdit(r)}>Edit</button>
                <button className="admin-btn-ghost" style={{ flex: 1, textAlign: 'center', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDelete(r.id, r.name)}>Delete</button>
              </div>
            </motion.div>
          ))
        }
      </div>
    </div>
  );
};

// ── Notifications Page ─────────────────────────────────────────────────────
export const NotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getNotifications()
      .then(setNotifications)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="up-shell">
      <div className="up-heading"><div><h1>Notifications</h1><p>System alerts and activity notifications.</p></div></div>
      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading...</div> :
          notifications.length === 0 ? <div className="admin-empty-row" style={{ padding: '3rem' }}>No notifications yet.</div> :
          notifications.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.is_read ? 'rgba(255,255,255,0.1)' : '#FF9500', flexShrink: 0, marginTop: 5 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'white', fontWeight: 800 }}>{a.title}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.message}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {new Date(a.created_at).toLocaleDateString('en-KE')}
              </span>
            </motion.div>
          ))
        }
      </div>
    </div>
  );
};

// ── Announcements Page ─────────────────────────────────────────────────────
export const AnnouncementsPage: React.FC = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [title,         setTitle]         = useState('');
  const [body,          setBody]          = useState('');
  const [audience,      setAudience]      = useState('all');
  const [saving,        setSaving]        = useState(false);

  const load = () => adminService.getAnnouncements().then(setAnnouncements).catch(e => toast(e.message, 'error')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast('Title and body are required.', 'error'); return; }
    setSaving(true);
    try {
      await adminService.createAnnouncement(title, body, audience);
      toast('Announcement published.', 'success');
      setTitle(''); setBody(''); setShowForm(false);
      load();
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const STATUS: Record<string, { label: string; color: string }> = {
    published: { label: 'Published', color: '#22C55E' },
    scheduled: { label: 'Scheduled', color: '#2E5BFF' },
    draft:     { label: 'Draft',     color: '#888' },
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Announcements</h1><p>Broadcast messages to users and organizers.</p></div>
        <button className="up-add-btn" onClick={() => setShowForm(v => !v)}><Plus size={14}/> New Announcement</button>
      </div>

      {showForm && (
        <motion.form className="admin-glass-panel" onSubmit={submit} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>New Announcement</h3>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="admin-modal-textarea" style={{ resize: 'none', height: 40 }}/>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body message..." className="admin-modal-textarea" rows={3}/>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select value={audience} onChange={e => setAudience(e.target.value)} className="admin-period-select">
              <option value="all">All Users</option>
              <option value="organizers">Organizers Only</option>
              <option value="customers">Customers Only</option>
            </select>
            <div className="admin-modal-actions" style={{ flex: 1 }}>
              <button type="button" className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="up-add-btn" disabled={saving}>{saving ? 'Publishing...' : 'Publish'}</button>
            </div>
          </div>
        </motion.form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? <div className="admin-empty-row">Loading...</div> :
          announcements.map((a, i) => {
            const sm = STATUS[a.status] ?? STATUS.draft;
            return (
              <motion.div key={a.id} className="admin-glass-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <Megaphone size={16} style={{ color: '#FF9500', flexShrink: 0 }}/>
                    <strong style={{ color: 'white', fontWeight: 800, fontSize: '0.92rem' }}>{a.title}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <StatusBadge label={sm.label} color={sm.color}/>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleDateString('en-KE')}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', marginBottom: '0.85rem', paddingLeft: '1.75rem', lineHeight: 1.5 }}>{a.body}</p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '1.75rem' }}>Audience: {a.audience}</span>
              </motion.div>
            );
          })
        }
      </div>
    </div>
  );
};

// ── Audit Logs Page ────────────────────────────────────────────────────────
export const AuditLogsPage: React.FC = () => {
  const { toast } = useToast();
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    adminService.getAuditLogs().then(setLogs).catch(e => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.action.includes(search.toLowerCase()) ||
    (l.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.target ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const ACTION_COLOR: Record<string, string> = {
    approved: '#22C55E', verified: '#22C55E', processed: '#2E5BFF', login: '#888',
    rejected: '#EF4444', suspended: '#EF4444', updated: '#FF9500',
  };

  return (
    <div className="up-shell">
      <div className="up-heading"><div><h1>Audit Logs</h1><p>Complete trail of admin actions on the platform.</p></div>
        <button className="up-add-btn" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-gray)' }}><Download size={14}/> Export</button>
      </div>
      <div className="up-toolbar">
        <div className="up-search"><Search size={14}/><input placeholder="Search actions, actors, targets..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      </div>
      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading...</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Action</th><th>Actor</th><th>Target</th><th>Timestamp</th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={4} className="admin-empty-row">No audit logs yet.</td></tr>}
                {filtered.map((l, i) => {
                  const verb = l.action.split('.')[1];
                  const color = ACTION_COLOR[verb] ?? '#888';
                  return (
                    <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color, fontWeight: 700 }}>{l.action}</span></td>
                      <td className="admin-cell-title">{l.profiles?.full_name ?? 'System'}</td>
                      <td className="admin-td-muted">{l.target ?? '—'}</td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-gray)' }}>{new Date(l.created_at).toLocaleString('en-KE')}</span></td>
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

// ── Payment Gateways Page ──────────────────────────────────────────────────
export const GatewaysPage: React.FC = () => {
  const { toast } = useToast();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPaymentMethods();
      setMethods(data ?? []);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, current: boolean) => {
    try {
      await adminService.updatePaymentMethod(id, { is_active: !current });
      toast('Gateway toggled.', 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const GATEWAY_CONFIG: Record<string, { icon: React.ReactNode; color: string; health: string; latency: string; desc: string }> = {
    mpesa:         { icon: <Globe size={20}/>,      color: '#22C55E', health: 'Operational', latency: '120ms', desc: 'Safaricom STK Push integration' },
    card:          { icon: <Shield size={20}/>,     color: '#2E5BFF', health: 'Operational', latency: '85ms',  desc: 'Visa / Mastercard processing' },
    bank_transfer: { icon: <DollarSign size={20}/>, color: '#FF9500', health: 'Operational', latency: '—',     desc: 'Direct bank transfer processing' },
    cash:          { icon: <DollarSign size={20}/>, color: '#888',    health: 'Active',      latency: '—',     desc: 'Pay at the venue on event day' },
  };

  return (
    <div className="up-shell">
      <div className="up-heading"><div><h1>Payment Gateways</h1><p>Configure and monitor payment integrations.</p></div></div>
      {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {methods.map((m, i) => {
            const cfg = GATEWAY_CONFIG[m.slug] ?? { icon: <Globe size={20}/>, color: '#888', health: 'Active', latency: '—', desc: m.description };
            return (
              <motion.div key={m.id} className="admin-glass-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>{m.name}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>{cfg.desc}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: cfg.health === 'Operational' ? '#22C55E' : '#888' }}>{cfg.health}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latency</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>{cfg.latency}</span>
                    </div>
                    <button style={{ position: 'relative', width: 44, height: 26, borderRadius: 13, background: m.is_active ? cfg.color : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0 }} onClick={() => toggle(m.id, m.is_active)}>
                      <span style={{ position: 'absolute', top: 3, left: m.is_active ? 20 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}/>
                    </button>
                  </div>
                </div>
                {m.is_active && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button className="admin-btn-ghost" onClick={() => toast('Gateway configuration panel coming soon.', 'info')} style={{ marginRight: '0.5rem' }}>Configure</button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Hero Slides Page ─────────────────────────────────────────────────────────
export const ChatMessagesPage: React.FC = () => {
  const { toast } = useToast();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminConversations();
      setConvs(data ?? []);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConv = async (c: Conversation) => {
    setSelected(c);
    try {
      const full = await getAdminConversation(c.id);
      setMessages(full.messages ?? []);
      const sock = getSocket();
      sock.emit('join-conversation', c.id);
    } catch (e: any) { toast(e.message, 'error'); }
  };

  useEffect(() => {
    const sock = getSocket();
    const handler = (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    sock.on('new-message', handler);
    return () => { sock.off('new-message', handler); };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      const msg = await adminSendMessage(selected.id, text);
      setMessages(prev => [...prev, msg]);
      setInput('');
      const sock = getSocket();
      sock.emit('send-message', { ...msg, conversation_id: selected.id });
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSending(false); }
  };

  const handleClose = async (id: string) => {
    try {
      await closeConversation(id);
      toast('Conversation closed.', 'success');
      setSelected(null);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const isSelected = (id: string) => selected?.id === id;

  return (
    <div className="up-shell" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="up-heading">
        <div><h1>Messages</h1><p>Live chat conversations with users.</p></div>
      </div>

      <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* ── Left: Conversation List ── */}
        <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>Chats</span>
            <button onClick={load} style={{ background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', display: 'flex' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading...</div>
            ) : convs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No conversations yet.</div>
            ) : convs.map(c => (
              <div key={c.id}
                onClick={() => openConv(c)}
                style={{
                  display: 'flex',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  background: isSelected(c.id) ? 'rgba(253,184,19,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
                onMouseEnter={e => { if (!isSelected(c.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!isSelected(c.id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.85rem',
                  background: 'rgba(253,184,19,0.15)',
                  color: '#FDB813',
                }}>
                  {getInitials(c.user_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.user_name}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.4rem' }}>
                      {formatTime(c.updated_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {c.last_message || 'No messages'}
                    </span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                      color: c.status === 'open' ? '#22C55E' : '#666',
                      background: c.status === 'open' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                      padding: '0.05rem 0.45rem', borderRadius: 6, textTransform: 'uppercase', marginLeft: '0.4rem',
                    }}>{c.status}</span>
                  </div>
                  {c.user_email && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem', display: 'block' }}>
                      {c.user_email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Chat Area ── */}
        {selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Header */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.75rem',
                  background: 'rgba(253,184,19,0.15)', color: '#FDB813',
                }}>
                  {getInitials(selected.user_name)}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>{selected.user_name}</div>
                  {selected.user_email && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{selected.user_email}</div>
                  )}
                </div>
              </div>
              {selected.status === 'open' && (
                <button className="admin-btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => handleClose(selected.id)}>Close</button>
              )}
            </div>
            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '0.75rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.3rem',
              background: 'rgba(0,0,0,0.08)',
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '2rem' }}>
                  No messages yet. Send a reply to start the conversation.
                </div>
              )}
              {messages.map((m, idx) => {
                const isAdmin = m.sender_type === 'admin';
                const showName = idx === 0 || messages[idx - 1].sender_type !== m.sender_type;
                return (
                  <div key={m.id} style={{
                    alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                    maxWidth: '72%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAdmin ? 'flex-end' : 'flex-start',
                  }}>
                    {showName && (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        color: 'var(--text-muted)', marginBottom: '0.15rem',
                        marginLeft: isAdmin ? 0 : '0.5rem',
                        marginRight: isAdmin ? '0.5rem' : 0,
                      }}>
                        {isAdmin ? 'You' : m.sender_name}
                      </span>
                    )}
                    <div style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: isAdmin ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: isAdmin ? 'rgba(253,184,19,0.15)' : 'rgba(255,255,255,0.06)',
                      border: isAdmin ? '1px solid rgba(253,184,19,0.12)' : '1px solid rgba(255,255,255,0.04)',
                      position: 'relative',
                    }}>
                      <div style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.4', wordBreak: 'break-word' }}>
                        {m.content}
                      </div>
                      <div style={{
                        fontSize: '0.55rem', color: 'var(--text-muted)',
                        textAlign: 'right', marginTop: '0.15rem',
                      }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>
            {/* Input */}
            {selected.status === 'open' ? (
              <div style={{
                display: 'flex', gap: '0.5rem', padding: '0.65rem 1rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.1)',
              }}>
                <input style={{
                  flex: 1, padding: '0.6rem 0.85rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
                  color: 'white', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
                }}
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={sending}
                />
                <button style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: !input.trim() || sending ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #FDB813, #F59E0B)',
                  border: 'none', color: !input.trim() || sending ? '#666' : '#0A0D14', cursor: !input.trim() || sending ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }} onClick={handleSend} disabled={!input.trim() || sending}>
                  {sending ? <Loader size={15} className="spin" /> : <Send size={15} />}
                </button>
              </div>
            ) : (
              <div style={{
                padding: '0.75rem 1rem', textAlign: 'center',
                fontSize: '0.78rem', color: 'var(--text-muted)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.1)',
              }}>
                This conversation is closed.
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem' }}>
            <MessageSquare size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem', fontWeight: 600 }}>Select a conversation</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Choose a chat from the left panel to view messages</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const HeroSlidesPage: React.FC = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState({ image_url: '', title: '', subtitle: '', link_url: '', link_text: 'Explore Events', sort_order: 0, is_active: true });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getHeroSlides();
      setSlides(data ?? []);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ image_url: '', title: '', subtitle: '', link_url: '', link_text: 'Explore Events', sort_order: slides.length, is_active: true });
    setShowForm(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({ image_url: s.image_url, title: s.title, subtitle: s.subtitle, link_url: s.link_url ?? '', link_text: s.link_text, sort_order: s.sort_order, is_active: s.is_active });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadImage } = await import('../../lib/api');
      const url = await uploadImage(file);
      setForm(f => ({ ...f, image_url: url }));
      toast('Image uploaded successfully.', 'success');
    } catch (err: any) {
      toast(err.message ?? 'Upload failed.', 'error');
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.image_url) { toast('Please upload an image.', 'error'); return; }
    try {
      if (editing) {
        await adminService.updateHeroSlide(editing.id, form);
        toast('Slide updated.', 'success');
      } else {
        await adminService.createHeroSlide(form);
        toast('Slide created.', 'success');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteHeroSlide(id);
      toast('Slide deleted.', 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      await adminService.updateHeroSlide(slide.id, { is_active: !slide.is_active });
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const moveUp = async (slide: HeroSlide, idx: number) => {
    if (idx === 0) return;
    const above = slides[idx - 1];
    try {
      await adminService.updateHeroSlide(slide.id, { sort_order: above.sort_order });
      await adminService.updateHeroSlide(above.id, { sort_order: slide.sort_order });
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const moveDown = async (slide: HeroSlide, idx: number) => {
    if (idx >= slides.length - 1) return;
    const below = slides[idx + 1];
    try {
      await adminService.updateHeroSlide(slide.id, { sort_order: below.sort_order });
      await adminService.updateHeroSlide(below.id, { sort_order: slide.sort_order });
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Hero Slideshow</h1><p>Manage the marketplace hero carousel images and text.</p></div>
        <button className="up-add-btn" onClick={openNew}><Plus size={15}/> Add Slide</button>
      </div>

      {showForm && (
        <motion.div className="admin-glass-panel" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(253,184,19,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FDB813' }}>
              <ImageIcon size={16} />
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{editing ? 'Edit Slide' : 'New Slide'}</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-gray)' }}>Add a new hero carousel slide</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-form-label">Background Image</label>
              <div className="admin-form-upload">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="admin-form-preview" />
                ) : (
                  <div className="admin-form-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.72rem', fontWeight: 700 }}>
                    No Image
                  </div>
                )}
                <label className="admin-form-upload-btn">
                  <ImageIcon size={14} />
                  {uploading ? 'Uploading...' : (form.image_url ? 'Change Image' : 'Upload Image')}
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
                </label>
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Title</label>
              <input className="admin-form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Discover Amazing Events" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Subtitle</label>
              <input className="admin-form-input" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Find events that move you" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Link URL</label>
              <input className="admin-form-input" value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="/events" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Button Text</label>
              <input className="admin-form-input" value={form.link_text} onChange={e => setForm(f => ({ ...f, link_text: e.target.value }))} placeholder="Explore Events" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Sort Order</label>
              <input className="admin-form-input" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="admin-form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#FDB813', cursor: 'pointer' }} />
                Active
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button className="up-add-btn" onClick={handleSave}>{editing ? 'Update Slide' : 'Create Slide'}</button>
            <button className="admin-btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading...</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th style={{ width: 30 }}></th><th>Image</th><th>Title</th><th>Subtitle</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {slides.length === 0 && <tr><td colSpan={7} className="admin-empty-row">No slides yet. Add one to get started.</td></tr>}
                {slides.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button className="admin-icon-btn" onClick={() => moveUp(s, i)} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={12}/></button>
                        <button className="admin-icon-btn" onClick={() => moveDown(s, i)} disabled={i >= slides.length - 1} style={{ opacity: i >= slides.length - 1 ? 0.3 : 1 }}><ChevronDown size={12}/></button>
                      </div>
                    </td>
                    <td>
                      <img src={s.image_url} alt="" style={{ width: 80, height: 45, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }} />
                    </td>
                    <td className="admin-cell-title">{s.title || '—'}</td>
                    <td className="admin-td-muted">{s.subtitle || '—'}</td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.sort_order}</span></td>
                    <td>
                      <button onClick={() => toggleActive(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.is_active ? '#22C55E' : '#666' }}>
                        {s.is_active ? <Eye size={16}/> : <EyeOff size={16}/>}
                      </button>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-act-view" onClick={() => openEdit(s)} title="Edit"><span style={{ fontSize: '0.75rem' }}>Edit</span></button>
                        <button className="admin-act-reject" onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={14}/></button>
                      </div>
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
