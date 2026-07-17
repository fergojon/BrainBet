/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the required XP for a given level using an exponential progression scale.
 * Formula: Required XP = base * (level ^ exponent)
 * level 1 -> 2: 100 XP
 * level 2 -> 3: 220 XP
 * level 3 -> 4: 380 XP
 * level 4 -> 5: 580 XP
 */
export function getRequiredXpForLevel(level: number): number {
  if (level <= 0) return 100;
  const base = 100;
  const exponent = 1.3;
  return Math.round(base * Math.pow(level, exponent));
}
