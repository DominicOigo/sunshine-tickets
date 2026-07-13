import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, CreditCard, Landmark, DollarSign, Loader2 } from 'lucide-react';
import { request } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import './OrgSubPage.css';

const ICON_MAP: Record<string, React.ReactNode> = {
  'smartphone':  <Smartphone size={18} />,
  'credit-card': <CreditCard size={18} />,
  'landmark':    <Landmark size={18} />,
  'dollar-sign': <DollarSign size={18} />,
};

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  organizer_active: boolean;
  sort_order: number;
}

export const OrgPaymentMethodsPage: React.FC = () => {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/payment-methods/my')
      .then(setMethods)
      .catch(() => toast('Failed to load payment methods.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (method: PaymentMethod) => {
    const newActive = !method.organizer_active;
    try {
      await request('/payment-methods/my/toggle', {
        method: 'PUT',
        body: JSON.stringify({ method_id: method.id, active: newActive }),
      });
      setMethods(prev =>
        prev.map(m => m.id === method.id ? { ...m, organizer_active: newActive } : m)
      );
      toast(`${method.name} ${newActive ? 'enabled' : 'disabled'}.`, 'success');
    } catch {
      toast('Failed to update payment method.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="osp-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader2 size={32} className="spinner" style={{ color: 'var(--primary-gold)' }} />
      </div>
    );
  }

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>Payment Methods</h1>
          <p>Choose which payment methods your customers can use when buying tickets.</p>
        </div>
      </div>

      <div className="osp-glass-panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {methods.map((method, i) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="osp-pm-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                background: method.organizer_active
                  ? 'rgba(34,197,94,0.05)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  method.organizer_active
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(255,255,255,0.05)'
                }`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: method.organizer_active
                      ? 'rgba(34,197,94,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    color: method.organizer_active ? '#22C55E' : 'var(--text-gray)',
                    transition: 'all 0.2s',
                  }}
                >
                  {ICON_MAP[method.icon] || <Smartphone size={18} />}
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'white', display: 'block' }}>
                    {method.name}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                    {method.description}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggle(method)}
                style={{
                  position: 'relative',
                  width: 42,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: method.organizer_active
                    ? '#22C55E'
                    : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.25s',
                  boxShadow: method.organizer_active
                    ? '0 0 10px rgba(34,197,94,0.4)'
                    : 'none',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: method.organizer_active ? 21 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }}
                />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div
        className="osp-glass-panel"
        style={{
          marginTop: '1rem',
          padding: '1rem 1.25rem',
          fontSize: '0.8rem',
          color: 'var(--text-gray)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>
          How it works
        </strong>
        Only enabled payment methods will appear at checkout for your customers.
        M-Pesa is the default method and requires a phone number for STK Push.
        Card payments redirect to a secure payment gateway.
        Bank Transfer and Cash require manual confirmation.
      </div>
    </div>
  );
};
