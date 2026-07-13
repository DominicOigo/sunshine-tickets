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
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (isAuthModalOpen) {
      setRole(defaultRole);
    }
  }, [isAuthModalOpen, defaultRole]);

  useEffect(() => {
    request('/settings/registration-open')
      .then(d => setRegistrationOpen(d.open))
      .catch(() => {});
  }, []);

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
        <div className="auth__overlay">
          <motion.div
            className="auth__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />

          <motion.div
            className="auth__card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
          >
            <div className="auth__glow auth__glow--warm" />
            <div className="auth__glow auth__glow--cool" />

            <button className="auth__close" onClick={closeAuthModal} aria-label="Close">
              <X size={18} />
            </button>

            {success ? (
              <motion.div
                className="auth__success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="auth__success-icon">
                  <ShieldCheck size={36} />
                </div>
                <h3 className="auth__success-heading">
                  {authMode === 'signin' ? 'Welcome Back!' : 'Account Created'}
                </h3>
                <p className="auth__success-text">
                  {authMode === 'signin'
                    ? 'Successfully signed in. Redirecting...'
                    : 'Your account is ready. Redirecting...'}
                </p>
                <div className="auth__success-bar" />
              </motion.div>
            ) : forgotMode ? (
              <div>
                <button className="auth__back-link" onClick={() => { setForgotMode(false); setResetSent(false); setError(''); }}>
                  &larr; Back to Sign In
                </button>

                {resetSent ? (
                  <motion.div className="auth__success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="auth__success-icon">
                      <Mail size={36} />
                    </div>
                    <h3 className="auth__success-heading">Check Your Email</h3>
                    <p className="auth__success-text">
                      A reset link has been sent to <strong>{email}</strong>.
                    </p>
                    <div className="auth__success-bar" />
                    <button className="auth__action-link" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                      Back to Sign In
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="auth__heading">
                      <h2 className="auth__title">Reset Password</h2>
                      <p className="auth__subtitle">Enter your email and we'll send you a reset link.</p>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div className="auth__alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                          <AlertCircle size={14} /><span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleReset} className="auth__form">
                      <div className="auth__field">
                        <label className="auth__field-label">Email Address</label>
                        <div className="auth__input-box">
                          <input type="email" placeholder="yourname@domain.co.ke" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                          <Mail size={16} className="auth__input-icon" />
                        </div>
                      </div>
                      <button type="submit" className="auth__submit-btn" disabled={loading}>
                        {loading
                          ? <span className="auth__spinner"><span className="auth__spinner-dot"/><span className="auth__spinner-dot"/><span className="auth__spinner-dot"/></span>
                          : <><span>Send Reset Link</span><ArrowRight size={16} /></>}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="auth__heading">
                  <div className="auth__heading-icon">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="auth__title">
                    {authMode === 'signin' ? 'Sign In to Sunshine' : 'Create Account'}
                  </h2>
                  <p className="auth__subtitle">
                    {authMode === 'signin'
                      ? 'Access your tickets, exclusive events, and local offers'
                      : "Join Kenya\u2019s premium event ticket marketplace"}
                  </p>
                </div>

                <div className="auth__tabs">
                  <button
                    type="button"
                    className={`auth__tab ${authMode === 'signin' ? 'auth__tab--active' : ''}`}
                    onClick={() => { setError(''); setAuthMode('signin'); }}
                  >
                    Sign In
                    {authMode === 'signin' && (
                      <motion.div className="auth__tab-indicator" layoutId="activeTabLine" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={`auth__tab ${authMode === 'signup' ? 'auth__tab--active' : ''} ${!registrationOpen ? 'auth__tab--disabled' : ''}`}
                    onClick={() => { if (!registrationOpen) return; setError(''); setAuthMode('signup'); }}
                    title={!registrationOpen ? 'Registration is currently closed' : ''}
                  >
                    Register
                    {authMode === 'signup' && (
                      <motion.div className="auth__tab-indicator" layoutId="activeTabLine" />
                    )}
                  </button>
                </div>

                {!registrationOpen && authMode === 'signup' && (
                  <div className="auth__alert auth__alert--warning">
                    <AlertCircle size={14} />
                    <span>Registration is currently closed. Please contact support for assistance.</span>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="auth__alert"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="auth__form">
                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth__field">
                      <label className="auth__field-label">Register As</label>
                      <div className="auth__role-group">
                        <label className={`auth__role-card ${role === 'customer' ? 'auth__role-card--selected' : ''}`}>
                          <input
                            type="radio"
                            name="auth-role"
                            value="customer"
                            checked={role === 'customer'}
                            onChange={() => setRole('customer')}
                          />
                          <span>Ticket Buyer</span>
                        </label>
                        <label className={`auth__role-card ${role === 'organizer' ? 'auth__role-card--selected' : ''}`}>
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
                    <div className="auth__field">
                      <label className="auth__field-label" htmlFor="auth-name">Full Name</label>
                      <div className="auth__input-box">
                        <input
                          id="auth-name"
                          type="text"
                          placeholder="e.g. Dominic Kiprop"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <User size={16} className="auth__input-icon" />
                      </div>
                    </div>
                  )}

                  <div className="auth__field">
                    <label className="auth__field-label" htmlFor="auth-username">Username</label>
                    <div className="auth__input-box">
                      <input
                        id="auth-username"
                        type="text"
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <User size={16} className="auth__input-icon" />
                    </div>
                  </div>

                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth__field">
                      <label className="auth__field-label" htmlFor="auth-email">Email Address</label>
                      <div className="auth__input-box">
                        <input
                          id="auth-email"
                          type="email"
                          placeholder="yourname@domain.co.ke"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <Mail size={16} className="auth__input-icon" />
                      </div>
                    </div>
                  )}

                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth__field">
                      <label className="auth__field-label" htmlFor="auth-phone">Phone Number (optional)</label>
                      <div className="auth__input-box">
                        <input
                          id="auth-phone"
                          type="tel"
                          placeholder="07XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                        />
                        <Phone size={16} className="auth__input-icon" />
                      </div>
                    </div>
                  )}

                  <div className="auth__field">
                    <label className="auth__field-label" htmlFor="auth-password">Password</label>
                    <div className="auth__input-box">
                      <input
                        id="auth-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Lock size={16} className="auth__input-icon" />
                    </div>
                  </div>

                  {authMode === 'signup' && registrationOpen && (
                    <div className="auth__field">
                      <label className="auth__field-label" htmlFor="auth-confirm">Confirm Password</label>
                      <div className="auth__input-box">
                        <input
                          id="auth-confirm"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <Lock size={16} className="auth__input-icon" />
                      </div>
                    </div>
                  )}

                  {authMode === 'signin' && (
                    <div className="auth__forgot-link">
                      <button type="button" className="auth__forgot-btn" onClick={() => { setError(''); setForgotMode(true); }}>
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="auth__submit-btn"
                    disabled={loading || (authMode === 'signup' && !registrationOpen)}
                  >
                    {loading ? (
                      <span className="auth__spinner">
                        <span className="auth__spinner-dot" />
                        <span className="auth__spinner-dot" />
                        <span className="auth__spinner-dot" />
                      </span>
                    ) : (
                      <>
                        <span>{authMode === 'signin' ? 'Sign In' : !registrationOpen ? 'Registration Closed' : 'Create Account'}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth__footer">
                  <span>{authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}</span>
                  <button type="button" className="auth__switch-btn" onClick={toggleMode}>
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
