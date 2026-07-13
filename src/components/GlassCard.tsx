import React from 'react';
import { motion } from 'framer-motion';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverGlow = true }) => {
  return (
    <motion.div 
      className={'glass-card ' + (hoverGlow ? 'hover-glow' : '') + ' ' + className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className='glass-content'>
        {children}
      </div>
      {hoverGlow && <div className='glass-shine' />}
    </motion.div>
  );
};

export default GlassCard;