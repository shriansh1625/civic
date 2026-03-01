/**
 * CivicLens AI — Schemes by Category Pie/Donut Chart
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
  '#FF6B00', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e',
  '#06b6d4', '#f59e0b', '#84cc16', '#ec4899', '#6366f1',
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.[0]) {
    return (
      <div className="glass-card-cinematic px-4 py-2.5 shadow-elevated !rounded-lg border border-white/[0.08]">
        <p className="text-xs text-gray-400 capitalize">{payload[0].name}</p>
        <p className="text-sm font-semibold text-white">{payload[0].value} schemes</p>
      </div>
    );
  }
  return null;
};

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-gray-400 capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CategoryChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name,
    value: Number(value),
  })).sort((a, b) => b.value - a.value);

  if (!chartData.length) return <p className="text-gray-500 text-sm">No category data available.</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%" cy="45%"
          innerRadius={55} outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
