/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  CreditCard, 
  Users as UsersIcon, 
  HelpCircle, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Coins, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  Clock,
  Search,
  Crown
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { useTelegram } from '../context/TelegramContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Button } from '../components/Button.js';

interface AdminUser {
  telegram_id: string;
  username: string;
  balance: number;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
  is_premium?: boolean;
  is_banned?: boolean;
  ban_reason?: string;
}

interface AdminQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  reward: number;
}

interface AdminWithdrawal {
  id: string;
  user_id: string;
  username: string;
  card_number: string;
  card_holder: string;
  amount_coins: number;
  amount_som: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const AdminPanel: React.FC = () => {
  const { showToast } = useApp();
  const { initData } = useTelegram();

  const [activeSubTab, setActiveSubTab] = useState<'withdrawals' | 'questions' | 'users' | 'tournaments'>('withdrawals');
  
  // Data States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  
  // Tournament form State
  const [showAddTournamentForm, setShowAddTournamentForm] = useState(false);
  const [newTournament, setNewTournament] = useState({
    title: '',
    description: '',
    entry_fee: 1000,
    prize_pool: 20000,
    questions: [
      { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' as 'A' | 'B' | 'C' | 'D' }
    ]
  });
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State for Adding Question
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    category: '',
    reward: 10
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setWithdrawalsEnabled(payload.data.withdrawals_enabled);
      }
    } catch (e) {
      console.error('fetchSettings error:', e);
    }
  }, [initData]);

  // Toggle withdrawals
  const handleToggleWithdrawals = async () => {
    const nextState = !withdrawalsEnabled;
    const confirmMsg = nextState 
      ? "Haqiqatdan ham pul yechib olishni OCHIQ qilmoqchimisiz?" 
      : "Haqiqatdan ham pul yechib olishni YOPIQ (bloklangan) qilmoqchimisiz?";
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ withdrawals_enabled: nextState })
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setWithdrawalsEnabled(nextState);
        showToast(payload.message, 'success');
      } else {
        showToast(payload.error || 'Xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('So\'rov bajarilmadi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Ban User
  const handleBanUser = async (telegramId: string) => {
    const reason = window.prompt("Foydalanuvchini bloklash sababini kiriting:");
    if (reason === null) return;

    try {
      setActionLoadingId(telegramId);
      const res = await fetch(`/api/admin/users/${telegramId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ reason: reason || 'Cheat/Bot shubhasi tufayli' })
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast('Foydalanuvchi bloklandi.', 'success');
        fetchUsers();
      } else {
        showToast(payload.error || 'Xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('So\'rov bajarilmadi.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Unban User
  const handleUnbanUser = async (telegramId: string) => {
    if (!window.confirm("Foydalanuvchini blokdan chiqarmoqchimisiz?")) {
      return;
    }

    try {
      setActionLoadingId(telegramId);
      const res = await fetch(`/api/admin/users/${telegramId}/unban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast('Foydalanuvchi blokdan chiqarildi.', 'success');
        fetchUsers();
      } else {
        showToast(payload.error || 'Xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('So\'rov bajarilmadi.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setUsers(payload.data || []);
      }
    } catch (e) {
      console.error('fetchUsers error:', e);
    }
  }, [initData]);

  // Fetch all questions
  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/questions', {
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setQuestions(payload.data || []);
      }
    } catch (e) {
      console.error('fetchQuestions error:', e);
    }
  }, [initData]);

  // Fetch all withdrawals
  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setWithdrawals(payload.data || []);
      }
    } catch (e) {
      console.error('fetchWithdrawals error:', e);
    }
  }, [initData]);

  // Fetch all tournaments
  const fetchAdminTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tournaments', {
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setTournaments(payload.data || []);
      }
    } catch (e) {
      console.error('fetchAdminTournaments error:', e);
    }
  }, [initData]);

  // Load everything for the active tab
  const loadActiveData = useCallback(async () => {
    setLoading(true);
    await fetchSettings();
    if (activeSubTab === 'withdrawals') {
      await fetchWithdrawals();
    } else if (activeSubTab === 'questions') {
      await fetchQuestions();
    } else if (activeSubTab === 'users') {
      await fetchUsers();
    } else if (activeSubTab === 'tournaments') {
      await fetchAdminTournaments();
    }
    setLoading(false);
  }, [activeSubTab, fetchWithdrawals, fetchQuestions, fetchUsers, fetchAdminTournaments, fetchSettings]);

  useEffect(() => {
    loadActiveData();
  }, [loadActiveData]);

  // Process Withdrawal request (Approve/Reject)
  const handleProcessWithdrawal = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/withdrawals/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ status })
      });

      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast(payload.message, 'success');
        // Refresh local list
        fetchWithdrawals();
      } else {
        showToast(payload.error || 'Xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error('Process error:', e);
      showToast('So\'rov bajarilmadi.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Add Question Submit
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question || !newQuestion.option_a || !newQuestion.option_b || !newQuestion.option_c || !newQuestion.option_d || !newQuestion.category) {
      showToast('Barcha maydonlarni to\'ldiring.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify(newQuestion)
      });

      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast('Savol muvaffaqiyatli qo\'shildi!', 'success');
        setNewQuestion({
          question: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_option: 'A',
          difficulty: 'easy',
          category: '',
          reward: 10
        });
        setShowAddForm(false);
        fetchQuestions();
      } else {
        showToast(payload.error || 'Xatolik.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Kiritishda xatolik yuz berdi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Haqiqatdan ham ushbu savolni o\'chirib tashlamoqchimisiz?')) {
      return;
    }

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-telegram-init-data': initData }
      });

      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast('Savol o\'chirildi.', 'success');
        fetchQuestions();
      } else {
        showToast(payload.error || 'O\'chirishda xatolik.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('O\'chirib bo\'lmadi.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create Tournament
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTournament.title.trim() || !newTournament.description.trim()) {
      showToast('Sarlavha va tavsif to\'ldirilishi shart.', 'error');
      return;
    }

    if (newTournament.questions.some(q => !q.question.trim() || !q.option_a.trim() || !q.option_b.trim())) {
      showToast('Barcha savollar va kamida A va B variantlari to\'ldirilishi shart.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify(newTournament)
      });

      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast('Turnir muvaffaqiyatli yaratildi!', 'success');
        setShowAddTournamentForm(false);
        setNewTournament({
          title: '',
          description: '',
          entry_fee: 1000,
          prize_pool: 20000,
          questions: [
            { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
          ]
        });
        fetchAdminTournaments();
      } else {
        showToast(payload.error || 'Turnir yaratishda xatolik.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Server bilan bog\'lanishda xatolik.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Tournament status
  const handleToggleTournament = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/tournaments/${id}/toggle`, {
        method: 'POST',
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast(payload.message, 'success');
        fetchAdminTournaments();
      } else {
        showToast(payload.error || 'Xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('O\'zgartirish so\'rovi bajarilmadi.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Tournament
  const handleDeleteTournament = async (id: string) => {
    if (!window.confirm('Haqiqatdan ham ushbu turnirni o\'chirib yubormoqchimisiz?')) {
      return;
    }

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/tournaments/${id}`, {
        method: 'DELETE',
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        showToast('Turnir o\'chirildi.', 'success');
        fetchAdminTournaments();
      } else {
        showToast(payload.error || 'O\'chirishda xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('O\'chirish so\'rovi bajarilmadi.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter lists based on search
  const filteredWithdrawals = withdrawals.filter(w => 
    w.card_number.includes(searchQuery) || 
    w.card_holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.telegram_id.includes(searchQuery)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6 pb-24 text-left font-sans"
    >
      {/* Admin Header Core Card */}
      <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-[#1e1435]/80 to-[#050816]/90 border-red-500/[0.15] shadow-[0_12px_40px_rgba(239,68,68,0.1)]">
        <div className="absolute top-[-40%] right-[-10%] w-44 h-44 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wide uppercase font-mono">BOSHQAQILUVCHI ADMIN PANEL</h3>
            <p className="text-[11px] text-[#A1A1AA] mt-0.5 leading-relaxed">
              Yechib olish so'rovlarini to'lash, o'yin savollarini tahrirlash va foydalanuvchilar balanslarini kuzatish.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Sub Tabs Selection */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl">
        <button
          onClick={() => { setActiveSubTab('withdrawals'); setSearchQuery(''); }}
          className={`py-2 px-0.5 text-center font-mono font-bold text-[10px] rounded-lg transition-all cursor-pointer ${activeSubTab === 'withdrawals' ? 'bg-[#8B5CF6] text-white' : 'text-[#A1A1AA] hover:text-white'}`}
        >
          To'lovlar ({withdrawals.filter(w => w.status === 'pending').length})
        </button>
        <button
          onClick={() => { setActiveSubTab('questions'); setSearchQuery(''); }}
          className={`py-2 px-0.5 text-center font-mono font-bold text-[10px] rounded-lg transition-all cursor-pointer ${activeSubTab === 'questions' ? 'bg-[#8B5CF6] text-white' : 'text-[#A1A1AA] hover:text-white'}`}
        >
          Savollar ({questions.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('tournaments'); setSearchQuery(''); }}
          className={`py-2 px-0.5 text-center font-mono font-bold text-[10px] rounded-lg transition-all cursor-pointer ${activeSubTab === 'tournaments' ? 'bg-[#8B5CF6] text-white' : 'text-[#A1A1AA] hover:text-white'}`}
        >
          Turnirlar ({tournaments.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('users'); setSearchQuery(''); }}
          className={`py-2 px-0.5 text-center font-mono font-bold text-[10px] rounded-lg transition-all cursor-pointer ${activeSubTab === 'users' ? 'bg-[#8B5CF6] text-white' : 'text-[#A1A1AA] hover:text-white'}`}
        >
          Azolar ({users.length})
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-[#A1A1AA]/50" />
        <input
          type="text"
          placeholder={`${activeSubTab === 'withdrawals' ? 'Karta, Ism yoki Telegram username...' : activeSubTab === 'questions' ? 'Savol matni yoki kategoriya...' : 'Username yoki Telegram ID bo\'yicha qidirish...'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#A1A1AA]/40 focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
        />
      </div>

      {/* Primary Tab Layout Views */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#A1A1AA]/50">
            Ma'lumotlar yuklanmoqda...
          </div>
        ) : (
          <>
            {/* 1. WITHDRAWALS TAB VIEW */}
            {activeSubTab === 'withdrawals' && (
              <div className="flex flex-col gap-3">
                {/* Global Settings Panel */}
                <GlassCard className="p-4 bg-white/[0.01] border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${withdrawalsEnabled ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase font-mono">Pul Yechish Tizimi</h4>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                        Hozirda foydalanuvchilar uchun: <span className={withdrawalsEnabled ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{withdrawalsEnabled ? "OCHIQ" : "YOPIQ (BLOKLANGAN)"}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={withdrawalsEnabled ? "danger" : "accent"}
                    size="sm"
                    className="h-8 text-[10px] font-mono font-bold"
                    onClick={handleToggleWithdrawals}
                  >
                    {withdrawalsEnabled ? "YOPIQ QILISH" : "OCHIQ QILISH"}
                  </Button>
                </GlassCard>

                {filteredWithdrawals.length === 0 ? (
                  <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-xs font-mono text-[#A1A1AA]/40">
                    Siz qidirgan to'lov so'rovlari topilmadi.
                  </div>
                ) : (
                  filteredWithdrawals.map(w => (
                    <GlassCard key={w.id} className="p-4 flex flex-col gap-4 border-white/[0.04]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-black text-white font-mono">{w.card_number}</span>
                          <span className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">{w.card_holder}</span>
                          <span className="text-[10px] text-[#8B5CF6] font-bold mt-1">@{w.username}</span>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="text-sm font-black text-[#8B5CF6] font-mono">
                            {w.amount_som.toLocaleString()} So'm
                          </span>
                          <span className="text-[9px] text-[#A1A1AA]/50 font-mono mt-0.5">
                            {new Date(w.created_at).toLocaleDateString()} {new Date(w.created_at).toLocaleTimeString().slice(0, 5)}
                          </span>
                        </div>
                      </div>

                      {/* Status / Actions Footer inside Card */}
                      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1">
                        <span className="text-[9px] font-mono text-[#A1A1AA]/50 uppercase">HOLATI:</span>
                        
                        {w.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button 
                              variant="danger" 
                              size="sm" 
                              className="h-7 text-[10px] font-mono font-bold px-3 py-0 flex items-center gap-1 cursor-pointer"
                              disabled={actionLoadingId === w.id}
                              onClick={() => handleProcessWithdrawal(w.id, 'rejected')}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Rad etish
                            </Button>
                            <Button 
                              variant="accent" 
                              size="sm" 
                              className="h-7 text-[10px] font-mono font-bold px-3 py-0 flex items-center gap-1 cursor-pointer"
                              disabled={actionLoadingId === w.id}
                              onClick={() => handleProcessWithdrawal(w.id, 'approved')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlash
                            </Button>
                          </div>
                        ) : (
                          <div>
                            {w.status === 'approved' ? (
                              <span className="px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> TO'LANDI
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> RAD ETILDI
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            )}

            {/* 2. QUESTIONS TAB VIEW */}
            {activeSubTab === 'questions' && (
              <div className="flex flex-col gap-4">
                {/* Expandable Add Question Form */}
                <GlassCard className="p-4 border-[#8B5CF6]/20 bg-[#8B5CF6]/5">
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="w-full flex items-center justify-between font-mono font-bold text-xs text-white focus:outline-none cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-[#8B5CF6]" /> YANGI SAVOL QO'SHISH
                    </span>
                    {showAddForm ? <ChevronUp className="w-4 h-4 text-[#8B5CF6]" /> : <ChevronDown className="w-4 h-4 text-[#8B5CF6]" />}
                  </button>

                  <AnimatePresence>
                    {showAddForm && (
                      <motion.form 
                        onSubmit={handleAddQuestion}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: '16px' }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-3.5 overflow-hidden text-left"
                      >
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-[#A1A1AA]">SAVOL MATNI</label>
                          <textarea
                            placeholder="Savol qanday?"
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                            required
                            rows={2}
                            className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50 font-sans"
                          />
                        </div>

                        {/* Options Inputs */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">A VARIANТ</label>
                            <input
                              type="text"
                              placeholder="Variant A"
                              value={newQuestion.option_a}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, option_a: e.target.value }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">B VARIANТ</label>
                            <input
                              type="text"
                              placeholder="Variant B"
                              value={newQuestion.option_b}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, option_b: e.target.value }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">C VARIANТ</label>
                            <input
                              type="text"
                              placeholder="Variant C"
                              value={newQuestion.option_c}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, option_c: e.target.value }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">D VARIANТ</label>
                            <input
                              type="text"
                              placeholder="Variant D"
                              value={newQuestion.option_d}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, option_d: e.target.value }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>
                        </div>

                        {/* Correct Option Dropdown */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">TO'G'RI VARIANТ</label>
                            <select
                              value={newQuestion.correct_option}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, correct_option: e.target.value as any }))}
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50 cursor-pointer"
                            >
                              <option value="A">A variant</option>
                              <option value="B">B variant</option>
                              <option value="C">C variant</option>
                              <option value="D">D variant</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">QIYINLIGI</label>
                            <select
                              value={newQuestion.difficulty}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value as any }))}
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50 cursor-pointer"
                            >
                              <option value="easy">Oson</option>
                              <option value="medium">O'rtacha</option>
                              <option value="hard">Qiyin</option>
                            </select>
                          </div>
                        </div>

                        {/* Category and Reward */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">KATEGORIYA</label>
                            <input
                              type="text"
                              placeholder="masalan: Matematika"
                              value={newQuestion.category}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">MUKOFOT (TANGALARDA)</label>
                            <input
                              type="number"
                              value={newQuestion.reward}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, reward: parseInt(e.target.value, 10) || 10 }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>
                        </div>

                        <Button type="submit" variant="primary" size="md" className="w-full mt-2 h-10">
                          <Plus className="w-4 h-4" /> SAVOLNI SAQLASH
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </GlassCard>

                {/* Questions List */}
                <div className="flex flex-col gap-2.5">
                  {filteredQuestions.length === 0 ? (
                    <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-xs font-mono text-[#A1A1AA]/40">
                      Hech qanday savollar topilmadi.
                    </div>
                  ) : (
                    filteredQuestions.map(q => (
                      <GlassCard key={q.id} className="p-4 flex flex-col gap-2.5 border-white/[0.04] bg-white/[0.01]">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] font-mono font-bold text-[#8B5CF6] uppercase tracking-wider bg-[#8B5CF6]/10 px-2 py-0.5 rounded-md border border-[#8B5CF6]/20 self-start mb-1.5">
                              {q.category}
                            </span>
                            <h5 className="text-xs font-bold text-white leading-relaxed">{q.question}</h5>
                          </div>
                          
                          <button
                            disabled={actionLoadingId === q.id}
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="text-[#A1A1AA]/40 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 border-t border-white/[0.04] pt-2.5 mt-1 text-[11px] text-[#A1A1AA] text-left">
                          <div className="truncate"><span className="font-mono text-[9px] text-[#A1A1AA]/50">A:</span> {q.option_a}</div>
                          <div className="truncate"><span className="font-mono text-[9px] text-[#A1A1AA]/50">B:</span> {q.option_b}</div>
                          <div className="truncate"><span className="font-mono text-[9px] text-[#A1A1AA]/50">C:</span> {q.option_c}</div>
                          <div className="truncate"><span className="font-mono text-[9px] text-[#A1A1AA]/50">D:</span> {q.option_d}</div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono text-[#A1A1AA]/70 pt-1">
                          <span>TO'G'RI VARIANT: <span className="text-green-400 font-bold">{q.correct_option}</span></span>
                          <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-400" /> +{q.reward} Tanga</span>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. TOURNAMENTS TAB VIEW */}
            {activeSubTab === 'tournaments' && (
              <div className="flex flex-col gap-4">
                {/* Expandable Add Tournament Form */}
                <GlassCard className="p-4 border-[#8B5CF6]/20 bg-[#8B5CF6]/5 text-left">
                  <button 
                    type="button"
                    onClick={() => setShowAddTournamentForm(!showAddTournamentForm)}
                    className="w-full flex items-center justify-between font-mono font-bold text-xs text-white focus:outline-none cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-[#8B5CF6]" /> YANGI TURNIR YARATISH
                    </span>
                    {showAddTournamentForm ? <ChevronUp className="w-4 h-4 text-[#8B5CF6]" /> : <ChevronDown className="w-4 h-4 text-[#8B5CF6]" />}
                  </button>

                  <AnimatePresence>
                    {showAddTournamentForm && (
                      <motion.form 
                        onSubmit={handleCreateTournament}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: '16px' }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-4 overflow-hidden text-left"
                      >
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-[#A1A1AA]">TURNIR NOMI (TITLE)</label>
                          <input
                            type="text"
                            placeholder="Turnir nomi..."
                            value={newTournament.title}
                            onChange={(e) => setNewTournament(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-[#A1A1AA]">TURNIR TAVSIFI (DESCRIPTION)</label>
                          <textarea
                            placeholder="Turnir haqida ma'lumot..."
                            value={newTournament.description}
                            onChange={(e) => setNewTournament(prev => ({ ...prev, description: e.target.value }))}
                            required
                            rows={2}
                            className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                          />
                        </div>

                        {/* Entry fee and prize pool */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">KIRISH NARXI (COIN)</label>
                            <input
                              type="number"
                              value={newTournament.entry_fee}
                              onChange={(e) => setNewTournament(prev => ({ ...prev, entry_fee: parseInt(e.target.value, 10) || 0 }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-[#A1A1AA]">SOVRIN JAMG'ARMASI (COIN)</label>
                            <input
                              type="number"
                              value={newTournament.prize_pool}
                              onChange={(e) => setNewTournament(prev => ({ ...prev, prize_pool: parseInt(e.target.value, 10) || 0 }))}
                              required
                              className="w-full bg-[#050816] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50"
                            />
                          </div>
                        </div>

                        {/* Questions segment */}
                        <div className="flex flex-col gap-3 border-t border-white/[0.05] pt-3.5 mt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#8B5CF6] font-bold uppercase tracking-wider">SAVOLLAR RO'YXATI ({newTournament.questions.length})</span>
                            <button
                              type="button"
                              onClick={() => setNewTournament(prev => ({
                                ...prev,
                                questions: [...prev.questions, { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]
                              }))}
                              className="text-[10px] font-mono font-bold text-green-400 flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none outline-none"
                            >
                              <Plus className="w-3.5 h-3.5" /> Savol Qo'shish
                            </button>
                          </div>

                          {newTournament.questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-[#050816] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-3 relative text-left">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono font-black text-white/40 uppercase">SAVOL #{qIndex + 1}</span>
                                {newTournament.questions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setNewTournament(prev => ({
                                      ...prev,
                                      questions: prev.questions.filter((_, idx) => idx !== qIndex)
                                    }))}
                                    className="text-[9px] font-mono font-bold text-red-400 hover:underline cursor-pointer bg-transparent border-none outline-none"
                                  >
                                    O'chirish
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-col gap-1">
                                <input
                                  type="text"
                                  placeholder="Savol matni..."
                                  value={q.question}
                                  onChange={(e) => {
                                    const updated = [...newTournament.questions];
                                    updated[qIndex].question = e.target.value;
                                    setNewTournament(prev => ({ ...prev, questions: updated }));
                                  }}
                                  required
                                  className="w-full bg-[#050816] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                />
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Option A"
                                  value={q.option_a}
                                  onChange={(e) => {
                                    const updated = [...newTournament.questions];
                                    updated[qIndex].option_a = e.target.value;
                                    setNewTournament(prev => ({ ...prev, questions: updated }));
                                  }}
                                  required
                                  className="w-full bg-[#050816] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Option B"
                                  value={q.option_b}
                                  onChange={(e) => {
                                    const updated = [...newTournament.questions];
                                    updated[qIndex].option_b = e.target.value;
                                    setNewTournament(prev => ({ ...prev, questions: updated }));
                                  }}
                                  required
                                  className="w-full bg-[#050816] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Option C"
                                  value={q.option_c}
                                  onChange={(e) => {
                                    const updated = [...newTournament.questions];
                                    updated[qIndex].option_c = e.target.value;
                                    setNewTournament(prev => ({ ...prev, questions: updated }));
                                  }}
                                  className="w-full bg-[#050816] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Option D"
                                  value={q.option_d}
                                  onChange={(e) => {
                                    const updated = [...newTournament.questions];
                                    updated[qIndex].option_d = e.target.value;
                                    setNewTournament(prev => ({ ...prev, questions: updated }));
                                  }}
                                  className="w-full bg-[#050816] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                />
                              </div>

                              {/* Correct selector */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-[#A1A1AA]">TO'G'RI JAVOB:</span>
                                <select
                                  value={q.correct_option}
                                  onChange={(e) => {
                                    const updated = [...newTournament.questions];
                                    updated[qIndex].correct_option = e.target.value as 'A' | 'B' | 'C' | 'D';
                                    setNewTournament(prev => ({ ...prev, questions: updated }));
                                  }}
                                  className="bg-[#050816] border border-white/[0.08] rounded-lg text-[10px] text-green-400 font-mono font-bold px-2 py-1 focus:outline-none cursor-pointer"
                                >
                                  <option value="A">A Variant</option>
                                  <option value="B">B Variant</option>
                                  <option value="C">C Variant</option>
                                  <option value="D">D Variant</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button type="submit" variant="primary" size="md" className="w-full mt-2 h-10 text-xs">
                          <Plus className="w-4 h-4" /> TURNIRNI PUBLIKATSIYA QILISH
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </GlassCard>

                {/* Tournaments list */}
                <div className="flex flex-col gap-3 text-left">
                  {tournaments.length === 0 ? (
                    <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-xs font-mono text-[#A1A1AA]/40">
                      Hozircha hech qanday turnir yaratilmagan.
                    </div>
                  ) : (
                    tournaments.map(t => (
                      <GlassCard key={t.id} className="p-4 flex flex-col gap-3.5 border-white/[0.04]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col text-left">
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border self-start mb-2 ${t.is_active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                              {t.is_active ? "FAOL" : "FAOL EMAS"}
                            </span>
                            <span className="text-xs font-black text-white">{t.title}</span>
                            <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">{t.description}</p>
                          </div>

                          <button
                            type="button"
                            disabled={actionLoadingId === t.id}
                            onClick={() => handleDeleteTournament(t.id)}
                            className="text-[#A1A1AA]/40 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0 border-none bg-transparent outline-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Tournament Specs */}
                        <div className="grid grid-cols-3 gap-2 border-t border-b border-white/[0.04] py-2.5 text-center text-[10px] font-mono text-[#A1A1AA]">
                          <div>
                            <span className="block text-[8px] text-[#A1A1AA]/50 uppercase">KIRISH NARXI</span>
                            <span className="text-white font-bold">{t.entry_fee.toLocaleString()} Coin</span>
                          </div>
                          <div className="border-l border-r border-white/[0.04]">
                            <span className="block text-[8px] text-[#A1A1AA]/50 uppercase">MUKOFOT JAMG'ARMASI</span>
                            <span className="text-[#5B8CFF] font-bold">{t.prize_pool.toLocaleString()} Coin</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-[#A1A1AA]/50 uppercase">ISHTIROKCHILAR</span>
                            <span className="text-green-400 font-bold">{t.participants.length} ta a'zo</span>
                          </div>
                        </div>

                        {/* Toggle state button */}
                        <div className="flex justify-between items-center text-[10px] font-mono text-[#A1A1AA]/50">
                          <span>Savollar: {t.questions.length} ta</span>
                          <Button
                            type="button"
                            variant={t.is_active ? "danger" : "accent"}
                            size="sm"
                            className="h-7 px-3.5 text-[9px] font-bold"
                            disabled={actionLoadingId === t.id}
                            onClick={() => handleToggleTournament(t.id)}
                          >
                            {t.is_active ? "YOPISH" : "FAOL QILISH"}
                          </Button>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. USERS TAB VIEW */}
            {activeSubTab === 'users' && (
              <div className="flex flex-col gap-2.5">
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-xs font-mono text-[#A1A1AA]/40">
                    Siz izlagan foydalanuvchilar topilmadi.
                  </div>
                ) : (
                  filteredUsers.map((u, index) => (
                    <GlassCard key={u.telegram_id} className="p-4 flex flex-col gap-3.5 border-white/[0.04] bg-white/[0.01]">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5B8CFF] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold font-mono">
                            {index + 1}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              @{u.username}
                              {u.is_premium && (
                                <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                              )}
                            </span>
                            <span className="text-[9px] font-mono text-[#A1A1AA]/50 mt-0.5">ID: {u.telegram_id}</span>
                            {u.is_banned && (
                              <span className="text-[9px] font-mono font-bold text-red-400 mt-1 uppercase">
                                BLOKLANGAN {u.ban_reason ? `(${u.ban_reason})` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="text-xs font-black text-yellow-400 font-mono flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 fill-yellow-400" /> {u.balance.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono text-[#A1A1AA] mt-0.5">Level {u.level} • {u.streak}d/kun</span>
                        </div>
                      </div>

                      {/* User Actions footer inside card */}
                      <div className="flex justify-end gap-2 border-t border-white/[0.04] pt-2.5 mt-0.5">
                        {u.is_banned ? (
                          <Button
                            variant="accent"
                            size="sm"
                            className="h-7 text-[10px] font-mono font-bold px-3 py-0 cursor-pointer"
                            disabled={actionLoadingId === u.telegram_id}
                            onClick={() => handleUnbanUser(u.telegram_id)}
                          >
                            BLOKDAN CHIQARISH
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            className="h-7 text-[10px] font-mono font-bold px-3 py-0 cursor-pointer"
                            disabled={actionLoadingId === u.telegram_id}
                            onClick={() => handleBanUser(u.telegram_id)}
                          >
                            BLOKLASH
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
export default AdminPanel;
