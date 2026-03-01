/**
 * CivicLens AI — AI Activity Context
 * Central state management for tracking real agent activity across the application.
 * Reflects actual API call states — never fabricates agent activity.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AIActivityContext = createContext(null);

/* Agent definitions matching the real backend pipeline */
const AGENTS = {
  crawl:          { id: 'crawl',          name: 'Crawl Agent',          icon: '🔍' },
  parser:         { id: 'parser',         name: 'Parser Agent',         icon: '📄' },
  validation:     { id: 'validation',     name: 'Validation Agent',     icon: '✅' },
  summarization:  { id: 'summarization',  name: 'Summarization Agent',  icon: '🧠' },
  personalization:{ id: 'personalization', name: 'Personalization Agent', icon: '🎯' },
  notification:   { id: 'notification',   name: 'Notification Agent',   icon: '🔔' },
};

/**
 * Provides global AI activity state.
 * - `activeAgents` tracks which agents are currently processing
 * - `logs` stores timestamped agent activity entries
 * - `startAgent` / `completeAgent` / `failAgent` are called from real API flows
 * - `isProcessing` is true when any agent is active
 */
export function AIActivityProvider({ children }) {
  const [activeAgents, setActiveAgents] = useState({});
  const [logs, setLogs] = useState([]);
  const logIdRef = useRef(0);

  const addLog = useCallback((agentId, message, type = 'info') => {
    const agent = AGENTS[agentId] || { id: agentId, name: agentId, icon: '⚙️' };
    setLogs(prev => [{
      id: ++logIdRef.current,
      timestamp: new Date(),
      agentId,
      agentName: agent.name,
      agentIcon: agent.icon,
      message,
      type, // 'info' | 'success' | 'error' | 'processing'
    }, ...prev].slice(0, 50)); // Keep last 50 entries
  }, []);

  const startAgent = useCallback((agentId, task = '') => {
    const agent = AGENTS[agentId] || { id: agentId, name: agentId, icon: '⚙️' };
    setActiveAgents(prev => ({
      ...prev,
      [agentId]: {
        ...agent,
        status: 'active',
        task: task || `Processing…`,
        startedAt: new Date(),
      },
    }));
    addLog(agentId, task || 'Started processing', 'processing');
  }, [addLog]);

  const completeAgent = useCallback((agentId, summary = '') => {
    setActiveAgents(prev => {
      const updated = { ...prev };
      if (updated[agentId]) {
        updated[agentId] = {
          ...updated[agentId],
          status: 'completed',
          completedAt: new Date(),
          task: summary || 'Completed',
        };
      }
      return updated;
    });
    addLog(agentId, summary || 'Task completed', 'success');

    // Auto-clear completed agents after 8 seconds
    setTimeout(() => {
      setActiveAgents(prev => {
        const updated = { ...prev };
        if (updated[agentId]?.status === 'completed') {
          updated[agentId] = { ...updated[agentId], status: 'idle' };
        }
        return updated;
      });
    }, 8000);
  }, [addLog]);

  const failAgent = useCallback((agentId, error = '') => {
    setActiveAgents(prev => {
      const updated = { ...prev };
      if (updated[agentId]) {
        updated[agentId] = {
          ...updated[agentId],
          status: 'error',
          task: error || 'Error occurred',
        };
      }
      return updated;
    });
    addLog(agentId, error || 'Error encountered', 'error');
  }, [addLog]);

  const clearLogs = useCallback(() => setLogs([]), []);

  // Derived state
  const isProcessing = Object.values(activeAgents).some(a => a.status === 'active');
  const activeCount = Object.values(activeAgents).filter(a => a.status === 'active').length;

  return (
    <AIActivityContext.Provider value={{
      activeAgents,
      logs,
      isProcessing,
      activeCount,
      startAgent,
      completeAgent,
      failAgent,
      clearLogs,
      AGENTS,
    }}>
      {children}
    </AIActivityContext.Provider>
  );
}

export const useAIActivity = () => {
  const ctx = useContext(AIActivityContext);
  if (!ctx) throw new Error('useAIActivity must be used within AIActivityProvider');
  return ctx;
};
