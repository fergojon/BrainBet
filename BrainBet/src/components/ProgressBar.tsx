/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { getRequiredXpForLevel } from '../utils/xp.js';

interface ProgressBarProps {
  xp: number;
  level: number;
  className?: string;
}

/**
 * Premium Level and XP Progress Bar
 * Styled with soft neon indicators, percentage displays, and fluid spring animations.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ xp, level, className = '' }) => {
  const nextLevelXp = getRequiredXpForLevel(level);
  const percentage = Math.min(Math.max((xp / nextLevelXp) * 100, 0), 100);

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {/* Label Indicators */}
      <div className="flex justify-between items-end text-xs font-mono">
        <span className="text-[#A1A1AA] flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-[#5B8CFF] animate-pulse" />
          RANKING LEVEL <strong className="text-white text-sm font-semibold">{level}</strong>
        </span>
        <span className="text-right text-[#A1A1AA]">
          <strong className="text-white">{xp}</strong> / {nextLevelXp} XP
        </span>
      </div>

      {/* Progress Track Bar */}
      <div className="relative h-2.5 w-full bg-white/[0.04] border border-white/[0.05] rounded-full overflow-hidden">
        {/* Glow behind the active bar */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#5B8CFF]/10 to-[#8B5CF6]/10" />
        
        {/* Animated Fill element */}
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#5B8CFF] to-[#8B5CF6]"
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          style={{
            boxShadow: '0 0 10px 0px rgba(91, 140, 255, 0.45)'
          }}
        />
      </div>

      {/* Subtle Progression percentage detail */}
      <div className="flex justify-end">
        <span className="text-[10px] font-mono text-[#A1A1AA]/70">{Math.round(percentage)}% TO LEVEL UP</span>
      </div>
    </div>
  );
};
export default ProgressBar;
