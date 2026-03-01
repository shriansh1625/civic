/**
 * CivicLens AI — Landing Page (v5 — Cinematic Pitch Mode)
 * Three-mode design: Pitch Presentation + Investor Screenshot + Cinematic Animation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Brain, Bell, BarChart3, Globe,
  ArrowRight, Search, Users, Database, ChevronRight, Sparkles, Star, Award
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const gridItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const features = [
  {
    icon: Search,
    title: 'Autonomous Monitoring',
    desc: 'AI-powered crawler continuously scans 50+ Government of India portals for new schemes, tenders, and policy updates.',
  },
  {
    icon: Brain,
    title: 'AI Summarization',
    desc: 'Instant AI summaries of complex government documents. Ask questions in natural language and get clear answers.',
  },
  {
    icon: Users,
    title: 'Personalized Intelligence',
    desc: 'Tailored feeds for Students, MSMEs, Startups, Farmers, NGOs, and Citizens based on your profile.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Real-time notifications for new relevant schemes and approaching deadlines. Never miss an opportunity.',
  },
  {
    icon: BarChart3,
    title: 'Budget Visualization',
    desc: 'Interactive charts showing budget allocations by ministry, state-wise spending, and sector analysis.',
  },
  {
    icon: Database,
    title: 'AMD EPYC Powered',
    desc: 'Deployed on AMD EPYC infrastructure for multi-core parallel crawling and optimized AI inference.',
  },
];

const stats = [
  { value: '500+', label: 'Government Schemes' },
  { value: '28+', label: 'States Covered' },
  { value: '24/7', label: 'Autonomous Scanning' },
  { value: '6', label: 'User Profiles' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-700 noise-bg relative overflow-hidden">
      {/* Cinematic background system */}
      <div className="animated-bg">
        <div className="animated-bg-orb3" />
      </div>
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-[1]" />

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 w-full z-50 bg-navy-800/70 backdrop-blur-2xl border-b border-white/[0.04]"
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl saffron-gradient flex items-center justify-center shadow-lg shadow-saffron-500/25 ring-2 ring-saffron-500/10"
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              CivicLens <span className="text-gradient-hero">AI</span>
            </span>
            <span className="ai-indicator hidden sm:inline-flex">
              <Sparkles className="w-3 h-3" /> v2.0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-6 relative z-10">
        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-40 left-[10%] w-20 h-20 rounded-full bg-gradient-to-br from-saffron-500/[0.06] to-transparent blur-xl pointer-events-none hidden lg:block"
        />
        <motion.div
          animate={{ y: [6, -10, 6], rotate: [0, -3, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-60 right-[8%] w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/[0.04] to-transparent blur-2xl pointer-events-none hidden lg:block"
        />
        <motion.div
          animate={{ y: [-5, 12, -5] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-[20%] w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/[0.05] to-transparent blur-xl pointer-events-none hidden lg:block"
        />

        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-saffron-500/[0.1] to-purple-500/[0.06] border border-saffron-500/15 mb-8 shadow-lg shadow-saffron-500/5"
          >
            <Zap className="w-4 h-4 text-saffron-400 animate-sparkle" />
            <span className="text-sm text-saffron-400 font-medium">Powered by AMD EPYC Infrastructure</span>
            <div className="w-1 h-1 rounded-full bg-saffron-500/50" />
            <span className="text-sm text-gray-500 font-medium">Hackathon 2026</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="hero-title text-white mb-6"
          >
            Autonomous Civic<br />
            <span className="text-gradient-hero">Intelligence Agent</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="hero-subtitle mx-auto mb-12"
          >
            CivicLens AI continuously monitors Government of India portals, structures information,
            and delivers <span className="text-white font-semibold">personalized civic intelligence</span> to
            every citizen — from students to entrepreneurs.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register" className="btn-primary text-lg px-10 py-4 flex items-center gap-2 shadow-xl shadow-saffron-500/25">
                Launch Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login" className="btn-secondary text-lg px-10 py-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={staggerGrid}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={gridItem}
                whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,107,0,0.06)' }}
                className="glass-card-cinematic p-6 text-center cursor-default"
              >
                <div className="text-3xl sm:text-4xl font-display font-bold text-gradient-hero mb-1.5">{stat.value}</div>
                <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <motion.section
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-20 px-6 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs uppercase tracking-[0.2em] text-gray-500 mb-6 font-medium"
          >
            Live Dashboard Preview
          </motion.p>
          <div className="glass-card-cinematic p-1.5 rounded-3xl overflow-hidden shadow-2xl shadow-black/30">
            <div className="bg-navy-800/90 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <span className="ml-3 text-xs text-gray-500 font-medium">CivicLens AI Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50"></div>
                  </div>
                  <span className="text-[10px] text-emerald-400">Live</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Active Schemes', value: '247', color: 'text-saffron-400' },
                  { label: 'New Today', value: '12', color: 'text-green-400' },
                  { label: 'Alerts', value: '5', color: 'text-blue-400' },
                  { label: 'Relevant to You', value: '34', color: 'text-purple-400' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]"
                  >
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className={`text-2xl font-bold font-display ${item.color}`}>{item.value}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  'PM-KISAN: 17th Installment Released',
                  'Startup Seed Fund Extended to 2027',
                  'NSP Scholarships 2026-27 Open',
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-white/[0.03] rounded-xl p-3.5 flex items-start gap-3 border border-white/[0.04]"
                  >
                    <div className="w-2 h-2 rounded-full bg-saffron-500 mt-1.5 flex-shrink-0 shadow-sm shadow-saffron-500/50"></div>
                    <p className="text-xs text-gray-300 leading-relaxed">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section className="py-24 px-6 relative z-10 section-spotlight">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="section-label mb-3 flex items-center justify-center gap-2">
              <Award className="w-3.5 h-3.5 text-saffron-400" />
              Core Capabilities
            </div>
            <h2 className="section-title text-3xl sm:text-4xl mb-4">
              Civic Intelligence, <span className="text-gradient-hero">Reimagined</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete autonomous system that bridges the gap between government services and citizens.
            </p>
          </motion.div>

          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={gridItem}
                className="feature-card group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl saffron-gradient flex items-center justify-center mb-5 feature-icon shadow-lg shadow-saffron-500/20">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2.5 tracking-tight">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── User Types ── */}
      <section className="py-24 px-6 bg-navy-800/30 relative z-10 section-spotlight">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="section-label mb-3 flex items-center justify-center gap-2">
              <Users className="w-3.5 h-3.5 text-saffron-400" />
              Who It's For
            </div>
            <h2 className="section-title text-3xl sm:text-4xl mb-4">
              Built for Every <span className="text-gradient-hero">Indian Citizen</span>
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              Personalized civic intelligence tailored to your unique needs and eligibility.
            </p>
          </motion.div>
          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5"
          >
            {[
              { type: 'Student', emoji: '🎓', color: 'border-blue-500/20 hover:border-blue-500/40 hover:shadow-glow-blue' },
              { type: 'MSME', emoji: '🏭', color: 'border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-glow-amber' },
              { type: 'Startup', emoji: '🚀', color: 'border-purple-500/20 hover:border-purple-500/40' },
              { type: 'Farmer', emoji: '🌾', color: 'border-green-500/20 hover:border-green-500/40 hover:shadow-glow-emerald' },
              { type: 'NGO', emoji: '🤝', color: 'border-pink-500/20 hover:border-pink-500/40 hover:shadow-glow-rose' },
              { type: 'Citizen', emoji: '🇮🇳', color: 'border-saffron-500/20 hover:border-saffron-500/40' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={gridItem}
                whileHover={{ scale: 1.1, y: -6 }}
                whileTap={{ scale: 0.95 }}
                className={`glass-card-premium p-7 text-center border ${item.color} transition-all duration-300 cursor-pointer`}
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{item.emoji}</div>
                <p className="font-semibold text-white text-sm">{item.type}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24 px-6 relative z-10 section-spotlight"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card-cinematic p-12 sm:p-16 relative">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-saffron-500/[0.03] via-transparent to-blue-500/[0.02] rounded-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron-500/[0.1] border border-saffron-500/15 mb-6">
                <Star className="w-3.5 h-3.5 text-saffron-400" />
                <span className="text-xs text-saffron-400 font-medium">Free to use • No credit card required</span>
              </div>
              <h2 className="section-title text-3xl sm:text-4xl mb-4">
                Start Your Civic Intelligence Journey
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of informed citizens who never miss a government scheme or policy update.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 shadow-xl shadow-saffron-500/25">
                    Create Free Account <ChevronRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2">
                    View Demo
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-10 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-saffron-500" />
            <span className="font-display font-bold text-white">CivicLens AI</span>
            <span className="text-[10px] text-gray-600 ml-1">v2.0</span>
          </div>
          <p className="text-xs text-gray-500">
            © 2026 CivicLens AI — Autonomous Civic Intelligence Agent for India. AMD EPYC Powered.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">All Systems Operational</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">Made in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
