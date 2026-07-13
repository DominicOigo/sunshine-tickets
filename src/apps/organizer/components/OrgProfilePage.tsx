import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Building, Phone, Save, ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import './OrgSubPage.css';

export const OrgProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast('Name and email are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(name, email, phone || undefined, businessName || undefined);
      toast('Profile updated successfully.', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>Organizer Profile</h1>
          <p>Manage your public branding, business information, and default payout channels.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Form panel */}
        <div className="osp-glass-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'white', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.50rem' }}>
              Basic Profile Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>
                  FULL NAME / REPRESENTATIVE
                </label>
                <div className="osp-search" style={{ maxWidth: 'none' }}>
                  <User size={14} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>
                  EMAIL ADDRESS
                </label>
                <div className="osp-search" style={{ maxWidth: 'none' }}>
                  <Mail size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'white', margin: '0.5rem 0 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.50rem' }}>
              Business Profile &amp; Payouts
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>
                  BUSINESS / COMPANY NAME
                </label>
                <div className="osp-search" style={{ maxWidth: 'none' }}>
                  <Building size={14} />
                  <input
                    type="text"
                    placeholder="e.g. Acme Entertainment"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>
                  M-PESA PAYOUT PHONE NUMBER
                </label>
                <div className="osp-search" style={{ maxWidth: 'none' }}>
                  <Phone size={14} />
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="osp-primary-btn"
              style={{
                alignSelf: 'flex-start',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={14} />
              {saving ? 'Saving changes...' : 'Save Profile Settings'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="osp-glass-panel" style={{ background: '#0F1014', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF9500', marginBottom: '0.75rem' }}>
              <ShieldCheck size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Verification Badge</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  background: user?.is_verified ? 'rgba(34,197,94,0.1)' : 'rgba(255,149,0,0.1)',
                  color: user?.is_verified ? '#22C55E' : '#FF9500',
                  border: `1px solid ${user?.is_verified ? 'rgba(34,197,94,0.2)' : 'rgba(255,149,0,0.2)'}`
                }}
              >
                {user?.is_verified ? 'VERIFIED PARTNER' : 'PENDING APPROVAL'}
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-gray)', marginTop: '0.75rem', margin: 0, lineHeight: '1.5' }}>
              Verified organizer partners receive higher payout processing priorities and automatic ticket confirmation features. If you need details verified, make sure your payout phone matches your verified business credentials.
            </p>
          </div>

          <div className="osp-glass-panel" style={{ background: '#0F1014', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <FileText size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Social Credentials</strong>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.5' }}>
              Branding details, social handles, and representative credentials are automatically embedded in your public marketplace event listings, creating trust and boosting tickets bought by customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrgProfilePage;
