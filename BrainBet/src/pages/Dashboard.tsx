/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, Swords, Trophy, Users, Zap, Calendar, ChevronRight, Share2, Award, Brain } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { useTelegram } from '../context/TelegramContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Button } from '../components/Button.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { StreakBadge } from '../components/StreakBadge.js';
import { DashboardSkeleton } from '../components/Skeletons.js';

export const Dashboard: React.FC = () => {
  const { profile, loadingProfile, setActiveTab, showToast } = useApp();
  const { user } = useTelegram();
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Quick action: jump straight to the Quiz Arena!
  const handleQuickStart = () => {
    setActiveTab('quiz');
  };

  // Simulated link copy for referral system
  const handleCopyInvite = () => {
    const inviteLink = `https://t.me/BrainBetBot/app?startapp=ref_${user?.id || '999'}`;
    navigator.clipboard.writeText(inviteLink);
    showToast('Taklif havolasi buferga nusxalandi!', 'success');
  };

  if (loadingProfile || !profile) {
    return <DashboardSkeleton />;
  }

  // Animation constants for staggered layout entrances
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 22 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full flex flex-col gap-6 pb-24"
    >
      {/* 1. Header Profile Widget */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar sphere with first-letter display */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#5B8CFF] to-[#8B5CF6] p-0.5 shadow-[0_0_20px_rgba(91,140,255,0.3)]">
              <div className="w-full h-full rounded-full bg-[#050816] flex items-center justify-center text-white text-lg font-bold">
                {profile.username?.charAt(0).toUpperCase() || 'B'}
              </div>
            </div>
            {/* Live pulsing online bubble */}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#22C55E] border-2 border-[#050816]" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-mono text-[#A1A1AA] tracking-wider">XUSH KELIBSIZ</span>
            <span className="text-base font-black tracking-tight text-white flex items-center gap-1">
              @{profile.username}
            </span>
          </div>
        </div>

        {/* Level and Streak indicators */}
        <StreakBadge streak={profile.streak} />
      </motion.div>

      {/* 2. Balance & XP Overview */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-6 flex flex-col gap-5 relative overflow-hidden">
          {/* Floating visual gradient blob inside */}
          <div className="absolute top-[-50%] right-[-10%] w-36 h-36 rounded-full bg-[#5B8CFF]/15 blur-2xl pointer-events-none" />

          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#A1A1AA] tracking-wider uppercase">UMUMIY BALANS</span>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                <span className="text-3xl font-black text-white tracking-tight leading-none">
                  {profile.balance.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-[#A1A1AA]/70 self-end mb-1">TANGA</span>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-mono text-[#A1A1AA] tracking-wider uppercase">KUNLIK LIMIT</span>
              <span className="text-sm font-semibold text-white mt-1.5 flex items-center gap-1 font-mono">
                {profile.answered_today} / {profile.daily_limit}
                <Zap className="w-3.5 h-3.5 text-[#5B8CFF] fill-[#5B8CFF]" />
              </span>
              <span className="text-[9px] text-[#A1A1AA]/60 font-mono mt-0.5">YANGILANISHGA: 12 SOAT</span>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-4">
            <ProgressBar xp={profile.xp} level={profile.level} />
          </div>
        </GlassCard>
      </motion.div>

      {/* 3. Primary QUICK ARENA launcher */}
      <motion.div variants={itemVariants}>
        <Button variant="primary" size="lg" className="w-full h-14" onClick={handleQuickStart}>
          <Brain className="w-5 h-5 fill-white/10" />
          KVIZNI BOSHLASH
          <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* 4. Gamified Feature Bento Grids (Upcoming lock indications & Referral triggers) */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3">
        <h4 className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase">JANG ARENALARI</h4>
        
        <div className="grid grid-cols-2 gap-3">
          {/* PvP Battles Lock Card */}
          <GlassCard 
            className="p-4 flex flex-col gap-3 group relative opacity-75 cursor-pointer"
            onClick={() => showToast('PvP Arena 2-bosqich yangilanishlarida ochiladi. Bizni kuzatishda davom eting!', 'info')}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                PvP Duel
                <span className="text-[8px] font-mono bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-widest scale-90">YOPILGAN</span>
              </span>
              <p className="text-[11px] text-[#A1A1AA] mt-1 leading-normal text-left">
                Haqiqiy o'yinchilar bilan real vaqtda kuch sinashing.
              </p>
            </div>
          </GlassCard>

          {/* Tournament Bracket Lock Card */}
          <GlassCard 
            className="p-4 flex flex-col gap-3 opacity-75 cursor-pointer"
            onClick={() => showToast('Chempionat turnirlari tez orada haftalik yangilanishlarda taqdim etiladi!', 'info')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                Chempionat
                <span className="text-[8px] font-mono bg-[#8B5CF6]/20 text-[#8B5CF6] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-widest scale-90">YOPILGAN</span>
              </span>
              <p className="text-[11px] text-[#A1A1AA] mt-1 leading-normal text-left">
                Katta mukofotlar jamg'armasiga ega turnirlarda ishtirok eting.
              </p>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* 5. Referrals and Achievements Bento Row */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3">
        {/* Referral System */}
        <GlassCard className="p-4 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setShowReferralModal(true)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white">Taklif etish dasturi</span>
              <span className="text-xs text-[#A1A1AA]">Har bir taklif uchun +500 tanga oling</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
        </GlassCard>

        {/* AI Question Forge Suite teaser */}
        <GlassCard className="p-4 flex items-center justify-between gap-4 border-[#8B5CF6]/20 bg-[#8B5CF6]/5 cursor-pointer" onClick={() => setActiveTab('ai-forge')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
              <Brain className="w-5 h-5 text-[#8B5CF6] animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Savol Generator
                <span className="text-[9px] bg-[#8B5CF6] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold scale-90">YANGI</span>
              </span>
              <span className="text-xs text-[#A1A1AA]">Gemini AI yordamida o'z xohishingizcha savollar yarating</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8B5CF6]" />
        </GlassCard>
      </motion.div>

      {/* 6. Referral Modal System */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050816]/75 backdrop-blur-sm" onClick={() => setShowReferralModal(false)} />
          <motion.div
            className="relative w-full max-w-sm bg-[#0a0e22] border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#22C55E]/15 flex items-center justify-center text-[#22C55E] mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Do'stlarni taklif qilish</h3>
              <p className="text-xs text-[#A1A1AA] mb-5 leading-normal px-2">
                BrainBet jamoangizni kengaytiring. Do'stlaringiz birinchi marta kvizda qatnashganda, ikkalangiz ham darhol <strong className="text-yellow-400">500 tanga</strong> olasiz.
              </p>

              <div className="w-full flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 mb-5 select-all">
                <span className="text-[10px] font-mono text-[#A1A1AA] truncate flex-1 block select-all text-left">
                  {`https://t.me/BrainBetBot/app?startapp=ref_${user?.id || '999'}`}
                </span>
                <button 
                  onClick={handleCopyInvite}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Nusxa
                </button>
              </div>

              <div className="flex gap-2 w-full">
                <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowReferralModal(false)}>
                  Orqaga
                </Button>
                <Button variant="primary" size="md" className="flex-1" onClick={handleCopyInvite}>
                  <Share2 className="w-4 h-4" /> Ulashish
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default Dashboard;
