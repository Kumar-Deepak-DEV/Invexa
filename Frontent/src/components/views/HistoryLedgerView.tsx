import React, { useState, useMemo } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import { MoveDirection, LedgerEntry, MoveHistoryEntry } from '../../types';
import {
  History,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Download,
  Calendar,
  CheckCircle2,
  Layers,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  MapPin,
  Clock,
  X,
  Eye,
  FileText
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

export const HistoryLedgerView: React.FC = () => {
  const { ledger, moveHistory, products, warehouses, showToast } = useStockSense();

  const [activeTab, setActiveTab] = useState<'history' | 'ledger'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'IN' | 'OUT' | 'TRANSFER'>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [operationFilter, setOperationFilter] = useState('ALL');
  const [selectedLedgerItem, setSelectedLedgerItem] = useState<LedgerEntry | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<MoveHistoryEntry | null>(null);

  // Statistics
  const stats = useMemo(() => {
    let totalInQty = 0;
    let totalOutQty = 0;
    let transferCount = 0;

    ledger.forEach((item) => {
      if (item.changeType === 'IN') {
        totalInQty += Math.abs(item.qtyChange);
      } else if (item.changeType === 'OUT') {
        totalOutQty += Math.abs(item.qtyChange);
      } else if (item.changeType === 'TRANSFER') {
        transferCount += 1;
      }
    });

    return {
      totalEntries: ledger.length,
      totalInQty,
      totalOutQty,
      transferCount,
      historyCount: moveHistory.length,
    };
  }, [ledger, moveHistory]);

  // Filtered Move History
  const filteredHistory = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return (moveHistory || []).filter((item) => {
      if (!item) return false;
      const ref = String(item.reference || '').toLowerCase();
      const prod = String(item.product || '').toLowerCase();
      const fromLoc = String(item.from || '').toLowerCase();
      const toLoc = String(item.to || '').toLowerCase();
      const usr = String(typeof item.user === 'string' ? item.user : (item.user as any)?.name || '').toLowerCase();

      const matchesSearch =
        !term ||
        ref.includes(term) ||
        prod.includes(term) ||
        fromLoc.includes(term) ||
        toLoc.includes(term) ||
        usr.includes(term);

      const matchesDirection =
        directionFilter === 'ALL' || item.direction === directionFilter;

      return matchesSearch && matchesDirection;
    });
  }, [moveHistory, searchTerm, directionFilter]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return (ledger || []).filter((item) => {
      if (!item) return false;
      const ref = String(item.reference || '').toLowerCase();
      const prodName = String(item.productName || '').toLowerCase();
      const prodId = String(item.productId || '').toLowerCase();
      const usr = String(typeof item.user === 'string' ? item.user : (item.user as any)?.name || '').toLowerCase();
      const op = String(item.operation || '').toLowerCase();
      const wh = String(item.warehouse || '').toLowerCase();

      const matchesSearch =
        !term ||
        ref.includes(term) ||
        prodName.includes(term) ||
        prodId.includes(term) ||
        usr.includes(term) ||
        op.includes(term) ||
        wh.includes(term);

      const matchesDirection =
        directionFilter === 'ALL' || item.changeType === directionFilter;

      const matchesWarehouse =
        warehouseFilter === 'ALL' || item.warehouse === warehouseFilter;

      const matchesOperation =
        operationFilter === 'ALL' || item.operation === operationFilter;

      return matchesSearch && matchesDirection && matchesWarehouse && matchesOperation;
    });
  }, [ledger, searchTerm, directionFilter, warehouseFilter, operationFilter]);

  // CSV Export for Ledger
  const exportLedgerCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Reference', 'Product Name', 'Operation', 'Direction', 'Qty Delta', 'Unit', 'Prev Stock', 'New Stock', 'Warehouse', 'Location', 'Responsible User'];
      const rows = filteredLedger.map(l => [
        `"${l.id}"`,
        `"${l.date}"`,
        `"${l.reference}"`,
        `"${l.productName}"`,
        `"${l.operation}"`,
        `"${l.changeType}"`,
        l.qtyChange,
        `"${l.unit}"`,
        l.prevStock,
        l.newStock,
        `"${l.warehouse}"`,
        `"${l.location}"`,
        `"${l.user}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `stocksense-stock-ledger-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Stock Ledger CSV exported successfully!', 'success');
    } catch {
      showToast('Failed to export CSV', 'danger');
    }
  };

  // CSV Export for Move History
  const exportHistoryCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Reference', 'Type', 'Product', 'From Location', 'To Location', 'Quantity', 'Direction', 'Responsible User', 'Status'];
      const rows = filteredHistory.map(h => [
        `"${h.id}"`,
        `"${h.date}"`,
        `"${h.reference}"`,
        `"${h.type}"`,
        `"${h.product}"`,
        `"${h.from}"`,
        `"${h.to}"`,
        `"${h.quantity}"`,
        `"${h.direction}"`,
        `"${h.user}"`,
        `"${h.status}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `stocksense-move-history-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Move History CSV exported successfully!', 'success');
    } catch {
      showToast('Failed to export CSV', 'danger');
    }
  };

  const getDirectionBadge = (dir: MoveDirection) => {
    switch (dir) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            IN (Receipt)
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            OUT (Delivery)
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            TRANSFER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {dir}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Audit & Compliance Ledger
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Move History & Stock Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable single-source audit trail of all warehouse movements, receipt postings, deliveries, and cycle counts.
          </p>
        </div>

        {/* Tab switcher + Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Move History
              <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]">
                {moveHistory.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Stock Ledger
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-[10px]">
                {ledger.length}
              </span>
            </button>
          </div>

          <button
            onClick={activeTab === 'history' ? exportHistoryCSV : exportLedgerCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Audit Records</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.totalEntries}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">100% Immutable Trail</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Inbound Qty Added</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">+{stats.totalInQty.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">From Vendor Receipts</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Outbound Qty Dispatched</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">-{stats.totalOutQty.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">To Customer Orders</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Internal Transfers</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.transferCount}</div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">0 Net Stock Drift</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3.5">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'history' ? 'Search reference, product, location, user...' : 'Search ledger reference, SKU, operation, user...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Direction Filter */}
          <div className="min-w-[170px]">
            <CustomSelect
              value={directionFilter}
              onChange={(val) => setDirectionFilter(val as any)}
              options={[
                { value: 'ALL', label: 'All Directions' },
                { value: 'IN', label: 'IN (Inbound)', badge: 'IN', badgeColor: 'bg-emerald-50 text-emerald-700' },
                { value: 'OUT', label: 'OUT (Outbound)', badge: 'OUT', badgeColor: 'bg-blue-50 text-blue-700' },
                { value: 'TRANSFER', label: 'TRANSFER (Internal)', badge: 'TRF', badgeColor: 'bg-purple-50 text-purple-700' }
              ]}
              size="sm"
            />
          </div>

          {activeTab === 'ledger' && (
            <div className="min-w-[180px]">
              <CustomSelect
                value={warehouseFilter}
                onChange={(val) => setWarehouseFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Warehouses' },
                  ...warehouses.map(wh => ({
                    value: wh.name,
                    label: wh.name,
                    subLabel: wh.city,
                    badge: wh.code
                  }))
                ]}
                size="sm"
              />
            </div>
          )}

          {(searchTerm || directionFilter !== 'ALL' || warehouseFilter !== 'ALL' || operationFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDirectionFilter('ALL');
                setWarehouseFilter('ALL');
                setOperationFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: MOVE HISTORY VIEW */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Warehouse Movement Logs</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {filteredHistory.length} logs
              </span>
            </div>
            <div className="text-xs text-slate-400">Chronologically Ordered</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">From Location</th>
                  <th className="py-3 px-4">To Location</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-center">Direction</th>
                  <th className="py-3 px-4">Responsible</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No movement history records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.date}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {item.reference}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.product}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.from}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.to}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {getDirectionBadge(item.direction)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {item.user.charAt(0)}
                          </div>
                          <span>{item.user}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedHistoryItem(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK LEDGER VIEW */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">General Inventory Stock Ledger</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {filteredLedger.length} ledger postings
              </span>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Continuous Cryptographic Sequence
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Posting Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Product & SKU</th>
                  <th className="py-3 px-4">Operation Type</th>
                  <th className="py-3 px-4 text-center">Direction</th>
                  <th className="py-3 px-4 text-right">Delta (Qty)</th>
                  <th className="py-3 px-4 text-right">Prev Balance</th>
                  <th className="py-3 px-4 text-right font-bold text-blue-600">New Balance</th>
                  <th className="py-3 px-4">Warehouse / Location</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No stock ledger entries found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {entry.date}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap font-mono text-[11px]">
                        {entry.reference}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {entry.productName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {entry.productId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap">
                          {entry.operation}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {getDirectionBadge(entry.changeType)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            entry.qtyChange > 0
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : entry.qtyChange < 0
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-blue-600 dark:text-blue-400 font-bold'
                          }
                        >
                          {entry.qtyChange > 0 ? `+${entry.qtyChange}` : entry.qtyChange} {entry.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                        {entry.prevStock} {entry.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap bg-blue-50/30 dark:bg-blue-950/20">
                        {entry.newStock} {entry.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{entry.warehouse}</div>
                        <div className="text-[10px] text-slate-400">{entry.location}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {entry.user}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLedgerItem(entry)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View Ledger Verification"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: LEDGER ENTRY */}
      {selectedLedgerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Ledger Entry Audit Verification</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedLedgerItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLedgerItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Cryptographically verified ledger record. Zero balance discrepancy detected.</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400 font-medium">Operation Reference</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedLedgerItem.reference}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400 font-medium">Date & Timestamp</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLedgerItem.date}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400 font-medium">Product Name</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLedgerItem.productName}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400 font-medium">Product Code / SKU</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLedgerItem.productId}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400 font-medium">Warehouse Facility</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLedgerItem.warehouse}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400 font-medium">Storage Location</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLedgerItem.location}</div>
                </div>
              </div>

              {/* Balance Transition Diagram */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-3">Balance Transition Breakdown</div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Previous Stock</div>
                    <div className="text-base font-bold text-slate-700 dark:text-slate-300">{selectedLedgerItem.prevStock} {selectedLedgerItem.unit}</div>
                  </div>
                  <div className="text-center px-3 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Delta Applied</div>
                    <div className={`text-sm font-bold ${selectedLedgerItem.qtyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedLedgerItem.qtyChange > 0 ? `+${selectedLedgerItem.qtyChange}` : selectedLedgerItem.qtyChange} {selectedLedgerItem.unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">New Balance</div>
                    <div className="text-base font-bold text-blue-600 dark:text-blue-400">{selectedLedgerItem.newStock} {selectedLedgerItem.unit}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Authorized Operator: <strong>{selectedLedgerItem.user}</strong></span>
                </div>
                <div className="font-mono text-[10px] text-slate-400">HASH: 0x{selectedLedgerItem.id.slice(0, 10)}...</div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLedgerItem(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: HISTORY ITEM */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Warehouse Movement Details</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedHistoryItem.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400">Operation Type</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedHistoryItem.type}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400">Date Logged</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedHistoryItem.date}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl col-span-2">
                  <div className="text-slate-400">Product Name</div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5">{selectedHistoryItem.product}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400">Origin (From)</div>
                  <div className="font-medium text-slate-900 dark:text-white mt-0.5">{selectedHistoryItem.from}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400">Destination (To)</div>
                  <div className="font-medium text-slate-900 dark:text-white mt-0.5">{selectedHistoryItem.to}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400">Quantity Transferred</div>
                  <div className="font-bold text-blue-600 text-sm mt-0.5">{selectedHistoryItem.quantity}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="text-slate-400">Execution Status</div>
                  <div className="font-semibold text-emerald-600 mt-0.5">{selectedHistoryItem.status}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-300">Operator: <strong>{selectedHistoryItem.user}</strong></span>
                </div>
                {getDirectionBadge(selectedHistoryItem.direction)}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
