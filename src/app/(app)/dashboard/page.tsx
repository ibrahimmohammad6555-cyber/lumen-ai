'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/ui/StatCard';
import { RevenueExpensesChart, ProfitTrendChart } from '@/components/ui/Charts';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { useApp } from '@/context/AppContext';
import { convertCurrency, formatCurrency } from '@/lib/currencies';

// Dynamic import for 3D HeroScene (SSR disabled to ensure clean client WebGL rendering)
const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <HeroFallback />,
});

function HeroFallback() {
  return (
    <div
      className="w-full rounded-2xl flex items-center justify-center border"
      style={{
        height: 340,
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="text-center space-y-2">
        <div
          className="w-12 h-12 rounded-full mx-auto animate-pulse"
          style={{ background: 'linear-gradient(135deg, #4f8ef7, #22d3ee)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading 3D visualization…
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { transactions, products, currency } = useApp();
  const [dateFilter, setDateFilter] = useState<'today' | '30d' | '12m' | 'all'>('all');

  // Filtered transactions based on date filter
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();

    return transactions.filter((t) => {
      const txTime = new Date(t.date).getTime();
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        return t.date === todayStr;
      }
      if (dateFilter === '30d') {
        return nowTime - txTime <= 30 * 86400000;
      }
      if (dateFilter === '12m') {
        return nowTime - txTime <= 365 * 86400000;
      }
      return true;
    });
  }, [transactions, dateFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let purchases = 0;
    let salesCount = 0;

    filteredTransactions.forEach((t) => {
      const val = convertCurrency(t.amount, t.currency || 'INR', currency);
      if (t.type === 'sale') {
        totalRevenue += val;
        salesCount++;
      } else if (t.type === 'purchase') {
        purchases += val;
        totalExpenses += val;
      } else if (t.type === 'expense') {
        totalExpenses += val;
      }
    });

    const grossProfit = totalRevenue - purchases;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      salesCount,
    };
  }, [filteredTransactions, currency]);

  // Monthly Chart Trends from filtered or all records
  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; expenses: number }>();

    filteredTransactions.forEach((t) => {
      const d = new Date(t.date);
      const label = d.toLocaleString('en-US', { month: 'short' });
      if (!map.has(label)) {
        map.set(label, { month: label, revenue: 0, expenses: 0 });
      }
      const entry = map.get(label)!;
      const val = convertCurrency(t.amount, t.currency || 'INR', currency);
      if (t.type === 'sale') {
        entry.revenue += val;
      } else {
        entry.expenses += val;
      }
    });

    return Array.from(map.values());
  }, [filteredTransactions, currency]);

  const profitTrendData = useMemo(() => {
    return monthlyChartData.map((d) => ({
      month: d.month,
      profit: d.revenue - d.expenses,
    }));
  }, [monthlyChartData]);

  // Low stock alert count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => (p.stockQuantity || 0) <= (p.reorderLevel || 0)).length;
  }, [products]);

  return (
    <div className="p-5 md:p-7 max-w-screen-xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Business Intelligence Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Executive overview of revenue, margins, capital health, and 3D performance core.
          </p>
        </div>

        {/* Date Selector & Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-xl p-1 border text-xs font-semibold" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: '30d', label: '30D' },
              { id: '12m', label: '12M' },
              { id: 'all', label: 'All Time' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as typeof dateFilter)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === f.id ? 'bg-blue-600 text-white shadow' : 'text-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Link
            href="/sales"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <span>+</span> Record Sale
          </Link>
        </div>
      </div>

      {/* Low-Stock Notice Banner */}
      {lowStockCount > 0 && (
        <div className="p-3.5 rounded-2xl flex items-center justify-between border bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-2.5 text-xs text-amber-400 font-semibold">
            <span>⚠️</span>
            <span>{lowStockCount} product(s) in inventory need replenishment.</span>
          </div>
          <Link href="/inventory" className="text-xs font-bold text-amber-400 underline">
            View Inventory →
          </Link>
        </div>
      )}

      {/* 3D Hero + Primary KPI summary cards */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* 3D Scene */}
        <div className="xl:col-span-3">
          <HeroScene />
        </div>

        {/* KPI Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 auto-rows-fr">
          <StatCard
            label="Total Revenue"
            value={metrics.totalRevenue}
            change={12.4}
            icon="📈"
            color="blue"
          />
          <StatCard
            label="Total Expenses & Purchases"
            value={metrics.totalExpenses}
            change={-3.1}
            icon="📉"
            color="red"
          />
          <StatCard
            label="Net Operating Profit"
            value={metrics.netProfit}
            icon="💰"
            color="green"
          />
          <StatCard
            label="Net Profit Margin"
            value={metrics.profitMargin}
            icon="⚡"
            color="teal"
            prefix="%"
          />
        </div>
      </div>

      {/* Secondary Quick Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Gross Operating Profit"
          value={metrics.grossProfit}
          icon="✦"
          color="purple"
        />

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl text-blue-400">
            🧮
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Commercial Calculators
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              8 high-precision calculators for pricing, markup, tax & break-even.
            </p>
            <Link href="/calculators" className="text-xs font-bold text-blue-400 hover:underline mt-1 block">
              Open Calculators Suite →
            </Link>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl text-emerald-400">
            📊
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Executive Reports
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Export auditor-ready PDF reports and multi-sheet Excel files.
            </p>
            <Link href="/reports" className="text-xs font-bold text-emerald-400 hover:underline mt-1 block">
              Generate Reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevenueExpensesChart
          customData={monthlyChartData.length > 0 ? monthlyChartData : undefined}
          isLive={monthlyChartData.length > 0}
        />
        <ProfitTrendChart
          customData={profitTrendData.length > 0 ? profitTrendData : undefined}
          isLive={profitTrendData.length > 0}
        />
      </div>

      {/* Recent Activity Feed */}
      <RecentActivity />

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between text-xs py-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        <p>LUMEN.AI · Complete Business Intelligence Platform</p>
        <p>Local-First IndexedDB Engine · Display Currency: {currency}</p>
      </div>
    </div>
  );
}
