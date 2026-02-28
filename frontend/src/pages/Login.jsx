/**
 * CivicLens AI — Login Page (v3 — production-grade polish)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setLoading(true);
    try {
      await login(demoEmail, 'demo123');
      navigate('/app');
    } catch (err) {
      setError('Demo login failed. Please run the seed script first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-700 noise-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-count-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl saffron-gradient flex items-center justify-center shadow-lg shadow-saffron-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">
              CivicLens <span className="text-saffron-400">AI</span>
            </span>
          </Link>
          <p className="text-gray-400 mt-3 text-sm">Sign in to your civic intelligence dashboard</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8 border border-white/[0.06]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/15 text-red-400 text-sm animate-count-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-saffron-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-saffron-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
              <p className="text-sm text-gray-400">Quick Demo Login</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '👨‍💼 Admin', email: 'admin@civiclens.ai' },
                { label: '🎓 Student', email: 'student@civiclens.ai' },
                { label: '🌾 Farmer', email: 'farmer@civiclens.ai' },
                { label: '🚀 Startup', email: 'startup@civiclens.ai' },
              ].map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => demoLogin(demo.email)}
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-saffron-500/20 hover:text-white transition-all duration-200 text-center scheme-card-lift"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-saffron-400 hover:text-saffron-300 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
