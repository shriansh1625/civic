/**
 * CivicLens AI — Budget by Ministry Bar Chart
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#FF6B00', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#10b981', '#3b82f6', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-navy-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-400">{payload[0].payload.name}</p>
        <p className="text-sm font-semibold text-saffron-400">₹{payload[0].value.toLocaleString('en-IN')} Cr</p>
      </div>
    );
  }
  return null;
};

export default function BudgetChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name: name.replace('Ministry of ', '').replace('Ministry of', ''),
    value: Number(value),
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  if (!chartData.length) return <p className="text-gray-500 text-sm">No budget data available.</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K Cr`} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
