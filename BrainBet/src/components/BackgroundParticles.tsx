/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

/**
 * Ambient Cosmic Particle Background
 * Generates floating particles that drift slowly on our rich `#050816` canvas.
 */
export const BackgroundParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate a fixed set of particles to prevent hydration mismatch
    const pool: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage x-axis
      y: Math.random() * 100, // percentage y-axis
      size: Math.random() * 2.5 + 0.5, // sizes from 0.5px to 3px
      duration: Math.random() * 15 + 10, // speed
      delay: Math.random() * -10 // offset
    }));
    setParticles(pool);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#050816]">
      {/* Central Ambient Color Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_left,rgba(91,140,255,0.08),transparent_70%)] blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.07),transparent_70%)] blur-[120px]" />
      <div className="absolute top-[40%] right-[20%] w-[50%] h-[40%] rounded-full bg-[radial-gradient(circle_at_center,rgba(91,140,255,0.03),transparent_60%)] blur-[80px]" />

      {/* Grid Pattern Mesh */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Drifting particles layer */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white opacity-40 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};
export default BackgroundParticles;
