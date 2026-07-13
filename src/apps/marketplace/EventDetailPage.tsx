import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, Ticket, Phone, CheckCircle, Loader, Shield, ShoppingBag, Compass, Smartphone, CreditCard, Landmark, DollarSign } from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ordersService } from '../../lib/ordersService';
import { paymentsService } from '../../lib/paymentsService';
import { request } from '../../lib/api';
import './EventDetailPage.css';

type PurchaseStep = 'select' | 'phone' | 'processing' | 'success';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events } = useEvents();
  const { toast } = useToast();
  const { user, openAuthModal } = useAuth();
  const { addItem } = useCart();

  const event = events.find(e => e.id === id);

  const [selectedTier, setSelectedTier] = useState(0);
  const [qty, setQty] = useState(1);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<PurchaseStep>('select');
  const [orderRef, setOrderRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    if (event?.organizerId) {
      request(`/payment-methods/organizer/${event.organizerId}`)
        .then(methods => { setPaymentMethods(methods); if (methods.length > 0) setPaymentMethod(methods[0].slug); })
        .catch(() => {});
    }
  }, [event?.organizerId]);

  const PM_ICONS: Record<string, React.ReactNode> = {
    mpesa: <Smartphone size={16} />,
    card: <CreditCard size={16} />,
    bank_transfer: <Landmark size={16} />,
    cash: <DollarSign size={16} />,
  };

  if (!event) {
    return (
      <div className="event-detail-not-found">
        <h2>Event not found</h2>
        <button onClick={() => navigate('/')}>Back to Marketplace</button>
      </div>
    );
  }

  const tier = event.tiers[selectedTier];
  const tierPrice = tier ? tier.priceInt ?? parseInt(tier.price.replace(/[^0-9]/g, ''), 10) : 0;
  const total = tierPrice * qty;
  const availability = tier ? Math.max(0, tier.capacity - tier.sold) : 0;
  const relatedEvents = events.filter(e => e.id !== event.id && e.status === 'published').slice(0, 4);

  const handleInitiatePayment = async () => {
    const cleanedPhone = phone.replace(/\s+/g, '');
    if (paymentMethod === 'mpesa') {
      if (!cleanedPhone.match(/^(?:254|0)[17]\d{8}$/)) {
        toast('Enter a valid Safaricom number (07xx or 01xx)', 'error');
        return;
      }
    }
    if (!user) {
      toast('Please sign in to purchase tickets.', 'error');
      openAuthModal('signin');
      return;
    }
    try {
      setStep('processing');
      const order = await ordersService.create({
        eventId:   event.id,
        tierId:    tier.id,
        quantity:  qty,
        unitPrice: tierPrice,
        phone:     paymentMethod === 'mpesa' ? cleanedPhone : '',
        paymentMethod,
      });
      const payment = await paymentsService.initiate(order.id, user.id, total, cleanedPhone);

      await paymentsService.confirm(payment.id, 'SIM' + Math.random().toString(36).slice(2,10).toUpperCase());

      const maxAttempts = 20;
      let attempts = 0;
      const poll = setInterval(async () => {
        try {
          const status = await paymentsService.getStatus(payment.id);
          if (status === 'success') {
            clearInterval(poll);
            setOrderRef(order.reference);
            setStep('success');
          } else if (status === 'failed') {
            clearInterval(poll);
            toast('Payment failed. Please try again.', 'error');
            setStep('phone');
          }
        } catch {
          // ignore polling errors, keep trying
        }
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          toast('Payment confirmation timed out.', 'error');
          setStep('phone');
        }
      }, 1500);
    } catch (e: any) {
      toast(e.message ?? 'Payment failed. Please try again.', 'error');
      setStep('phone');
    }
  };

  const handleMerchAdd = (item: { name: string; price: string; stock: number }) => {
    if (!user) {
      toast('Please sign in to add items to your cart.', 'info');
      openAuthModal('signin');
      return;
    }
    const merchPrice = parseInt(item.price.replace(/[^0-9]/g, ''), 10) || 0;
    addItem({
      eventId: event.id,
      eventTitle: event.title,
      eventImage: event.image,
      type: 'merch',
      itemName: item.name,
      quantity: 1,
      unitPrice: merchPrice,
    });
    toast(`${item.name} added to cart.`, 'success');
  };

  return (
    <div className="event-detail-page">
      {/* Back nav */}
      <button className="edp-back" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to Events
      </button>

      <div className="edp-layout">
        {/* Left: Event Info */}
        <div className="edp-info">
          {event.image && (
            <div className="edp-hero-img">
              <img src={event.image} alt={event.title} />
              {event.badge && <span className="edp-badge">{event.badge}</span>}
            </div>
          )}
          <div className="edp-meta-card glass-panel">
            <h1 className="edp-title">{event.title}</h1>
            <div className="edp-meta-rows">
              <div className="edp-meta-row"><Calendar size={16} className="cyan-neon" /><span>{event.day}, {event.date}</span></div>
              <div className="edp-meta-row"><MapPin size={16} className="orange-neon" /><span>{event.location}</span></div>
              <div className="edp-meta-row"><Users size={16} className="cyan-neon" /><span>by {event.organizerName}</span></div>
            </div>
            <p className="edp-description">{event.description}</p>
          </div>
        </div>

        {/* Right: Purchase Panel */}
        <div className="edp-purchase">
          <div className="glass-panel purchase-panel">
            <AnimatePresence mode="wait">

              {/* Step: Select tier */}
              {step === 'select' && (
                <motion.div key="select" className="pp-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h3 className="pp-title">Select Tickets</h3>

                  <div className="pp-tiers">
                    {event.tiers.map((t, i) => {
                      const avail = t.capacity - t.sold;
                      const soldPct = Math.round((t.sold / t.capacity) * 100);
                      return (
                        <button
                          key={i}
                          className={`pp-tier-card ${selectedTier === i ? 'selected' : ''} ${avail === 0 ? 'sold-out' : ''}`}
                          onClick={() => { if (avail > 0) { setSelectedTier(i); setQty(1); } }}
                          disabled={avail === 0}
                        >
                          <div className="pp-tier-top">
                            <div>
                              <span className="pp-tier-name">{t.name}</span>
                              {avail < 50 && avail > 0 && <span className="pp-tier-low">Only {avail} left</span>}
                              {avail === 0 && <span className="pp-tier-sold">Sold Out</span>}
                            </div>
                            <span className="pp-tier-price">{t.price}</span>
                          </div>
                          <div className="pp-tier-bar-track">
                            <div className="pp-tier-bar-fill" style={{ width: `${soldPct}%` }} />
                          </div>
                          <span className="pp-tier-sold-label">{soldPct}% sold</span>
                        </button>
                      );
                    })}
                  </div>

                  {availability > 0 && (
                    <>
                      <div className="pp-qty-row">
                        <span>Quantity</span>
                        <div className="pp-qty-ctrl">
                          <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                          <span>{qty}</span>
                          <button onClick={() => setQty(q => Math.min(10, q + 1))}>+</button>
                        </div>
                      </div>

                      <div className="pp-total-row">
                        <span>Total</span>
                        <strong>KES {total.toLocaleString()}</strong>
                      </div>

                      <div className="pp-actions">
                        <button className="pp-cart-btn" onClick={() => {
                          if (!user) { toast('Please sign in to add to cart.', 'info'); openAuthModal('signin'); return; }
                          addItem({
                            eventId: event.id,
                            eventTitle: event.title,
                            eventImage: event.image,
                            type: 'ticket',
                            tierId: tier.id,
                            tierName: tier.name,
                            quantity: qty,
                            unitPrice: tierPrice,
                          });
                          toast(`${qty} × ${tier.name} added to cart`, 'success');
                        }}>
                          <ShoppingBag size={16} /> Add to Cart
                        </button>
                        <button className="pp-pay-btn" onClick={() => setStep('phone')}>
                          <Ticket size={17} /> Buy Now
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step: Enter phone */}
              {step === 'phone' && (
                <motion.div key="phone" className="pp-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <button className="pp-back-link" onClick={() => setStep('select')}><ArrowLeft size={14} /> Change selection</button>
                  <h3 className="pp-title">Payment</h3>

                  <div className="pp-order-summary">
                    <div className="pp-sum-row"><span>{event.title}</span></div>
                    <div className="pp-sum-row"><span>{tier?.name} × {qty}</span><strong>KES {total.toLocaleString()}</strong></div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)', display: 'block', marginBottom: '0.5rem' }}>
                      Payment Method
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {paymentMethods.map(pm => (
                        <label
                          key={pm.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            background: paymentMethod === pm.slug ? 'rgba(255,149,0,0.08)' : 'rgba(255,255,255,0.02)',
                            border: paymentMethod === pm.slug ? '1px solid rgba(255,149,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: 'white',
                          }}
                        >
                          <input
                            type="radio"
                            name="pm"
                            value={pm.slug}
                            checked={paymentMethod === pm.slug}
                            onChange={() => setPaymentMethod(pm.slug)}
                            style={{ accentColor: 'var(--primary-gold)' }}
                          />
                          <span>{PM_ICONS[pm.slug] || null}</span>
                          <span style={{ fontWeight: 600 }}>{pm.name}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-gray)' }}>{pm.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === 'mpesa' && (
                    <div className="pp-phone-field">
                      <label><Phone size={13} /> M-Pesa Phone Number</label>
                      <div className="pp-phone-input-wrap">
                        <span className="pp-prefix">+254</span>
                        <input type="tel" value={phone.replace(/^(254|0)/, '')} onChange={e => setPhone('0' + e.target.value.replace(/\D/g, ''))} placeholder="7XX YXX XXX" maxLength={9} />
                      </div>
                      <p className="pp-phone-hint">An STK Push will be sent to this number to confirm payment.</p>
                    </div>
                  )}

                  {paymentMethod !== 'mpesa' && (
                    <div className="pp-security-note">
                      <Shield size={14} />
                      <span>{paymentMethod === 'card' ? 'Redirected to secure payment gateway.' : paymentMethod === 'bank_transfer' ? 'Bank details provided after order.' : 'Pay at the venue on event day.'}</span>
                    </div>
                  )}

                  {paymentMethod === 'mpesa' && (
                    <div className="pp-security-note">
                      <Shield size={14} />
                      <span>Secured via Safaricom Daraja API. Your PIN is never shared with us.</span>
                    </div>
                  )}

                  <button className="pp-pay-btn" onClick={handleInitiatePayment} style={{ marginTop: '1rem' }}>
                    {paymentMethod === 'mpesa' ? `Send STK Push — KES ${total.toLocaleString()}` : `Pay — KES ${total.toLocaleString()}`}
                  </button>
                </motion.div>
              )}

              {/* Step: Processing */}
              {step === 'processing' && (
                <motion.div key="processing" className="pp-step pp-centered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="pp-processing-ring">
                    <Loader size={32} className="spin-icon cyan-neon" />
                  </div>
                  <h3 className="pp-title">{paymentMethod === 'mpesa' ? 'STK Push Sent' : 'Processing Payment'}</h3>
                  <p className="pp-processing-sub">{paymentMethod === 'mpesa' ? `Check your phone ${phone} and enter your M-Pesa PIN to complete the payment.` : 'Please wait while we process your payment...'}</p>
                  <div className="pp-waiting-dots">
                    {[0,1,2].map(i => (
                      <motion.span key={i} className="pp-dot" animate={{ opacity: [0.2,1,0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step: Success */}
              {step === 'success' && (
                <motion.div key="success" className="pp-step pp-centered" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <motion.div
                    className="pp-success-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}>
                    <CheckCircle size={40} />
                  </motion.div>
                  <h3 className="pp-title">Payment Confirmed!</h3>
                  <p className="pp-processing-sub">Your {qty} × {tier?.name} ticket{qty > 1 ? 's' : ''} for <strong>{event.title}</strong> {qty > 1 ? 'are' : 'is'} confirmed. Check your email for the QR ticket.</p>
                  <div className="pp-ticket-ref">
                    <span>Ref: {orderRef || 'Confirmed'}</span>
                  </div>
                  <button className="pp-pay-btn" onClick={() => navigate('/')}>Back to Events</button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Merch Section */}
      {event.merch && event.merch.length > 0 && (
        <div className="edp-merch-section">
          <h2 className="edp-section-title"><ShoppingBag size={20} /> Official Merchandise</h2>
          <div className="edp-merch-grid">
            {event.merch.map((item, i) => (
              <div key={i} className="edp-merch-card glass-panel">
                <div className="edp-merch-icon"><ShoppingBag size={24} style={{ color: 'var(--primary-gold)' }} /></div>
                <div className="edp-merch-info">
                  <strong>{item.name}</strong>
                  <span>{item.price}</span>
                </div>
                <div className="edp-merch-stock">{item.stock > 0 ? `${item.stock} left` : 'Sold out'}</div>
                <button className="edp-merch-btn" disabled={item.stock === 0}
                  onClick={() => handleMerchAdd(item)}>
                  {item.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <div className="edp-related-section">
          <h2 className="edp-section-title"><Compass size={20} /> You May Also Like</h2>
          <div className="edp-related-grid">
            {relatedEvents.map(ev => (
              <button key={ev.id} className="edp-related-card" onClick={() => navigate(`/event/${ev.id}`)}>
                {ev.image && <img src={ev.image} alt={ev.title} className="edp-related-img" />}
                <div className="edp-related-info">
                  <strong>{ev.title}</strong>
                  <span><MapPin size={11} /> {ev.location.split(',')[0]}</span>
                  <span className="edp-related-price">{ev.price}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
