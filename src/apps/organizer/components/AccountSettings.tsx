import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import './AccountSettings.css';

const Field: React.FC<{
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, icon, type = 'text', value, onChange, placeholder, disabled }) => (
  <div className="as-field">
    <label>{label}</label>
    <div className={`as-input-wrap ${disabled ? 'disabled' : ''}`}>
      <span className="as-icon">{icon}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
    </div>
  </div>
);

const Section: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="as-section glass-panel">
    <div className="as-section-header">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
    {children}
  </div>
);

export const AccountSettings: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const { toast } = useToast();

  // Profile state
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await updateProfile(name, email);
      toast('Profile updated successfully.', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (newPw !== confirmPw) { toast('New passwords do not match.', 'error'); return; }
    setPwLoading(true);
    try {
      await updatePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      toast('Password changed successfully.', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const profileChanged = name !== (user?.name ?? '') || email !== (user?.email ?? '');

  return (
    <div className="account-settings">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Account Settings</h2>
          <p className="panel-subtitle">Manage your profile, email address, and password</p>
        </div>
      </div>

      <div className="as-grid">
        {/* Profile */}
        <Section title="Profile Information" subtitle="Update your display name and email address.">
          <div className="as-fields">
            <Field label="Full Name" icon={<User size={16} />} value={name} onChange={setName} placeholder="Your full name" />
            <Field label="Email Address" icon={<Mail size={16} />} type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          </div>
          <div className="as-footer">
            <motion.button
              className="as-save-btn"
              onClick={handleProfileSave}
              disabled={!profileChanged || profileLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {profileLoading ? 'Saving...' : <><Save size={15} /> Save Changes</>}
            </motion.button>
          </div>
        </Section>

        {/* Password */}
        <Section title="Change Password" subtitle="Use a strong password of at least 6 characters.">
          <div className="as-fields">
            <Field label="Current Password" icon={<Lock size={16} />} type="password" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" />
            <Field label="New Password" icon={<Lock size={16} />} type="password" value={newPw} onChange={setNewPw} placeholder="••••••••" />
            <Field label="Confirm New Password" icon={<Lock size={16} />} type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
          </div>

          {/* Strength indicator */}
          {newPw.length > 0 && (
            <div className="as-strength">
              <div className="as-strength-bars">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`as-strength-bar ${newPw.length >= i * 3 ? (newPw.length >= 10 ? 'strong' : newPw.length >= 6 ? 'medium' : 'weak') : ''}`} />
                ))}
              </div>
              <span className={`as-strength-label ${newPw.length >= 10 ? 'strong' : newPw.length >= 6 ? 'medium' : 'weak'}`}>
                {newPw.length >= 10 ? 'Strong' : newPw.length >= 6 ? 'Medium' : 'Weak'}
              </span>
            </div>
          )}

          <div className="as-footer">
            <motion.button
              className="as-save-btn"
              onClick={handlePasswordSave}
              disabled={!currentPw || !newPw || !confirmPw || pwLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {pwLoading ? 'Updating...' : <><ShieldCheck size={15} /> Update Password</>}
            </motion.button>
          </div>
        </Section>
      </div>

      {/* Danger zone */}
      <div className="as-danger-zone">
        <div>
          <h4>Danger Zone</h4>
          <p>Permanently delete your account and all associated data.</p>
        </div>
        <button className="as-danger-btn" onClick={() => toast('Account deletion requires contacting support.', 'info')}>
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
