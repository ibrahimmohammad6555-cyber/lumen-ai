'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/currencies';
import { type Product } from '@/lib/db';
import * as XLSX from 'xlsx';

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, adjustProductStock, currency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Restock / Shipment Arrival');

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [unit, setUnit] = useState('pcs');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(5);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Inventory Totals & Valuations
  const stats = useMemo(() => {
    let totalItems = products.length;
    let totalUnits = 0;
    let valuationCost = 0;
    let valuationRetail = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      totalUnits += p.stockQuantity || 0;
      valuationCost += (p.costPrice || 0) * (p.stockQuantity || 0);
      valuationRetail += (p.sellingPrice || 0) * (p.stockQuantity || 0);
      if ((p.stockQuantity || 0) <= (p.reorderLevel || 0)) {
        lowStockCount++;
      }
    });

    return {
      totalItems,
      totalUnits,
      valuationCost,
      valuationRetail,
      potentialProfit: valuationRetail - valuationCost,
      lowStockCount,
    };
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (stockStatusFilter === 'low' && p.stockQuantity > p.reorderLevel) return false;
      if (stockStatusFilter === 'out' && p.stockQuantity > 0) return false;
      if (stockStatusFilter === 'ok' && p.stockQuantity <= p.reorderLevel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = p.name.toLowerCase().includes(q);
        const mSku = p.sku.toLowerCase().includes(q);
        const mCat = p.category.toLowerCase().includes(q);
        if (!mName && !mSku && !mCat) return false;
      }
      return true;
    });
  }, [products, categoryFilter, stockStatusFilter, searchQuery]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('General');
    setUnit('pcs');
    setCostPrice(0);
    setSellingPrice(0);
    setStockQuantity(10);
    setReorderLevel(5);
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setUnit(p.unit || 'pcs');
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setStockQuantity(p.stockQuantity);
    setReorderLevel(p.reorderLevel);
    setIsProductModalOpen(true);
  };

  const openStockAdjustModal = (p: Product) => {
    setAdjustTarget(p);
    setAdjustAmount(1);
    setAdjustReason('Restock / Shipment Arrival');
    setIsAdjustModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct?.id) {
      await updateProduct(editingProduct.id, {
        name,
        sku,
        category,
        unit,
        costPrice,
        sellingPrice,
        stockQuantity,
        reorderLevel,
      });
    } else {
      await addProduct({
        name,
        sku,
        category,
        unit,
        costPrice,
        sellingPrice,
        stockQuantity,
        reorderLevel,
      });
    }
    setIsProductModalOpen(false);
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustTarget?.id) {
      await adjustProductStock(adjustTarget.id, adjustAmount);
    }
    setIsAdjustModalOpen(false);
  };

  const exportInventory = (format: 'xlsx' | 'csv') => {
    const data = filteredProducts.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category,
      Unit: p.unit,
      'Cost Price': p.costPrice,
      'Selling Price': p.sellingPrice,
      'Stock Quantity': p.stockQuantity,
      'Reorder Level': p.reorderLevel,
      'Total Valuation (Cost)': p.costPrice * p.stockQuantity,
      'Total Valuation (Retail)': p.sellingPrice * p.stockQuantity,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, `LUMEN_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `LUMEN_Inventory_${new Date().toISOString().split('T')[0]}.csv`, {
        bookType: 'csv',
      });
    }
  };

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Inventory & Stock Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Catalogue tracking, low-stock threshold triggers, and real-time inventory valuations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInventory('xlsx')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold glass-card hover:border-emerald-500 text-emerald-400 transition-all flex items-center gap-1.5"
          >
            <span>📥</span> Excel
          </button>
          <button
            onClick={() => exportInventory('csv')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold glass-card hover:border-blue-500 text-blue-400 transition-all flex items-center gap-1.5"
          >
            <span>📄</span> CSV
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <span>+</span> Add Product
          </button>
        </div>
      </div>

      {/* Low Stock Banner Warning */}
      {stats.lowStockCount > 0 && (
        <div
          className="p-4 rounded-2xl flex items-center justify-between border"
          style={{ background: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.3)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-400">
                Low Stock Alert: {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} at or below reorder threshold!
              </p>
              <p className="text-xs text-amber-200/80">
                Review low-stock items and generate purchase orders to avoid stockouts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStockStatusFilter('low')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
          >
            View Low Stock Items
          </button>
        </div>
      )}

      {/* Inventory KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border-t-2 border-blue-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Catalogue & Total Units</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {stats.totalItems} SKUs <span className="text-sm font-normal text-gray-400">({stats.totalUnits} Units)</span>
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-emerald-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Inventory Valuation (Cost)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(stats.valuationCost, currency)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-cyan-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Expected Retail Value</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">
            {formatCurrency(stats.valuationRetail, currency)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-t-2 border-indigo-500">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Potential Gross Profit</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            +{formatCurrency(stats.potentialProfit, currency)}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by product name, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

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

        <select
          value={stockStatusFilter}
          onChange={(e) => setStockStatusFilter(e.target.value as 'all' | 'low' | 'out' | 'ok')}
          className="px-3 py-2 rounded-xl text-xs border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Stock Statuses</option>
          <option value="low">Low Stock (≤ Reorder Level)</option>
          <option value="out">Out of Stock (0 units)</option>
          <option value="ok">Well Stocked</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="glass-card rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider border-b" style={{ borderColor: 'var(--border-color)', background: 'rgba(79,142,247,0.04)', color: 'var(--text-muted)' }}>
              <tr>
                <th className="py-3.5 px-4 font-semibold">SKU / Code</th>
                <th className="py-3.5 px-4 font-semibold">Product Name</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold text-right">Cost Price</th>
                <th className="py-3.5 px-4 font-semibold text-right">Selling Price</th>
                <th className="py-3.5 px-4 font-semibold text-center">Stock Level</th>
                <th className="py-3.5 px-4 font-semibold text-right">Total Value</th>
                <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No products found in inventory. Click &quot;Add Product&quot; to register items.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.reorderLevel;
                  const isOut = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-blue-500/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-400">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.category}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(p.costPrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(p.sellingPrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          ● {p.stockQuantity} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(p.costPrice * p.stockQuantity, currency)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => openStockAdjustModal(p)}
                          className="px-2 py-1 text-xs rounded-lg glass-card hover:border-emerald-400 text-emerald-400"
                          title="Adjust Stock Quantity"
                        >
                          ± Stock
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-2 py-1 text-xs rounded-lg glass-card hover:border-blue-400 text-blue-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => p.id && deleteProduct(p.id)}
                          className="px-2 py-1 text-xs rounded-lg glass-card hover:border-rose-400 text-rose-400"
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

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl shadow-2xl space-y-4 border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingProduct ? 'Edit Product' : 'Add New Inventory Product'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Thermal Receipt Printer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>SKU / Barcode</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Cost Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Selling Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Unit Type</label>
                  <input
                    type="text"
                    placeholder="pcs, box, kg"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Current Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Reorder Alert Trigger</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border text-gray-400"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow"
                >
                  {editingProduct ? 'Save Changes' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-4 border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Adjust Stock Quantity
                </h2>
                <p className="text-xs text-blue-400 font-mono mt-0.5">{adjustTarget.name} ({adjustTarget.sku})</p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-800/40 text-xs flex justify-between">
                <span className="text-gray-400">Current Stock Quantity:</span>
                <span className="font-bold text-white">{adjustTarget.stockQuantity} {adjustTarget.unit}</span>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Stock Adjustment Units (Use positive for arrival, negative for damage/loss)
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border text-sm font-bold text-center"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <p className="text-xs text-center mt-1 text-gray-400">
                  New resulting stock level will be: <strong className="text-emerald-400">{Math.max(0, adjustTarget.stockQuantity + adjustAmount)} {adjustTarget.unit}</strong>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Reason / Source
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="Restock / Shipment Arrival">Restock / Shipment Arrival</option>
                  <option value="Damaged / Expired Goods">Damaged / Expired Goods</option>
                  <option value="Physical Audit Discrepancy">Physical Audit Discrepancy</option>
                  <option value="Customer Return / Warranty">Customer Return / Warranty</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border text-gray-400"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
