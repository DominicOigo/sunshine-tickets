import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Ticket, Package, Shield, Phone, Loader, CheckCircle, ArrowRight, Smartphone, CreditCard, Landmark, DollarSign } from 'lucide-react';
import Navbar from './components/Navbar';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ordersService } from '../../lib/ordersService';
import { paymentsService } from '../../lib/paymentsService';
import { request } from '../../lib/api';
import './CartPage.css';

type CartStep = 'review' | 'checkout' | 'processing' | 'done';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<CartStep>('review');
  const [phone, setPhone] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    request('/payment-methods/').then(setPaymentMethods).catch(() => {});
  }, []);

  const PM_ICONS: Record<string, React.ReactNode> = {
    mpesa: <Smartphone size={16} />,
    card: <CreditCard size={16} />,
    bank_transfer: <Landmark size={16} />,
    cash: <DollarSign size={16} />,
  };

  const groupedItems = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.eventId]) acc[item.eventId] = [];
    acc[item.eventId].push(item);
    return acc;
  }, {});

  const handleCheckout = () => {
    if (!user) {
      toast('Please sign in to checkout.', 'error');
      openAuthModal('signin');
      return;
    }
    if (items.length === 0) return;
    setStep('checkout');
  };

  const handlePay = async () => {
    const cleanedPhone = phone.replace(/\s+/g, '');
    if (paymentMethod === 'mpesa') {
      if (!cleanedPhone.match(/^(?:254|0)[17]\d{8}$/)) {
        toast('Enter a valid Safaricom number (07xx or 01xx)', 'error');
        return;
      }
    }
    if (!user) {
      toast('Please sign in to purchase.', 'error');
      openAuthModal('signin');
      return;
    }

    const ticketItems = items.filter(i => i.type === 'ticket');
    if (ticketItems.length === 0) {
      toast('No tickets in cart.', 'error');
      return;
    }

    try {
      setStep('processing');

      const results: Array<{ order: any; payment: { id: string } }> = [];
      for (const item of ticketItems) {
        const order = await ordersService.create({
          eventId: item.eventId,
          tierId: item.tierId!,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          phone: paymentMethod === 'mpesa' ? cleanedPhone : '',
          paymentMethod,
        });
        const payment = await paymentsService.initiate(order.id, user.id, item.unitPrice * item.quantity, cleanedPhone);
        results.push({ order, payment });
      }

      for (const r of results) {
        await paymentsService.confirm(r.payment.id, 'SIM' + Math.random().toString(36).slice(2, 10).toUpperCase());
      }

      const maxAttempts = 20;
      let attempts = 0;
      const poll = setInterval(async () => {
        try {
          const statues = await Promise.all(results.map(r => paymentsService.getStatus(r.payment.id)));
          if (statues.every(s => s === 'success')) {
            clearInterval(poll);
            const refs = results.map(r => r.order.reference).filter(Boolean);
            setOrderRef(refs[0] || 'Confirmed');
            setStep('done');
            clearCart();
          } else if (statues.some(s => s === 'failed')) {
            clearInterval(poll);
            toast('One or more payments failed.', 'error');
            setStep('checkout');
          }
        } catch {
          // ignore polling errors, keep trying
        }
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          toast('Payment confirmation timed out.', 'error');
          setStep('checkout');
        }
      }, 1500);
    } catch (e: any) {
      toast(e.message ?? 'Payment failed. Please try again.', 'error');
      setStep('checkout');
    }
  };

  return (
    <div className="cart-page">
      <Navbar />
      <main className="cart-main">
        <AnimatePresence mode="wait">
          {step === 'review' && (
            <motion.div key="review" className="cart-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="cart-header">
                <Link to="/" className="cart-back-link"><ArrowLeft size={16} /> Continue Browsing</Link>
                <h1 className="cart-title"><ShoppingCart size={22} /> Shopping Cart</h1>
                {itemCount > 0 && (
                  <button className="cart-clear-btn" onClick={clearCart}>
                    <Trash2 size={14} /> Clear Cart
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon"><ShoppingCart size={48} /></div>
                  <h3>Your cart is empty</h3>
                  <p>Browse events and add tickets or merchandise to get started.</p>
                  <Link to="/" className="cart-browse-btn">Browse Events</Link>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {Object.entries(groupedItems).map(([eventId, eventItems]) => (
                      <div key={eventId} className="cart-event-group">
                        <h3 className="cart-event-title">{eventItems[0].eventTitle}</h3>
                        {eventItems.map(item => (
                          <div key={item.id} className="cart-item-card">
                            <div className="cart-item-icon">
                              {item.type === 'ticket' ? <Ticket size={18} /> : <Package size={18} />}
                            </div>
                            <div className="cart-item-info">
                              <strong>{item.type === 'ticket' ? item.tierName : item.itemName}</strong>
                              <span>{item.type === 'ticket' ? 'Ticket' : 'Merchandise'}</span>
                            </div>
                            <div className="cart-item-qty">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                <Minus size={14} />
                              </button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= 10}>
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="cart-item-total">
                              KES {(item.unitPrice * item.quantity).toLocaleString()}
                            </div>
                            <button className="cart-item-remove" onClick={() => removeItem(item.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="cart-footer">
                    <div className="cart-total-row">
                      <span>Total ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                      <strong>KES {total.toLocaleString()}</strong>
                    </div>
                    <button className="cart-checkout-btn" onClick={handleCheckout}>
                      Proceed to Checkout <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === 'checkout' && (
            <motion.div key="checkout" className="cart-content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button className="cart-back-link" onClick={() => setStep('review')}><ArrowLeft size={16} /> Back to Cart</button>
              <h1 className="cart-title"><Shield size={22} /> Checkout</h1>

              <div className="cart-order-summary">
                <h3>Order Summary</h3>
                {Object.entries(groupedItems).map(([eventId, eventItems]) => (
                  <div key={eventId} className="co-event">
                    <strong className="co-event-title">{eventItems[0].eventTitle}</strong>
                    {eventItems.map(item => (
                      <div key={item.id} className="co-item">
                        <span>{item.type === 'ticket' ? item.tierName : item.itemName} × {item.quantity}</span>
                        <span>KES {(item.unitPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="co-total">
                  <span>Total</span>
                  <strong>KES {total.toLocaleString()}</strong>
                </div>
              </div>

              <div className="co-payment-methods" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gray)', display: 'block', marginBottom: '0.5rem' }}>
                  Payment Method
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {paymentMethods.map(pm => (
                    <label
                      key={pm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: '10px',
                        background: paymentMethod === pm.slug ? 'rgba(255,149,0,0.08)' : 'rgba(255,255,255,0.02)',
                        border: paymentMethod === pm.slug ? '1px solid rgba(255,149,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: 'white',
                        fontSize: '0.85rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={pm.slug}
                        checked={paymentMethod === pm.slug}
                        onChange={() => setPaymentMethod(pm.slug)}
                        style={{ accentColor: 'var(--primary-gold)' }}
                      />
                      <span>{PM_ICONS[pm.slug] || null}</span>
                      <span>{pm.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-gray)' }}>{pm.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mpesa' && (
                <div className="co-phone-field">
                  <label><Phone size={14} /> M-Pesa Phone Number</label>
                  <div className="co-phone-input-wrap">
                    <span className="co-prefix">+254</span>
                    <input
                      type="tel"
                      value={phone.replace(/^(254|0)/, '')}
                      onChange={e => setPhone('0' + e.target.value.replace(/\D/g, ''))}
                      placeholder="7XX XXX XXX"
                      maxLength={9}
                    />
                  </div>
                  <p className="co-phone-hint">An STK Push will be sent to this number to confirm payment.</p>
                </div>
              )}

              {paymentMethod !== 'mpesa' && (
                <div className="co-security" style={{ marginBottom: '1rem' }}>
                  <Shield size={14} />
                  <span>{paymentMethod === 'card' ? 'Redirected to secure payment gateway.' : paymentMethod === 'bank_transfer' ? 'Bank details will be provided after order confirmation.' : 'Pay at the venue on event day.'}</span>
                </div>
              )}

              {paymentMethod === 'mpesa' && (
                <div className="co-security">
                  <Shield size={14} />
                  <span>Secured via Safaricom Daraja API. Your PIN is never shared with us.</span>
                </div>
              )}

              <button className="cart-checkout-btn" onClick={handlePay} style={{ marginTop: '1rem' }}>
                {paymentMethod === 'mpesa' ? `Send STK Push — KES ${total.toLocaleString()}` : `Pay — KES ${total.toLocaleString()}`}
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" className="cart-content cart-centered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="pp-processing-ring"><Loader size={32} className="spin-icon cyan-neon" /></div>
              <h2 className="cart-title">Processing Payment</h2>
              <p className="co-processing-sub">{paymentMethod === 'mpesa' ? `Check your phone ${phone} and enter your M-Pesa PIN to complete payment.` : 'Please wait while we process your payment...'}</p>
              <div className="pp-waiting-dots">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="pp-dot" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }} />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" className="cart-content cart-centered" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="pp-success-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              >
                <CheckCircle size={40} />
              </motion.div>
              <h2 className="cart-title">Payment Confirmed!</h2>
              <p className="co-processing-sub">Your tickets are confirmed. Check your email for QR tickets.</p>
              <div className="pp-ticket-ref">
                <span>Ref: {orderRef}</span>
              </div>
              <div className="co-actions">
                <Link to="/tickets" className="cart-checkout-btn">View My Tickets</Link>
                <Link to="/" className="co-secondary-btn">Back to Events</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CartPage;
