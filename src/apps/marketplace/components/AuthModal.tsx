import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, AlertCircle, ShieldCheck, Sparkles, Phone } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { request } from '../../../lib/api';
import './AuthModal.css';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authMode, closeAuthModal, setAuthMode, signIn, signUp, resetPassword, defaultRole } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [role, setRole] = useState<'customer' | 'organizer'>('customer');
  
  useEffect(() => {
    if (isAuthModalOpen) {
      setRole(defaultRole);
    }
  }, [isAuthModalOpen, defaultRole]);
  
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    request('/settings/registration-open')
      .then(d => setRegistrationOpen(d.open))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validations
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
        if (!registrationOpen) {
          setError('Registration is currently closed. Please contact support for assistance.');
          setLoading(false);
          return;
        }
        loggedInUser = await signUp(username, email, password, name, role, undefined, phone || undefined);
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Delay closing to show the success screen
      setTimeout(() => {
        setSuccess(false);
        if (authMode === 'signup' && role === 'organizer') {
          setAuthMode('signin');
          setUsername('');
          setEmail('');
          setName('');
          setPhone('');
          setPassword('');
          setConfirmPassword('');
          setRole('customer');
          setError('Your organizer account has been registered and is pending admin approval. You can sign in once verified.');
        } else {
          setUsername('');
          setEmail('');
          setName('');
          setPhone('');
          setPassword('');
          setConfirmPassword('');
          setRole('customer');
          closeAuthModal();
        }
      }, 2000);

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  const toggleMode = () => {
    setError('');
    setForgotMode(false);
    setResetSent(false);
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setLoading(false);
      setResetSent(true);
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="auth-overlay-fixed">
          {/* Backdrop Blur Overlay */}
          <motion.div 
            className="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />

          {/* Modal Container */}
          <motion.div 
            className="auth-modal-container"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          >
            {/* Background Glow Accents */}
            <div className="auth-glow auth-glow--orange" />
            <div className="auth-glow auth-glow--cyan" />

            {/* Close Button */}
            <button 
              className="auth-close-btn" 
              onClick={closeAuthModal}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {success ? (
              /* Success Screen */
              <motion.div 
                className="auth-success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="success-icon-wrapper">
                  <ShieldCheck size={48} className="cyan-neon" />
                </div>
                <h3 className="success-title">
                  {authMode === 'signin' ? 'Welcome Back!' : 'Account Created'}
                </h3>
                <p className="success-subtitle">
                  {authMode === 'signin' 
                    ? 'Successfully signed in. Redirecting...' 
                    : 'Your account is ready. Redirecting...'}
                </p>
                <div className="success-glow-line" />
              </motion.div>
            ) : forgotMode ? (
              /* Forgot Password Screen */
              <div className="auth-form-wrapper">
                <button className="auth-back-link" onClick={() => { setForgotMode(false); setResetSent(false); setError(''); }}>
                  ← Back to Sign In
                </button>
                {resetSent ? (
                  <motion.div className="auth-success-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="success-icon-wrapper">
                      <Mail size={48} className="cyan-neon" />
                    </div>
                    <h3 className="success-title">Check Your Email</h3>
                    <p className="success-subtitle">A reset link has been sent to <strong>{email}</strong>.</p>
                    <div className="success-glow-line" />
                    <button className="auth-toggle-link auth-toggle-link--mt" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                      Back to Sign In
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="auth-header">
                      <h2 className="auth-header__title">Reset Password</h2>
                      <p className="auth-header__subtitle">Enter your email and we'll send you a reset link.</p>
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div className="auth-error-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <AlertCircle size={16} /><span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <form onSubmit={handleReset} className="auth-form-fields">
                      <div className="auth-input-group">
                        <label>Email Address</label>
                        <div className="auth-input-wrapper">
                          <Mail size={18} className="input-icon" />
                          <input type="email" placeholder="yourname@domain.co.ke" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                        </div>
                      </div>
                      <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading
                          ? <span className="spinner-dots"><span className="dot"/><span className="dot"/><span className="dot"/></span>
                          : <><span>Send Reset Link</span><ArrowRight size={18} /></>}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              /* Form Screen */
              <div className="auth-form-wrapper">
                <div className="auth-header">
                  <div className="auth-header__icon">
                    <Sparkles size={24} className="orange-neon" />
                  </div>
                  <h2 className="auth-header__title">
                    {authMode === 'signin' ? 'Sign In to Sunshine' : 'Create Account'}
                  </h2>
                  <p className="auth-header__subtitle">
                    {authMode === 'signin' 
                      ? 'Access your tickets, exclusive events, and local offers' 
                      : "Join Kenya\u2019s premium event ticket marketplace"}
                  </p>
                </div>

                <div className="auth-tabs">
                    <button 
                      type="button"
                      className={`auth-tab ${authMode === 'signin' ? 'active' : ''}`}
                      onClick={() => { setError(''); setAuthMode('signin'); }}
                    >
                      Sign In
                      {authMode === 'signin' && (
                        <motion.div className="active-tab-line" layoutId="activeTabLine" />
                      )}
                    </button>
                    <button 
                      type="button"
                      className={`auth-tab ${authMode === 'signup' ? 'active' : ''} ${!registrationOpen ? 'disabled' : ''}`}
                      onClick={() => { if (!registrationOpen) return; setError(''); setAuthMode('signup'); }}
                      title={!registrationOpen ? 'Registration is currently closed' : ''}
                    >
                      Register
                      {authMode === 'signup' && (
                        <motion.div className="active-tab-line" layoutId="activeTabLine" />
                      )}
                    </button>
                  </div>
                {!registrationOpen && authMode === 'signup' && (
                  <div className="auth-error-banner auth-error-banner--warning">
                    <AlertCircle size={16} />
                    <span>Registration is currently closed. Please contact support for assistance.</span>
                  </div>
                )}

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      className="auth-error-banner"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="auth-form-fields">
                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth-input-group">
                      <label>Register As</label>
                      <div className="auth-role-group">
                        <label className={`auth-role-option ${role === 'customer' ? 'active' : ''}`}>
                          <input 
                            type="radio" 
                            name="auth-role" 
                            value="customer" 
                            checked={role === 'customer'} 
                            onChange={() => setRole('customer')}
                          />
                          <span>Ticket Buyer</span>
                        </label>
                        <label className={`auth-role-option ${role === 'organizer' ? 'active' : ''}`}>
                          <input 
                            type="radio" 
                            name="auth-role" 
                            value="organizer" 
                            checked={role === 'organizer'} 
                            onChange={() => setRole('organizer')}
                          />
                          <span>Event Organizer</span>
                        </label>
                      </div>
                    </div>
                  )}
                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth-input-group">
                      <label htmlFor="auth-name">Full Name</label>
                      <div className="auth-input-wrapper">
                        <User size={18} className="input-icon" />
                        <input 
                          id="auth-name"
                          type="text" 
                          placeholder="e.g. Dominic Kiprop"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  <div className="auth-input-group">
                    <label htmlFor="auth-username">Username</label>
                    <div className="auth-input-wrapper">
                      <User size={18} className="input-icon" />
                      <input 
                        id="auth-username"
                        type="text" 
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth-input-group">
                      <label htmlFor="auth-email">Email Address</label>
                      <div className="auth-input-wrapper">
                        <Mail size={18} className="input-icon" />
                        <input 
                          id="auth-email"
                          type="email" 
                          placeholder="yourname@domain.co.ke"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth-input-group">
                      <label htmlFor="auth-phone">Phone Number (optional)</label>
                      <div className="auth-input-wrapper">
                        <Phone size={18} className="input-icon" />
                        <input 
                          id="auth-phone"
                          type="tel" 
                          placeholder="07XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  <div className="auth-input-group">
                    <label htmlFor="auth-password">Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input 
                        id="auth-password"
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth-input-group">
                      <label htmlFor="auth-confirm">Confirm Password</label>
                      <div className="auth-input-wrapper">
                        <Lock size={18} className="input-icon" />
                        <input 
                          id="auth-confirm"
                          type="password" 
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {authMode === 'signin' && (
                    <div className="auth-forgot-link">
                      <button type="button" className="text-btn" onClick={() => { setError(''); setForgotMode(true); }}>Forgot Password?</button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="auth-submit-btn"
                    disabled={loading || (authMode === 'signup' && !registrationOpen)}
                  >
                    {loading ? (
                      <span className="spinner-dots">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </span>
                    ) : (
                      <>
                        <span>{authMode === 'signin' ? 'Sign In' : !registrationOpen ? 'Registration Closed' : 'Create Account'}</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-footer-switch">
                    <span>
                      {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                    </span>
                    <button type="button" className="auth-toggle-link" onClick={toggleMode}>
                      {authMode === 'signin' ? 'Create an account' : 'Sign in here'}
                    </button>
                  </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
