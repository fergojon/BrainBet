/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  hoverGlow?: boolean;
}

/**
 * Premium Glassmorphism Card
 * Styled with back-blur filters, transparent double borders, and gentle ambient shadows.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  id,
  hoverGlow = false
}) => {
  const cardStyle = `
    relative overflow-hidden rounded-2xl 
    bg-white/[0.03] backdrop-blur-xl 
    border border-white/[0.07] 
    shadow-[0_8px_32px_0_rgba(5,8,22,0.6)]
    transition-all duration-300
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  // Dynamic spring layouts
  if (onClick) {
    return (
      <motion.div
        id={id}
        className={cardStyle}
        onClick={onClick}
        whileHover={{
          scale: 1.015,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          boxShadow: hoverGlow ? '0 12px 40px -10px rgba(91, 140, 255, 0.25)' : '0 12px 40px -10px rgba(0,0,0,0.8)'
        }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {/* Transparent ambient glow backdrops */}
        <div className="absolute -inset-y-12 -inset-x-12 bg-[radial-gradient(circle_at_30%_20%,rgba(91,140,255,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }

  return (
    <div id={id} className={cardStyle}>
      <div className="absolute -inset-y-12 -inset-x-12 bg-[radial-gradient(circle_at_30%_20%,rgba(91,140,255,0.04),transparent_60%)] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
export default GlassCard;
