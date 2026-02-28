/**
 * CivicLens AI — Landing Page (v3 — production-grade polish)
 * Premium government-tech aesthetic with hero animations and feature stagger.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Zap, Brain, Bell, BarChart3, Globe,
  ArrowRight, Search, Users, Database, ChevronRight, Sparkles
} from 'lucide-react';

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
    <div className="min-h-screen bg-navy-700 noise-bg">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-navy-800/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl saffron-gradient flex items-center justify-center shadow-lg shadow-saffron-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              CivicLens <span className="text-saffron-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron-500/[0.08] border border-saffron-500/15 mb-8 animate-count-up">
            <Zap className="w-4 h-4 text-saffron-400" />
            <span className="text-sm text-saffron-400 font-medium">Powered by AMD EPYC Infrastructure</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight animate-count-up" style={{ animationDelay: '100ms' }}>
            Autonomous Civic<br />
            <span className="text-gradient">Intelligence Agent</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed animate-count-up" style={{ animationDelay: '200ms' }}>
            CivicLens AI continuously monitors Government of India portals, structures information,
            and delivers <span className="text-white font-medium">personalized civic intelligence</span> to
            every citizen — from students to entrepreneurs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-count-up" style={{ animationDelay: '300ms' }}>
            <Link to="/register" className="btn-primary text-lg px-8 py-3.5 flex items-center gap-2 shadow-xl shadow-saffron-500/20">
              Launch Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-3.5">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-5 text-center scheme-card-lift animate-count-up" style={{ animationDelay: `${400 + i * 100}ms` }}>
                <div className="text-3xl font-display font-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-1.5 rounded-3xl overflow-hidden border-saffron-500/10 shadow-2xl shadow-black/20">
            <div className="bg-navy-800/90 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <span className="ml-3 text-xs text-gray-500 font-medium">CivicLens AI Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
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
                  <div key={i} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className={`text-2xl font-bold font-display ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  'PM-KISAN: 17th Installment Released',
                  'Startup Seed Fund Extended to 2027',
                  'NSP Scholarships 2026-27 Open',
                ].map((text, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-xl p-3.5 flex items-start gap-3 border border-white/[0.04]">
                    <div className="w-2 h-2 rounded-full bg-saffron-500 mt-1.5 flex-shrink-0"></div>
                    <p className="text-xs text-gray-300 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white mb-4 tracking-tight">
              Civic Intelligence, <span className="text-gradient">Reimagined</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete autonomous system that bridges the gap between government services and citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="glass-card-hover p-6 group" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-12 h-12 rounded-xl saffron-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-saffron-500/15">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── User Types ── */}
      <section className="py-20 px-6 bg-navy-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white mb-4 tracking-tight">
              Built for Every <span className="text-gradient">Indian Citizen</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { type: 'Student', emoji: '🎓', color: 'border-blue-500/20 hover:border-blue-500/40' },
              { type: 'MSME', emoji: '🏭', color: 'border-yellow-500/20 hover:border-yellow-500/40' },
              { type: 'Startup', emoji: '🚀', color: 'border-purple-500/20 hover:border-purple-500/40' },
              { type: 'Farmer', emoji: '🌾', color: 'border-green-500/20 hover:border-green-500/40' },
              { type: 'NGO', emoji: '🤝', color: 'border-pink-500/20 hover:border-pink-500/40' },
              { type: 'Citizen', emoji: '🇮🇳', color: 'border-saffron-500/20 hover:border-saffron-500/40' },
            ].map((item, i) => (
              <div key={i} className={`glass-card p-6 text-center border ${item.color} hover:scale-105 transition-all duration-300 cursor-pointer scheme-card-lift`}>
                <div className="text-4xl mb-3">{item.emoji}</div>
                <p className="font-semibold text-white text-sm">{item.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-saffron-500/[0.08] border border-saffron-500/15 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
            <span className="text-xs text-saffron-400 font-medium">Free to use</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-6 tracking-tight">
            Start Your Civic Intelligence Journey
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of informed citizens who never miss a government scheme or policy update.
          </p>
          <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 shadow-xl shadow-saffron-500/20">
            Create Free Account <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-saffron-500" />
            <span className="font-display font-bold text-white">CivicLens AI</span>
          </div>
          <p className="text-xs text-gray-500">
            © 2026 CivicLens AI — Autonomous Civic Intelligence Agent for India. AMD EPYC Powered.
          </p>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Made in India 🇮🇳</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
