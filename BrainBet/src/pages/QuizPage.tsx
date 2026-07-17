/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, ArrowRight, Zap, RefreshCw, Sparkles, Award, BookOpen, ChevronRight, Calculator, Landmark, ArrowLeft, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Button } from '../components/Button.js';
import { RewardPopup } from '../components/RewardPopup.js';
import { QuizSkeleton } from '../components/Skeletons.js';
import { TournamentView } from './TournamentView.js';

export const QuizPage: React.FC = () => {
  const {
    questions,
    loadingQuestions,
    submitAnswer,
    fetchQuestions,
    setActiveTab,
    showToast
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quizSubTab, setQuizSubTab] = useState<'daily' | 'tournaments'>('daily');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    is_correct: boolean;
    correct_option: 'A' | 'B' | 'C' | 'D';
    earned_coins: number;
    earned_xp: number;
    level_up: boolean;
    new_level: number;
  } | null>(null);

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(20);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeQuestion = questions[currentIndex];

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Evaluates selected multiple-choice options
  const handleOptionSelect = useCallback(async (option: 'A' | 'B' | 'C' | 'D', isForcedTimeout = false) => {
    if (isEvaluating || !activeQuestion) return;
    
    stopTimer();
    setSelectedOption(option);
    setIsEvaluating(true);

    try {
      // Send selected answer to API with optimistic evaluation
      const result = await submitAnswer(activeQuestion.id, isForcedTimeout ? 'A' : option);
      
      // If forced timeout occurred, manually override evaluation is_correct to false
      const isCorrect = isForcedTimeout ? false : result.is_correct;

      setEvaluationResult({
        is_correct: isCorrect,
        correct_option: result.correct_option,
        earned_coins: isCorrect ? result.earned_coins : 0,
        earned_xp: result.earned_xp,
        level_up: result.level_up,
        new_level: result.new_level
      });

      // Briefly pause to let the option glow/shake animation play out on screen
      setTimeout(() => {
        setShowRewardModal(true);
      }, 1000);

    } catch (err) {
      console.error('Submission transaction failure:', err);
      // Clean locks on network error
      setIsEvaluating(false);
      setSelectedOption(null);
    }
  }, [isEvaluating, activeQuestion, stopTimer, submitAnswer]);

  // Handles countdown expiration
  const handleTimeOut = useCallback(async () => {
    if (isEvaluating || !activeQuestion) return;
    showToast('Vaqt tugadi! Avtomatik baholanmoqda...', 'info');
    // Select an option outside range to force incorrect logging
    await handleOptionSelect('A', true); 
  }, [isEvaluating, activeQuestion, showToast, handleOptionSelect]);

  // Starts the interactive countdown timer
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerSeconds(20);

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Initialize and maintain timer when active question index increments
  useEffect(() => {
    if (activeQuestion && !isEvaluating) {
      startTimer();
    }
    return () => stopTimer();
  }, [activeQuestion, isEvaluating, startTimer, stopTimer]);

  // Monitor timer count and trigger expiration safely after rendering phases
  useEffect(() => {
    if (timerSeconds === 0 && !isEvaluating && activeQuestion) {
      stopTimer();
      handleTimeOut();
    }
  }, [timerSeconds, isEvaluating, activeQuestion, stopTimer, handleTimeOut]);

  // Increments active question index pointer and clean evaluation scopes
  const handleNextQuestion = () => {
    setShowRewardModal(false);
    
    // Smooth fade parameters
    setTimeout(() => {
      setEvaluationResult(null);
      setSelectedOption(null);
      setIsEvaluating(false);
      
      if (questions.length === 0) {
        setCurrentIndex(0);
      }
    }, 150);
  };

  const handleRefreshDeck = () => {
    if (selectedCategory) {
      fetchQuestions(undefined, selectedCategory);
    } else {
      fetchQuestions();
    }
    setCurrentIndex(0);
    setEvaluationResult(null);
    setSelectedOption(null);
    setIsEvaluating(false);
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    fetchQuestions(undefined, cat);
    setCurrentIndex(0);
    setEvaluationResult(null);
    setSelectedOption(null);
    setIsEvaluating(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  // 1. Subject/Category Selection Screen
  if (!selectedCategory) {
    const categoriesList = [
      { id: 'Tarix', label: 'Tarix', icon: Landmark, desc: 'Buyuk ajdodlar, tarixiy burilishlar va jahon tarixi.', color: 'from-amber-500 to-orange-600' },
      { id: 'Matematika', label: 'Matematika', icon: Calculator, desc: 'Mantiqiy misollar, qiziqarli tenglamalar va geometriya.', color: 'from-[#5B8CFF] to-blue-700' },
      { id: 'Ingliz tili', label: 'Ingliz tili', icon: BookOpen, desc: 'Grammatika, so\'z boyligi va foydali iboralar.', color: 'from-emerald-500 to-teal-600' }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col gap-6 pb-24"
      >
        <div className="text-center flex flex-col items-center gap-1 mt-2">
          <div className="w-12 h-12 rounded-full bg-[#5B8CFF]/10 flex items-center justify-center text-[#5B8CFF] mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">KVIZ ARENASI</h3>
          <p className="text-xs text-[#A1A1AA] px-4">O'yinga kiring, bilimingizni sinab ko'ring va sovrinlarni qo'lga kiriting!</p>
        </div>

        {/* Modern Sub-Tab Switcher */}
        <div className="flex bg-[#0a0d24] p-1 rounded-xl border border-white/[0.05] w-full mt-1">
          <button
            type="button"
            onClick={() => setQuizSubTab('daily')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
              quizSubTab === 'daily'
                ? 'bg-[#5B8CFF]/10 text-[#5B8CFF] border border-[#5B8CFF]/15 shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kundalik Kvizlar
          </button>
          <button
            type="button"
            onClick={() => setQuizSubTab('tournaments')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 relative ${
              quizSubTab === 'tournaments'
                ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/15 shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Turnirlar
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
          </button>
        </div>

        {quizSubTab === 'tournaments' ? (
          <TournamentView />
        ) : (
          <div className="flex flex-col gap-4 mt-1">
            {categoriesList.map(cat => {
              const Icon = cat.icon;
              return (
                <GlassCard 
                  key={cat.id} 
                  className="p-5 flex items-center justify-between gap-4 border-white/[0.06] hover:border-[#5B8CFF]/30 cursor-pointer transition-all duration-300 group relative overflow-hidden active:scale-98"
                  onClick={() => handleSelectCategory(cat.id)}
                >
                  {/* Accent glow on hover */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${cat.color}`} />
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-base font-bold text-white group-hover:text-[#5B8CFF] transition-colors">
                        {cat.label}
                      </span>
                      <span className="text-xs text-[#A1A1AA] mt-1 max-w-[220px] leading-relaxed">
                        {cat.desc}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#A1A1AA] group-hover:text-white transition-colors" />
                </GlassCard>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  if (loadingQuestions) {
    return <QuizSkeleton />;
  }

  // Handle empty state: all questions cleared
  if (!activeQuestion) {
    return (
      <motion.div
        className="w-full flex flex-col items-center justify-center text-center p-6 pb-24"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <GlassCard className="p-8 w-full max-w-sm flex flex-col items-center gap-5 border-[#5b8cff]/10">
          <div className="w-16 h-16 rounded-full bg-[#5b8cff]/10 flex items-center justify-center text-[#5b8cff]">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Barcha savollar tugadi!</h3>
            <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed">
              Siz ushbu mavzudagi barcha savollarga to'liq javob berib bo'ldingiz! Yangi savollarni yuklang yoki boshqa mavzuni sinab ko'ring.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-4">
            <Button variant="primary" size="md" className="w-full" onClick={handleRefreshDeck}>
              <RefreshCw className="w-4 h-4" /> Yangi savollarni yuklash
            </Button>
            
            <Button variant="secondary" size="md" className="w-full" onClick={handleBackToCategories}>
              <ArrowLeft className="w-4 h-4" /> Boshqa mavzularga qaytish
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // Difficulty specific styles
  const difficultyBadges = {
    easy: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/20',
    medium: 'bg-[#5B8CFF]/15 text-[#5B8CFF] border-[#5B8CFF]/20',
    hard: 'bg-red-500/15 text-red-400 border-red-500/20'
  };

  const difficultyNames = {
    easy: 'Oson',
    medium: 'O\'rtacha',
    hard: 'Qiyin'
  };

  const optionsMap: { label: string; value: 'A' | 'B' | 'C' | 'D' }[] = [
    { label: activeQuestion.option_a, value: 'A' },
    { label: activeQuestion.option_b, value: 'B' },
    { label: activeQuestion.option_c, value: 'C' },
    { label: activeQuestion.option_d, value: 'D' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full flex flex-col gap-5 pb-24"
    >
      {/* 1. Header progress and active countdown timer */}
      <div className="flex items-center justify-between gap-4">
        {/* Chips detail */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBackToCategories}
            className="flex items-center justify-center p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border uppercase font-bold tracking-widest ${difficultyBadges[activeQuestion.difficulty]}`}>
            {difficultyNames[activeQuestion.difficulty]}
          </span>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/[0.05] bg-white/[0.02] text-[#A1A1AA]/90 truncate max-w-[120px]">
            {activeQuestion.category}
          </span>
        </div>

        {/* Dynamic visual timer layout */}
        <div className="flex items-center gap-2 text-sm font-mono font-bold">
          <Timer className={`w-4 h-4 ${timerSeconds <= 5 ? 'text-red-500 animate-pulse' : 'text-[#5B8CFF]'}`} />
          <span className={timerSeconds <= 5 ? 'text-red-500' : 'text-white'}>
            00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
          </span>
        </div>
      </div>

      {/* Countdown Progress Strip bar */}
      <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${timerSeconds <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-[#5B8CFF] to-[#8B5CF6]'}`}
          style={{ width: `${(timerSeconds / 20) * 100}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>

      {/* 2. Primary Question statement card */}
      <GlassCard className="p-6 min-h-[140px] flex flex-col justify-center relative overflow-hidden border-white/[0.06]">
        {/* Back visual accents */}
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#5B8CFF] to-[#8B5CF6]" />
        
        <h3 className="text-base font-bold text-white leading-relaxed select-none pl-2">
          {activeQuestion.question}
        </h3>
      </GlassCard>

      {/* 3. Multiple choice clickable option stack */}
      <div className="flex flex-col gap-3">
        {optionsMap.map((opt, i) => {
          const isSelected = selectedOption === opt.value;
          const isCorrectAnswer = evaluationResult?.correct_option === opt.value;
          const isWrongSelection = evaluationResult && isSelected && !evaluationResult.is_correct;

          // Compute contextual styling classes on option elements
          let borderStyle = 'border-white/[0.07] bg-white/[0.03] text-white/[0.9]';
          let glowClass = '';

          if (isSelected) {
            borderStyle = 'border-[#5B8CFF] bg-[#5B8CFF]/10 text-white';
          }

          if (evaluationResult) {
            if (isCorrectAnswer) {
              borderStyle = 'border-green-500 bg-green-500/10 text-green-400';
              glowClass = 'shadow-[0_0_15px_rgba(34,197,94,0.15)]';
            } else if (isWrongSelection) {
              borderStyle = 'border-red-500 bg-red-500/10 text-red-400';
              glowClass = 'shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-[shake_0.4s_ease-in-out_1]';
            } else if (isSelected && !isCorrectAnswer) {
              borderStyle = 'opacity-40 border-white/[0.02] bg-white/[0.01]';
            } else {
              borderStyle = 'opacity-40 border-white/[0.02] bg-white/[0.01]';
            }
          }

          return (
            <motion.div
              key={opt.value}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
            >
              <button
                disabled={isEvaluating}
                onClick={() => handleOptionSelect(opt.value)}
                className={`
                  w-full px-5 py-4 text-sm font-semibold rounded-2xl border text-left flex items-center justify-between
                  transition-all duration-300 relative overflow-hidden select-none
                  ${isEvaluating ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.06] hover:border-white/15'}
                  ${borderStyle} ${glowClass}
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Option circle indexes */}
                  <span className={`
                    w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border
                    ${isSelected 
                      ? 'bg-[#5B8CFF]/20 border-[#5B8CFF]/30 text-white' 
                      : 'bg-white/[0.03] border-white/[0.05] text-[#A1A1AA]'
                    }
                    ${evaluationResult && isCorrectAnswer ? 'bg-green-500/20 border-green-500/30 text-green-400' : ''}
                    ${evaluationResult && isWrongSelection ? 'bg-red-500/20 border-red-500/30 text-red-400' : ''}
                  `}>
                    {opt.value}
                  </span>
                  
                  <span className="leading-relaxed leading-normal">{opt.label}</span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Display reward coins summary chip info */}
      <div className="flex justify-center mt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05] text-[10px] font-mono text-[#A1A1AA]/80">
          MUKOFOT MIKDORI <strong className="text-yellow-400">{activeQuestion.reward} TANGA</strong>
          <Zap className="w-3 h-3 text-[#5B8CFF]" />
        </span>
      </div>

      {/* 5. Congratulations popup modal overlay */}
      <RewardPopup
        isOpen={showRewardModal}
        onClose={handleNextQuestion}
        type={evaluationResult?.is_correct ? (evaluationResult.level_up ? 'levelup' : 'correct') : 'wrong'}
        coins={evaluationResult?.earned_coins || 0}
        xp={evaluationResult?.earned_xp || 0}
        title={
          evaluationResult?.is_correct 
            ? (evaluationResult.level_up ? 'Darajangiz ko\'tarildi!' : 'To\'g\'ri javob!') 
            : 'Noto\'g\'ri javob'
        }
        extraText={
          evaluationResult?.is_correct
            ? (evaluationResult.level_up 
                ? `Ajoyib! Siz to'g'ri javob berdingiz va darajangiz ${evaluationResult.new_level}-ga ko'tarildi! Olg'a!` 
                : `Barakalla! To'g'ri javob berdingiz va mukofotlarni muvaffaqiyatli qo'lga kiritdingiz!`)
            : `To'g'ri javob ${evaluationResult?.correct_option} edi. Xavotir olmang, bilimingizni oshirishda davom eting!`
        }
      />
    </motion.div>
  );
};
export default QuizPage;
