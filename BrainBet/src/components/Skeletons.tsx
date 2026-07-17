/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Shimmering animated profile skeleton for Dashboard loading
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse">
      {/* Header Profile Info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.05]" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-5 w-32 bg-white/[0.05] rounded-md" />
          <div className="h-3.5 w-20 bg-white/[0.03] rounded-md" />
        </div>
        <div className="w-24 h-8 bg-white/[0.04] rounded-full" />
      </div>

      {/* Tally Balance Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-28 bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col gap-2 justify-center">
          <div className="h-3 w-12 bg-white/[0.03] rounded" />
          <div className="h-8 w-24 bg-white/[0.05] rounded-md" />
        </div>
        <div className="h-28 bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col gap-2 justify-center">
          <div className="h-3 w-16 bg-white/[0.03] rounded" />
          <div className="h-8 w-20 bg-white/[0.05] rounded-md" />
        </div>
      </div>

      {/* Progress Bar Widget */}
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-white/[0.04] rounded" />
          <div className="h-3 w-16 bg-white/[0.04] rounded" />
        </div>
        <div className="h-3 w-full bg-white/[0.03] rounded-full" />
      </div>

      {/* Main Trigger Button */}
      <div className="h-14 w-full bg-white/[0.04] rounded-xl" />
    </div>
  );
};

/**
 * Shimmering animated trivia card skeleton for Quiz page loading
 */
export const QuizSkeleton: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-5 animate-pulse">
      {/* Badges Info */}
      <div className="flex justify-between items-center">
        <div className="h-6 w-20 bg-white/[0.04] rounded-full" />
        <div className="h-6 w-16 bg-white/[0.04] rounded-full" />
      </div>

      {/* Question Statement Card */}
      <div className="h-36 bg-white/[0.03] border border-white/[0.05] rounded-3xl p-5 flex flex-col gap-3 justify-center">
        <div className="h-4 w-5/6 bg-white/[0.05] rounded" />
        <div className="h-4 w-2/3 bg-white/[0.03] rounded" />
      </div>

      {/* Multiple-choice options */}
      <div className="flex flex-col gap-3">
        <div className="h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl" />
        <div className="h-14 bg-[#5b8cff]/5 border border-[#5b8cff]/10 rounded-2xl" />
        <div className="h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl" />
        <div className="h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl" />
      </div>
    </div>
  );
};

/**
 * Shimmering animated list skeleton for Leaderboard rankings
 */
export const LeaderboardSkeleton: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-3 animate-pulse">
      {/* Top 3 podium items */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="h-32 bg-white/[0.03] border border-white/[0.05] rounded-2xl" />
        <div className="h-36 bg-white/[0.04] border border-white/[0.06] rounded-2xl" />
        <div className="h-32 bg-white/[0.03] border border-white/[0.05] rounded-2xl" />
      </div>

      {/* Remaining list items */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center px-4 gap-4">
            <div className="w-5 h-5 bg-white/[0.04] rounded" />
            <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-3.5 w-24 bg-white/[0.04] rounded" />
              <div className="h-2.5 w-12 bg-white/[0.02] rounded" />
            </div>
            <div className="w-12 h-5 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
