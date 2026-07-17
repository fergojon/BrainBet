/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Brain, Trophy, Wallet as WalletIcon, Sparkles, ShieldAlert } from 'lucide-react';
import { TelegramProvider } from './context/TelegramContext.js';
import { AppProvider, useApp } from './context/AppContext.js';
import { BackgroundParticles } from './components/BackgroundParticles.js';
import { ToastContainer } from './components/Toast.js';

// Page Views
import { Dashboard } from './pages/Dashboard.js';
import { QuizPage } from './pages/QuizPage.js';
import { Leaderboard } from './pages/Leaderboard.js';
import { Wallet } from './pages/Wallet.js';
import { AIForge } from './pages/AIForge.js';
import { AdminPanel } from './pages/AdminPanel.js';

/**
 * Inner Application Coordinates
 * Renders the active page depending on the activeTab context state.
 * Employs Framer Motion page transition directions.
 */
const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, profile } = useApp();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'quiz':
        return <QuizPage />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'wallet':
        return <Wallet />;
      case 'ai-forge':
        return <AIForge />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: Zap },
    { id: 'quiz', label: 'Savollar', icon: Brain },
    { id: 'leaderboard', label: 'Reyting', icon: Trophy },
    { id: 'wallet', label: 'Hamyon', icon: WalletIcon },
    { id: 'ai-forge', label: 'AI Forge', icon: Sparkles },
    ...(profile?.is_admin ? [{ id: 'admin', label: 'Admin', icon: ShieldAlert }] : [])
  ];

  return (
    <div className="relative min-h-screen bg-[#050816] text-white flex flex-col items-center select-none overflow-x-hidden antialiased">
      {/* 1. Starscape Cosmic Backdrop Layer */}
      <BackgroundParticles />

      {/* 2. Primary Layout Shell */}
      <div className="relative z-10 w-full max-w-md px-4 flex flex-col min-h-screen">
        {/* Top Branding Header */}
        <header className="flex justify-between items-center py-5 border-b border-white/[0.04] mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5B8CFF] to-[#8B5CF6] flex items-center justify-center font-bold text-sm tracking-tight shadow-[0_0_15px_rgba(91,140,255,0.25)]">
              BB
            </div>
            <span className="text-lg font-black tracking-widest bg-gradient-to-r from-white to-[#A1A1AA] bg-clip-text text-transparent">
              BRAINBET
            </span>
          </div>

          <span className="text-[9px] font-mono font-bold tracking-widest text-[#5B8CFF]/80 bg-[#5B8CFF]/10 px-2.5 py-1 rounded-full uppercase border border-[#5B8CFF]/10">
            1-Bosqich MVP
          </span>
        </header>

        {/* Floating notifications */}
        <ToastContainer />

        {/* 3. Sliding Screen Container */}
        <main className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.99, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 4. Elegant Footer Dock Bar Navigation */}
        <nav className="fixed bottom-4 left-4 right-4 z-40">
          <div className="relative flex justify-around items-center h-16 bg-[#070b1e]/85 backdrop-blur-lg border border-white/[0.08] rounded-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.8)] px-2">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative flex flex-col items-center justify-center h-full w-14 focus:outline-none cursor-pointer group"
                >
                  {/* Dynamic indicator pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute -top-1 w-8 h-1 bg-[#5B8CFF] rounded-full shadow-[0_0_12px_rgba(91,140,255,0.8)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <IconComponent 
                    className={`w-5 h-5 transition-transform duration-200 group-active:scale-90 ${isActive ? 'text-[#5B8CFF] scale-105' : 'text-[#A1A1AA]/60 hover:text-[#A1A1AA]'}`} 
                  />
                  
                  <span className={`text-[9px] font-semibold mt-1 transition-colors ${isActive ? 'text-[#5B8CFF]' : 'text-[#A1A1AA]/50'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <TelegramProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </TelegramProvider>
  );
}
