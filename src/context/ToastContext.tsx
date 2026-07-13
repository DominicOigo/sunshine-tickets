import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = { success: <CheckCircle size={16} />, error: <XCircle size={16} />, info: <AlertCircle size={16} /> };
  const colors = { success: '#22C55E', error: '#EF4444', info: '#00F2FE' };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.9rem 1.25rem',
                background: 'rgba(14,15,20,0.97)',
                border: `1px solid ${colors[t.type]}30`,
                borderLeft: `3px solid ${colors[t.type]}`,
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                maxWidth: '340px',
                minWidth: '260px',
              }}
            >
              <span style={{ color: colors[t.type], flexShrink: 0 }}>{icons[t.type]}</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, lineHeight: 0 }}>
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
