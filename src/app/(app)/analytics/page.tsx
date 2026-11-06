'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, convertCurrency } from '@/lib/currencies';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#4f8ef7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export default function AnalyticsPage() {
  const { transactions, currency, theme } = useApp();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#94b4d8' : '#3d5a8a';
  const gridColor = isDark ? 'rgba(79,142,247,0.1)' : 'rgba(79,142,247,0.15)';

  const [period, setPeriod] = useState<'7d' | '30d' | '6m' | '12m' | 'all'>('all');

  // Filtered transactions by period
  const filteredTx = useMemo(() => {
    const now = new Date().getTime();
    return transactions.filter((t) => {
      const txTime = new Date(t.date).getTime();
      if (period === '7d') return now - txTime <= 7 * 86400000;
      if (period === '30d') return now - txTime <= 30 * 86400000;
      if (period === '6m') return now - txTime <= 180 * 86400000;
      if (period === '12m') return now - txTime <= 365 * 86400000;
      return true;
    });
  }, [transactions, period]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let revenue = 0;
    let expenses = 0;
    let salesCount = 0;

    filteredTx.forEach((t) => {
      const val = convertCurrency(t.amount, t.currency || 'INR', currency);
      if (t.type === 'sale') {
        revenue += val;
        salesCount++;
      } else if (t.type === 'expense' || t.type === 'purchase') {
        expenses += val;
      }
    });

    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const avgOrderValue = salesCount > 0 ? revenue / salesCount : 0;

    return {
      revenue,
      expenses,
      profit,
      margin,
      salesCount,
      avgOrderValue,
    };
  }, [filteredTx, currency]);

  // Monthly / Date Trends
  const trendData = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number; expenses: number; profit: number }>();

    filteredTx.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });

      if (!map.has(key)) {
        map.set(key, { label, revenue: 0, expenses: 0, profit: 0 });
      }
      const entry = map.get(key)!;
      const val = convertCurrency(t.amount, t.currency || 'INR', currency);

      if (t.type === 'sale') {
        entry.revenue += val;
      } else {
        entry.expenses += val;
      }
      entry.profit = entry.revenue - entry.expenses;
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map((e) => e[1]);
  }, [filteredTx, currency]);

  // Category Breakdown for Expenses
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();

    filteredTx.forEach((t) => {
      if (t.type === 'expense' || t.type === 'purchase') {
        const val = convertCurrency(t.amount, t.currency || 'INR', currency);
        const cat = t.category || 'General';
        map.set(cat, (map.get(cat) || 0) + val);
      }
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
  }, [filteredTx, currency]);

  // Payment Method Breakdown
  const paymentData = useMemo(() => {
    const map = new Map<string, number>();

    filteredTx.forEach((t) => {
      if (t.type === 'sale') {
        const method = t.paymentMethod || 'UPI';
        const val = convertCurrency(t.amount, t.currency || 'INR', currency);
        map.set(method, (map.get(method) || 0) + val);
      }
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
  }, [filteredTx, currency]);

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Business Intelligence & Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time analytics synthesized from your actual transaction records and margins.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex rounded-xl p-1 border text-xs font-semibold" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '6m', label: '6 Months' },
            { id: '12m', label: '12 Months' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as typeof period)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === item.id ? 'bg-blue-600 text-white shadow' : 'text-gray-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border-t-2 border-blue-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Period Revenue</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">
            {formatCurrency(metrics.revenue, currency)}
          </p>
          <p className="text-xs mt-1 text-gray-400">{metrics.salesCount} closed transactions</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-rose-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Cost & Overheads</p>
          <p className="text-2xl font-bold text-rose-500 mt-1">
            {formatCurrency(metrics.expenses, currency)}
          </p>
          <p className="text-xs mt-1 text-gray-400">Purchases & operating expenses</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-emerald-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Net Operating Margin</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {metrics.margin.toFixed(1)}%
          </p>
          <p className="text-xs mt-1 text-gray-400">
            {formatCurrency(metrics.profit, currency)} Net Profit
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-cyan-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Average Ticket Size</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">
            {formatCurrency(metrics.avgOrderValue, currency)}
          </p>
          <p className="text-xs mt-1 text-gray-400">Per sales order average</p>
        </div>
      </div>

      {/* Charts Row 1: Time Series Trend & Profit Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Revenue vs. Overheads Trend</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Actual sales vs total expenditures over time</p>
            </div>
            <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10">Active Records</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="anaRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anaExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} />
              <YAxis
                tick={{ fill: textColor, fontSize: 10 }}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, currency, true)}
                width={65}
              />
              <Tooltip
                formatter={(val: any) => [
                  formatCurrency(Number(val) || 0, currency),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Area type="monotone" dataKey="revenue" name="Sales Revenue" stroke="#4f8ef7" strokeWidth={2} fill="url(#anaRev)" />
              <Area type="monotone" dataKey="expenses" name="Total Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#anaExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Net Operating Profit Trajectory</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Net profit realization by timeframe</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">Net Cash</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} />
              <YAxis
                tick={{ fill: textColor, fontSize: 10 }}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, currency, true)}
                width={65}
              />
              <Tooltip
                formatter={(val: any) => [
                  formatCurrency(Number(val) || 0, currency),
                  'Net Profit',
                ]}
              />
              <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Expense Distribution & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Expense Distribution by Category
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Identify major operational cost drivers
          </p>

          <div className="h-64 flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No expense data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      formatCurrency(Number(val) || 0, currency),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Payment Channels & Settlement
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Revenue captured by customer payment method
          </p>

          <div className="h-64 flex items-center justify-center">
            {paymentData.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sales transactions for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v, currency, true)} tick={{ fill: textColor, fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: textColor, fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [
                      formatCurrency(Number(val) || 0, currency),
                    ]}
                  />
                  <Bar dataKey="value" fill="#4f8ef7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
