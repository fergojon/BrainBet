/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// Declare standard type interfaces for Telegram WebApp SDK global object
export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    receiver?: any;
    chat_instance?: string;
    chat_type?: string;
    auth_date?: number;
    hash?: string;
  };
  
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };
  
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string;
  isTelegram: boolean;
  theme: 'light' | 'dark';
  haptics: {
    impact: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [isTelegram, setIsTelegram] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Look for Telegram script injection
    const tg = (window as any).Telegram?.WebApp as TelegramWebApp | undefined;

    if (tg && tg.initData) {
      console.log('Telegram WebApp environment detected.');
      setWebApp(tg);
      setInitData(tg.initData);
      setIsTelegram(true);
      setTheme(tg.colorScheme || 'dark');
      
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Signal Telegram WebApp container that we are fully rendered and ready
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation(); // Prompt user before accidental closing swipe
    } else {
      console.warn('Telegram WebApp SDK not found or initData is empty. Bootstrapping mock sandbox session.');
      // Create high-fidelity mock session for local / AI Studio development
      const mockUser: TelegramUser = {
        id: 711824249,
        username: 'brainbet_architect',
        first_name: 'Antigravity',
        last_name: 'Builder',
        is_premium: true
      };
      
      // Fake initData matching format requirements: user, auth_date, hash
      const mockInitData = `query_id=AAEq8KswAgAAACrwqzAnU7P7&user=${encodeURIComponent(JSON.stringify(mockUser))}&auth_date=1721207747&hash=8f5db9996e5792d427d11f621a1135ef0efca25cfcd0b2d6ffae278f21915469`;
      
      setUser(mockUser);
      setInitData(mockInitData);
      setIsTelegram(false);
      setTheme('dark');
    }
  }, []);

  // Standardized Haptic feedback wrapper that falls back gracefully
  const haptics = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(style);
      } else {
        console.log(`[Mock Haptics] Impact: ${style}`);
      }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred(type);
      } else {
        console.log(`[Mock Haptics] Notification: ${type}`);
      }
    },
    selection: () => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.selectionChanged();
      } else {
        console.log('[Mock Haptics] Selection changed');
      }
    }
  };

  return (
    <TelegramContext.Provider value={{ webApp, user, initData, isTelegram, theme, haptics }}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};
