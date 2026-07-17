/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext.js';

/**
 * Floating Alert Notification Manager
 * Renders stacked notifications with dynamic color states and automatic click dismissals.
 */
export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md text-xs font-medium
                ${isError 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_4px_20px_rgba(239,68,68,0.2)]' 
                  : isSuccess
                    ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_4px_20px_rgba(34,197,94,0.2)]'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_4px_20px_rgba(91,140,255,0.2)]'
                }
              `}
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {/* Type Icon */}
              {isError ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : isSuccess ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Info className="w-4 h-4 shrink-0" />
              )}

              {/* Message Payload */}
              <div className="flex-1 leading-normal pr-1">{toast.message}</div>

              {/* Manual Dismiss */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="hover:opacity-80 transition-opacity p-0.5"
              >
                <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
export default ToastContainer;
