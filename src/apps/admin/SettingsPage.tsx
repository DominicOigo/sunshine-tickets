import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Bell, Shield, Globe, Mail, Smartphone, Save, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './SettingsPage.css';

type SettingsTab = 'platform' | 'payments' | 'notifications' | 'security';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<SettingsTab>('platform');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Platform settings state
  const [platform, setPlatform] = useState({
    siteName: 'Sunshine Tickets',
    siteUrl: 'https://sunshinetickets.co.ke',
    supportEmail: 'support@sunshinetickets.co.ke',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    maintenanceMode: false,
    registrationOpen: true,
    eventAutoApprove: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const s = await adminService.getSettings();
        setPlatform(p => ({
          ...p,
          maintenanceMode: s.maintenance_mode === 'true',
          registrationOpen: s.registration_open === 'true',
          eventAutoApprove: s.event_auto_approve === 'true',
          siteName: s.site_name || p.siteName,
          siteUrl: s.site_url || p.siteUrl,
          supportEmail: s.support_email || p.supportEmail,
          currency: s.currency || p.currency,
          timezone: s.timezone || p.timezone,
        }));
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Payment settings state
  const [payments, setPayments] = useState({
    mpesaEnabled: true,
    cardEnabled: true,
    mpesaShortcode: '174379',
    mpesaPasskey: '••••••••••••••••',
    serviceFeePercent: '5',
    payoutSchedule: 'weekly',
    minPayoutAmount: '5000',
  });

  // Notification settings state
  const [notifs, setNotifs] = useState({
    emailNewOrder: true,
    emailNewUser: true,
    emailEventApproval: true,
    emailPaymentFailed: true,
    smsNewOrder: false,
    smsPaymentFailed: true,
    adminDigestEmail: true,
    digestFrequency: 'daily',
  });

  // Security settings state
  const [security, setSecurity] = useState({
    twoFactorRequired: false,
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    ipWhitelistEnabled: false,
    auditLogRetention: '90',
  });

  const save = async (section: string) => {
    setSaving(true);
    try {
      if (section === 'platform') {
        await adminService.updateSettings({
          registration_open: platform.registrationOpen ? 'true' : 'false',
          maintenance_mode: platform.maintenanceMode ? 'true' : 'false',
          event_auto_approve: platform.eventAutoApprove ? 'true' : 'false',
          site_name: platform.siteName,
          site_url: platform.siteUrl,
          support_email: platform.supportEmail,
          currency: platform.currency,
          timezone: platform.timezone,
        });
      } else if (section === 'payments') {
        await adminService.updateSettings({
          mpesa_enabled: payments.mpesaEnabled ? 'true' : 'false',
          card_enabled: payments.cardEnabled ? 'true' : 'false',
          mpesa_shortcode: payments.mpesaShortcode,
          mpesa_passkey: payments.mpesaPasskey,
          service_fee_percent: payments.serviceFeePercent,
          payout_schedule: payments.payoutSchedule,
          min_payout_amount: payments.minPayoutAmount,
        });
      } else if (section === 'notifications') {
        await adminService.updateSettings({
          email_new_order: notifs.emailNewOrder ? 'true' : 'false',
          email_new_user: notifs.emailNewUser ? 'true' : 'false',
          email_event_approval: notifs.emailEventApproval ? 'true' : 'false',
          email_payment_failed: notifs.emailPaymentFailed ? 'true' : 'false',
          sms_new_order: notifs.smsNewOrder ? 'true' : 'false',
          sms_payment_failed: notifs.smsPaymentFailed ? 'true' : 'false',
          admin_digest_email: notifs.adminDigestEmail ? 'true' : 'false',
          digest_frequency: notifs.digestFrequency,
        });
      } else if (section === 'security') {
        await adminService.updateSettings({
          two_factor_required: security.twoFactorRequired ? 'true' : 'false',
          session_timeout: security.sessionTimeout,
          max_login_attempts: security.maxLoginAttempts,
          ip_whitelist_enabled: security.ipWhitelistEnabled ? 'true' : 'false',
          audit_log_retention: security.auditLogRetention,
        });
      }
      toast('Settings saved successfully.', 'success');
    } catch {
      toast('Failed to save settings.', 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="sp-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader2 size={32} className="spinner" style={{ color: 'var(--primary-gold)' }} />
      </div>
    );
  }

  const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'platform',      label: 'Platform',      icon: <Globe size={15}/> },
    { id: 'payments',      label: 'Payments',      icon: <CreditCard size={15}/> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15}/> },
    { id: 'security',      label: 'Security',      icon: <Shield size={15}/> },
  ];

  return (
    <div className="sp-shell">
      <div className="sp-heading">
        <div>
          <h1>System Settings</h1>
          <p>Configure platform-wide settings and preferences.</p>
        </div>
      </div>

      <div className="sp-layout">
        {/* Sidebar tabs */}
        <div className="admin-glass-panel sp-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`sp-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="sp-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="sp-content">

          {/* ── Platform ── */}
          {tab === 'platform' && (
            <div className="admin-glass-panel sp-section">
              <div className="sp-section-header">
                <Settings size={18} style={{ color: '#FF9500' }}/>
                <h3>Platform Settings</h3>
              </div>
              <div className="sp-fields">
                <div className="sp-field-row">
                  <div className="sp-field">
                    <label>Site Name</label>
                    <input value={platform.siteName} onChange={e => setPlatform(p => ({...p, siteName: e.target.value}))} />
                  </div>
                  <div className="sp-field">
                    <label>Site URL</label>
                    <input value={platform.siteUrl} onChange={e => setPlatform(p => ({...p, siteUrl: e.target.value}))} />
                  </div>
                </div>
                <div className="sp-field-row">
                  <div className="sp-field">
                    <label>Support Email</label>
                    <input value={platform.supportEmail} onChange={e => setPlatform(p => ({...p, supportEmail: e.target.value}))} />
                  </div>
                  <div className="sp-field">
                    <label>Default Currency</label>
                    <select value={platform.currency} onChange={e => setPlatform(p => ({...p, currency: e.target.value}))}>
                      <option value="KES">KES – Kenyan Shilling</option>
                      <option value="USD">USD – US Dollar</option>
                    </select>
                  </div>
                </div>
                <div className="sp-field">
                  <label>Timezone</label>
                  <select value={platform.timezone} onChange={e => setPlatform(p => ({...p, timezone: e.target.value}))}>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="sp-toggles">
                  {[
                    { key: 'maintenanceMode',  label: 'Maintenance Mode',        sub: 'Show maintenance page to all users', color: '#EF4444' },
                    { key: 'registrationOpen', label: 'Open Registration',        sub: 'Allow new users to register',        color: '#22C55E' },
                    { key: 'eventAutoApprove', label: 'Auto-Approve Events',      sub: 'Skip manual review for new events',  color: '#FF9500' },
                  ].map(item => (
                    <div key={item.key} className="sp-toggle-row">
                      <div>
                        <span className="sp-toggle-label">{item.label}</span>
                        <span className="sp-toggle-sub">{item.sub}</span>
                      </div>
                      <button
                        className={`sp-toggle ${(platform as any)[item.key] ? 'on' : 'off'}`}
                        style={{ ['--toggle-color' as any]: item.color }}
                        onClick={() => setPlatform(p => ({...p, [item.key]: !(p as any)[item.key]}))}
                      >
                        <span className="sp-toggle-knob"/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sp-save-row">
                <button className="sp-save-btn" onClick={() => save('platform')} disabled={saving}><Save size={15}/> {saving ? 'Saving...' : 'Save Platform Settings'}</button>
              </div>
            </div>
          )}

          {/* ── Payments ── */}
          {tab === 'payments' && (
            <div className="admin-glass-panel sp-section">
              <div className="sp-section-header">
                <CreditCard size={18} style={{ color: '#22C55E' }}/>
                <h3>Payment Settings</h3>
              </div>
              <div className="sp-fields">
                <div className="sp-toggles" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { key: 'mpesaEnabled', label: 'M-Pesa Payments',  sub: 'Accept payments via M-Pesa STK Push', color: '#22C55E' },
                    { key: 'cardEnabled',  label: 'Card Payments',     sub: 'Accept Visa / Mastercard payments',   color: '#2E5BFF' },
                  ].map(item => (
                    <div key={item.key} className="sp-toggle-row">
                      <div>
                        <span className="sp-toggle-label">{item.label}</span>
                        <span className="sp-toggle-sub">{item.sub}</span>
                      </div>
                      <button
                        className={`sp-toggle ${(payments as any)[item.key] ? 'on' : 'off'}`}
                        style={{ ['--toggle-color' as any]: item.color }}
                        onClick={() => setPayments(p => ({...p, [item.key]: !(p as any)[item.key]}))}
                      >
                        <span className="sp-toggle-knob"/>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="sp-field-row">
                  <div className="sp-field">
                    <label>M-Pesa Shortcode</label>
                    <input value={payments.mpesaShortcode} onChange={e => setPayments(p => ({...p, mpesaShortcode: e.target.value}))} />
                  </div>
                  <div className="sp-field">
                    <label>M-Pesa Passkey</label>
                    <input type="password" value={payments.mpesaPasskey} onChange={e => setPayments(p => ({...p, mpesaPasskey: e.target.value}))} />
                  </div>
                </div>
                <div className="sp-field-row">
                  <div className="sp-field">
                    <label>Service Fee (%)</label>
                    <input type="number" value={payments.serviceFeePercent} onChange={e => setPayments(p => ({...p, serviceFeePercent: e.target.value}))} />
                  </div>
                  <div className="sp-field">
                    <label>Min Payout Amount (KES)</label>
                    <input type="number" value={payments.minPayoutAmount} onChange={e => setPayments(p => ({...p, minPayoutAmount: e.target.value}))} />
                  </div>
                </div>
                <div className="sp-field">
                  <label>Payout Schedule</label>
                  <select value={payments.payoutSchedule} onChange={e => setPayments(p => ({...p, payoutSchedule: e.target.value}))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="sp-save-row">
                <button className="sp-save-btn" onClick={() => save('payments')} disabled={saving}><Save size={15}/> {saving ? 'Saving...' : 'Save Payment Settings'}</button>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === 'notifications' && (
            <div className="admin-glass-panel sp-section">
              <div className="sp-section-header">
                <Bell size={18} style={{ color: '#2E5BFF' }}/>
                <h3>Notification Settings</h3>
              </div>
              <div className="sp-fields">
                <p className="sp-sub-heading"><Mail size={13}/> Email Notifications</p>
                <div className="sp-toggles">
                  {[
                    { key: 'emailNewOrder',      label: 'New Order',            sub: 'Notify admin when a new order is placed'      },
                    { key: 'emailNewUser',        label: 'New User Registration',sub: 'Notify admin when a new user registers'       },
                    { key: 'emailEventApproval',  label: 'Event Submission',     sub: 'Notify admin when an event is submitted'      },
                    { key: 'emailPaymentFailed',  label: 'Failed Payment',       sub: 'Notify admin when a payment fails'            },
                  ].map(item => (
                    <div key={item.key} className="sp-toggle-row">
                      <div>
                        <span className="sp-toggle-label">{item.label}</span>
                        <span className="sp-toggle-sub">{item.sub}</span>
                      </div>
                      <button
                        className={`sp-toggle ${(notifs as any)[item.key] ? 'on' : 'off'}`}
                        style={{ ['--toggle-color' as any]: '#2E5BFF' }}
                        onClick={() => setNotifs(n => ({...n, [item.key]: !(n as any)[item.key]}))}
                      >
                        <span className="sp-toggle-knob"/>
                      </button>
                    </div>
                  ))}
                </div>
                <p className="sp-sub-heading" style={{ marginTop: '1rem' }}><Smartphone size={13}/> SMS Notifications</p>
                <div className="sp-toggles">
                  {[
                    { key: 'smsNewOrder',       label: 'New Order SMS',        sub: 'SMS admin on new orders'          },
                    { key: 'smsPaymentFailed',  label: 'Failed Payment SMS',   sub: 'SMS admin on payment failures'    },
                  ].map(item => (
                    <div key={item.key} className="sp-toggle-row">
                      <div>
                        <span className="sp-toggle-label">{item.label}</span>
                        <span className="sp-toggle-sub">{item.sub}</span>
                      </div>
                      <button
                        className={`sp-toggle ${(notifs as any)[item.key] ? 'on' : 'off'}`}
                        style={{ ['--toggle-color' as any]: '#22C55E' }}
                        onClick={() => setNotifs(n => ({...n, [item.key]: !(n as any)[item.key]}))}
                      >
                        <span className="sp-toggle-knob"/>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="sp-field" style={{ marginTop: '1rem' }}>
                  <label>Admin Digest Frequency</label>
                  <select value={notifs.digestFrequency} onChange={e => setNotifs(n => ({...n, digestFrequency: e.target.value}))}>
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="sp-save-row">
                <button className="sp-save-btn" onClick={() => save('notifications')} disabled={saving}><Save size={15}/> {saving ? 'Saving...' : 'Save Notification Settings'}</button>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {tab === 'security' && (
            <div className="admin-glass-panel sp-section">
              <div className="sp-section-header">
                <Shield size={18} style={{ color: '#EF4444' }}/>
                <h3>Security Settings</h3>
              </div>
              <div className="sp-fields">
                <div className="sp-toggles" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { key: 'twoFactorRequired',  label: 'Require 2FA for Admins', sub: 'All admin accounts must use 2FA',       color: '#EF4444' },
                    { key: 'ipWhitelistEnabled', label: 'IP Whitelist',            sub: 'Restrict admin access by IP address', color: '#FF9500' },
                  ].map(item => (
                    <div key={item.key} className="sp-toggle-row">
                      <div>
                        <span className="sp-toggle-label">{item.label}</span>
                        <span className="sp-toggle-sub">{item.sub}</span>
                      </div>
                      <button
                        className={`sp-toggle ${(security as any)[item.key] ? 'on' : 'off'}`}
                        style={{ ['--toggle-color' as any]: item.color }}
                        onClick={() => setSecurity(s => ({...s, [item.key]: !(s as any)[item.key]}))}
                      >
                        <span className="sp-toggle-knob"/>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="sp-field-row">
                  <div className="sp-field">
                    <label>Session Timeout (minutes)</label>
                    <input type="number" value={security.sessionTimeout} onChange={e => setSecurity(s => ({...s, sessionTimeout: e.target.value}))} />
                  </div>
                  <div className="sp-field">
                    <label>Max Login Attempts</label>
                    <input type="number" value={security.maxLoginAttempts} onChange={e => setSecurity(s => ({...s, maxLoginAttempts: e.target.value}))} />
                  </div>
                </div>
                <div className="sp-field">
                  <label>Audit Log Retention (days)</label>
                  <input type="number" value={security.auditLogRetention} onChange={e => setSecurity(s => ({...s, auditLogRetention: e.target.value}))} />
                </div>
              </div>
              <div className="sp-save-row">
                <button className="sp-save-btn" onClick={() => save('security')} disabled={saving}><Save size={15}/> {saving ? 'Saving...' : 'Save Security Settings'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
