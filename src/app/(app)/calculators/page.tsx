'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/currencies';

type CalculatorTab =
  | 'selling-price'
  | 'pnl'
  | 'margin-markup'
  | 'discount'
  | 'gst'
  | 'break-even'
  | 'commission'
  | 'expense';

export default function CalculatorsPage() {
  const { currency } = useApp();
  const [activeTab, setActiveTab] = useState<CalculatorTab>('selling-price');

  // 1. Selling Price Calculator State
  const [spCost, setSpCost] = useState<number>(1200);
  const [spMarkup, setSpMarkup] = useState<number>(35);
  const calculatedSellingPrice = spCost * (1 + spMarkup / 100);
  const calculatedSpProfit = calculatedSellingPrice - spCost;
  const calculatedSpMargin = calculatedSellingPrice > 0 ? (calculatedSpProfit / calculatedSellingPrice) * 100 : 0;

  // 2. Profit & Loss Calculator State
  const [pnlRevenue, setPnlRevenue] = useState<number>(150000);
  const [pnlCogs, setPnlCogs] = useState<number>(65000);
  const [pnlSalaries, setPnlSalaries] = useState<number>(25000);
  const [pnlRent, setPnlRent] = useState<number>(15000);
  const [pnlUtilities, setPnlUtilities] = useState<number>(6000);
  const [pnlMarketing, setPnlMarketing] = useState<number>(8000);
  const [pnlOther, setPnlOther] = useState<number>(4000);

  const pnlGrossProfit = pnlRevenue - pnlCogs;
  const pnlTotalOpex = pnlSalaries + pnlRent + pnlUtilities + pnlMarketing + pnlOther;
  const pnlNetProfit = pnlGrossProfit - pnlTotalOpex;
  const pnlGrossMargin = pnlRevenue > 0 ? (pnlGrossProfit / pnlRevenue) * 100 : 0;
  const pnlNetMargin = pnlRevenue > 0 ? (pnlNetProfit / pnlRevenue) * 100 : 0;

  // 3. Margin & Markup Calculator State
  const [mmCost, setMmCost] = useState<number>(800);
  const [mmPrice, setMmPrice] = useState<number>(1200);
  const mmProfit = mmPrice - mmCost;
  const mmMarginPercent = mmPrice > 0 ? (mmProfit / mmPrice) * 100 : 0;
  const mmMarkupPercent = mmCost > 0 ? (mmProfit / mmCost) * 100 : 0;

  // 4. Discount Calculator State
  const [discOriginal, setDiscOriginal] = useState<number>(2500);
  const [discPercent, setDiscPercent] = useState<number>(15);
  const discSavings = (discOriginal * discPercent) / 100;
  const discFinal = Math.max(0, discOriginal - discSavings);

  // 5. GST and Tax Calculator State
  const [taxAmount, setTaxAmount] = useState<number>(10000);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [taxMode, setTaxMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  let gstBase = taxAmount;
  let gstTotalTax = 0;
  let gstFinalAmount = taxAmount;

  if (taxMode === 'exclusive') {
    gstBase = taxAmount;
    gstTotalTax = (taxAmount * taxRate) / 100;
    gstFinalAmount = taxAmount + gstTotalTax;
  } else {
    gstBase = taxAmount / (1 + taxRate / 100);
    gstTotalTax = taxAmount - gstBase;
    gstFinalAmount = taxAmount;
  }
  const gstCgst = gstTotalTax / 2;
  const gstSgst = gstTotalTax / 2;

  // 6. Break-Even Calculator State
  const [beFixedCost, setBeFixedCost] = useState<number>(85000);
  const [bePricePerUnit, setBePricePerUnit] = useState<number>(500);
  const [beVarCostPerUnit, setBeVarCostPerUnit] = useState<number>(220);
  const beContributionMargin = bePricePerUnit - beVarCostPerUnit;
  const beUnits = beContributionMargin > 0 ? Math.ceil(beFixedCost / beContributionMargin) : 0;
  const beRevenue = beUnits * bePricePerUnit;
  const beMarginRatio = bePricePerUnit > 0 ? (beContributionMargin / bePricePerUnit) * 100 : 0;

  // 7. Commission Calculator State
  const [commSalesVolume, setCommSalesVolume] = useState<number>(250000);
  const [commRate, setCommRate] = useState<number>(8.5);
  const commPayout = (commSalesVolume * commRate) / 100;
  const commRetained = commSalesVolume - commPayout;

  // 8. Expense Calculator State
  const [expRent, setExpRent] = useState<number>(25000);
  const [expPayroll, setExpPayroll] = useState<number>(60000);
  const [expSupplies, setExpSupplies] = useState<number>(12000);
  const [expSoftware, setExpSoftware] = useState<number>(5500);
  const [expMarketing, setExpMarketing] = useState<number>(14000);
  const [expLogistics, setExpLogistics] = useState<number>(8500);

  const expTotalMonthly = expRent + expPayroll + expSupplies + expSoftware + expMarketing + expLogistics;
  const expAnnualized = expTotalMonthly * 12;
  const expDailyAverage = expTotalMonthly / 30;

  const tabs: { id: CalculatorTab; label: string; icon: string }[] = [
    { id: 'selling-price', label: 'Selling Price', icon: '🏷️' },
    { id: 'pnl', label: 'Profit & Loss', icon: '📊' },
    { id: 'margin-markup', label: 'Margin & Markup', icon: '📐' },
    { id: 'discount', label: 'Discount', icon: '✂️' },
    { id: 'gst', label: 'GST & Tax', icon: '🏛️' },
    { id: 'break-even', label: 'Break-Even', icon: '⚖️' },
    { id: 'commission', label: 'Commission', icon: '🤝' },
    { id: 'expense', label: 'Expense Forecast', icon: '🧾' },
  ];

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Business Calculators
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          8 financial calculation tools calibrated for commercial accuracy and instant margin decisions.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'glass-card hover:border-blue-400'
            }`}
            style={{
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── 1. SELLING PRICE CALCULATOR ─── */}
      {activeTab === 'selling-price' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Target Selling Price Calculator
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Calculate the optimal retail or wholesale price based on unit cost and desired markup percentage.
            </p>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Product Cost Price ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={spCost}
                onChange={(e) => setSpCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border text-base font-medium"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Desired Markup Percentage</span>
                <span className="text-blue-500 font-bold">{spMarkup}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="300"
                value={spMarkup}
                onChange={(e) => setSpMarkup(parseFloat(e.target.value) || 0)}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>1% (Minimal)</span>
                <span>50% (Standard)</span>
                <span>150%+ (High Margin)</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">Calculation Outcome</span>
              <div className="mt-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Recommended Selling Price</p>
                <p className="text-4xl font-extrabold text-blue-500 tracking-tight mt-1">
                  {formatCurrency(calculatedSellingPrice, currency)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-3.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <p className="text-xs font-medium text-emerald-500">Gross Profit per Unit</p>
                <p className="text-xl font-bold text-emerald-500 mt-1">
                  +{formatCurrency(calculatedSpProfit, currency)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <p className="text-xs font-medium text-blue-500">Gross Profit Margin</p>
                <p className="text-xl font-bold text-blue-500 mt-1">
                  {calculatedSpMargin.toFixed(1)}%
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              Formula: Price = Cost × (1 + Markup%) · Profit = Price - Cost
            </p>
          </div>
        </div>
      )}

      {/* ─── 2. PROFIT & LOSS CALCULATOR ─── */}
      {activeTab === 'pnl' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Profit & Loss Pro-Forma Statement
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Total Revenue ({currency})</label>
                <input
                  type="number"
                  value={pnlRevenue}
                  onChange={(e) => setPnlRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Cost of Goods Sold (COGS)</label>
                <input
                  type="number"
                  value={pnlCogs}
                  onChange={(e) => setPnlCogs(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: 'var(--text-muted)' }}>Operating Expenses (OpEx)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Wages & Payroll</label>
                <input
                  type="number"
                  value={pnlSalaries}
                  onChange={(e) => setPnlSalaries(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Commercial Rent</label>
                <input
                  type="number"
                  value={pnlRent}
                  onChange={(e) => setPnlRent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Utilities & Internet</label>
                <input
                  type="number"
                  value={pnlUtilities}
                  onChange={(e) => setPnlUtilities(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Marketing & Ads</label>
                <input
                  type="number"
                  value={pnlMarketing}
                  onChange={(e) => setPnlMarketing(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Statement Summary</span>
              <div className="mt-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Net Operating Profit</p>
                <p className={`text-4xl font-extrabold tracking-tight mt-1 ${pnlNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {pnlNetProfit >= 0 ? '+' : ''}{formatCurrency(pnlNetProfit, currency)}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm py-4 border-t border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Gross Profit</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(pnlGrossProfit, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Gross Margin %</span>
                <span className="font-semibold text-blue-400">{pnlGrossMargin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Total OpEx</span>
                <span className="font-semibold text-rose-400">-{formatCurrency(pnlTotalOpex, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Net Margin %</span>
                <span className={`font-semibold ${pnlNetMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pnlNetMargin.toFixed(1)}%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Formula: Net Profit = Revenue - COGS - Total Operating Overheads
            </p>
          </div>
        </div>
      )}

      {/* ─── 3. PROFIT MARGIN & MARKUP CALCULATOR ─── */}
      {activeTab === 'margin-markup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Margin vs. Markup Converter
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Never confuse margin with markup again. Analyze exact percentages for your items.
            </p>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Cost Price ({currency})
              </label>
              <input
                type="number"
                value={mmCost}
                onChange={(e) => setMmCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border text-base font-medium"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Selling Price ({currency})
              </label>
              <input
                type="number"
                value={mmPrice}
                onChange={(e) => setMmPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border text-base font-medium"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Profit Metrics</span>
              <p className="text-2xl font-bold mt-2 text-indigo-400">
                {formatCurrency(mmProfit, currency)} Profit Per Unit
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'rgba(79,142,247,0.06)' }}>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Profit Margin</p>
                <p className="text-3xl font-extrabold text-blue-500 mt-2">{mmMarginPercent.toFixed(1)}%</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Profit ÷ Selling Price</p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'rgba(16,185,129,0.06)' }}>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Markup</p>
                <p className="text-3xl font-extrabold text-emerald-500 mt-2">{mmMarkupPercent.toFixed(1)}%</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Profit ÷ Cost Price</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: A 50% markup equals a 33.3% margin. A 100% markup equals a 50% margin.
            </p>
          </div>
        </div>
      )}

      {/* ─── 4. DISCOUNT CALCULATOR ─── */}
      {activeTab === 'discount' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Discount & Savings Calculator
            </h2>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Original Price ({currency})
              </label>
              <input
                type="number"
                value={discOriginal}
                onChange={(e) => setDiscOriginal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border text-base font-medium"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Discount Percentage</span>
                <span className="text-rose-500 font-bold">{discPercent}% OFF</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={discPercent}
                onChange={(e) => setDiscPercent(parseFloat(e.target.value) || 0)}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Final Price After Discount</span>
              <p className="text-4xl font-extrabold text-emerald-500 tracking-tight mt-2">
                {formatCurrency(discFinal, currency)}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(244,63,94,0.08)' }}>
              <p className="text-xs font-medium text-rose-500">Customer Total Savings</p>
              <p className="text-2xl font-bold text-rose-500 mt-1">
                -{formatCurrency(discSavings, currency)} ({discPercent}% Off)
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Formula: Final Price = Original Price × (1 - Discount%)
            </p>
          </div>
        </div>
      )}

      {/* ─── 5. GST & TAX CALCULATOR ─── */}
      {activeTab === 'gst' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              GST & Sales Tax Computation
            </h2>

            <div className="flex rounded-xl p-1 border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              <button
                onClick={() => setTaxMode('exclusive')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  taxMode === 'exclusive' ? 'bg-blue-600 text-white shadow' : 'text-gray-400'
                }`}
              >
                Tax Exclusive (Add Tax)
              </button>
              <button
                onClick={() => setTaxMode('inclusive')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  taxMode === 'inclusive' ? 'bg-blue-600 text-white shadow' : 'text-gray-400'
                }`}
              >
                Tax Inclusive (Remove Tax)
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {taxMode === 'exclusive' ? 'Base Amount (Excl. Tax)' : 'Gross Amount (Incl. Tax)'} ({currency})
              </label>
              <input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border text-base font-medium"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                GST Rate Slabs
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[0, 5, 12, 18, 28].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setTaxRate(rate)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      taxRate === rate
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-extrabold'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Invoice Total</span>
              <p className="text-4xl font-extrabold text-cyan-400 tracking-tight mt-2">
                {formatCurrency(gstFinalAmount, currency)}
              </p>
            </div>

            <div className="space-y-3 py-3 border-t border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Net Base Value:</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(gstBase, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Total GST ({taxRate}%):</span>
                <span className="font-semibold text-amber-500">{formatCurrency(gstTotalTax, currency)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-2 rounded-lg bg-gray-800/40">
                  <span className="text-gray-400">CGST ({taxRate / 2}%):</span>
                  <p className="font-bold text-gray-200 mt-0.5">{formatCurrency(gstCgst, currency)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-800/40">
                  <span className="text-gray-400">SGST ({taxRate / 2}%):</span>
                  <p className="font-bold text-gray-200 mt-0.5">{formatCurrency(gstSgst, currency)}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Intrastate transactions split into CGST + SGST (50/50). Interstate uses IGST ({taxRate}%).
            </p>
          </div>
        </div>
      )}

      {/* ─── 6. BREAK-EVEN CALCULATOR ─── */}
      {activeTab === 'break-even' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Break-Even Point Calculator
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Find the exact sales volume needed to cover all fixed expenses and begin turning a profit.
            </p>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Total Fixed Overheads ({currency}/period)
              </label>
              <input
                type="number"
                value={beFixedCost}
                onChange={(e) => setBeFixedCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2 rounded-xl border text-sm"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Unit Selling Price
                </label>
                <input
                  type="number"
                  value={bePricePerUnit}
                  onChange={(e) => setBePricePerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Variable Cost / Unit
                </label>
                <input
                  type="number"
                  value={beVarCostPerUnit}
                  onChange={(e) => setBeVarCostPerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Break-Even Volume Required</span>
              <p className="text-4xl font-extrabold text-amber-400 tracking-tight mt-2">
                {beUnits.toLocaleString()} Units
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Equivalent to {formatCurrency(beRevenue, currency)} in gross revenue
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <span className="text-xs text-blue-400 font-medium">Unit Contribution</span>
                <p className="text-lg font-bold text-blue-400 mt-0.5">{formatCurrency(beContributionMargin, currency)}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <span className="text-xs text-purple-400 font-medium">Contribution Ratio</span>
                <p className="text-lg font-bold text-purple-400 mt-0.5">{beMarginRatio.toFixed(1)}%</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Formula: Break-Even Units = Fixed Costs ÷ (Price - Variable Cost)
            </p>
          </div>
        </div>
      )}

      {/* ─── 7. COMMISSION CALCULATOR ─── */}
      {activeTab === 'commission' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Sales Commission & Payouts
            </h2>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Total Sale Deal Size ({currency})
              </label>
              <input
                type="number"
                value={commSalesVolume}
                onChange={(e) => setCommSalesVolume(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border text-base font-medium"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Commission Percentage</span>
                <span className="text-indigo-400 font-bold">{commRate}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={commRate}
                onChange={(e) => setCommRate(parseFloat(e.target.value) || 0)}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Agent Commission Payout</span>
              <p className="text-4xl font-extrabold text-indigo-400 tracking-tight mt-2">
                {formatCurrency(commPayout, currency)}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(79,142,247,0.08)' }}>
              <p className="text-xs font-medium text-blue-400">Net Business Retained Revenue</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {formatCurrency(commRetained, currency)}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Formula: Commission = Sale Amount × Commission% · Retained = Sale - Commission
            </p>
          </div>
        </div>
      )}

      {/* ─── 8. EXPENSE CALCULATOR ─── */}
      {activeTab === 'expense' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recurring Overhead Runway Forecast
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>Rent & Property</label>
                <input
                  type="number"
                  value={expRent}
                  onChange={(e) => setExpRent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>Payroll & Staff</label>
                <input
                  type="number"
                  value={expPayroll}
                  onChange={(e) => setExpPayroll(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>Supplies & Consumables</label>
                <input
                  type="number"
                  value={expSupplies}
                  onChange={(e) => setExpSupplies(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>Software & Tools</label>
                <input
                  type="number"
                  value={expSoftware}
                  onChange={(e) => setExpSoftware(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>Marketing & Ads</label>
                <input
                  type="number"
                  value={expMarketing}
                  onChange={(e) => setExpMarketing(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>Logistics & Delivery</label>
                <input
                  type="number"
                  value={expLogistics}
                  onChange={(e) => setExpLogistics(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">Total Monthly Run-Rate</span>
              <p className="text-4xl font-extrabold text-rose-400 tracking-tight mt-2">
                {formatCurrency(expTotalMonthly, currency)} / mo
              </p>
            </div>

            <div className="space-y-3 py-3 border-t border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Daily Burn Rate</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(expDailyAverage, currency)} / day</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Annualized Overheads</span>
                <span className="font-semibold text-rose-500">{formatCurrency(expAnnualized, currency)} / year</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Essential for cash-flow buffer planning and working capital management.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
