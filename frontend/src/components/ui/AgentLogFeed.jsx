/**
 * CivicLens AI — Agent Log Feed
 * Console-style, collapsible log panel showing timestamped agent activity.
 * Pulls logs from the useAIActivity context.
 * Styled as a terminal / dev-console aesthetic inside the app.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronDown, ChevronUp, Trash2, Circle } from 'lucide-react';
import { useAIActivity } from '../../hooks/useAIActivity';

const LOG_TYPE_STYLES = {
  info:       { color: 'text-blue-400',    dot: 'bg-blue-400' },
  success:    { color: 'text-emerald-400', dot: 'bg-emerald-400' },
  error:      { color: 'text-red-400',     dot: 'bg-red-400' },
  processing: { color: 'text-saffron-400', dot: 'bg-yellow-400' },
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AgentLogFeed() {
  const { logs, clearLogs, isProcessing } = useAIActivity();
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, expanded]);

  if (logs.length === 0 && !isProcessing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="fixed bottom-4 left-4 z-[44] w-96 max-w-[calc(100vw-2rem)]"
    >
      <div className="bg-[#0a1020]/95 backdrop-blur-xl border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Terminal className="w-4 h-4 text-saffron-400" />
              {isProcessing && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-saffron-400 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-xs font-semibold text-white/80">
              Agent Log
            </span>
            <span className="text-[10px] text-white/30 font-mono">
              ({logs.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); clearLogs(); }}
                className="p-1 rounded hover:bg-white/[0.05] text-white/20 hover:text-white/50 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-white/30" />
            )}
          </div>
        </button>

        {/* Log entries */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                ref={scrollRef}
                className="max-h-56 overflow-y-auto px-3 pb-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10"
                style={{
                  fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", monospace',
                }}
              >
                {logs.length === 0 ? (
                  <p className="text-[11px] text-white/20 py-3 text-center">
                    No agent activity yet…
                  </p>
                ) : (
                  logs.map((log) => {
                    const style = LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.info;
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-start gap-2 py-1 group"
                      >
                        <span className="text-[10px] text-white/20 flex-shrink-0 mt-0.5 font-mono">
                          {formatTime(log.timestamp)}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                        <span className={`text-[11px] leading-relaxed ${style.color}`}>
                          <span className="text-white/40">{log.agent}</span>
                          <span className="text-white/15 mx-1">—</span>
                          {log.message}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
