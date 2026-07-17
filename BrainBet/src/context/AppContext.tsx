/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTelegram } from './TelegramContext.js';

export interface UserProfile {
  telegram_id: string;
  username: string;
  created_at: string;
  balance: number;
  xp: number;
  level: number;
  daily_limit: number;
  answered_today: number;
  streak: number;
  last_answered_at: string | null;
  leaderboard_position: number;
  is_admin?: boolean;
}

export interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  reward: number;
}

export interface SubmissionResult {
  is_correct: boolean;
  correct_option: 'A' | 'B' | 'C' | 'D';
  selected_option: 'A' | 'B' | 'C' | 'D';
  earned_coins: number;
  earned_xp: number;
  streak: number;
  daily_answer_count: number;
  daily_limit: number;
  level_up: boolean;
  new_level: number;
  new_xp: number;
  new_balance: number;
  animation_state: {
    sparkles: boolean;
    streak_glow: boolean;
    level_glow: boolean;
  };
}

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  profile: UserProfile | null;
  questions: Question[];
  activeTab: 'dashboard' | 'quiz' | 'leaderboard' | 'wallet' | 'ai-forge' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'quiz' | 'leaderboard' | 'wallet' | 'ai-forge' | 'admin') => void;
  loadingProfile: boolean;
  loadingQuestions: boolean;
  loadingAI: boolean;
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: number) => void;
  fetchProfile: () => Promise<void>;
  fetchQuestions: (difficulty?: 'easy' | 'medium' | 'hard', category?: string) => Promise<void>;
  submitAnswer: (questionId: string, option: 'A' | 'B' | 'C' | 'D') => Promise<SubmissionResult>;
  generateAIQuestions: (category: string, difficulty: 'easy' | 'medium' | 'hard') => Promise<void>;
  leaderboard: any[];
  fetchLeaderboard: () => Promise<void>;
  loadingLeaderboard: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initData, haptics } = useTelegram();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quiz' | 'leaderboard' | 'wallet' | 'ai-forge' | 'admin'>('dashboard');
  
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Toast notifications management
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch or register User stats
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingProfile(true);
      const url = `/api/user/${user.id}?username=${encodeURIComponent(user.username || user.first_name)}`;
      const res = await fetch(url);
      const payload = await res.json();
      
      if (res.ok && payload.status === 'success') {
        const flattenedProfile: UserProfile = {
          ...payload.data,
          telegram_id: payload.data.profile.telegram_id,
          username: payload.data.profile.username,
          created_at: payload.data.profile.created_at,
          is_admin: payload.data.profile.is_admin
        };
        setProfile(flattenedProfile);
      } else {
        showToast(payload.error || 'Failed to sync account profile.', 'error');
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      showToast('Network disconnect: Cannot reach profile server.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  }, [user, showToast]);

  // Fetch standard unanswered quiz questions pool
  const fetchQuestions = useCallback(async (difficulty?: 'easy' | 'medium' | 'hard', category?: string) => {
    if (!user) return;
    try {
      setLoadingQuestions(true);
      let url = '/api/questions?limit=10';
      if (difficulty) {
        url += `&difficulty=${difficulty}`;
      }
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'x-telegram-init-data': initData
        }
      });
      const payload = await res.json();
      
      if (res.ok && payload.status === 'success') {
        setQuestions(payload.data.questions);
      } else {
        showToast(payload.error || 'Failed to sync quiz bank.', 'error');
      }
    } catch (err) {
      console.error('fetchQuestions error:', err);
      showToast('Network error loading questions.', 'error');
    } finally {
      setLoadingQuestions(false);
    }
  }, [user, initData, showToast]);

  // Submit Answer with optimistic updates and haptic triggers
  const submitAnswer = useCallback(async (questionId: string, option: 'A' | 'B' | 'C' | 'D'): Promise<SubmissionResult> => {
    if (!user) throw new Error('Unauthenticated user context');
    
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ question_id: questionId, selected_option: option })
      });
      
      const payload = await res.json();
      
      if (!res.ok || payload.status !== 'success') {
        haptics.notification('error');
        const errorMessage = payload.error || 'Submission failed.';
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }

      const result: SubmissionResult = payload.data;

      // Haptic Feedback based on evaluation result
      if (result.is_correct) {
        haptics.notification('success');
      } else {
        haptics.impact('medium');
      }

      // Optimistic state syncing
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          balance: result.new_balance,
          xp: result.new_xp,
          level: result.new_level,
          answered_today: result.daily_answer_count,
          streak: result.streak,
          leaderboard_position: prev.leaderboard_position // Leaderboard position persists until fresh sync
        };
      });

      // Remove the answered question from current in-memory pool
      setQuestions(prev => prev.filter(q => q.id !== questionId));

      return result;
    } catch (err: any) {
      console.error('submitAnswer error:', err);
      throw err;
    }
  }, [user, initData, haptics, showToast]);

  // Fetch leaderboard standings
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await fetch('/api/leaderboard?limit=30');
      const payload = await res.json();
      
      if (res.ok && payload.status === 'success') {
        setLeaderboard(payload.data.leaderboard);
      } else {
        showToast(payload.error || 'Failed to sync leaderboards.', 'error');
      }
    } catch (err) {
      console.error('fetchLeaderboard error:', err);
      showToast('Network error loading leaderboards.', 'error');
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [showToast]);

  // Generate on-the-fly AI questions using Gemini AI
  const generateAIQuestions = useCallback(async (category: string, difficulty: 'easy' | 'medium' | 'hard') => {
    if (!user) return;
    try {
      setLoadingAI(true);
      haptics.impact('light');
      
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ category, difficulty, count: 4 })
      });
      
      const payload = await res.json();
      
      if (res.ok && payload.status === 'success') {
        haptics.notification('success');
        setQuestions(payload.data.questions);
        setActiveTab('quiz'); // Transition user directly to the Quiz Arena tab!
        showToast(`AI Arena generated successfully! Topic: ${category.toUpperCase()}`, 'success');
      } else {
        haptics.notification('error');
        showToast(payload.error || 'AI arena generation offline.', 'error');
      }
    } catch (err) {
      console.error('generateAIQuestions error:', err);
      showToast('AI Generation failed: Connection error.', 'error');
    } finally {
      setLoadingAI(false);
    }
  }, [user, initData, haptics, showToast]);

  // Periodic Profile Synchronization on boot and on tab switching
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchQuestions();
    }
  }, [user, fetchProfile, fetchQuestions]);

  return (
    <AppContext.Provider value={{
      profile,
      questions,
      activeTab,
      setActiveTab: (tab) => {
        haptics.selection();
        setActiveTab(tab);
        if (tab === 'leaderboard') fetchLeaderboard();
        if (tab === 'dashboard') fetchProfile();
      },
      loadingProfile,
      loadingQuestions,
      loadingAI,
      toasts,
      showToast,
      dismissToast,
      fetchProfile,
      fetchQuestions,
      submitAnswer,
      generateAIQuestions,
      leaderboard,
      fetchLeaderboard,
      loadingLeaderboard
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
