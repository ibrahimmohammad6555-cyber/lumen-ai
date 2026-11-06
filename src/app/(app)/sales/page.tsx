'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, convertCurrency } from '@/lib/currencies';
import { type Transaction } from '@/lib/db';
import * as XLSX from 'xlsx';

export default function SalesAndExpensesPage() {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    currency,
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'purchase' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formType, setFormType] = useState<'sale' | 'purchase' | 'expense'>('sale');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<string>('Sales');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('UPI');
  const [formInvoiceNo, setFormInvoiceNo] = useState<string>('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        // Date filter
        if (dateFilter !== 'all') {
          const txDate = new Date(t.date);
          const now = new Date();
          if (dateFilter === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            if (t.date !== todayStr) return false;
          } else if (dateFilter === 'month') {
            if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
          } else if (dateFilter === 'year') {
            if (txDate.getFullYear() !== now.getFullYear()) return false;
          }
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchInv = (t.invoiceNo || '').toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchInv) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
          return sortOrder === 'desc' ? -diff : diff;
        } else {
          const diff = a.amount - b.amount;
          return sortOrder === 'desc' ? -diff : diff;
        }
      });
  }, [transactions, typeFilter, categoryFilter, dateFilter, searchQuery, sortField, sortOrder]);

  // Totals converted to selected display currency
  const totals = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    let expenses = 0;

    transactions.forEach((t) => {
      const converted = convertCurrency(t.amount, t.currency || 'INR', currency);
      if (t.type === 'sale') sales += converted;
      else if (t.type === 'purchase') purchases += converted;
      else if (t.type === 'expense') expenses += converted;
    });

    return {
      sales,
      purchases,
      expenses,
      net: sales - purchases - expenses,
    };
  }, [transactions, currency]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingId(null);
    setFormType('sale');
    setFormAmount(0);
    setFormCategory('Retail Counter');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('UPI');
    setFormInvoiceNo(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (t: Transaction) => {
    setEditingId(t.id ?? null);
    setFormType(t.type);
    setFormAmount(t.amount);
    setFormCategory(t.category);
    setFormDescription(t.description);
    setFormDate(t.date);
    setFormPaymentMethod(t.paymentMethod || 'UPI');
    setFormInvoiceNo(t.invoiceNo || '');
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) {
      alert('Please enter a valid amount greater than zero.');
      return;
    }

    if (editingId) {
      await updateTransaction(editingId, {
        type: formType,
        amount: formAmount,
        currency,
        category: formCategory,
        description: formDescription || `${formType.toUpperCase()} entry`,
        date: formDate,
        paymentMethod: formPaymentMethod,
        invoiceNo: formInvoiceNo,
      });
    } else {
      await addTransaction({
        type: formType,
        amount: formAmount,
        currency,
        category: formCategory,
        description: formDescription || `${formType.toUpperCase()} entry`,
        date: formDate,
        paymentMethod: formPaymentMethod,
        invoiceNo: formInvoiceNo,
      });
    }
    setIsModalOpen(false);
  };

  // Export to Excel / CSV
  const handleExportData = (format: 'xlsx' | 'csv') => {
    const data = filteredTransactions.map((t) => ({
      ID: t.id,
      Date: t.date,
      Type: t.type.toUpperCase(),
      Category: t.category,
      Description: t.description,
      Amount: t.amount,
      Currency: t.currency,
      PaymentMethod: t.paymentMethod || 'N/A',
      InvoiceNo: t.invoiceNo || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, `LUMEN_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `LUMEN_Transactions_${new Date().toISOString().split('T')[0]}.csv`, {
        bookType: 'csv',
      });
    }
  };

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Sales, Purchases & Expenses
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Full double-entry transaction management with instant local IndexedDB persistence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportData('xlsx')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold glass-card hover:border-emerald-500 text-emerald-400 transition-all flex items-center gap-1.5"
          >
            <span>📥</span> Excel
          </button>
          <button
            onClick={() => handleExportData('csv')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold glass-card hover:border-blue-500 text-blue-400 transition-all flex items-center gap-1.5"
          >
            <span>📄</span> CSV
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <span>+</span> Record Transaction
          </button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border-t-2 border-emerald-500">
          <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Total Sales (Income)</span>
            <span className="text-emerald-500">↑</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {formatCurrency(totals.sales, currency)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-amber-500">
          <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Total Purchases</span>
            <span className="text-amber-500">↓</span>
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            {formatCurrency(totals.purchases, currency)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-rose-500">
          <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Total Expenses (OpEx)</span>
            <span className="text-rose-500">↓</span>
          </div>
          <p className="text-2xl font-bold text-rose-500 mt-1">
            {formatCurrency(totals.expenses, currency)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-blue-500">
          <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Net Operating Cash Flow</span>
            <span className="text-blue-500">⇄</span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${totals.net >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
            {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net, currency)}
          </p>
        </div>
      </div>

      {/* Controls: Search, Type, Category, Date Filters */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search by description, category, or invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:border-blue-500"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Type Filter */}
          <div className="flex rounded-xl p-1 border text-xs font-medium" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            {(['all', 'sale', 'purchase', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  typeFilter === t ? 'bg-blue-600 text-white font-bold shadow' : 'text-gray-400'
                }`}
              >
                {t === 'all' ? 'All Types' : `${t}s`}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'month' | 'year')}
            className="px-3 py-2 rounded-xl text-xs border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 rounded-xl text-xs border flex items-center gap-1 text-gray-300"
            style={{ borderColor: 'var(--border-color)' }}
            title="Toggle sort direction"
          >
            <span>Sort: {sortField}</span>
            <span>{sortOrder === 'desc' ? '▼' : '▲'}</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider border-b" style={{ borderColor: 'var(--border-color)', background: 'rgba(79,142,247,0.04)', color: 'var(--text-muted)' }}>
              <tr>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Description</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Payment / Ref</th>
                <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No transactions match the selected filter. Click &quot;Record Transaction&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isSale = tx.type === 'sale';
                  const isPurchase = tx.type === 'purchase';

                  return (
                    <tr key={tx.id} className="hover:bg-blue-500/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {tx.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                          style={{
                            background: isSale
                              ? 'rgba(16,185,129,0.12)'
                              : isPurchase
                              ? 'rgba(245,158,11,0.12)'
                              : 'rgba(244,63,94,0.12)',
                            color: isSale ? '#10b981' : isPurchase ? '#f59e0b' : '#f43f5e',
                          }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {tx.paymentMethod || 'Cash'} · {tx.invoiceNo || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-bold text-right whitespace-nowrap">
                        <span style={{ color: isSale ? '#10b981' : '#f43f5e' }}>
                          {isSale ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap space-x-2">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="px-2.5 py-1 text-xs rounded-lg glass-card hover:border-blue-400 text-blue-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => tx.id && deleteTransaction(tx.id)}
                          className="px-2.5 py-1 text-xs rounded-lg glass-card hover:border-rose-400 text-rose-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl shadow-2xl space-y-4 border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingId ? 'Edit Transaction' : 'Record New Transaction'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sale', 'purchase', 'expense'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setFormType(t)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                        formType === t ? 'border-blue-500 bg-blue-500/15 text-blue-400 font-extrabold' : 'border-gray-700 text-gray-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Category
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Electronics, Utilities, Supplies, Wages"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Description / Customer / Vendor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Detailed note about this entry..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Payment Mode
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Invoice / Receipt #
                  </label>
                  <input
                    type="text"
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border text-gray-400 hover:text-white"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                >
                  {editingId ? 'Save Changes' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
