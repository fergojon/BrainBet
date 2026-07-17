/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, Flame, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { useTelegram } from '../context/TelegramContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { LeaderboardSkeleton } from '../components/Skeletons.js';

export const Leaderboard: React.FC = () => {
  const { leaderboard, loadingLeaderboard, fetchLeaderboard, profile } = useApp();
  const { user } = useTelegram();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loadingLeaderboard && leaderboard.length === 0) {
    return <LeaderboardSkeleton />;
  }

  // Segment leaderboard into Top 3 podium players and general runners-up list
  const topThree = leaderboard.slice(0, 3);
  const runnersUp = leaderboard.slice(3);

  const podiumOrder = [
    topThree[1], // 2nd place (Left)
    topThree[0], // 1st place (Center)
    topThree[2], // 3rd place (Right)
  ].filter(Boolean);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full flex flex-col gap-6 pb-24"
    >
      {/* 1. Header description */}
      <div className="flex flex-col gap-1 text-center mt-2">
        <h3 className="text-xl font-black text-white tracking-tight">GLOBAL REYTING</h3>
        <p className="text-xs text-[#A1A1AA]">Darajalarni oshirish va eng yuqori o'rinlarni egallash uchun har kuni bellashing.</p>
      </div>

      {/* 2. Top 3 Podium Displays */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2">
          {podiumOrder.map((player) => {
            const isFirst = player.rank === 1;
            const isSecond = player.rank === 2;
            const isThird = player.rank === 3;

            return (
              <motion.div
                key={player.telegram_id}
                className="flex flex-col items-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 * player.rank }}
              >
                {/* Podium Avatar sphere with crown/medal accents */}
                <div className="relative mb-2">
                  <div className={`
                    rounded-full p-0.5 relative shadow-lg
                    ${isFirst 
                      ? 'w-16 h-16 bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-300 ring-4 ring-yellow-400/20' 
                      : isSecond
                        ? 'w-14 h-14 bg-gradient-to-tr from-gray-300 via-zinc-400 to-gray-200'
                        : 'w-14 h-14 bg-gradient-to-tr from-amber-600 via-orange-700 to-amber-600'
                    }
                  `}>
                    <div className="w-full h-full rounded-full bg-[#0a0e22] flex items-center justify-center text-white font-extrabold text-sm uppercase">
                      {player.username?.charAt(0) || 'U'}
                    </div>
                  </div>

                  {/* Medal badges overlapping the avatars */}
                  <span className={`
                    absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border shadow-md
                    ${isFirst ? 'bg-yellow-400 border-yellow-300 text-yellow-950' : ''}
                    ${isSecond ? 'bg-zinc-300 border-zinc-200 text-zinc-950' : ''}
                    ${isThird ? 'bg-orange-600 border-orange-500 text-orange-50' : ''}
                  `}>
                    {player.rank}
                  </span>
                </div>

                {/* Info labels */}
                <span className="text-xs font-bold text-white truncate max-w-[85px] block text-center">
                  @{player.username}
                </span>
                
                <span className="text-[10px] font-mono text-[#A1A1AA] flex items-center gap-0.5 mt-0.5">
                  LVL {player.level}
                </span>

                {/* Score balance */}
                <span className="text-[10px] font-mono font-bold text-yellow-400 flex items-center gap-0.5 mt-1">
                  {player.balance.toLocaleString()} <span className="text-[8px] opacity-75">C</span>
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 3. Runners-Up Rankings List */}
      <GlassCard className="p-4 flex flex-col gap-2.5 border-white/[0.05]">
        <div className="flex justify-between items-center text-[10px] font-mono text-[#A1A1AA]/60 px-2 uppercase tracking-wider mb-1">
          <span>O'RIN VA ISHTIROKCHI</span>
          <span>TANGALAR / DARAJA</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {runnersUp.length === 0 ? (
            <div className="text-center py-6 text-[#A1A1AA]/50 text-xs font-mono">HOZIRCHA ISHTIROKCHILAR YO'Q</div>
          ) : (
            runnersUp.map(player => {
              const isActiveUser = String(player.telegram_id) === String(user?.id);

              return (
                <motion.div
                  key={player.telegram_id}
                  variants={itemVariants}
                  className={`
                    flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors
                    ${isActiveUser 
                      ? 'bg-[#5b8cff]/5 border-[#5b8cff]/20 shadow-[0_0_15px_rgba(91,140,255,0.06)]' 
                      : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank index */}
                    <span className="text-xs font-mono text-[#A1A1AA] w-5 text-center font-bold">
                      #{player.rank}
                    </span>

                    {/* Miniature Avatar */}
                    <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-extrabold text-white uppercase shrink-0">
                      {player.username?.charAt(0) || 'U'}
                    </div>

                    {/* Name */}
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold leading-none text-left ${isActiveUser ? 'text-[#5B8CFF]' : 'text-white'}`}>
                        @{player.username}
                      </span>
                      {player.streak > 0 && (
                        <span className="text-[9px] font-mono text-orange-400 flex items-center gap-0.5 mt-1 leading-none font-bold">
                          <Flame className="w-2.5 h-2.5 fill-orange-400" /> {player.streak} KUNLIK CHIDAMLILIK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Level and coin metrics */}
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                      LVL {player.level}
                    </span>
                    <span className="text-xs font-mono font-bold text-yellow-400 text-right min-w-[55px]">
                      {player.balance.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* 4. Active user absolute placement footer bar */}
      {profile && (
        <motion.div 
          className="fixed bottom-[84px] left-4 right-4 z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <GlassCard className="p-3.5 flex items-center justify-between border-[#5B8CFF]/20 bg-[#070c22]/90 shadow-[0_-5px_25px_rgba(5,8,22,0.8)]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-[#5B8CFF] font-mono bg-[#5B8CFF]/10 px-2.5 py-1 rounded-lg">
                REYTINGDA #{profile.leaderboard_position}
              </span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">Sizning o'rningiz</span>
                <span className="text-[10px] font-mono text-[#A1A1AA]/80">UMUMIY CHEMPIONAT PROGRESSI</span>
              </div>
            </div>
            
            <span className="text-xs font-mono font-bold text-yellow-400">
              {profile.balance.toLocaleString()} <span className="text-[9px]">C</span>
            </span>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
};
export default Leaderboard;
