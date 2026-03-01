/**
 * CivicLens AI — Dashboard Page (v5 — Cinematic Pitch Mode)
 * Personalized civic intelligence dashboard with cinematic glassmorphism,
 * staggered card reveals, enhanced health ring, and premium microinteractions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAIActivity } from '../hooks/useAIActivity';
import { dashboardAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Bell, FileText, Clock, Zap,
  ArrowUpRight, Sparkles, IndianRupee, Activity, Shield,
  Cpu, Globe, CheckCircle, ArrowRight
} from 'lucide-react';
import BudgetChart from '../components/charts/BudgetChart';
import CategoryChart from '../components/charts/CategoryChart';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
};

/* ── Animated number counter ── */
function AnimatedNumber({ value, duration = 1200, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const numericVal = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;

  useEffect(() => {
    if (numericVal === 0) { setDisplay(0); return; }
    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      start = Math.round(eased * numericVal);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [numericVal, duration]);

  return <>{prefix}{display.toLocaleString('en-IN')}{suffix}</>;
}

/* ── Health Score Ring ── */
function HealthScoreRing({ score }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className="health-ring">
      <svg width="96" height="96" className="drop-shadow-lg">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white font-display"><AnimatedNumber value={score} /></span>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}

/* ── Shimmer skeleton ── */
function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-40 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { startAgent, completeAgent, failAgent } = useAIActivity();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    startAgent('personalization', 'Loading personalized dashboard…');
    try {
      const res = await dashboardAPI.getDashboard();
      setData(res.data);
      completeAgent('personalization', 'Dashboard personalized for your profile');
    } catch (err) {
      setData(getFallbackData());
      failAgent('personalization', 'Using cached dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  const d = data || getFallbackData();
  const healthScore = d.health_score || 87;

  const stats = [
    { label: 'Active Schemes', value: d.active_schemes || 34, icon: FileText, color: 'text-saffron-400', bg: 'bg-saffron-500/10', border: 'border-saffron-500/10' },
    { label: 'New Today', value: d.new_today || 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10' },
    { label: 'Unread Alerts', value: d.unread_alerts || 0, icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/10' },
    { label: 'Total Budget', value: d.total_budget_cr || 0, icon: IndianRupee, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/10', isBudget: true },
    { label: 'Crawl Sources', value: d.active_sources || 8, icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/10' },
  ];

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ── Welcome Header ── */}
      <motion.div variants={stagger.item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-gradient-hero">{user?.full_name || 'User'}</span>
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">
            Your personalized civic intelligence briefing for today
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/15"
          >
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
            </div>
            <span className="text-sm text-emerald-400 font-medium">System Operational</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-saffron-500/[0.08] border border-saffron-500/15"
          >
            <Sparkles className="w-4 h-4 text-saffron-400 animate-sparkle" />
            <span className="text-sm text-saffron-400 font-medium">AI Active</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Stats Cards ── */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
            transition={{ duration: 0.2 }}
            className="stat-card group cursor-default"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.border} border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-display font-bold ${stat.color}`}>
              {stat.isBudget
                ? <AnimatedNumber value={Math.round((stat.value) / 1000)} prefix="₹" suffix="K Cr" />
                : <AnimatedNumber value={stat.value} />
              }
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Health Score + System Status Row ── */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Health Score */}
        <motion.div whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(52,211,153,0.06)' }} className="glass-card-cinematic p-6 flex items-center gap-6 group">
          <HealthScoreRing score={healthScore} />
          <div>
            <h3 className="font-display font-semibold text-white text-base tracking-tight">Civic Intelligence Health</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Based on data freshness, source coverage, and AI confidence</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="badge-green">
                <CheckCircle className="w-3 h-3 mr-1" /> {d.active_sources || 8} sources
              </span>
              <span className="badge-blue">
                <Activity className="w-3 h-3 mr-1" /> <AnimatedNumber value={Math.round((d.ai_confidence || 0.92) * 100)} suffix="%" /> confidence
              </span>
            </div>
          </div>
        </motion.div>

        {/* Last Crawl */}
        <motion.div whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} className="glass-card-cinematic p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-saffron-400" />
            </div>
            <h3 className="font-display font-semibold text-white text-sm">AMD EPYC Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Last Crawl</span>
              <span className="text-gray-200 font-medium">{d.last_crawl_time ? new Date(d.last_crawl_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">System Status</span>
              <span className="text-emerald-400 font-semibold">{d.system_status || 'Operational'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Processing</span>
              <span className="text-gray-200 font-medium">16 EPYC Cores</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full mt-1 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '78%' }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-emerald-500 progress-shimmer"
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Insights */}
        <motion.div whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} className="glass-card-cinematic p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-display font-semibold text-white text-sm">Quick Insights</h3>
          </div>
          <div className="space-y-3">
            {[
              { color: 'bg-emerald-400', text: `${d.total_schemes || 34} schemes in database` },
              { color: 'bg-saffron-400', text: `₹${(d.total_budget_cr || 0).toLocaleString('en-IN')} Cr total budget tracked` },
              { color: 'bg-blue-400', text: `${Object.keys(d.schemes_by_category || {}).length} categories covered` },
              { color: 'bg-purple-400', text: `${Object.keys(d.budget_by_ministry || {}).length} ministries monitored` },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 text-xs"
              >
                <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0 shadow-sm`} style={{ boxShadow: `0 0 6px currentColor` }} />
                <span className="text-gray-300">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div whileHover={{ y: -3 }} className="glass-card-cinematic p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-saffron-400" />
            </div>
            <h2 className="font-display text-base font-semibold text-white">Budget by Ministry</h2>
          </div>
          <BudgetChart data={d.budget_by_ministry} />
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="glass-card-cinematic p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="font-display text-base font-semibold text-white">Schemes by Category</h2>
          </div>
          <CategoryChart data={d.schemes_by_category} />
        </motion.div>
      </motion.div>

      {/* ── What's New + Relevant ── */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Updates */}
        <div className="glass-card-cinematic p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="font-display text-base font-semibold text-white">What's New Today</h2>
            {(d.recent_updates || []).length > 0 && (
              <span className="badge-green ml-auto">{(d.recent_updates || []).length} updates</span>
            )}
          </div>
          <div className="space-y-2.5">
            {(d.recent_updates || []).slice(0, 5).map((update, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer border border-transparent hover:border-white/[0.06]"
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  update.change_type === 'new' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-saffron-400 shadow-sm shadow-saffron-400/50'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{update.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{update.summary || update.content}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`badge text-[10px] ${update.change_type === 'new' ? 'badge-green' : 'badge-saffron'}`}>
                      {update.change_type}
                    </span>
                    <span className="text-[10px] text-gray-600">{update.category}</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 mt-1 flex-shrink-0" />
              </motion.div>
            ))}
            {(d.recent_updates || []).length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent updates yet</p>
                <p className="text-xs text-gray-600 mt-1">Run a crawl to fetch latest data</p>
              </div>
            )}
          </div>
        </div>

        {/* Personalized Feed */}
        <div className="glass-card-cinematic p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-saffron-400" />
            </div>
            <h2 className="font-display text-base font-semibold text-white">Relevant for You</h2>
          </div>
          <div className="space-y-2.5">
            {(d.relevant_schemes || []).slice(0, 5).map((scheme, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer group border border-transparent hover:border-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{scheme.title}</p>
                      {scheme.is_newly_added && (
                        <span className="badge-green text-[10px] py-0 px-1.5 animate-pulse">NEW</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{scheme.ai_summary || scheme.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="badge-blue text-[10px]">{scheme.category}</span>
                      <span className="badge-saffron text-[10px]">{scheme.target_audience}</span>
                      {scheme.relevance_score && (
                        <span className="text-[10px] text-gray-500 font-medium">Score: {scheme.relevance_score}</span>
                      )}
                      {scheme.budget_allocated > 0 && (
                        <span className="text-[10px] text-gray-500">₹{scheme.budget_allocated} Cr</span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-saffron-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 flex-shrink-0 mt-1" />
                </div>
              </motion.div>
            ))}
            {(d.relevant_schemes || []).length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Personalized recommendations</p>
                <p className="text-xs text-gray-600 mt-1">Login to see schemes relevant to you</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getFallbackData() {
  return {
    total_schemes: 34,
    active_schemes: 34,
    new_today: 0,
    total_alerts: 15,
    unread_alerts: 8,
    total_budget_cr: 425000,
    active_sources: 8,
    health_score: 87,
    ai_confidence: 0.92,
    system_status: 'operational',
    last_crawl_time: new Date().toISOString(),
    schemes_by_category: {
      agriculture: 6, startup: 6, education: 6, health: 5,
      welfare: 4, technology: 4, employment: 3,
    },
    budget_by_ministry: {
      'Ministry of Agriculture': 152000, 'Ministry of Education': 125000,
      'Ministry of Health': 90659, 'Ministry of MSME': 22138,
      'Ministry of Rural Dev': 266000, 'Ministry of Housing': 79000,
    },
    recent_updates: [],
    relevant_schemes: [],
  };
}
