/**
 * CivicLens AI — Scheme Explorer (v5 — Cinematic Pitch Mode)
 * Framer Motion staggered card reveals, premium glassmorphism, animated modal.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { schemesAPI, trackingAPI } from '../services/api';
import {
  Search, Filter, MapPin, Users, ChevronDown,
  ExternalLink, IndianRupee, Calendar, FileText, X,
  AlertTriangle, Clock, Sparkles, TrendingUp, SlidersHorizontal, XCircle,
  Bell, BellOff, Loader2
} from 'lucide-react';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, y: 14, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  },
};

const CATEGORIES = [
  'all', 'education', 'agriculture', 'health', 'business',
  'startup', 'welfare', 'technology', 'employment', 'housing',
];

const AUDIENCES = [
  { value: 'all', label: 'All' },
  { value: 'student', label: '🎓 Student' },
  { value: 'farmer', label: '🌾 Farmer' },
  { value: 'msme', label: '🏭 MSME' },
  { value: 'startup', label: '🚀 Startup' },
  { value: 'ngo', label: '🤝 NGO' },
  { value: 'citizen', label: '🇮🇳 Citizen' },
];

const STATES = [
  'All India', 'Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Haryana',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

function DeadlineBadge({ deadline }) {
  if (!deadline || deadline === 'Ongoing' || deadline === 'Continuous') {
    return <span className="deadline-ongoing"><Clock className="w-3 h-3 mr-1" />Ongoing</span>;
  }
  // Try to parse deadline
  try {
    const parts = deadline.split(/[-/\s]+/);
    if (parts.length >= 3) {
      const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
        january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
      const day = parseInt(parts[0]);
      const month = months[parts[1].toLowerCase()] ?? parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const dl = new Date(year, month, day);
      const daysLeft = Math.ceil((dl - new Date()) / 86400000);
      if (daysLeft < 0) return <span className="badge bg-gray-500/20 text-gray-500"><Calendar className="w-3 h-3 mr-1" />Expired</span>;
      if (daysLeft <= 7) return <span className="deadline-critical"><AlertTriangle className="w-3 h-3 mr-1" />{daysLeft}d left!</span>;
      if (daysLeft <= 30) return <span className="deadline-approaching"><Clock className="w-3 h-3 mr-1" />{daysLeft}d left</span>;
      return <span className="deadline-open"><Calendar className="w-3 h-3 mr-1" />{deadline}</span>;
    }
  } catch {}
  return <span className="deadline-open"><Calendar className="w-3 h-3 mr-1" />{deadline}</span>;
}

function BudgetBadge({ amount }) {
  if (!amount || amount <= 0) return null;
  const tier = amount >= 50000 ? 'Mega' : amount >= 10000 ? 'Large' : amount >= 1000 ? 'Medium' : 'Small';
  const color = amount >= 50000 ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : amount >= 10000 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/15 text-blue-400';
  return (
    <span className={`badge ${color}`}>
      <IndianRupee className="w-3 h-3 mr-0.5" />₹{amount.toLocaleString('en-IN')} Cr
      <span className="ml-1 opacity-50 text-[9px]">({tier})</span>
    </span>
  );
}

export default function SchemeExplorer() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [audience, setAudience] = useState('all');
  const [state, setState] = useState('All India');
  const [selected, setSelected] = useState(null);
  const [total, setTotal] = useState(0);
  const [trackedSchemes, setTrackedSchemes] = useState(new Set());
  const [trackingLoading, setTrackingLoading] = useState(new Set());

  useEffect(() => {
    loadSchemes();
    loadSubscriptions();
  }, [category, audience, state]);

  const loadSubscriptions = async () => {
    try {
      const res = await trackingAPI.getSubscriptions();
      const ids = new Set((res.data || []).map(s => s.scheme_id));
      setTrackedSchemes(ids);
    } catch {}
  };

  const toggleTrack = async (e, schemeId) => {
    e.stopPropagation();
    setTrackingLoading(prev => new Set(prev).add(schemeId));
    try {
      if (trackedSchemes.has(schemeId)) {
        await trackingAPI.unsubscribe(schemeId);
        setTrackedSchemes(prev => { const n = new Set(prev); n.delete(schemeId); return n; });
      } else {
        await trackingAPI.subscribe(schemeId);
        setTrackedSchemes(prev => new Set(prev).add(schemeId));
      }
    } catch {}
    setTrackingLoading(prev => { const n = new Set(prev); n.delete(schemeId); return n; });
  };

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const res = await schemesAPI.getSchemes({
        category: category !== 'all' ? category : undefined,
        state: state !== 'All India' ? state : undefined,
        audience: audience !== 'all' ? audience : undefined,
        search: search || undefined,
      });
      setSchemes(res.data.schemes || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch {
      setSchemes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadSchemes();
  };

  const categoryColors = {
    education: 'bg-blue-500/20 text-blue-400',
    agriculture: 'bg-green-500/20 text-green-400',
    health: 'bg-red-500/20 text-red-400',
    business: 'bg-yellow-500/20 text-yellow-400',
    startup: 'bg-purple-500/20 text-purple-400',
    welfare: 'bg-pink-500/20 text-pink-400',
    technology: 'bg-cyan-500/20 text-cyan-400',
    employment: 'bg-orange-500/20 text-orange-400',
    housing: 'bg-lime-500/20 text-lime-400',
    infrastructure: 'bg-indigo-500/20 text-indigo-400',
  };

  // Check if scheme was added recently (within 24h of most recent scheme in the list)
  const isNew = (scheme) => {
    if (!scheme.created_at) return false;
    const created = new Date(scheme.created_at);
    const now = new Date();
    return (now - created) < 86400000;
  };

  const hasActiveFilters = category !== 'all' || audience !== 'all' || state !== 'All India' || search;
  const clearAllFilters = () => { setCategory('all'); setAudience('all'); setState('All India'); setSearch(''); };

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">Scheme Explorer</h1>
          <p className="text-gray-400 mt-1 text-sm">Browse <span className="text-white font-semibold">{total}</span> government schemes across India</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={clearAllFilters}
              className="badge bg-red-500/10 text-red-400 border border-red-500/15 cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-3 h-3 mr-1" />Clear All
            </motion.button>
          )}
          <span className="badge-green text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />Live Data
          </span>
        </div>
      </motion.div>

      {/* ── Search & Filters ── */}
      <motion.div variants={stagger.item} className="glass-card-cinematic p-5">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-saffron-400 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11 text-sm"
              placeholder="Search schemes by name, ministry, eligibility, or keyword..."
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="flex flex-wrap gap-3 items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-gray-500 mr-1" />
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors duration-200 border ${
                  category === cat
                    ? 'bg-saffron-500/15 text-saffron-400 border-saffron-500/25 shadow-sm shadow-saffron-500/10'
                    : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.08] border-transparent'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <select value={audience} onChange={(e) => setAudience(e.target.value)}
                className="input-field py-2 text-xs w-36 appearance-none pr-8 cursor-pointer">
                {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={state} onChange={(e) => setState(e.target.value)}
                className="input-field py-2 text-xs w-40 appearance-none pr-8 cursor-pointer">
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Scheme Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : schemes.length === 0 ? (
        <motion.div variants={stagger.item} className="glass-card-cinematic p-16 text-center">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">No schemes found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
          <button onClick={clearAllFilters} className="btn-secondary text-sm mt-4">Clear All Filters</button>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {schemes.map((scheme, i) => (
            <motion.div
              key={scheme.id || i}
              variants={stagger.item}
              whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,107,0,0.04)' }}
              onClick={() => setSelected(scheme)}
              className="glass-card-cinematic p-5 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-semibold text-white group-hover:text-saffron-400 transition-colors truncate">
                      {scheme.title}
                    </h3>
                    {isNew(scheme) && (
                      <span className="badge-green text-[9px] py-0 px-1.5 animate-pulse flex-shrink-0">NEW</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{scheme.ministry}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                  <button
                    onClick={(e) => toggleTrack(e, scheme.id)}
                    disabled={trackingLoading.has(scheme.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      trackedSchemes.has(scheme.id)
                        ? 'bg-saffron-500/15 text-saffron-400 border border-saffron-500/25'
                        : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-saffron-400 hover:border-saffron-500/20'
                    }`}
                    title={trackedSchemes.has(scheme.id) ? 'Tracking enabled' : 'Track this scheme'}
                  >
                    {trackingLoading.has(scheme.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : trackedSchemes.has(scheme.id) ? (
                      <Bell className="w-3.5 h-3.5" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-saffron-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                {scheme.ai_summary || scheme.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className={`badge ${categoryColors[scheme.category] || 'badge-saffron'}`}>
                  {scheme.category}
                </span>
                <span className="badge bg-white/10 text-gray-300">
                  <Users className="w-3 h-3 mr-1" />{scheme.target_audience}
                </span>
                <span className="badge bg-white/10 text-gray-300">
                  <MapPin className="w-3 h-3 mr-1" />{scheme.state}
                </span>
                <BudgetBadge amount={scheme.budget_allocated} />
                <DeadlineBadge deadline={scheme.deadline} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Detail Modal (Impact View) ── */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-card-cinematic p-8 border border-white/[0.08]"
            >
            <button onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-white pr-8 tracking-tight">{selected.title}</h2>
              {isNew(selected) && <span className="badge-green text-[10px]">NEW</span>}
            </div>
            <p className="text-sm text-saffron-400 mt-1 font-medium">{selected.ministry}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`badge ${categoryColors[selected.category] || 'badge-saffron'}`}>{selected.category}</span>
              <span className="badge-blue">{selected.target_audience}</span>
              <span className="badge bg-white/10 text-gray-300">{selected.state}</span>
              <DeadlineBadge deadline={selected.deadline} />
            </div>

            {/* AI Summary Highlight */}
            {selected.ai_summary && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-saffron-500/10 to-saffron-600/5 border border-saffron-500/15">
                <p className="text-xs text-saffron-400 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Summary
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">{selected.ai_summary}</p>
              </div>
            )}

            {/* Impact Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10', val: `₹${(selected.budget_allocated || 0).toLocaleString('en-IN')}`, sub: 'Crore Budget' },
                { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', val: selected.target_audience, sub: 'Target Group', capitalize: true },
                { icon: MapPin, color: 'text-purple-400', bg: 'bg-purple-500/10', val: selected.state, sub: 'Coverage' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="bg-white/[0.04] rounded-xl p-3.5 text-center border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-base font-bold text-white ${s.capitalize ? 'capitalize' : ''}`}>{s.val}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {[
                { label: 'Description', value: selected.description },
                { label: 'Eligibility', value: selected.eligibility },
                { label: 'Benefits', value: selected.benefits },
                { label: 'Documents Required', value: selected.documents_required },
              ].filter(s => s.value).map((section, i) => (
                <div key={i}>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">{section.label}</h4>
                  <p className="text-sm text-gray-400 whitespace-pre-line">{section.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-6 pt-5 border-t border-white/[0.06]">
              {selected.source_url && (
                <a href={selected.source_url} target="_blank" rel="noopener noreferrer"
                  className="btn-primary text-sm flex items-center gap-2">
                  Visit Official Portal <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={(e) => toggleTrack(e, selected.id)}
                disabled={trackingLoading.has(selected.id)}
                className={`text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 font-medium ${
                  trackedSchemes.has(selected.id)
                    ? 'bg-saffron-500/15 text-saffron-400 border border-saffron-500/25'
                    : 'btn-secondary'
                }`}
              >
                {trackingLoading.has(selected.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : trackedSchemes.has(selected.id) ? (
                  <><Bell className="w-4 h-4" /> Tracking</>                ) : (
                  <><BellOff className="w-4 h-4" /> Track Scheme</>                )}
              </button>
              <span className="text-xs text-gray-500 ml-auto flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {selected.deadline || 'Ongoing'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
