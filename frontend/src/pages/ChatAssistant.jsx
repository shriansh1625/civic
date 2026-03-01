/**
 * CivicLens AI — AI Chat Assistant (v5 — Cinematic Pitch Mode)
 * Framer Motion message animations, premium glassmorphism, animated confidence bar.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI } from '../services/api';
import { useAIActivity } from '../hooks/useAIActivity';
import { AIConfidenceInline } from '../components/ui/AIConfidenceRing';
import {
  Send, Bot, User, Sparkles, Copy, Check, HelpCircle,
  ExternalLink, IndianRupee, Calendar, FileText, ArrowRight, MessageSquare
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "What agriculture schemes are available for farmers?",
  "How to apply for Startup India Seed Fund?",
  "Compare education scholarships for students",
  "What is the budget for PM-KISAN?",
  "Am I eligible for Ayushman Bharat?",
  "List all schemes with deadlines approaching",
  "What documents do I need for MUDRA loan?",
  "Show me technology schemes in Karnataka",
];

function SchemeCard({ card }) {
  const budgetLabel = card.budget_cr ? `₹${card.budget_cr.toLocaleString('en-IN')} Cr` : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 mt-2 hover:border-saffron-500/15 hover:bg-white/[0.06] transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{card.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{card.ministry}</p>
        </div>
        {card.relevance_tag && (
          <span className="badge-green text-[9px] py-0 px-1.5 flex-shrink-0">{card.relevance_tag}</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{card.eligibility}</p>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className="badge-blue text-[10px]">{card.category}</span>
        {budgetLabel && (
          <span className="badge bg-emerald-500/15 text-emerald-400 text-[10px]">
            <IndianRupee className="w-2.5 h-2.5 mr-0.5" />{budgetLabel}
          </span>
        )}
        {card.deadline && card.deadline !== 'Ongoing' && (
          <span className="badge bg-red-500/15 text-red-400 text-[10px]">
            <Calendar className="w-2.5 h-2.5 mr-0.5" />{card.deadline}
          </span>
        )}
        {card.source_url && (
          <a href={card.source_url} target="_blank" rel="noopener noreferrer"
            className="badge bg-white/[0.04] text-saffron-400 text-[10px] hover:bg-saffron-500/15 transition-colors">
            <ExternalLink className="w-2.5 h-2.5 mr-0.5" />Portal
          </a>
        )}
      </div>
    </motion.div>
  );
}

function renderMarkdown(text) {
  // Simple markdown-like rendering
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-white mt-2 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-white mt-2 mb-1">{line.slice(3)}</h3>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold text-white mt-1">{line.slice(2, -2)}</p>;
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.slice(2);
      // Bold segments
      const parts = content.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} className="flex items-start gap-2 ml-1 text-sm text-gray-300">
          <span className="text-saffron-400 mt-0.5">•</span>
          <span>{parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-white">{p.slice(2, -2)}</strong> : p)}</span>
        </div>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />;
    // Inline bolds
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="text-sm text-gray-200 leading-relaxed">
        {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-white">{p.slice(2, -2)}</strong> : p)}
      </p>
    );
  });
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Namaste! 🙏 I'm **CivicLens AI**, your civic intelligence assistant. I can help you with:\n\n- Information about **Government of India schemes**\n- **Eligibility criteria** and application processes\n- Budget allocations and **policy updates**\n- Personalized scheme recommendations\n- Document requirements and **deadlines**\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const { startAgent, completeAgent, failAgent } = useAIActivity();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    startAgent('summarization', `Searching schemes for: "${text.trim().slice(0, 40)}…"`);

    try {
      const res = await chatAPI.ask(text.trim());
      const data = res.data;
      const assistantMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        scheme_cards: data.scheme_cards || [],
        suggested_actions: data.suggested_actions || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      completeAgent('summarization', `Found ${data.scheme_cards?.length || 0} schemes, ${Math.round((data.confidence || 0) * 100)}% confidence`);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "I apologize, I'm having trouble processing your request right now. Please try again or rephrase your question.",
      }]);
      failAgent('summarization', 'Failed to process query');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-[calc(100vh-10rem)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.06]">
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          className="w-10 h-10 rounded-xl saffron-gradient flex items-center justify-center shadow-lg shadow-saffron-500/25 ring-2 ring-saffron-500/10"
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <h1 className="font-display text-lg font-bold text-white tracking-tight">AI Chat Assistant</h1>
          <p className="text-xs text-gray-500">Real-time scheme search powered by CivicLens AI</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50"></div>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Online • {messages.length - 1} msgs</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user'
                ? 'saffron-gradient shadow-sm shadow-saffron-500/20'
                : 'bg-white/[0.06] border border-white/[0.08]'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-saffron-400" />}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-saffron-500/15 border border-saffron-500/20'
                  : 'bg-white/[0.06] border border-white/[0.08] shadow-lg shadow-black/10'
              }`}>
                <div className="chat-markdown">{renderMarkdown(msg.content)}</div>

                {/* Scheme Cards */}
                {msg.scheme_cards?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-xs text-saffron-400 font-semibold mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Matching Schemes ({msg.scheme_cards.length})
                    </p>
                    {msg.scheme_cards.map((card, j) => (
                      <SchemeCard key={j} card={card} />
                    ))}
                  </div>
                )}

                {/* Suggested Actions */}
                {msg.suggested_actions?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-[11px] text-gray-500 mb-2">Related questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggested_actions.map((action, j) => (
                        <button key={j} onClick={() => sendMessage(action)}
                          className="px-2.5 py-1.5 rounded-lg bg-saffron-500/[0.08] border border-saffron-500/15 text-[11px] text-saffron-400 hover:bg-saffron-500/20 hover:border-saffron-500/25 transition-all flex items-center gap-1">
                          <ArrowRight className="w-2.5 h-2.5" /> {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {msg.sources?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-[11px] text-gray-500 mb-1">Sources:</p>
                    {msg.sources.map((src, j) => (
                      <a key={j} href={src} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-saffron-400/80 hover:text-saffron-400 block truncate">
                        {src}
                      </a>
                    ))}
                  </div>
                )}

                {msg.confidence && (
                  <div className="mt-3 pt-2">
                    <AIConfidenceInline
                      score={Math.round(msg.confidence * 100)}
                      label="AI Confidence"
                    />
                  </div>
                )}
              </div>

              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  {copied === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === i ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-saffron-400" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-saffron-400 typing-dot"></div>
                  <div className="w-2 h-2 rounded-full bg-saffron-400 typing-dot"></div>
                  <div className="w-2 h-2 rounded-full bg-saffron-400 typing-dot"></div>
                </div>
                <span className="text-xs text-gray-500">Searching schemes & analyzing...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="py-4">
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Try asking
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(q)}
                className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-gray-300 hover:bg-saffron-500/[0.08] hover:border-saffron-500/15 hover:text-saffron-400 transition-colors text-left"
              >
                {q}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pt-4 border-t border-white/[0.06]">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field pr-10 resize-none h-12 py-3 text-sm"
              placeholder="Ask about any government scheme or policy..."
              rows={1}
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Sparkles className="w-4 h-4 text-gray-600 group-focus-within:text-saffron-500/50 transition-colors" />
            </div>
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          CivicLens AI searches schemes in real-time • Always verify at official sources
        </p>
      </div>
    </motion.div>
  );
}
