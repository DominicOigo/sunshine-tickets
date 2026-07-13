import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, AlertCircle, ShieldCheck, Sparkles, Building, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './OrganizerAuthPage.css';

export const OrganizerAuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'signup') {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!businessName.trim()) {
        setError('Please enter your company/business name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      let loggedInUser;
      if (authMode === 'signin') {
        loggedInUser = await signIn(username, password);
      } else {
        loggedInUser = await signUp(username, email, password, name, 'organizer', businessName, payoutPhone);
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        setSuccess(false);
        if (authMode === 'signup') {
          setAuthMode('signin');
          setUsername('');
          setEmail('');
          setName('');
          setPassword('');
          setConfirmPassword('');
          setBusinessName('');
          setPayoutPhone('');
          setError('Your account has been registered and is pending admin approval. Please wait for verification (up to 24 hours).');
        } else if (loggedInUser) {
          const role = loggedInUser.role || 'organizer';
          if (role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/manage');
          }
        }
      }, 2000);

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="org-auth-page">
      {/* Background Neon Glows */}
      <div className="org-auth-glow org-auth-glow--orange" />
      <div className="org-auth-glow org-auth-glow--cyan" />

      <motion.div 
        className="org-auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {success ? (
          <motion.div 
            className="org-auth-success"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <div className="org-success-icon">
              <ShieldCheck size={48} className="cyan-neon" />
            </div>
            <h3>{authMode === 'signin' ? 'Welcome Back!' : 'Account Registered'}</h3>
            <p>
              {authMode === 'signin' 
                ? 'Authentication successful. Loading dashboard...' 
                : 'Registration completed. Redirecting to verification portal...'}
            </p>
          </motion.div>
        ) : (
          <div className="org-auth-card">
            <div className="org-auth-header">
              <div className="org-brand-icon">
                <Sparkles size={26} className="orange-neon" />
              </div>
              <h2>Sunshine Tickets</h2>
              <span className="org-portal-badge">ORGANIZER PORTAL</span>
              <p>
                {authMode === 'signin' 
                  ? 'Access your organizer dashboard and ticket stats' 
                  : 'Register a verified organizer account to host events'}
              </p>
            </div>

            {/* Tabs */}
            <div className="org-auth-tabs">
              <button 
                type="button" 
                className={`org-auth-tab ${authMode === 'signin' ? 'active' : ''}`}
                onClick={() => { setError(''); setAuthMode('signin'); }}
              >
                Sign In
                {authMode === 'signin' && <motion.div className="org-tab-line" layoutId="orgTabLine" />}
              </button>
              <button 
                type="button" 
                className={`org-auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => { setError(''); setAuthMode('signup'); }}
              >
                Register
                {authMode === 'signup' && <motion.div className="org-tab-line" layoutId="orgTabLine" />}
              </button>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="org-error-banner"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="org-auth-form">
              {authMode === 'signup' && (
                <>
                  <div className="org-input-group">
                    <label>Full Name</label>
                    <div className="org-input-wrapper">
                      <User size={18} className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="Your full name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        disabled={loading} 
                      />
                    </div>
                  </div>

                  <div className="org-input-group">
                    <label>Business / Company Name</label>
                    <div className="org-input-wrapper">
                      <Building size={18} className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="e.g. Carnivore Events Ltd" 
                        value={businessName} 
                        onChange={e => setBusinessName(e.target.value)} 
                        required 
                        disabled={loading} 
                      />
                    </div>
                  </div>

                  <div className="org-input-group">
                    <label>Payout Phone Number (M-Pesa)</label>
                    <div className="org-input-wrapper">
                      <Phone size={18} className="input-icon" />
                      <input 
                        type="tel" 
                        placeholder="e.g. 07XXXXXXXX" 
                        value={payoutPhone} 
                        onChange={e => setPayoutPhone(e.target.value)} 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="org-input-group">
                <label>Username</label>
                <div className="org-input-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="your_username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                    disabled={loading} 
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="org-input-group">
                  <label>Email Address</label>
                  <div className="org-input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      placeholder="organizer@domain.co.ke" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      disabled={loading} 
                    />
                  </div>
                </div>
              )}

              <div className="org-input-group">
                <label>Password</label>
                <div className="org-input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    disabled={loading} 
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="org-input-group">
                  <label>Confirm Password</label>
                  <div className="org-input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required 
                      disabled={loading} 
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="org-auth-submit" disabled={loading}>
                {loading ? (
                  <span className="spinner-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Sign In' : 'Register Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OrganizerAuthPage;
