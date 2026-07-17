/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { Button } from './Button.js';

interface RewardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  type?: 'correct' | 'levelup' | 'wrong';
  coins: number;
  xp: number;
  extraText?: string;
}

/**
 * Premium Congratulations / Splash Reward Modal Overlay
 * Features exploding stars, high-performance stagger animations, and floating gold coin assets.
 */
export const RewardPopup: React.FC<RewardPopupProps> = ({
  isOpen,
  onClose,
  title,
  type = 'correct',
  coins,
  xp,
  extraText = ''
}) => {
  // Disable body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isLevelUp = type === 'levelup';
  const isWrong = type === 'wrong';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            className="absolute inset-0 bg-[#050816]/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog Card Container */}
          <motion.div
            className={`
              relative w-full max-w-sm overflow-hidden rounded-3xl border p-6 text-center shadow-[0_20px_50px_rgba(91,140,255,0.3)]
              ${isWrong 
                ? 'bg-[#1a0e12]/90 border-red-500/20' 
                : isLevelUp 
                  ? 'bg-[#150e2a]/90 border-[#8B5CF6]/30'
                  : 'bg-[#0a122c]/90 border-[#5B8CFF]/20'
              }
            `}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {/* Ambient Lighting Accents */}
            <div className={`
              absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40
              ${isWrong ? 'bg-red-500' : isLevelUp ? 'bg-purple-500' : 'bg-blue-500'}
            `} />

            {/* Sparkles Ambient */}
            {!isWrong && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                  className="absolute top-10 left-10 text-yellow-400"
                  animate={{ y: [0, -10, 0], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <motion.div 
                  className="absolute bottom-16 right-10 text-yellow-400"
                  animate={{ y: [0, -15, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              </div>
            )}

            {/* Core Visual */}
            <div className="relative mb-6 mt-4 flex justify-center">
              {isWrong ? (
                <motion.div
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500"
                  initial={{ rotate: -15, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <span className="text-4xl font-extrabold font-mono">✕</span>
                </motion.div>
              ) : isLevelUp ? (
                <motion.div
                  className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <Trophy className="w-12 h-12" />
                  <motion.div
                    className="absolute inset-0 rounded-full border border-dashed border-[#8B5CF6]/40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#5B8CFF]/15 border border-[#5B8CFF]/30 text-yellow-400 shadow-[0_0_30px_rgba(91,140,255,0.2)]"
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <Coins className="w-12 h-12 fill-yellow-400" />
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-200" />
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* Title & Description */}
            <motion.h3
              className="text-2xl font-extrabold tracking-tight text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {title || (isWrong ? 'Incorrect Option' : isLevelUp ? 'Level Advanced!' : 'Correct Answer!')}
            </motion.h3>

            <motion.p
              className="text-sm text-[#A1A1AA] px-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {extraText || (isWrong ? 'Don\'t worry, every try is a step closer to mastery. Keep practice going!' : isLevelUp ? 'You have pushed boundary limits. Keep building your brain power!' : 'Great skills! You scored rewards successfully.')}
            </motion.p>

            {/* Rewards Tally Display */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
              <motion.div
                className="flex flex-col items-center border-r border-white/[0.05]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-[10px] font-mono text-[#A1A1AA] tracking-wider uppercase mb-1">COINS EARNED</span>
                <span className="text-xl font-black text-yellow-400 flex items-center gap-1">
                  +{coins} <Coins className="w-4 h-4 fill-yellow-400 inline" />
                </span>
              </motion.div>

              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-[10px] font-mono text-[#A1A1AA] tracking-wider uppercase mb-1">XP EARNED</span>
                <span className="text-xl font-black text-[#5B8CFF] flex items-center gap-1">
                  +{xp} <span className="text-xs">XP</span>
                </span>
              </motion.div>
            </div>

            {/* Close / Action button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant={isWrong ? 'danger' : isLevelUp ? 'accent' : 'primary'}
                size="full"
                onClick={onClose}
              >
                Continue Adventure <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default RewardPopup;
