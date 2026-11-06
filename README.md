# LUMEN.AI — Complete Business Intelligence & Commercial Calculation Platform

A comprehensive 3D-first business intelligence, record management, commercial calculation, and inventory suite for businesses worldwide.

## Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **3D Graphics Engine**: Three.js via React Three Fiber v9 & Drei v10
- **Data Persistence**: Local-First IndexedDB via Dexie v4 + Optional Supabase Cloud Sync
- **Charts & Data Viz**: Recharts (Dynamic Area, Bar, and Donut charts)
- **Exports & Documents**: SheetJS (`xlsx`) for Excel workbooks, `jspdf` & `jspdf-autotable` for branded PDF reports, and JSON disaster-recovery snapshots.
- **Styling**: Tailwind CSS + Custom Dark/Light theme design tokens

## Features Implemented & Verified

### 1. Business Intelligence Dashboard (`/dashboard`)
- Real-time revenue, gross profit, net operating profit, and margin KPIs linked directly to IndexedDB records.
- Smooth, pointer-reactive 3D Performance Core with luminous distorted orb, orbiting data nodes, and stars background.
- Dynamic area & bar charts reflecting date-filtered sales trends.
- Quick date filtering (`Today`, `30D`, `12M`, `All Time`).
- Recent activity feed with live transaction links.

### 2. Commercial Calculator Suite (`/calculators`) — 8 Interactive Tools
1. **Target Selling Price Calculator**: Calculates selling price, gross profit, and margin % from cost & markup.
2. **Profit & Loss Statement Calculator**: Comprehensive revenue, COGS, and operating expense breakdown.
3. **Margin vs. Markup Converter**: Instant percentage conversion and unit profit analysis.
4. **Discount Calculator**: Visual discount slider, final payable amount, and customer savings.
5. **GST & Tax Calculator**: Inclusive & exclusive tax modes, standard GST slabs (0%, 5%, 12%, 18%, 28%), CGST/SGST/IGST breakdown.
6. **Break-Even Calculator**: Fixed overheads, variable cost per unit, break-even unit volume & revenue.
7. **Commission Calculator**: Flat & tiered commission payouts and net retained business earnings.
8. **Expense & Burn-Rate Forecast**: Categorized monthly overhead runway and daily burn rates.

### 3. Record Management — Sales, Purchases & Expenses (`/sales`)
- Complete double-entry record ledger for Sales (income), Purchases (stock/materials), and Expenses (overheads).
- Add & Edit transaction modals with invoice/receipt numbers and payment methods (UPI, Cash, Card, Bank Transfer, Cheque).
- Search, filter by type/category/date, and sort ascending/descending.
- One-click export of filtered transaction records to Excel (`.xlsx`) and CSV.

### 4. Real-Time Analytics (`/analytics`)
- Timeframe filters: 7 Days, 30 Days, 6 Months, 12 Months, All Time.
- Revenue vs. overheads trends and net profit trajectory.
- Donut chart of expense distribution by category.
- Horizontal bar chart of revenue by customer payment channel.
- Real-time average ticket size and volume metrics.

### 5. Inventory Management (`/inventory`)
- Product catalogue tracking SKU, unit type, cost price, selling price, and stock levels.
- Low-stock threshold alerts with automatic reorder triggers.
- Quick ± stock adjustment modal with audit reason tracking.
- Asset valuation totals (cost valuation vs. projected retail valuation & potential margin).
- Export inventory catalogue to Excel (`.xlsx`) and CSV.

### 6. Reports & Export Engine (`/reports`)
- Formatted client-side PDF export with LUMEN.AI corporate header, executive summary table, and transaction/inventory ledger.
- Multi-sheet Excel workbook export (`.xlsx`) covering Executive Summary, Transactions, and Inventory.
- Full local disaster-recovery backup: Export complete database to JSON & Restore from JSON backup file.
- Print-friendly layout for physical accounting audits (`window.print()`).

### 7. Settings, Identity & Cloud Sync (`/settings`)
- Dark / Light theme toggle persisted in IndexedDB.
- Currency selector supporting INR (₹ default), USD ($), EUR (€), GBP (£), AED (د.إ), and JPY (¥) with conversion engine.
- Optional Supabase authentication and cloud sync (URL & Anon Key configuration).
- Database reset and sample data reload controls.

## Running the Application

```bash
# Navigate to project folder
cd C:\Users\ibrah\.gemini\antigravity\scratch\lumen-ai

# Start local development server
npm run dev
# URL: http://localhost:3000

# Build production bundle
npm run build

# Start production server
npm start

# Run linting
npm run lint
```
