import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
}

export const Card = ({ children, className = '', gradient = false }: CardProps) => {
  const baseStyles = 'rounded-xl p-6 backdrop-blur-sm';
  const backgroundStyles = gradient
    ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20'
    : 'bg-gray-800/50 border border-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseStyles} ${backgroundStyles} ${className}`}
    >
      {children}
    </motion.div>
  );
};
