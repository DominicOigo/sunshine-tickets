import React from 'react';
import { motion } from 'framer-motion';
import './NeonButton.css';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '' 
}) => {
  return (
    <motion.button
      className={'neon-button ' + variant + ' ' + className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <span className='button-text'>{children}</span>
      <div className='button-glow' />
    </motion.button>
  );
};

export default NeonButton;