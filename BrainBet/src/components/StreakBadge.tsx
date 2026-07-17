/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

/**
 * Animated Flame Streak Badge
 * Adapts to streak longevity with glowing orange/magenta highlights and breathing animations.
 */
export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, className = '' }) => {
  const isStreakActive = streak > 0;

  return (
    <motion.div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border
        ${isStreakActive 
          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_0_rgba(249,115,22,0.15)]' 
          : 'bg-white/[0.03] border-white/[0.05] text-[#A1A1AA]'
        }
        ${className}
      `}
      animate={isStreakActive ? {
        scale: [1, 1.04, 1],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      } : {}}
    >
      <Flame 
        className={`w-4 h-4 ${isStreakActive ? 'fill-orange-400 animate-pulse' : 'text-[#A1A1AA]'}`} 
      />
      
      <span className="text-xs font-mono font-semibold">
        {isStreakActive ? `${streak} DAY STREAK` : 'NO STREAK'}
      </span>
    </motion.div>
  );
};
export default StreakBadge;
