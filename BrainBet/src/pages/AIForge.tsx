/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, AlertTriangle, Cpu, Command, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Button } from '../components/Button.js';

export const AIForge: React.FC = () => {
  const { generateAIQuestions, loadingAI } = useApp();
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loaderMessageIndex, setLoaderMessageIndex] = useState(0);

  // Status indicators when awaiting Gemini API results
  const loadingMessages = [
    'Neyron kanallar faollashtirilmoqda...',
    'Gemini bilimlar bazasiga murojaat qilinmoqda...',
    'Savollarning qiyinchilik darajalari sozlanmoqda...',
    'To\'g\'ri javob variantlari tekshirilmoqda...',
    'Mukofot koeffitsiyentlari biriktirilmoqda...',
    'Sizning maxsus Kviz Arenangiz yuklanmoqda...'
  ];

  // Rotate messages to reassure user during network delay
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (loadingAI) {
      interval = setInterval(() => {
        setLoaderMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoaderMessageIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingAI]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) return;
    
    await generateAIQuestions(category.trim(), difficulty);
  };

  const sampleTopics = [
    { label: 'Solidity smart-kontraktlar', category: 'Smart Contracts', diff: 'hard' },
    { label: 'Kvant fizikasi sirlari', category: 'Cosmos Science', diff: 'medium' },
    { label: 'SIdagi tarixiy burilishlar', category: 'AI Models', diff: 'easy' },
    { label: 'Meme tangalar iqtisodi', category: 'Web3 Trivia', diff: 'medium' }
  ] as const;

  const difficultyNames = {
    easy: 'Oson',
    medium: 'O\'rtacha',
    hard: 'Qiyin'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6 pb-24"
    >
      <AnimatePresence mode="wait">
        {loadingAI ? (
          /* High-fidelity custom loader overlay */
          <motion.div
            key="loader"
            className="w-full flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative mb-6">
              <motion.div
                className="w-20 h-20 rounded-full border border-dashed border-[#8B5CF6]/40 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-[#8B5CF6]"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Cpu className="w-8 h-8" />
              </motion.div>
            </div>
            
            <h4 className="text-base font-bold text-white mb-2">AI ARENA GENERATSIYASI</h4>
            
            <div className="h-5 overflow-hidden relative w-full max-w-xs">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={loaderMessageIndex}
                  className="text-xs font-mono text-[#8B5CF6]/90 block tracking-wide"
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                >
                  {loadingMessages[loaderMessageIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
            
            <p className="text-[10px] text-[#A1A1AA] mt-6 max-w-xs leading-relaxed px-4">
              Gemini AI siz tanlagan mavzu bo'yicha krizlarni maxsus tayyorlamoqda. Bu taxminan 3 soniya vaqt oladi.
            </p>
          </motion.div>
        ) : (
          /* Creation interface page */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            {/* Title */}
            <div className="text-center flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] mb-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">AI SAVOL GENERATORI</h3>
              <p className="text-xs text-[#A1A1AA]">Gemini AI yordamida o'zingiz xohlagan mavzuda mukammal kvizlar to'plamini yarating.</p>
            </div>

            {/* Main creation card */}
            <GlassCard className="p-5 border-[#8B5CF6]/15 bg-[#120a28]/10 relative">
              <form onSubmit={handleGenerate} className="flex flex-col gap-5">
                {/* Category Topic Input */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase">ARENA CORE MAVZUSI</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={30}
                      required
                      placeholder="Masalan: Alisher Navoiy, Geometriya, Kvant Fizikasi"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]/50 placeholder-[#A1A1AA]/30"
                    />
                    <Command className="w-4 h-4 text-[#A1A1AA]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[9px] text-[#A1A1AA]/60 font-mono self-end">MAKSIMAL 30 TA BELGI</span>
                </div>

                {/* Difficulty selector tabs */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase">ARENA QIYINCHILIK DARAJASI</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(diff => {
                      const isActive = difficulty === diff;
                      return (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setDifficulty(diff)}
                          className={`
                            py-2.5 rounded-xl text-xs font-semibold border transition-all uppercase tracking-wider font-mono cursor-pointer
                            ${isActive 
                              ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-white shadow-[0_0_12px_rgba(139,92,246,0.15)]' 
                              : 'bg-white/[0.02] border-white/[0.05] text-[#A1A1AA]/70 hover:text-white'
                            }
                          `}
                        >
                          {difficultyNames[diff]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Warnings or parameters detail */}
                <div className="flex items-start gap-2 bg-[#8B5CF6]/5 border border-[#8B5CF6]/15 p-3 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#A1A1AA] leading-relaxed text-left">
                    AI tomonidan yaratilgan savollar ham standart energiya sarflaydi. To'plangan tajriba va tangalar tanlangan qiyinchilik darajasiga muvofiq beriladi.
                  </p>
                </div>

                {/* Submit button */}
                <Button
                  variant="accent"
                  size="md"
                  type="submit"
                  disabled={!category.trim()}
                  className="w-full h-11"
                >
                  <Sparkles className="w-4 h-4" /> AI ARENASINI YARATISH
                </Button>
              </form>
            </GlassCard>

            {/* Quick-starter thematic chips */}
            <div className="flex flex-col gap-2.5 text-left">
              <h4 className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase">TAVSIYA ETILADIGAN PRESETLAR</h4>
              <div className="grid grid-cols-2 gap-2">
                {sampleTopics.map(topic => (
                  <button
                    key={topic.label}
                    onClick={() => {
                      setCategory(topic.label);
                      setDifficulty(topic.diff);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] text-left transition-colors cursor-pointer group animate-fade-in"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white leading-normal group-hover:text-[#8B5CF6] transition-colors">{topic.label}</span>
                      <span className="text-[9px] font-mono text-[#A1A1AA]/70 uppercase mt-1">Daraja: {difficultyNames[topic.diff]}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA]/40 group-hover:text-[#8B5CF6] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default AIForge;
