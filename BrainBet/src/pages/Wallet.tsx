/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Coins, 
  ArrowRightLeft, 
  Check, 
  Clock, 
  XCircle, 
  User as UserIcon, 
  Zap, 
  ExternalLink, 
  History,
  TrendingUp,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { useTelegram } from '../context/TelegramContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Button } from '../components/Button.js';

interface WithdrawalRequest {
  id: string;
  card_number: string;
  card_holder: string;
  amount_coins: number;
  amount_som: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
}

export const Wallet: React.FC = () => {
  const { profile, fetchProfile, showToast } = useApp();
  const { initData } = useTelegram();
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [amountCoins, setAmountCoins] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [isPurchasingPremium, setIsPurchasingPremium] = useState(false);
  const [isClaimingPremiumBonus, setIsClaimingPremiumBonus] = useState(false);

  // Social Quests local completion states
  const [quests, setQuests] = useState([
    { id: 'q-tg', name: 'BrainBet Telegram kanaliga qo\'shiling', reward: 150, url: 'https://t.me/BrainBetChannel', completed: false },
    { id: 'q-tw', name: 'BrainBet-ni Twitter/X da kuzatib boring', reward: 100, url: 'https://twitter.com/BrainBet', completed: false },
    { id: 'q-yt', name: 'YouTube akademiyamizga a\'zo bo\'ling', reward: 200, url: 'https://youtube.com', completed: false }
  ]);

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    // Limit to standard 16 digit card layout
    if (formattedValue.length <= 19) {
      setCardNumber(formattedValue);
    }
  };

  // Fetch global settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/settings');
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setWithdrawalsEnabled(payload.data.withdrawals_enabled);
      }
    } catch (error) {
      console.error('fetchSettings error:', error);
    }
  }, []);

  // Fetch Withdrawal History
  const fetchWithdrawalHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/wallet/withdrawals', {
        headers: {
          'x-telegram-init-data': initData
        }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setWithdrawals(payload.data || []);
      }
    } catch (error) {
      console.error('fetchWithdrawalHistory error:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [initData]);

  useEffect(() => {
    fetchWithdrawalHistory();
    fetchSettings();
  }, [fetchWithdrawalHistory, fetchSettings]);

  // Purchase Premium status
  const handleBuyPremium = async () => {
    if (!window.confirm("Haqiqatdan ham 20,000 Coin evaziga BrainBet Premium a'zoligini xarid qilmoqchimisiz?")) {
      return;
    }

    try {
      setIsPurchasingPremium(true);
      const res = await fetch('/api/wallet/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        }
      });

      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast('Tabriklaymiz! Siz muvaffaqiyatli BrainBet Premium a\'zosi bo\'ldingiz!', 'success');
        fetchProfile();
      } else {
        showToast(payload.error || 'Xarid qilishda xatolik yuz berdi.', 'error');
      }
    } catch (error) {
      console.error('Premium purchase error:', error);
      showToast('Ulanishda xatolik yuz berdi.', 'error');
    } finally {
      setIsPurchasingPremium(false);
    }
  };

  // Claim Premium Daily Bonus
  const handleClaimPremiumBonus = async () => {
    try {
      setIsClaimingPremiumBonus(true);
      const res = await fetch('/api/wallet/premium-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast(payload.message, 'success');
        fetchProfile();
      } else {
        showToast(payload.error || 'Sovg\'ani olishda xatolik yuz berdi.', 'error');
      }
    } catch (error) {
      console.error('Premium claim error:', error);
      showToast('Tarmoq xatosi: Sovg\'a olinmadi.', 'error');
    } finally {
      setIsClaimingPremiumBonus(false);
    }
  };

  // Claim Social Quest rewards
  const handleClaimQuest = async (questId: string, reward: number) => {
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));
    showToast(`Mukofot yuborilmoqda... +${reward} Tanga!`, 'info');

    setTimeout(() => {
      if (profile) {
        profile.balance += reward;
        showToast(`Vazifa bajarildi! Balansingizga +${reward} tanga qo'shildi.`, 'success');
      }
    }, 500);
  };

  // Submit Card Withdrawal Request
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCard = cardNumber.replace(/\s+/g, '');
    
    if (cleanCard.length !== 16) {
      showToast('Karta raqami 16 xonali bo\'lishi shart.', 'error');
      return;
    }

    if (!cardHolder.trim()) {
      showToast('Karta egasining ismini kiriting.', 'error');
      return;
    }

    const coins = parseInt(amountCoins, 10);
    if (isNaN(coins) || coins < 1000) {
      showToast('Minimal yechib olish summasi 1,000 tanga.', 'error');
      return;
    }

    if (!profile || profile.balance < coins) {
      showToast('Balansingizda yetarli tanga mavjud emas.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({
          card_number: cardNumber,
          card_holder: cardHolder,
          amount_coins: coins
        })
      });

      const payload = await res.json();

      if (res.ok && payload.status === 'success') {
        showToast('Yechib olish so\'rovi yuborildi!', 'success');
        setCardNumber('');
        setCardHolder('');
        setAmountCoins('');
        // Sync local user profile state
        fetchProfile();
        // Refresh withdrawal list
        fetchWithdrawalHistory();
      } else {
        showToast(payload.error || 'So\'rovni yuborishda xatolik.', 'error');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      showToast('Tarmoq xatosi: So\'rov yuborilmadi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6 pb-24 text-left"
    >
      {/* 1. Futuristic Card Payment Dashboard */}
      <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-[#101535]/80 to-[#050816]/90 border-white/[0.06] shadow-[0_12px_40px_rgba(139,92,246,0.15)]">
        {/* Abstract glowing sphere */}
        <div className="absolute bottom-[-50%] left-[-20%] w-44 h-44 rounded-full bg-[#8B5CF6]/15 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#8B5CF6]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#A1A1AA]">UZBEKISTAN CARD WITHDRAWAL</span>
          </div>
          
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 tracking-widest uppercase">
            Humo / Uzcard
          </span>
        </div>

        <div className="flex flex-col gap-1 py-2">
          <span className="text-[10px] font-mono text-[#A1A1AA] uppercase">ALMASHINUV KURSI</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">1,000 Coin</span>
            <span className="text-sm font-mono text-[#8B5CF6] font-bold">=</span>
            <span className="text-2xl font-black text-[#8B5CF6]">1,000 So'm</span>
          </div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed mt-2">
            Ishlab topgan tangalaringizni HUMO yoki UZCARD bank kartalariga o'zbek so'mida (UZS) to'g'ridan-to'g'ri yechib oling.
          </p>
        </div>
      </GlassCard>

      {/* BrainBet Premium Card */}
      <h4 className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase flex items-center gap-1.5">
        <Crown className="w-4 h-4 text-yellow-400" /> BRAINBET PREMIUM
      </h4>
      {profile?.is_premium ? (
        <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-[#1e1530]/90 to-[#0c081e]/95 border-yellow-500/[0.2] shadow-[0_12px_40px_rgba(234,179,8,0.08)]">
          <div className="absolute top-[-30%] right-[-10%] w-32 h-32 rounded-full bg-yellow-500/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] shrink-0">
                <Crown className="w-6 h-6 fill-yellow-400" />
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-sm font-black text-white tracking-wide">SIZ PREMIUM A'ZOSIZ! 👑</h4>
                <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                  Premium imtiyozlari faollashtirilgan. Turnirlarga bepul kirish, kosh-oyinda 20% bonus va har kuni bepul premium sovg'alardan bahramand bo'ling!
                </p>
              </div>
            </div>

            {/* Premium Daily Claim Section */}
            <div className="border-t border-white/[0.04] pt-3.5 mt-1 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 fill-yellow-400" /> Premium Kundalik Sovg'a
                </span>
                <span className="text-[11px] text-[#A1A1AA] mt-0.5">Har kuni bepul +1,000 Coin!</span>
              </div>
              <Button
                type="button"
                variant="accent"
                size="sm"
                className="h-8 text-[10px] font-bold font-mono px-4 cursor-pointer"
                disabled={isClaimingPremiumBonus}
                onClick={handleClaimPremiumBonus}
              >
                {isClaimingPremiumBonus ? "YUKLANMOQDA..." : "SOVG'ANI OLISH"}
              </Button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-[#101535]/80 to-[#050816]/90 border-white/[0.06] shadow-[0_12px_40px_rgba(139,92,246,0.1)]">
          <div className="absolute top-[-35%] right-[-10%] w-36 h-36 rounded-full bg-[#8B5CF6]/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-mono font-bold tracking-wider text-[#A1A1AA] uppercase">PREMIUM IMTIYOZLARI</h4>
                <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                  BrainBet Premium a'zoligi orqali o'yinlarda 20,000 Coin evaziga doimiy premium maqomiga ega bo'lasiz va barcha qiyin savollardan to'liq mukofotlarni olasiz.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1">
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase">PREMIUM NARXI</span>
                <span className="text-sm font-black text-yellow-400 font-mono mt-0.5">20,000 COIN</span>
              </div>
              <Button
                type="button"
                variant="accent"
                size="sm"
                className="h-9 px-4 text-xs font-bold"
                disabled={isPurchasingPremium || (profile ? profile.balance < 20000 : true)}
                onClick={handleBuyPremium}
              >
                {isPurchasingPremium ? "Xarid qilinmoqda..." : "XARID QILISH"}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 2. Coin Convert/Withdraw Form */}
      <div className="flex items-center justify-between mt-2">
        <h4 className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase">MABLAG'NI YECHIB OLISH</h4>
        {!withdrawalsEnabled && (
          <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 uppercase tracking-widest animate-pulse">
            Vaqtinchalik yopiq
          </span>
        )}
      </div>

      {!withdrawalsEnabled ? (
        <GlassCard className="p-5 border-red-500/20 bg-red-500/[0.03] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-white uppercase font-mono">Yechib olish yopilgan</span>
            <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
              Mablag'larni yechish hozirda admin tomonidan vaqtinchalik yopib qo'yilgan. Yechish imkoniyati har 3 oyda bir marta ochiladi va admin tomonidan e'lon qilinadi.
            </p>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-5 border-white/[0.05]">
          <form onSubmit={handleSubmitWithdrawal} className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#A1A1AA]">YECHIB OLISH UCHUN MAVJUD BALANS</span>
                <span className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  {profile ? profile.balance.toLocaleString() : '0'} <span className="text-xs text-[#A1A1AA]/70 font-mono font-medium">TANGA</span>
                </span>
              </div>
              
              <div className="text-right flex flex-col">
                <span className="text-[10px] font-mono text-[#A1A1AA]">QIYMATI</span>
                <span className="text-xl font-mono font-black text-[#8B5CF6] mt-1">
                  {profile ? profile.balance.toLocaleString() : '0'} SO'M
                </span>
              </div>
            </div>

            {/* Card Number Input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-mono text-[#A1A1AA] uppercase">Karta raqami (8600... yoki 9860...)</label>
              <div className="relative flex items-center">
                <CreditCard className="absolute left-3 w-4 h-4 text-[#A1A1AA]/50" />
                <input
                  type="text"
                  placeholder="8600 0000 0000 0000"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono placeholder-[#A1A1AA]/30 focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                />
              </div>
            </div>

            {/* Card Holder Input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-mono text-[#A1A1AA] uppercase">Karta egasining ismi sharifi</label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3 w-4 h-4 text-[#A1A1AA]/50" />
                <input
                  type="text"
                  placeholder="F.I.SH."
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono placeholder-[#A1A1AA]/30 focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                />
              </div>
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-mono text-[#A1A1AA] uppercase">Yechiladigan tangalar miqdori (Min. 1,000 Tanga)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  placeholder="Min. 1,000 Tanga"
                  value={amountCoins}
                  onChange={(e) => setAmountCoins(e.target.value)}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-[#A1A1AA]/30 focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                />
                <button 
                  type="button"
                  onClick={() => profile && setAmountCoins(String(profile.balance))}
                  className="absolute right-3 px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-[10px] font-mono font-bold cursor-pointer"
                >
                  MAKS
                </button>
              </div>
              {amountCoins && !isNaN(parseInt(amountCoins)) && (
                <span className="text-[10px] font-mono text-[#8B5CF6] mt-1 block">
                  Siz olasiz: {parseInt(amountCoins).toLocaleString()} So'm
                </span>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="accent"
              size="md"
              className="w-full mt-2 h-12"
              disabled={isSubmitting || !cardNumber || !cardHolder || !amountCoins}
            >
              <ArrowRightLeft className="w-4 h-4" />
              {isSubmitting ? 'So\'rov yuborilmoqda...' : 'YECHIB OLISH SO\'ROVINI YUBORISH'}
            </Button>
          </form>
        </GlassCard>
      )}

      {/* 3. Withdrawal Requests History */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#8B5CF6]" /> MABLAG' YECHISH TARIXI
        </h4>
        <span className="text-[9px] font-mono text-[#A1A1AA]/70 uppercase">
          {withdrawals.length} ta tranzaksiya
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {loadingHistory ? (
          <div className="py-6 text-center text-xs font-mono text-[#A1A1AA]/50">
            Tranzaksiyalar yuklanmoqda...
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-xs font-mono text-[#A1A1AA]/40">
            Hozircha hech qanday yechib olish so'rovlari mavjud emas.
          </div>
        ) : (
          withdrawals.map((w) => (
            <GlassCard key={w.id} className="p-4 flex items-center justify-between gap-4 border-white/[0.04] bg-white/[0.01]">
              <div className="flex flex-col gap-1 text-left min-w-0">
                <span className="text-xs font-bold text-white font-mono block truncate">
                  {w.card_number}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#A1A1AA]">
                    {w.card_holder}
                  </span>
                  <span className="text-[10px] text-[#A1A1AA]/40">•</span>
                  <span className="text-[9px] font-mono text-[#A1A1AA]/50">
                    {new Date(w.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-black text-white font-mono">
                  {w.amount_som.toLocaleString()} So'm
                </span>
                <div className="mt-1">
                  {w.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-mono flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3" /> KUTILMOQDA
                    </span>
                  )}
                  {w.status === 'approved' && (
                    <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-mono flex items-center gap-1 font-bold">
                      <Check className="w-3 h-3" /> TO'LANDI
                    </span>
                  )}
                  {w.status === 'rejected' && (
                    <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-mono flex items-center gap-1 font-bold">
                      <XCircle className="w-3 h-3" /> RAD ETILDI
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* 4. Community Social Quests */}
      <h4 className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase">HAMJAMIYAT VAZIFALARI</h4>
      <div className="flex flex-col gap-2.5">
        {quests.map(q => (
          <GlassCard key={q.id} className="p-4 flex items-center justify-between gap-4 border-white/[0.04] bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#5B8CFF]">
                <Zap className="w-4 h-4 fill-[#5B8CFF]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">{q.name}</span>
                <span className="text-[10px] font-mono font-bold text-yellow-400 mt-1 flex items-center gap-1">
                  +{q.reward} Tanga
                </span>
              </div>
            </div>

            {q.completed ? (
              <span className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5" /> BAJARILDI
              </span>
            ) : (
              <a
                href={q.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClaimQuest(q.id, q.reward)}
                className="px-3 py-1.5 rounded-xl bg-[#5B8CFF]/15 border border-[#5B8CFF]/30 text-white text-[11px] font-semibold hover:bg-[#5B8CFF]/25 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                O'tish <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
};
export default Wallet;
