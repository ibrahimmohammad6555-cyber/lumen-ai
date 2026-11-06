'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, convertCurrency } from '@/lib/currencies';
import { getDb } from '@/lib/db';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { transactions, products, currency, refreshTransactions, refreshProducts } = useApp();
  const [reportRange, setReportRange] = useState<'30d' | '90d' | 'ytd' | 'all'>('all');
  const [reportType, setReportType] = useState<'pnl' | 'ledger' | 'inventory'>('pnl');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered transactions for report
  const filteredTx = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();

    return transactions.filter((t) => {
      const txTime = new Date(t.date).getTime();
      if (reportRange === '30d') return nowTime - txTime <= 30 * 86400000;
      if (reportRange === '90d') return nowTime - txTime <= 90 * 86400000;
      if (reportRange === 'ytd') {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, reportRange]);

  // Aggregate numbers
  const summary = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    let expenses = 0;

    filteredTx.forEach((t) => {
      const val = convertCurrency(t.amount, t.currency || 'INR', currency);
      if (t.type === 'sale') sales += val;
      else if (t.type === 'purchase') purchases += val;
      else if (t.type === 'expense') expenses += val;
    });

    const grossProfit = sales - purchases;
    const netProfit = grossProfit - expenses;
    const netMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

    return {
      sales,
      purchases,
      expenses,
      grossProfit,
      netProfit,
      netMargin,
    };
  }, [filteredTx, currency]);

  // ─── 1. Export to PDF ──────────────────────────────────────────────────
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header Branding
    doc.setFillColor(7, 15, 33);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(79, 142, 247);
    doc.text('LUMEN.AI', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255);
    doc.text('Business Intelligence & Executive Financial Report', 14, 26);
    doc.text(`Generated: ${dateStr}`, 145, 26);

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Executive Financial Summary', 14, 48);

    const summaryTableData = [
      ['Gross Sales Revenue', formatCurrency(summary.sales, currency)],
      ['Cost of Purchases / Stock', formatCurrency(summary.purchases, currency)],
      ['Gross Operating Margin', formatCurrency(summary.grossProfit, currency)],
      ['Total Operating Expenses (OpEx)', formatCurrency(summary.expenses, currency)],
      ['Net Operating Profit / Loss', formatCurrency(summary.netProfit, currency)],
      ['Net Profit Margin %', `${summary.netMargin.toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: 54,
      head: [['Financial Metric', 'Value']],
      body: summaryTableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 142, 247], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3.5 },
    });

    // Detailed Table depending on Report Type
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;

    if (reportType === 'inventory') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Inventory Status & Asset Valuation', 14, finalY + 14);

      const invData = products.map((p) => [
        p.sku,
        p.name,
        p.category,
        formatCurrency(p.costPrice, currency),
        formatCurrency(p.sellingPrice, currency),
        `${p.stockQuantity} ${p.unit || 'pcs'}`,
        formatCurrency(p.costPrice * p.stockQuantity, currency),
      ]);

      autoTable(doc, {
        startY: finalY + 18,
        head: [['SKU', 'Product Name', 'Category', 'Unit Cost', 'Sell Price', 'In Stock', 'Valuation']],
        body: invData,
        theme: 'grid',
        headStyles: { fillColor: [14, 30, 53], textColor: 255 },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Transaction Ledger Audit', 14, finalY + 14);

      const txData = filteredTx.slice(0, 40).map((t) => [
        t.date,
        t.type.toUpperCase(),
        t.category,
        t.description,
        t.paymentMethod || 'Cash',
        formatCurrency(t.amount, t.currency || currency),
      ]);

      autoTable(doc, {
        startY: finalY + 18,
        head: [['Date', 'Type', 'Category', 'Description', 'Method', 'Amount']],
        body: txData,
        theme: 'grid',
        headStyles: { fillColor: [14, 30, 53], textColor: 255 },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });
    }

    doc.save(`LUMEN_Report_${reportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ─── 2. Export to Excel ────────────────────────────────────────────────
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Metric', 'Amount', 'Currency'],
      ['Gross Sales Revenue', summary.sales, currency],
      ['Cost of Purchases', summary.purchases, currency],
      ['Gross Profit', summary.grossProfit, currency],
      ['Operating Expenses', summary.expenses, currency],
      ['Net Operating Income', summary.netProfit, currency],
      ['Net Profit Margin %', summary.netMargin / 100, '%'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Executive Summary');

    // Transactions Sheet
    const txSheetData = filteredTx.map((t) => ({
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
    const wsTx = XLSX.utils.json_to_sheet(txSheetData);
    XLSX.utils.book_append_sheet(workbook, wsTx, 'Transactions');

    // Products Sheet
    const prodSheetData = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category,
      UnitCost: p.costPrice,
      SellingPrice: p.sellingPrice,
      StockQty: p.stockQuantity,
      ReorderLevel: p.reorderLevel,
      ValuationCost: p.costPrice * p.stockQuantity,
      ValuationRetail: p.sellingPrice * p.stockQuantity,
    }));
    const wsProd = XLSX.utils.json_to_sheet(prodSheetData);
    XLSX.utils.book_append_sheet(workbook, wsProd, 'Inventory');

    XLSX.writeFile(workbook, `LUMEN_Executive_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ─── 3. Full Database Backup JSON ──────────────────────────────────────
  const handleBackupDatabase = async () => {
    const db = getDb();
    const allTransactions = await db.transactions.toArray();
    const allProducts = await db.products.toArray();
    const allPreferences = await db.preferences.toArray();

    const backupPayload = {
      app: 'LUMEN.AI',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        transactions: allTransactions,
        products: allProducts,
        preferences: allPreferences,
      },
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LUMEN_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── 4. Database Restore JSON ──────────────────────────────────────────
  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed?.data?.transactions || !parsed?.data?.products) {
        alert('Invalid LUMEN.AI backup file format.');
        return;
      }

      if (window.confirm('Restoring will merge and replace current local data with the backup file. Proceed?')) {
        const db = getDb();
        await db.transactions.clear();
        await db.products.clear();
        await db.transactions.bulkAdd(parsed.data.transactions);
        await db.products.bulkAdd(parsed.data.products);

        await refreshTransactions();
        await refreshProducts();
        alert('Database successfully restored from backup file!');
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing backup JSON file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Financial Reports & Document Exports
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Generate executive P&L statements, auditor-ready Excel workbooks, PDF exports, and database backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold glass-card hover:border-blue-400 text-blue-400 flex items-center gap-1.5"
          >
            <span>🖨️</span> Print View
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25 flex items-center gap-1.5"
          >
            <span>📄</span> Download PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
          >
            <span>📥</span> Download Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Control Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Report Timeframe:
          </label>
          <div className="flex rounded-xl p-1 border text-xs font-semibold" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            {[
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'ytd', label: 'Year to Date' },
              { id: 'all', label: 'All Records' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setReportRange(r.id as typeof reportRange)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reportRange === r.id ? 'bg-blue-600 text-white shadow' : 'text-gray-400'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Report Content:
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="pnl">Profit & Loss Statement</option>
            <option value="ledger">Detailed Transaction Ledger</option>
            <option value="inventory">Inventory Asset Valuation</option>
          </select>
        </div>
      </div>

      {/* Printable Financial Statement Paper Canvas */}
      <div className="glass-card p-6 md:p-8 rounded-2xl border space-y-6" style={{ borderColor: 'var(--border-color)' }}>
        {/* Document Header */}
        <div className="flex justify-between items-start border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg">
                L
              </div>
              <span className="text-xl font-bold tracking-tight text-gradient">LUMEN.AI</span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Comprehensive Enterprise Accounting & Business Metrics
            </p>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Verified Statement
            </span>
            <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>
              Base Currency: {currency}
            </p>
          </div>
        </div>

        {/* P&L Statement Rows */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">
            Statement of Operations & Financial Performance
          </h2>

          <div className="divide-y text-sm" style={{ borderColor: 'var(--border-color)' }}>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>1. Gross Invoiced Sales Revenue</span>
              <span className="font-bold text-emerald-400">{formatCurrency(summary.sales, currency)}</span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>2. Cost of Purchases & Raw Materials</span>
              <span className="font-semibold text-amber-400">-{formatCurrency(summary.purchases, currency)}</span>
            </div>

            <div className="py-3 flex justify-between font-bold" style={{ background: 'rgba(79,142,247,0.04)' }}>
              <span className="text-blue-400">Gross Operating Profit (1 - 2)</span>
              <span className="text-blue-400">{formatCurrency(summary.grossProfit, currency)}</span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>3. Operating Expenses & Overheads (OpEx)</span>
              <span className="font-semibold text-rose-400">-{formatCurrency(summary.expenses, currency)}</span>
            </div>

            <div className="py-4 flex justify-between text-base font-extrabold border-t-2 border-b-2" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Net Operating Income / (Loss)</span>
              <span className={summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
                {summary.netProfit >= 0 ? '+' : ''}{formatCurrency(summary.netProfit, currency)}
              </span>
            </div>

            <div className="py-2.5 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Operating Profit Margin</span>
              <span className="font-bold text-blue-400">{summary.netMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Restore Box */}
      <div className="glass-card p-6 rounded-2xl border space-y-4" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Data Persistence & Disaster Recovery
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Your data is stored in your local browser storage. Export regular JSON backup snapshots to safeguard your business records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleBackupDatabase}
            className="px-4 py-2 rounded-xl text-xs font-bold glass-card hover:border-blue-400 text-blue-400 transition-all flex items-center gap-2"
          >
            <span>💾</span> Export Complete Database (.json)
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-bold glass-card hover:border-amber-400 text-amber-400 transition-all flex items-center gap-2"
          >
            <span>📂</span> Restore from Backup File
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleRestoreDatabase}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
