/**
 * CivicLens AI — Alerts Center Page (v5 — Cinematic Pitch Mode)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { alertsAPI } from '../services/api';
import {
  Bell, BellOff, CheckCheck, Filter, AlertTriangle,
  Clock, FileText, Info, Trash2, SlidersHorizontal, BellRing
} from 'lucide-react';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  },
};

export default function AlertsCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await alertsAPI.getAlerts();
      setAlerts(res.data);
    } catch {
      setAlerts(getFallbackAlerts());
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await alertsAPI.markRead(id);
      setAlerts((prev) => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await alertsAPI.markAllRead();
      setAlerts((prev) => prev.map(a => ({ ...a, is_read: true })));
    } catch {}
  };

  const filtered = filter === 'all' ? alerts
    : filter === 'unread' ? alerts.filter(a => !a.is_read)
    : alerts.filter(a => a.alert_type === filter);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const typeIcon = {
    new_scheme: FileText,
    deadline_reminder: Clock,
    update: Info,
    system: AlertTriangle,
  };

  const priorityColor = {
    urgent: 'border-l-red-500 bg-red-500/5',
    high: 'border-l-saffron-500 bg-saffron-500/5',
    normal: 'border-l-blue-500 bg-blue-500/5',
    low: 'border-l-gray-500 bg-gray-500/5',
  };

  const priorityBadge = {
    urgent: 'badge-red',
    high: 'badge-saffron',
    normal: 'badge-blue',
    low: 'bg-gray-500/20 text-gray-400 badge',
  };

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">Alerts Center</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {unreadCount > 0 ? <><span className="text-saffron-400 font-semibold">{unreadCount}</span> unread notifications</> : <span className="text-emerald-400">All caught up!</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={markAllRead}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </motion.button>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item} className="flex items-center gap-1.5 flex-wrap">
        <SlidersHorizontal className="w-4 h-4 text-gray-500 mr-1" />
        {[
          { value: 'all', label: 'All', count: alerts.length },
          { value: 'unread', label: 'Unread', count: unreadCount },
          { value: 'new_scheme', label: 'New Schemes' },
          { value: 'deadline_reminder', label: 'Deadlines' },
          { value: 'update', label: 'Updates' },
        ].map((f) => (
          <motion.button
            key={f.value}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 border ${
              filter === f.value
                ? 'bg-saffron-500/15 text-saffron-400 border-saffron-500/25 shadow-sm shadow-saffron-500/10'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.08] border-transparent'
            }`}
          >
            {f.label} {f.count !== undefined && <span className="ml-1 opacity-50">({f.count})</span>}
          </motion.button>
        ))}
      </motion.div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={stagger.item} className="glass-card-cinematic p-16 text-center">
          <BellOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No alerts to show</p>
          <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filtered.map((alert, i) => {
            const IconComp = typeIcon[alert.alert_type] || Bell;
            return (
              <motion.div
                key={alert.id || i}
                variants={stagger.item}
                whileHover={{ x: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                onClick={() => markRead(alert.id)}
                className={`glass-card-cinematic p-4 border-l-4 cursor-pointer transition-colors duration-200 hover:bg-white/[0.06]
                  ${priorityColor[alert.priority] || priorityColor.normal}
                  ${!alert.is_read ? 'ring-1 ring-white/[0.08]' : 'opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    alert.is_read ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-saffron-500/10 border-saffron-500/15'
                  }`}>
                    <IconComp className={`w-4 h-4 ${alert.is_read ? 'text-gray-500' : 'text-saffron-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-medium ${alert.is_read ? 'text-gray-400' : 'text-white'}`}>
                        {alert.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={priorityBadge[alert.priority] || priorityBadge.normal}>
                          {alert.priority}
                        </span>
                        {!alert.is_read && (
                          <div className="w-2 h-2 rounded-full bg-saffron-400 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-600">
                        {alert.created_at ? new Date(alert.created_at).toLocaleString('en-IN') : ''}
                      </span>
                      {alert.is_email_sent && (
                        <span className="text-xs text-gray-600">📧 Email sent</span>
                      )}
                    </div>
                  </div>
                </div>
            </motion.div>
          );
        })}
        </motion.div>
      )}
    </motion.div>
  );
}

function getFallbackAlerts() {
  const now = new Date();
  return [
    { id: 1, title: '🆕 New Scheme: PM Vishwakarma Yojana', message: 'New scheme for traditional artisans with ₹13,000 crore allocation. Check eligibility in Scheme Explorer.', alert_type: 'new_scheme', priority: 'high', is_read: false, is_email_sent: true, created_at: now.toISOString() },
    { id: 2, title: '⏰ Deadline in 5 days: Startup India Seed Fund', message: 'Application deadline approaching. Submit before 31-March-2026.', alert_type: 'deadline_reminder', priority: 'urgent', is_read: false, is_email_sent: true, created_at: new Date(now - 3*3600000).toISOString() },
    { id: 3, title: '📢 NSP Scholarships Portal Updated', message: '15 new post-graduate scholarships added for 2026-27.', alert_type: 'update', priority: 'normal', is_read: false, is_email_sent: false, created_at: new Date(now - 86400000).toISOString() },
    { id: 4, title: '🆕 PM Surya Ghar: Free Electricity Scheme', message: 'Rooftop solar for 1 crore homes. ₹78,000 subsidy. Apply now.', alert_type: 'new_scheme', priority: 'normal', is_read: true, is_email_sent: true, created_at: new Date(now - 2*86400000).toISOString() },
    { id: 5, title: '💰 Budget Update: Agriculture +12%', message: 'Agriculture allocation increased by 12%. New focus on organic farming.', alert_type: 'update', priority: 'normal', is_read: true, is_email_sent: true, created_at: new Date(now - 5*86400000).toISOString() },
    { id: 6, title: '⏰ Reminder: NSP Scholarship Deadline Oct 2026', message: 'National Scholarship Portal applications close 31-October-2026.', alert_type: 'deadline_reminder', priority: 'high', is_read: true, is_email_sent: false, created_at: new Date(now - 7*86400000).toISOString() },
  ];
}
