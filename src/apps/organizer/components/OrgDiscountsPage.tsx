import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Tag, Trash2, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import './OrgSubPage.css';

export const OrgDiscountsPage: React.FC = () => {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create state
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState<number>(10);
  const [maxUses, setMaxUses] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await organizerService.getDiscounts();
      setDiscounts(data ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await organizerService.toggleDiscount(id, !currentStatus);
      toast(`Discount code ${!currentStatus ? 'enabled' : 'disabled'}.`, 'success');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleDelete = async (id: string, codeStr: string) => {
    if (window.confirm(`Are you sure you want to delete promo code "${codeStr}"?`)) {
      try {
        await organizerService.deleteDiscount(id);
        toast(`Promo code "${codeStr}" deleted.`, 'success');
        load();
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || percent <= 0 || percent > 100) {
      toast('Please enter a valid code and percentage between 1 and 100.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const parsedMax = maxUses.trim() ? parseInt(maxUses) : undefined;
      await organizerService.createDiscount(code.toUpperCase().trim(), percent, parsedMax);
      toast('Discount code created successfully!', 'success');
      setCode('');
      setPercent(10);
      setMaxUses('');
      setShowAddForm(false);
      load();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = discounts.filter(d =>
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>Discounts &amp; Promos</h1>
          <p>Create and distribute custom promo codes to boost ticket sales.</p>
        </div>
        <button className="osp-primary-btn" onClick={() => setShowAddForm(true)}>
          <Plus size={15} /> Add Promo Code
        </button>
      </div>

      <div className="osp-toolbar">
        <div className="osp-search">
          <Search size={14} />
          <input
            placeholder="Search promo codes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Add code modal overlay */}
      <AnimatePresence>
        {showAddForm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '2rem'
            }}
          >
            <motion.div
              className="osp-glass-panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '450px',
                background: '#0F1014',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>Create Promo Code</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    color: 'var(--text-gray)',
                    padding: '4px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>PROMO CODE</label>
                  <input
                    type="text"
                    placeholder="e.g. EARLYBIRD20"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>DISCOUNT PERCENTAGE (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 15"
                    value={percent}
                    onChange={e => setPercent(parseInt(e.target.value))}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 'bold',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>MAXIMUM USES (OPTIONAL)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={maxUses}
                    onChange={e => setMaxUses(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      color: 'white',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="osp-primary-btn"
                  style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  {submitting ? 'Creating Code...' : 'Create Promo Code'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="osp-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="osp-empty" style={{ padding: '4rem' }}>Loading promo codes...</div>
        ) : (
          <div className="osp-table-wrap">
            <table className="osp-table">
              <thead>
                <tr>
                  <th>Promo Code</th>
                  <th>Discount</th>
                  <th>Uses</th>
                  <th>Limit</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="osp-empty">No active promo codes found. Create one above!</td>
                  </tr>
                ) : (
                  filtered.map((d, i) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={13} style={{ color: '#FF9500' }} />
                          <span style={{ fontFamily: 'monospace', fontSize: '0.92rem', color: 'white', fontWeight: 800 }}>
                            {d.code}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#22C55E' }}>{d.discount_percent}% OFF</strong>
                      </td>
                      <td className="osp-td-muted">{d.uses} uses</td>
                      <td className="osp-td-muted">{d.max_uses ? `${d.max_uses} max` : 'Unlimited'}</td>
                      <td>
                        {d.is_active ? (
                          <span className="osp-checkin-badge in">Active</span>
                        ) : (
                          <span className="osp-checkin-badge out">Disabled</span>
                        )}
                      </td>
                      <td className="osp-td-muted">
                        {new Date(d.created_at).toLocaleDateString('en-KE')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            className="osp-action-btn"
                            title={d.is_active ? 'Disable' : 'Enable'}
                            onClick={() => handleToggle(d.id, d.is_active)}
                            style={{ color: d.is_active ? '#FF9500' : '#22C55E' }}
                          >
                            {d.is_active ? <X size={13} /> : <Check size={13} />}
                          </button>
                          <button
                            className="osp-action-btn"
                            title="Delete Code"
                            onClick={() => handleDelete(d.id, d.code)}
                            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.1)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrgDiscountsPage;
