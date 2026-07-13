import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminLoginPage.css';

const AdminLoginPage: React.FC = () => {
  const { adminSignIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      await adminSignIn(email, password);
      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-glow admin-auth-glow--orange" />
      <div className="admin-auth-glow admin-auth-glow--cyan" />

      <motion.div
        className="admin-auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {success ? (
          <motion.div
            className="admin-auth-success"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <div className="admin-success-icon">
              <ShieldCheck size={48} className="cyan-neon" />
            </div>
            <h3>Access Granted</h3>
            <p>Authenticated successfully. Loading dashboard...</p>
          </motion.div>
        ) : (
          <div className="admin-auth-card">
            <div className="admin-auth-header">
              <div className="admin-brand-icon">
                <Sparkles size={26} className="orange-neon" />
              </div>
              <h2>Sunshine Tickets</h2>
              <span className="admin-portal-badge">ADMIN PORTAL</span>
              <p>Secure access to the administration dashboard</p>
            </div>

            {error && (
              <motion.div
                className="admin-error-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="admin-auth-form">
              <div className="admin-input-group">
                <label>Email Address</label>
                <div className="admin-input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="admin@sunshinetickets.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="admin-input-group">
                <label>Password</label>
                <div className="admin-input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" className="admin-auth-submit" disabled={loading}>
                {loading ? (
                  <span className="spinner-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="admin-auth-footer">
              <a href="/" className="admin-back-link">Back to Sunshine Tickets</a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
