import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Crown, 
  Zap, 
  Coins, 
  Timer, 
  ChevronRight, 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  Award, 
  Clock, 
  RefreshCw,
  User,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { useTelegram } from '../context/TelegramContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Button } from '../components/Button.js';

interface TournamentQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty?: string;
  category?: string;
  reward?: number;
}

interface TournamentProgress {
  user_id: string;
  username: string;
  correct_count: number;
  completed_questions_count: number;
  total_time_ms: number;
  started_at: string | null;
  completed_at: string | null;
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  entry_fee: number;
  prize_pool: number;
  questions: TournamentQuestion[];
  participants: string[];
  leaderboard: TournamentProgress[];
  is_active: boolean;
  created_at: string;
}

export const TournamentView: React.FC = () => {
  const { profile, fetchProfile, showToast } = useApp();
  const { initData } = useTelegram();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Gameplay state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctOption, setCorrectOption] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(20);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Final summary state
  const [gameResult, setGameResult] = useState<{
    correctCount: number;
    totalQuestions: number;
    totalTimeMs: number;
    earnedCoins: number;
    earnedXp: number;
  } | null>(null);

  // Fetch all tournaments
  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tournaments', {
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setTournaments(payload.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  // Fetch specific tournament details
  const fetchTournamentDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        headers: { 'x-telegram-init-data': initData }
      });
      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setSelectedTournament(payload.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [initData]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentDetails(selectedTournamentId);
    } else {
      setSelectedTournament(null);
    }
  }, [selectedTournamentId, fetchTournamentDetails]);

  const handleJoinTournament = async (tournamentId: string) => {
    const entryFee = selectedTournament?.entry_fee || 0;
    const isPremium = profile?.is_premium || false;

    const confirmMsg = isPremium 
      ? `Siz Premium a'zosisiz! Turnirga BEPUL qo'shilmoqchimisiz?`
      : `Turnirga qo'shilish narxi: ${entryFee.toLocaleString()} Coin. Davom etasizmi?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
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
        fetchTournamentDetails(tournamentId);
        fetchTournaments();
      } else {
        showToast(payload.error || 'Qo\'shilishda xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimerSeconds(20);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          stopTimer();
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const handleTimeout = () => {
    if (isEvaluating) return;
    submitTournamentAnswer('A', true); // auto-submit incorrect option A on timeout
  };

  // Start answering tournament questions
  const handleStartTournament = async () => {
    if (!selectedTournament) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/start-timer`, {
        method: 'POST',
        headers: { 'x-telegram-init-data': initData }
      });
      if (res.ok) {
        setIsPlaying(true);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsEvaluating(false);
        setIsCorrect(null);
        setCorrectOption(null);
        setGameResult(null);
        startTimer();
      } else {
        const errPayload = await res.json();
        showToast(errPayload.error || 'Timer boshlashda xatolik yuz berdi.', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitTournamentAnswer = async (option: 'A' | 'B' | 'C' | 'D', isTimeout = false) => {
    if (isEvaluating || !selectedTournament) return;
    stopTimer();

    setSelectedOption(option);
    setIsEvaluating(true);

    const activeQuestion = selectedTournament.questions[currentQuestionIndex];

    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          selectedOption: isTimeout ? 'A' : option
        })
      });

      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        const { evaluation, user } = payload.data;
        setIsCorrect(evaluation.is_correct);
        setCorrectOption(evaluation.correct_option);

        // Update profile balance
        fetchProfile();

        setTimeout(() => {
          if (evaluation.is_finished) {
            // Finished!
            const finalProgress = payload.data.tournament.leaderboard.find((l: any) => l.user_id === profile?.telegram_id);
            setGameResult({
              correctCount: finalProgress ? finalProgress.correct_count : 0,
              totalQuestions: selectedTournament.questions.length,
              totalTimeMs: finalProgress ? finalProgress.total_time_ms : 0,
              earnedCoins: evaluation.earned_coins,
              earnedXp: evaluation.earned_xp
            });
            setIsPlaying(false);
            fetchTournamentDetails(selectedTournament.id);
          } else {
            // Next Question
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsEvaluating(false);
            setIsCorrect(null);
            setCorrectOption(null);
            startTimer();
          }
        }, 1200);

      } else {
        showToast(payload.error || 'Baholashda xatolik yuz berdi.', 'error');
        setIsEvaluating(false);
      }
    } catch (e) {
      console.error(e);
      showToast('Ulanish xatosi.', 'error');
      setIsEvaluating(false);
    }
  };

  // Format milliseconds to min:sec:ms
  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const deciseconds = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${deciseconds}`;
  };

  // Cleanup timers
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const activeUserProgress = selectedTournament?.leaderboard.find(l => l.user_id === profile?.telegram_id);
  const hasJoined = selectedTournament?.participants.includes(profile?.telegram_id || '');
  const hasFinished = !!activeUserProgress?.completed_at;

  // Render Gameplay Mode
  if (isPlaying && selectedTournament) {
    const activeQuestion = selectedTournament.questions[currentQuestionIndex];
    const options = [
      { key: 'A', text: activeQuestion.option_a },
      { key: 'B', text: activeQuestion.option_b },
      { key: 'C', text: activeQuestion.option_c },
      { key: 'D', text: activeQuestion.option_d }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col gap-5 pb-24 text-left"
      >
        <div className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider">SAVOL {currentQuestionIndex + 1} / {selectedTournament.questions.length}</span>
            <span className="text-xs font-bold text-[#8B5CF6] mt-1 font-mono">{selectedTournament.title}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-red-400">
            <Timer className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-black font-mono">{timerSeconds}s</span>
          </div>
        </div>

        {/* Question Statement */}
        <GlassCard className="p-6 border-white/[0.06] bg-gradient-to-br from-[#101535]/50 to-[#050816]/70 relative">
          <p className="text-base font-medium text-white leading-relaxed">
            {activeQuestion.question}
          </p>
        </GlassCard>

        {/* Answer Options */}
        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            const optionKey = opt.key as 'A' | 'B' | 'C' | 'D';
            const isSelected = selectedOption === optionKey;
            
            let btnStyle = "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-white";
            if (isEvaluating) {
              if (isSelected) {
                btnStyle = isCorrect 
                  ? "border-green-500 bg-green-500/10 text-green-400 font-bold" 
                  : "border-red-500 bg-red-500/10 text-red-400 font-bold";
              } else if (correctOption === optionKey) {
                btnStyle = "border-green-500 bg-green-500/15 text-green-400 font-bold";
              } else {
                btnStyle = "opacity-40 border-white/[0.02] bg-transparent text-white/50";
              }
            }

            return (
              <button
                key={opt.key}
                disabled={isEvaluating}
                onClick={() => submitTournamentAnswer(optionKey)}
                className={`w-full p-4 rounded-xl text-left border text-sm transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.99] ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${isSelected ? 'bg-white/20' : 'bg-white/5 text-[#A1A1AA]'}`}>
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </div>

                {isEvaluating && isSelected && (
                  isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )
                )}
                {isEvaluating && !isSelected && correctOption === opt.key && (
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Render Completion Summary
  if (gameResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col items-center justify-center text-center p-4 pb-24 gap-5"
      >
        <GlassCard className="p-8 w-full max-w-sm flex flex-col items-center gap-5 border-yellow-500/20 bg-gradient-to-br from-[#1e1530]/90 to-[#0c081e]/95">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <Trophy className="w-8 h-8 fill-yellow-400" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide">TURNIR YAKUNLANDI!</h3>
            <p className="text-xs text-[#A1A1AA] mt-1">Ushbu turnirdagi ishtirokingiz muvaffaqiyatli baholandi.</p>
          </div>

          {/* Stats Box */}
          <div className="grid grid-cols-2 gap-3 w-full bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl text-left">
            <div>
              <span className="text-[9px] font-mono text-[#A1A1AA] uppercase">To'g'ri Javoblar</span>
              <span className="text-sm font-bold text-white block mt-0.5">{gameResult.correctCount} / {gameResult.totalQuestions}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-[#A1A1AA] uppercase">Umumiy Vaqt</span>
              <span className="text-sm font-bold text-white block mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> {formatTime(gameResult.totalTimeMs)}
              </span>
            </div>
          </div>

          {/* Reward block */}
          <div className="flex flex-col gap-1.5 w-full text-center">
            <span className="text-[10px] font-mono text-[#A1A1AA] uppercase">Siz Qabul Qildingiz</span>
            
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1.5 rounded-full text-yellow-400 text-sm font-black font-mono">
                <Coins className="w-4 h-4 fill-yellow-400" /> +{gameResult.earnedCoins.toLocaleString()} COIN
              </div>
              <div className="flex items-center gap-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-3.5 py-1.5 rounded-full text-[#8B5CF6] text-sm font-black font-mono">
                <Zap className="w-4 h-4 fill-[#8B5CF6]" /> +{gameResult.earnedXp.toLocaleString()} XP
              </div>
            </div>

            {profile?.is_premium && (
              <span className="text-[9px] font-mono font-bold text-yellow-400 mt-2 flex items-center justify-center gap-1 uppercase">
                <Crown className="w-3 h-3 fill-yellow-400" /> PREMIUM 20% BONUS QO'SHILDI!
              </span>
            )}
          </div>

          <Button 
            variant="primary" 
            size="md" 
            className="w-full mt-4"
            onClick={() => {
              setGameResult(null);
              if (selectedTournamentId) {
                fetchTournamentDetails(selectedTournamentId);
              }
            }}
          >
            Natijalarni ko'rish
          </Button>
        </GlassCard>
      </motion.div>
    );
  }

  // Render Selected Tournament Lobby
  if (selectedTournament) {
    const questionsCount = selectedTournament.questions.length;
    const entryFee = selectedTournament.entry_fee;
    const isPremium = profile?.is_premium;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col gap-5 pb-24 text-left"
      >
        {/* Back header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedTournamentId(null)}
            className="flex items-center justify-center p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h4 className="text-xs font-mono font-bold tracking-wider text-[#A1A1AA] uppercase">TURNIR MA'LUMOTLARI</h4>
            <h3 className="text-sm font-bold text-white max-w-[250px] truncate">{selectedTournament.title}</h3>
          </div>
        </div>

        {/* Main Details Card */}
        <GlassCard className="p-5 border-white/[0.06] relative overflow-hidden bg-gradient-to-b from-[#0e122b]/95 to-[#050816]/98">
          <div className="absolute top-[-30%] right-[-10%] w-32 h-32 rounded-full bg-[#8B5CF6]/10 blur-2xl pointer-events-none" />
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col text-left">
              <span className="text-lg font-black text-white">{selectedTournament.title}</span>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">{selectedTournament.description}</p>
            </div>

            {/* Quick specifications */}
            <div className="grid grid-cols-3 gap-2 border-t border-b border-white/[0.04] py-3 mt-1 text-center">
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-[#A1A1AA] uppercase">Kirish narxi</span>
                {isPremium ? (
                  <span className="text-xs font-mono font-black text-green-400 mt-1 uppercase flex items-center justify-center gap-0.5">
                    <Crown className="w-3 h-3 text-yellow-400" /> BEPUL
                  </span>
                ) : (
                  <span className="text-xs font-mono font-black text-yellow-400 mt-1 flex items-center justify-center gap-0.5">
                    <Coins className="w-3 h-3" /> {entryFee.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex flex-col border-l border-r border-white/[0.04]">
                <span className="text-[8px] font-mono text-[#A1A1AA] uppercase">Mukofot jamg'armasi</span>
                <span className="text-xs font-mono font-black text-[#5B8CFF] mt-1 flex items-center justify-center gap-0.5">
                  <Trophy className="w-3 h-3" /> {selectedTournament.prize_pool.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-[#A1A1AA] uppercase">Savollar soni</span>
                <span className="text-xs font-mono font-black text-white mt-1 uppercase">
                  {questionsCount} ta savol
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-1">
              {!hasJoined ? (
                <Button 
                  variant="accent" 
                  size="md" 
                  className="w-full h-12 text-xs font-bold"
                  disabled={loading}
                  onClick={() => handleJoinTournament(selectedTournament.id)}
                >
                  {isPremium ? (
                    <>
                      <Crown className="w-4 h-4 fill-yellow-400" />
                      BEPUL RO'YXATDAN O'TISH
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      {entryFee.toLocaleString()} COIN BILAN KIRISH
                    </>
                  )}
                </Button>
              ) : hasFinished ? (
                <div className="flex items-center gap-2.5 justify-center bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-green-400 text-xs font-bold uppercase font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  Siz ushbu turnirni yakunladingiz!
                </div>
              ) : (
                <Button 
                  variant="primary" 
                  size="md" 
                  className="w-full h-12 text-xs font-bold"
                  onClick={handleStartTournament}
                >
                  <Play className="w-4 h-4 fill-white" />
                  O'YINNI BOSHLASH ({activeUserProgress?.completed_questions_count || 0} / {questionsCount})
                </Button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Tournament Leaderboard Section */}
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" /> TURNIR REYTINGI
          </h4>
          <span className="text-[9px] font-mono text-[#A1A1AA]/60 font-bold uppercase">
            {selectedTournament.leaderboard.length} ishtirokchi
          </span>
        </div>

        {selectedTournament.leaderboard.length === 0 ? (
          <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-xs font-mono text-[#A1A1AA]/40">
            Hozircha ishtirokchilar yo'q. Birinchi bo'lib qatnashing!
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {selectedTournament.leaderboard.map((player, index) => {
              const isMe = player.user_id === profile?.telegram_id;
              const hasCompleted = !!player.completed_at;
              const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

              return (
                <GlassCard 
                  key={player.user_id} 
                  className={`p-3.5 flex items-center justify-between border-white/[0.04] transition-all ${isMe ? 'bg-[#5B8CFF]/5 border-[#5B8CFF]/20' : 'bg-white/[0.01]'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono w-5 text-[#A1A1AA]/60 text-center">
                      {rankIcon ? rankIcon : `${index + 1}`}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className={`text-xs font-bold flex items-center gap-1 ${isMe ? 'text-[#5B8CFF]' : 'text-white'}`}>
                        @{player.username}
                        {isMe && <span className="text-[9px] font-mono font-normal text-[#5B8CFF]/80">(Siz)</span>}
                      </span>
                      <span className="text-[9px] font-mono text-[#A1A1AA]/50 mt-0.5">
                        {player.completed_questions_count} ta savol {hasCompleted ? 'yakunlandi' : 'yechilmoqda'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-black text-green-400 font-mono">
                      {player.correct_count} ta to'g'ri
                    </span>
                    <span className="text-[9px] font-mono text-[#A1A1AA] mt-0.5 flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-[#A1A1AA]/70" />
                      {player.completed_at ? formatTime(player.total_time_ms) : '--:--'}
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  // Render Tournament List View
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col gap-5 pb-24 text-left"
    >
      <div className="text-center flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-2 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
          <Trophy className="w-6 h-6 fill-yellow-500/20" />
        </div>
        <h3 className="text-lg font-black text-white tracking-tight">KOP-O'YIN TURNIRLARI</h3>
        <p className="text-xs text-[#A1A1AA] px-4 text-center">Haqiqiy raqobat maydoni. Savollarga tezkor javob bering va katta mukofotlarni yutib oling!</p>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {loading && tournaments.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-6 h-6 text-[#5B8CFF] animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-xs font-mono text-[#A1A1AA]/40">
            Hozircha faol turnirlar yo'q. Tez orada yangilari qo'shiladi!
          </div>
        ) : (
          tournaments.map(t => {
            const userProgress = t.leaderboard.find(l => l.user_id === profile?.telegram_id);
            const isFinished = !!userProgress?.completed_at;
            const isUserJoined = t.participants.includes(profile?.telegram_id || '');

            return (
              <GlassCard 
                key={t.id}
                onClick={() => setSelectedTournamentId(t.id)}
                className={`p-5 flex flex-col gap-3.5 border-white/[0.06] hover:border-[#8B5CF6]/30 cursor-pointer transition-all duration-300 relative overflow-hidden group active:scale-98`}
              >
                {/* Purple decorative left-stripe */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#8B5CF6] to-[#5B8CFF]" />
                
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-white group-hover:text-[#8B5CF6] transition-colors">{t.title}</span>
                    <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed line-clamp-2">{t.description}</p>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-[#A1A1AA] shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                </div>

                {/* Info tags and entry pricing footer */}
                <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1">
                  <div className="flex items-center gap-1.5">
                    {isFinished ? (
                      <span className="text-[9px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase">
                        YAKUNLANDI
                      </span>
                    ) : isUserJoined ? (
                      <span className="text-[9px] font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 uppercase">
                        KIRILDI
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-[#5B8CFF] bg-[#5B8CFF]/10 px-2 py-0.5 rounded border border-[#5B8CFF]/20 uppercase">
                        FAOL
                      </span>
                    )}

                    <span className="text-[9px] font-mono text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">
                      {t.questions.length} TA SAVOL
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-mono text-[#A1A1AA] uppercase">Mukofot</span>
                      <span className="text-xs font-black text-[#5B8CFF] font-mono mt-0.5 flex items-center gap-0.5">
                        <Trophy className="w-3.5 h-3.5" /> {t.prize_pool.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col items-end border-l border-white/[0.06] pl-3">
                      <span className="text-[8px] font-mono text-[#A1A1AA] uppercase">Kirish</span>
                      {profile?.is_premium ? (
                        <span className="text-xs font-black text-green-400 font-mono mt-0.5 flex items-center gap-0.5">
                          <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> BEPUL
                        </span>
                      ) : (
                        <span className="text-xs font-black text-yellow-400 font-mono mt-0.5 flex items-center gap-0.5">
                          <Coins className="w-3.5 h-3.5" /> {t.entry_fee.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
