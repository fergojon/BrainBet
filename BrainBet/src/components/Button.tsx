/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
}

/**
 * Premium Clickable Button with spring tactile feedback and active-glow effects.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles = 'relative overflow-hidden font-medium rounded-xl flex items-center justify-center transition-all focus:outline-none select-none';
  
  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
    full: 'w-full py-3.5 text-base gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#5B8CFF] to-[#8B5CF6] text-white font-semibold shadow-[0_4px_16px_0_rgba(91,140,255,0.35)]',
    secondary: 'bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.08]',
    accent: 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-semibold shadow-[0_4px_16px_0_rgba(139,92,246,0.35)]',
    danger: 'bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 font-semibold',
    success: 'bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-400 font-semibold',
    glass: 'bg-white/[0.03] text-[#A1A1AA] border border-white/[0.05] hover:text-white'
  };

  const disabledStyles = 'opacity-40 cursor-not-allowed shadow-none hover:brightness-100';

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${sizeStyles[size]} 
        ${variantStyles[variant]} 
        ${disabled ? disabledStyles : ''} 
        ${className}
      `}
      {...(props as any)}
    >
      {/* Dynamic reflective light shimmer effect */}
      {!disabled && variant !== 'glass' && variant !== 'secondary' && (
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
};
export default Button;
