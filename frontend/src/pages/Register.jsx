/**
 * CivicLens AI — Registration Page
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Mail, Lock, User, MapPin, ArrowRight, AlertCircle } from 'lucide-react';

const USER_TYPES = [
  { value: 'student', label: '🎓 Student', desc: 'Scholarships, education schemes' },
  { value: 'msme', label: '🏭 MSME', desc: 'Business loans, trade support' },
  { value: 'startup', label: '🚀 Startup Founder', desc: 'Funding, incubation schemes' },
  { value: 'farmer', label: '🌾 Farmer', desc: 'Agriculture, rural development' },
  { value: 'ngo', label: '🤝 NGO', desc: 'Welfare, social development' },
  { value: 'citizen', label: '🇮🇳 Citizen', desc: 'All government schemes' },
];

const STATES = [
  'All India', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    user_type: 'citizen', state: 'All India',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-700 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl saffron-gradient flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              CivicLens <span className="text-saffron-400">AI</span>
            </span>
          </Link>
          <p className="text-gray-400 mt-2">Create your civic intelligence profile</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input name="full_name" value={form.full_name} onChange={handleChange}
                  className="input-field pl-11" placeholder="Your full name" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-field pl-11" placeholder="you@example.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  className="input-field pl-11" placeholder="Minimum 6 characters" required minLength={6} />
              </div>
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                {USER_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setForm({ ...form, user_type: type.value })}
                    className={`p-3 rounded-xl text-left transition-all border ${
                      form.user_type === type.value
                        ? 'bg-saffron-500/15 border-saffron-500/30 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">State</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select name="state" value={form.state} onChange={handleChange}
                  className="input-field pl-11 appearance-none">
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-saffron-400 hover:text-saffron-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
