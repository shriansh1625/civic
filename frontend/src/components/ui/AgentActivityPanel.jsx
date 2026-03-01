/**
 * CivicLens AI — Agent Activity Panel
 * Collapsible floating panel showing real agent states, tasks, and timestamps.
 * Only shows activity when actual API calls are in-flight.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIActivity } from '../../hooks/useAIActivity';
import { Activity, ChevronDown, ChevronUp, Cpu, Zap } from 'lucide-react';

const statusColors = {
  active:    'bg-saffron-500',
  completed: 'bg-emerald-400',
  error:     'bg-red-400',
  idle:      'bg-gray-600',
};

const statusLabels = {
  active:    'Active',
  completed: 'Done',
  error:     'Error',
  idle:      'Idle',
};

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function AgentActivityPanel() {
  const { activeAgents, isProcessing, activeCount } = useAIActivity();
  const [expanded, setExpanded] = useState(false);

  const agents = Object.values(activeAgents).filter(a => a.status !== undefined);
  const hasActivity = agents.length > 0;

  if (!hasActivity && !isProcessing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-[45] w-80"
    >
      {/* Header — always visible when there's activity */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-t-2xl ${!expanded ? 'rounded-b-2xl' : ''} 
          bg-navy-800/90 backdrop-blur-2xl border border-white/[0.08] 
          ${isProcessing ? 'shadow-lg shadow-saffron-500/10' : 'shadow-lg shadow-black/20'}
          transition-all duration-300 cursor-pointer`}
      >
        <div className="relative">
          <Cpu className={`w-4.5 h-4.5 ${isProcessing ? 'text-saffron-400' : 'text-gray-400'}`} />
          {isProcessing && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
          )}
        </div>
        <div className="flex-1 text-left">
          <span className="text-xs font-semibold text-white">AI Agents</span>
          <span className={`ml-2 text-[10px] font-medium ${isProcessing ? 'text-saffron-400' : 'text-gray-500'}`}>
            {isProcessing ? `${activeCount} active` : 'Idle'}
          </span>
        </div>
        {isProcessing && (
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-saffron-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-3 bg-saffron-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-3 bg-saffron-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-navy-800/95 backdrop-blur-2xl border border-t-0 border-white/[0.08] rounded-b-2xl p-3 space-y-2">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                >
                  {/* Status dot */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                    {agent.status === 'active' && (
                      <div className={`absolute inset-0 w-2 h-2 rounded-full ${statusColors[agent.status]} animate-ping opacity-50`} />
                    )}
                  </div>

                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{agent.icon}</span>
                      <span className="text-[11px] font-semibold text-white truncate">{agent.name}</span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${
                      agent.status === 'active' ? 'text-saffron-400' :
                      agent.status === 'completed' ? 'text-emerald-400' :
                      agent.status === 'error' ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {agent.task}
                    </p>
                  </div>

                  {/* Timestamp / Status */}
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                      agent.status === 'active' ? 'bg-saffron-500/15 text-saffron-400' :
                      agent.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                      agent.status === 'error' ? 'bg-red-500/15 text-red-400' :
                      'bg-white/[0.04] text-gray-500'
                    }`}>
                      {statusLabels[agent.status]}
                    </span>
                    {(agent.completedAt || agent.startedAt) && (
                      <p className="text-[9px] text-gray-600 mt-0.5">
                        {timeAgo(agent.completedAt || agent.startedAt)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {agents.length === 0 && (
                <div className="text-center py-3">
                  <p className="text-[11px] text-gray-500">No recent agent activity</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
