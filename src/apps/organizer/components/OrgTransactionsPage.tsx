import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, ArrowUpRight, ArrowDownLeft, Filter, RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import { useAuth } from '../../../context/AuthContext';
import './OrgSubPage.css';

interface Transaction {
  id: string;
  type: 'sale' | 'payout';
  ref: string;
  description: string;
  amount: number;
  date: Date;
  status: string;
}

export const OrgTransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch orders and payouts
      const orders = await organizerService.getMyOrders(user.id);
      const payouts = await organizerService.getMyPayouts(user.id);

      // Map orders to transactions
      const orderTrans: Transaction[] = (orders || [])
        .filter((o: any) => o.status === 'confirmed')
        .map((o: any) => ({
          id: o.id,
          type: 'sale',
          ref: o.reference,
          description: `Ticket Sale - ${o.event_title} (${o.quantity} x ${o.tier_name})`,
          amount: o.total_amount,
          date: new Date(o.created_at),
          status: 'completed'
        }));

      // Map payouts to transactions
      const payoutTrans: Transaction[] = (payouts || [])
        .map((p: any) => ({
          id: p.id,
          type: 'payout',
          ref: p.reference,
          description: `Payout Withdrawal to M-Pesa (${p.mpesa_phone || 'None'})`,
          amount: p.gross_amount,
          date: new Date(p.created_at),
          status: p.status
        }));

      // Merge and sort
      const merged = [...orderTrans, ...payoutTrans].sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactions(merged);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const filtered = transactions.filter(t =>
    t.ref.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>Financial Ledger</h1>
          <p>Real-time transaction history of all ticket sales and payout transfers.</p>
        </div>
        <button className="osp-export-btn" onClick={load}>
          <RefreshCw size={14} /> Refresh Ledger
        </button>
      </div>

      <div className="osp-toolbar">
        <div className="osp-search">
          <Search size={14} />
          <input
            placeholder="Search transactions by reference or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="osp-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="osp-empty" style={{ padding: '4rem' }}>Loading transaction ledger...</div>
        ) : (
          <div className="osp-table-wrap">
            <table className="osp-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="osp-empty">No transaction history found.</td>
                  </tr>
                ) : (
                  filtered.map((t, i) => {
                    const isCredit = t.type === 'sale';
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <td>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              background: isCredit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              border: `1px solid ${isCredit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                              color: isCredit ? '#22C55E' : '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {isCredit ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                          </div>
                        </td>
                        <td><span className="osp-ref">{t.ref}</span></td>
                        <td className="osp-td-muted" style={{ color: 'white' }}>{t.description}</td>
                        <td>
                          <strong style={{ color: isCredit ? '#22C55E' : '#EF4444', fontSize: '0.85rem' }}>
                            {isCredit ? '+' : '−'} KES {t.amount.toLocaleString()}
                          </strong>
                        </td>
                        <td className="osp-td-muted">
                          {t.date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span
                            className="osp-status-badge"
                            style={{
                              color: t.status === 'completed' || t.status === 'success' ? '#22C55E' : t.status === 'pending' ? '#FF9500' : '#EF4444',
                              background: t.status === 'completed' || t.status === 'success' ? 'rgba(34,197,94,0.1)' : t.status === 'pending' ? 'rgba(255,149,0,0.1)' : 'rgba(239,68,68,0.1)',
                              border: `1px solid ${t.status === 'completed' || t.status === 'success' ? 'rgba(34,197,94,0.2)' : t.status === 'pending' ? 'rgba(255,149,0,0.2)' : 'rgba(239,68,68,0.2)'}`
                            }}
                          >
                            {t.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrgTransactionsPage;
