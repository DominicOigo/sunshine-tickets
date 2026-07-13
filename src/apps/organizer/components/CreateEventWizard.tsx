import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Calendar, MapPin, Ticket, CheckCircle,
  Plus, Trash2, X, Upload, Image, Tag, ShoppingBag, Clock,
} from 'lucide-react';
import { useEvents } from '../../../context/EventContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { uploadImage } from '../../../lib/api';
import './CreateEventWizard.css';

interface Tier  { name: string; price: string; capacity: string; }
interface Merch { name: string; price: string; stock: string; }
interface Props  { onClose: () => void; }

const STEPS    = ['Details', 'Tickets', 'Merch', 'Review'];
const CATS     = ['Concerts','Festivals','Sports','Theatre','Comedy','Conferences','Workshops','Other'];
const blankTier  = (): Tier  => ({ name: '', price: '', capacity: '' });
const blankMerch = (): Merch => ({ name: '', price: '', stock: '' });

export const CreateEventWizard: React.FC<Props> = ({ onClose }) => {
  const { createEvent } = useEvents();
  const { user }        = useAuth();
  const { toast }       = useToast();
  const fileRef         = useRef<HTMLInputElement>(null);

  const [step,     setStep]     = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [uploading,setUploading]= useState(false);

  // Step 1 — Details
  const [title,       setTitle]       = useState('');
  const [date,        setDate]        = useState('');
  const [time,        setTime]        = useState('09:00');
  const [location,    setLocation]    = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [imageUrl,    setImageUrl]    = useState('');
  const [imagePreview,setImagePreview]= useState('');

  // Step 2 — Tickets
  const [tiers, setTiers] = useState<Tier[]>([blankTier()]);

  // Step 3 — Merch (optional)
  const [merch,    setMerch]    = useState<Merch[]>([]);
  const [hasMerch, setHasMerch] = useState(false);

  const updateTier  = (i: number, f: keyof Tier,  v: string) => setTiers(p => p.map((t,j) => j===i ? {...t,[f]:v} : t));
  const updateMerch = (i: number, f: keyof Merch, v: string) => setMerch(p => p.map((m,j) => j===i ? {...m,[f]:v} : m));

  const canStep1 = title.trim() && date && time && location.trim() && description.trim() && category;
  const canStep2 = tiers.every(t => t.name.trim() && t.price.trim() && t.capacity.trim());
  const canStep3 = !hasMerch || merch.every(m => m.name.trim() && m.price.trim() && m.stock.trim());

  // Upload image to Supabase Storage
  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB.', 'error'); return; }

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      setImagePreview(URL.createObjectURL(file));
      toast('Image uploaded.', 'success');
    } catch (e: any) {
      toast(e.message ?? 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const startDate = new Date(`${date}T${time}:00`).toISOString();
      const d = new Date(startDate);
      const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

      await createEvent({
        title,
        date:        `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}`,
        day:         days[d.getDay()],
        startDate,
        location,
        description,
        coordinates: { lat: -1.286389, lng: 36.817223 },
        price:       `KES ${Number(tiers[0].price).toLocaleString()}`,
        organizerId: user.id,
        organizerName: user.name,
        image:       imageUrl,
        tiers: tiers.map(t => ({
          id: '', name: t.name,
          price: `KES ${Number(t.price).toLocaleString()}`,
          priceInt: Number(t.price),
          capacity: Number(t.capacity),
          sold: 0, is_active: true,
        })),
        merch: hasMerch ? merch.map(m => ({
          name:  m.name,
          price: `KES ${Number(m.price).toLocaleString()}`,
          stock: Number(m.stock),
        })) : [],
      });

      toast('Event submitted for approval!', 'success');
      onClose();
    } catch (e: any) {
      toast(e.message ?? 'Failed to create event. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextDisabled = step === 0 ? !canStep1 : step === 1 ? !canStep2 : step === 2 ? !canStep3 : false;

  return (
    <div className="wizard-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="create-wizard"
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 350, damping: 30 }}>

        {/* Header */}
        <div className="cw-header">
          <div>
            <h2 className="cw-title">Create New Event</h2>
            <p className="cw-sub">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button className="cw-close" onClick={onClose}><X size={20}/></button>
        </div>

        {/* Progress */}
        <div className="cw-progress">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`cw-step-dot ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                {i < step ? <CheckCircle size={14}/> : <span>{i + 1}</span>}
              </div>
              {i < STEPS.length - 1 && <div className={`cw-step-line ${i < step ? 'active' : ''}`}/>}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="cw-body">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Details ── */}
            {step === 0 && (
              <motion.div key="s0" className="cw-step" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>

                {/* Image upload */}
                <div className="cw-image-upload" onClick={() => fileRef.current?.click()}>
                  {imagePreview
                    ? <img src={imagePreview} alt="preview" className="cw-image-preview"/>
                    : (
                      <div className="cw-image-placeholder">
                        {uploading
                          ? <><Upload size={24} className="cw-upload-icon spin"/><span>Uploading...</span></>
                          : <><Image size={24} className="cw-upload-icon"/><span>Click to upload event image</span><span className="cw-upload-hint">JPG, PNG, WebP — max 5MB</span></>
                        }
                      </div>
                    )
                  }
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImagePick}/>
                </div>

                <div className="cw-field">
                  <label>Event Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Diamond Platnumz Live in Concert"/>
                </div>

                <div className="cw-row">
                  <div className="cw-field">
                    <label><Tag size={13}/> Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="cw-select">
                      <option value="">Select category</option>
                      {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="cw-row">
                  <div className="cw-field">
                    <label><Calendar size={13}/> Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}/>
                  </div>
                  <div className="cw-field">
                    <label><Clock size={13}/> Time</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)}/>
                  </div>
                </div>

                <div className="cw-field">
                  <label><MapPin size={13}/> Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Carnivore Grounds, Nairobi"/>
                </div>

                <div className="cw-field">
                  <label>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the event experience..." rows={3}/>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Tickets ── */}
            {step === 1 && (
              <motion.div key="s1" className="cw-step" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <div className="cw-tiers-list">
                  {tiers.map((t, i) => (
                    <div key={i} className="cw-tier-row">
                      <div className="cw-tier-num"><Ticket size={14}/>{i + 1}</div>
                      <div className="cw-field" style={{ flex: 2 }}>
                        {i === 0 && <label>Tier Name</label>}
                        <input value={t.name} onChange={e => updateTier(i,'name',e.target.value)} placeholder="e.g. Early Bird"/>
                      </div>
                      <div className="cw-field" style={{ flex: 1 }}>
                        {i === 0 && <label>Price (KES)</label>}
                        <input type="number" value={t.price} onChange={e => updateTier(i,'price',e.target.value)} placeholder="2500" min="0"/>
                      </div>
                      <div className="cw-field" style={{ flex: 1 }}>
                        {i === 0 && <label>Capacity</label>}
                        <input type="number" value={t.capacity} onChange={e => updateTier(i,'capacity',e.target.value)} placeholder="500" min="1"/>
                      </div>
                      {tiers.length > 1 && (
                        <button className="cw-remove-tier" onClick={() => setTiers(p => p.filter((_,j)=>j!==i))} style={{ marginTop: i===0?'1.5rem':0 }}>
                          <Trash2 size={15}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {tiers.length < 5 && (
                  <button className="cw-add-tier" onClick={() => setTiers(p => [...p, blankTier()])}>
                    <Plus size={15}/> Add Ticket Tier
                  </button>
                )}
              </motion.div>
            )}

            {/* ── Step 3: Merch ── */}
            {step === 2 && (
              <motion.div key="s2" className="cw-step" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <div className="cw-merch-toggle">
                  <div>
                    <strong>Sell Official Merchandise</strong>
                    <p>Add T-shirts, caps, posters or any branded items fans can buy with their tickets.</p>
                  </div>
                  <button className={`cw-toggle ${hasMerch ? 'on' : 'off'}`} onClick={() => { setHasMerch(v => !v); if (!hasMerch && merch.length===0) setMerch([blankMerch()]); }}>
                    <span className="cw-toggle-knob"/>
                  </button>
                </div>

                {hasMerch && (
                  <div className="cw-merch-list">
                    {merch.map((m, i) => (
                      <div key={i} className="cw-tier-row">
                        <div className="cw-tier-num"><ShoppingBag size={14}/>{i+1}</div>
                        <div className="cw-field" style={{ flex: 3 }}>
                          {i === 0 && <label>Item Name</label>}
                          <input value={m.name} onChange={e => updateMerch(i,'name',e.target.value)} placeholder="e.g. Event T-Shirt"/>
                        </div>
                        <div className="cw-field" style={{ flex: 1 }}>
                          {i === 0 && <label>Price (KES)</label>}
                          <input type="number" value={m.price} onChange={e => updateMerch(i,'price',e.target.value)} placeholder="1500" min="0"/>
                        </div>
                        <div className="cw-field" style={{ flex: 1 }}>
                          {i === 0 && <label>Stock</label>}
                          <input type="number" value={m.stock} onChange={e => updateMerch(i,'stock',e.target.value)} placeholder="100" min="0"/>
                        </div>
                        {merch.length > 1 && (
                          <button className="cw-remove-tier" onClick={() => setMerch(p => p.filter((_,j)=>j!==i))} style={{ marginTop: i===0?'1.5rem':0 }}>
                            <Trash2 size={15}/>
                          </button>
                        )}
                      </div>
                    ))}
                    {merch.length < 10 && (
                      <button className="cw-add-tier" onClick={() => setMerch(p => [...p, blankMerch()])}>
                        <Plus size={15}/> Add Merch Item
                      </button>
                    )}
                  </div>
                )}

                {!hasMerch && (
                  <div className="cw-merch-empty">
                    <ShoppingBag size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}/>
                    <p>No merchandise for this event. Toggle above to add items.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 4: Review ── */}
            {step === 3 && (
              <motion.div key="s3" className="cw-step" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                {imagePreview && <img src={imagePreview} alt="" className="cw-review-banner"/>}
                <div className="cw-review-card">
                  <div className="cw-review-row"><span>Event</span><strong>{title}</strong></div>
                  <div className="cw-review-row"><span>Category</span><strong>{category}</strong></div>
                  <div className="cw-review-row"><span>Date &amp; Time</span><strong>{new Date(`${date}T${time}`).toLocaleString('en-KE',{dateStyle:'long',timeStyle:'short'})}</strong></div>
                  <div className="cw-review-row"><span>Location</span><strong>{location}</strong></div>
                  <div className="cw-review-row"><span>Organizer</span><strong>{user?.name}</strong></div>
                  <div className="cw-review-row"><span>Image</span><strong>{imageUrl ? 'Uploaded' : 'None'}</strong></div>
                </div>
                <div className="cw-tiers-summary">
                  <p className="cw-summary-label">Ticket Tiers ({tiers.length})</p>
                  {tiers.map((t, i) => (
                    <div key={i} className="cw-tier-summary-row">
                      <span className="cw-tier-pill">{t.name}</span>
                      <span>KES {Number(t.price).toLocaleString()}</span>
                      <span className="cw-tier-cap">{Number(t.capacity).toLocaleString()} tickets</span>
                    </div>
                  ))}
                </div>
                {hasMerch && merch.length > 0 && (
                  <div className="cw-tiers-summary">
                    <p className="cw-summary-label">Merchandise ({merch.length} items)</p>
                    {merch.map((m, i) => (
                      <div key={i} className="cw-tier-summary-row">
                        <span className="cw-tier-pill">{m.name}</span>
                        <span>KES {Number(m.price).toLocaleString()}</span>
                        <span className="cw-tier-cap">{m.stock} units</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="cw-approval-note">Your event will be reviewed by admin before going live on the marketplace.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="cw-footer">
          {step > 0
            ? <button className="cw-btn-back" onClick={() => setStep(s => s-1)}><ArrowLeft size={16}/> Back</button>
            : <div/>
          }
          {step < STEPS.length - 1
            ? <button className="cw-btn-next" onClick={() => setStep(s => s+1)} disabled={nextDisabled}>Next <ArrowRight size={16}/></button>
            : <button className="cw-btn-submit" onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : <><CheckCircle size={16}/> Submit Event</>}</button>
          }
        </div>
      </motion.div>
    </div>
  );
};

export default CreateEventWizard;
