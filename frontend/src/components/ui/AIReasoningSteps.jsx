/**
 * CivicLens AI — AI Reasoning Steps
 * Animated sequential display of AI processing stages.
 * Steps reveal with staggered animation tied to real loading states.
 * Each step shows a progress indicator that becomes a checkmark when complete.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array} props.steps - Array of { label: string, detail?: string }
 * @param {boolean} props.active - Whether the reasoning process is running
 * @param {boolean} props.completed - Whether all steps finished
 * @param {boolean} props.error - Whether processing failed
 * @param {string} props.errorMessage - Error message to display
 * @param {number} props.stepInterval - ms between each step reveal (default: 600)
 */
export default function AIReasoningSteps({
  steps = [],
  active = false,
  completed = false,
  error = false,
  errorMessage = '',
  stepInterval = 600,
}) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const intervalRef = useRef(null);

  // Advance steps while active
  useEffect(() => {
    if (active && steps.length > 0) {
      setCurrentStep(0);
      setCompletedSteps(new Set());

      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            setCompletedSteps(cs => new Set([...cs, prev]));
            return prev + 1;
          }
          clearInterval(intervalRef.current);
          return prev;
        });
      }, stepInterval);

      return () => clearInterval(intervalRef.current);
    }
  }, [active, steps.length, stepInterval]);

  // Mark all complete when completed prop is true
  useEffect(() => {
    if (completed && steps.length > 0) {
      clearInterval(intervalRef.current);
      setCompletedSteps(new Set(steps.map((_, i) => i)));
      setCurrentStep(steps.length);
    }
  }, [completed, steps.length]);

  // Reset on error
  useEffect(() => {
    if (error) {
      clearInterval(intervalRef.current);
    }
  }, [error]);

  if (!active && !completed && !error) return null;
  if (steps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          {active && !completed && !error ? (
            <Loader2 className="w-4 h-4 text-saffron-400 animate-spin" />
          ) : completed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        <span className={`text-xs font-semibold ${
          completed ? 'text-emerald-400' : error ? 'text-red-400' : 'text-saffron-400'
        }`}>
          {completed ? 'Analysis Complete' : error ? 'Processing Error' : 'AI Processing…'}
        </span>
      </div>

      {steps.map((step, i) => {
        const isCompleted = completedSteps.has(i);
        const isCurrent = i === currentStep && !completedSteps.has(i);
        const isPending = i > currentStep;
        const isFailed = error && isCurrent;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{
              opacity: isPending && !completed ? 0.3 : 1,
              x: 0,
            }}
            transition={{ duration: 0.3, delay: active ? i * 0.08 : 0 }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-300 ${
              isCompleted ? 'bg-emerald-500/[0.04]' :
              isCurrent ? 'bg-saffron-500/[0.06]' :
              isFailed ? 'bg-red-500/[0.04]' :
              'bg-transparent'
            }`}
          >
            {/* Step indicator */}
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </motion.div>
              ) : isCurrent && !isFailed ? (
                <Loader2 className="w-4 h-4 text-saffron-400 animate-spin" />
              ) : isFailed ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-gray-600" />
              )}
            </div>

            {/* Step label */}
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-medium ${
                isCompleted ? 'text-emerald-300' :
                isCurrent ? 'text-white' :
                isFailed ? 'text-red-300' :
                'text-gray-500'
              }`}>
                {step.label}
              </span>
              {step.detail && isCompleted && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-gray-500 ml-2"
                >
                  {step.detail}
                </motion.span>
              )}
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div className={`absolute left-[1.65rem] w-px h-2 ${
                isCompleted ? 'bg-emerald-500/30' : 'bg-white/[0.04]'
              }`} style={{ top: '100%' }} />
            )}
          </motion.div>
        );
      })}

      {/* Error message */}
      {error && errorMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400 mt-2 px-3"
        >
          {errorMessage}
        </motion.p>
      )}
    </motion.div>
  );
}
