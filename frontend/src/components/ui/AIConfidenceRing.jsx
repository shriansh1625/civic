/**
 * CivicLens AI — AI Confidence Ring
 * Animated circular progress ring for displaying AI confidence scores.
 * Color-coded: Green (85-100), Amber (60-84), Red (<60).
 * Glow intensity scales with confidence value.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function getConfidenceColor(score) {
  if (score >= 85) return { stroke: '#34d399', glow: 'rgba(52,211,153,', label: 'High', bg: 'bg-emerald-500/10' };
  if (score >= 60) return { stroke: '#fbbf24', glow: 'rgba(251,191,36,', label: 'Medium', bg: 'bg-amber-500/10' };
  return { stroke: '#f87171', glow: 'rgba(248,113,113,', label: 'Low', bg: 'bg-red-500/10' };
}

export default function AIConfidenceRing({
  score = 0,
  size = 80,
  strokeWidth = 4,
  label = 'Confidence',
  showLabel = true,
  showGlow = true,
  animated = true,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const { stroke, glow, label: riskLabel, bg } = getConfidenceColor(clampedScore);
  const glowIntensity = (clampedScore / 100) * 0.3;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (clampedScore / 100) * circumference);
    }, animated ? 200 : 0);
    return () => clearTimeout(timer);
  }, [clampedScore, circumference, animated]);

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative inline-flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow effect */}
        {showGlow && clampedScore > 0 && (
          <div
            className="absolute inset-0 rounded-full transition-all duration-1000"
            style={{
              boxShadow: `0 0 ${20 + clampedScore * 0.3}px ${glow}${glowIntensity})`,
            }}
          />
        )}

        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: `stroke-dashoffset ${animated ? '1.2s' : '0s'} cubic-bezier(0.22, 1, 0.36, 1)`,
              filter: showGlow ? `drop-shadow(0 0 4px ${glow}0.4))` : 'none',
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={clampedScore}
            initial={animated ? { scale: 0.5, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="font-display font-bold text-white"
            style={{ fontSize: size * 0.22 }}
          >
            {clampedScore}%
          </motion.span>
          {showLabel && (
            <span className="text-gray-500 font-medium" style={{ fontSize: Math.max(8, size * 0.1) }}>
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Risk label badge */}
      <motion.div
        initial={animated ? { opacity: 0, y: 4 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${bg}`}
        style={{ color: stroke }}
      >
        {riskLabel} Confidence
      </motion.div>
    </motion.div>
  );
}

/**
 * Compact inline version for use within result panels.
 */
export function AIConfidenceInline({ score = 0, label = '' }) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const { stroke, glow, label: riskLabel } = getConfidenceColor(clampedScore);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedScore}%` }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{
            backgroundColor: stroke,
            boxShadow: `0 0 8px ${glow}0.3)`,
          }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color: stroke }}>
        {clampedScore}%
      </span>
      {label && <span className="text-[10px] text-gray-500">{label}</span>}
    </div>
  );
}
