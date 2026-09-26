import React from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  Package,
  Layers,
  AlertTriangle,
  AlertOctagon,
  ArrowDownLeft,
  Truck,
  ArrowLeftRight,
  Building2,
  TrendingUp,
  PlusCircle,
  Factory,
  CheckCircle2,
  Clock,
  Store,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    getKPIs,
    receipts,
    deliveries,
    products,
    setActiveView,
    setSelectedReceiptId,
    setSelectedDeliveryId
  } = useStockSense();

  const kpis = getKPIs();

  // Receipt breakdown
  const pendingReceipts = receipts.filter(r => r.status === 'Draft' || r.status === 'Waiting').length;
  const readyReceipts = receipts.filter(r => r.status === 'Ready').length;
  const doneReceipts = receipts.filter(r => r.status === 'Done').length;

  // Delivery breakdown
  const pendingDeliveries = deliveries.filter(d => d.status === 'Draft' || d.status === 'Waiting').length;
  const readyDeliveries = deliveries.filter(d => d.status === 'Ready').length;
  const doneDeliveries = deliveries.filter(d => d.status === 'Done').length;

  // 1. Line Chart: Stock Velocity
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    datasets: [
      {
        label: 'Inbound Stock (kg/units)',
        data: [120, 190, 300, 250, 420, 310, 480],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true
      },
      {
        label: 'Outbound Stock (kg/units)',
        data: [80, 110, 180, 220, 310, 260, 350],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true
      }
    ]
  };

  // 2. Doughnut Chart: Category breakdown
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + p.stock;
  });

  const doughnutData = {
    labels: Object.keys(categoryMap),
    datasets: [
      {
        data: Object.values(categoryMap),
        backgroundColor: ['#2563EB', '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#64748B'],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  // 3. Bar Chart: Warehouse Utilization
  const whBarData = {
    labels: ['Main WH-001', 'Kalol WH-002', 'Transit WH-003', 'Staging WH-004'],
    datasets: [
      {
        label: 'Stock In-Storage (units)',
        data: [1980, 520, 200, 80],
        backgroundColor: '#2563EB',
        borderRadius: 6
      },
      {
        label: 'Available Free Capacity',
        data: [13020, 7980, 4800, 4120],
        backgroundColor: '#E2E8F0',
        borderRadius: 6
      }
    ]
  };

  // 4. Bar Chart: Inbound vs Outbound
  const inVsOutData = {
    labels: ['Steel Rods', 'Chairs', 'Laptops', 'Desks', 'Extrusions', 'Cartons'],
    datasets: [
      {
        label: 'Received (Inbound)',
        data: [150, 25, 20, 50, 100, 300],
        backgroundColor: '#2563EB',
        borderRadius: 6
      },
      {
        label: 'Delivered (Outbound)',
        data: [20, 15, 0, 6, 50, 200],
        backgroundColor: '#F59E0B',
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { boxWidth: 10, font: { size: 11, family: 'Inter' } } }
    },
    scales: {
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11, family: 'Inter' } } },
      x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' } } }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="card p-6 bg-gradient-to-r from-white via-white to-blue-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              Live Gateway WH-001
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Connected
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1.5 font-display">
            Good morning, {currentUser?.fullName || currentUser?.name || currentUser?.loginId || 'Operations Leader'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-warehouse operations summary, stock alerts, and fulfillment pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('receipts')}
            className="btn btn-secondary text-xs"
          >
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
            <span>+ New Receipt</span>
          </button>
          <button
            onClick={() => setActiveView('deliveries')}
            className="btn btn-primary text-xs"
          >
            <Truck className="w-4 h-4" />
            <span>+ New Delivery</span>
          </button>
          <button
            onClick={() => setActiveView('transfers')}
            className="btn btn-subtle text-xs"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="kpi-card" onClick={() => setActiveView('products')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {kpis.totalProducts.toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> 6 Active categories
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card" onClick={() => setActiveView('stock')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Stock Units</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {kpis.totalStock.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Across 8 bin locations
          </div>
        </div>

        {/* KPI 3 */}
        <div
          className={`kpi-card ${kpis.lowStock > 0 ? 'border-amber-300 bg-amber-50/20' : ''}`}
          onClick={() => setActiveView('products')}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-display">
            {kpis.lowStock} <span className="text-xs font-normal text-amber-500">items</span>
          </div>
          <div className="text-[11px] font-semibold text-amber-600 mt-2">
            Reorder thresholds reached
          </div>
        </div>

        {/* KPI 4 */}
        <div
          className={`kpi-card ${kpis.outOfStock > 0 ? 'border-red-300 bg-red-50/20' : ''}`}
          onClick={() => setActiveView('products')}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 font-display">
            {kpis.outOfStock} <span className="text-xs font-normal text-red-500">items</span>
          </div>
          <div className="text-[11px] font-semibold text-red-600 mt-2">
            Automated PO ready
          </div>
        </div>

        {/* KPI 5 */}
        <div className="kpi-card" onClick={() => setActiveView('receipts')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Receipts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 font-display">
            {kpis.pendingReceipts}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {readyReceipts} ready at inbound dock
          </div>
        </div>

        {/* KPI 6 */}
        <div className="kpi-card" onClick={() => setActiveView('deliveries')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Deliveries</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-display">
            {kpis.pendingDeliveries}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {readyDeliveries} picked & ready to ship
          </div>
        </div>

        {/* KPI 7 */}
        <div className="kpi-card" onClick={() => setActiveView('transfers')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Internal Transfers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 font-display">
            {kpis.internalTransfers}
          </div>
          <div className="text-[11px] font-semibold text-purple-600 mt-2">
            Zero company stock drift
          </div>
        </div>

        {/* KPI 8 */}
        <div className="kpi-card" onClick={() => setActiveView('warehouses')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Warehouses</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-display">
            {kpis.warehouses}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Gandhinagar, Kalol, Transit
          </div>
        </div>
      </div>

      {/* Visual Inventory Flowchart Widget */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              End-to-End Inventory Flow Architecture
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any stage below to jump straight to its operational control page
            </p>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg">
            Real-time Logic Path
          </span>
        </div>

        <div className="flex items-center justify-between overflow-x-auto py-2 gap-2">
          {/* Step 1 */}
          <div
            onClick={() => setActiveView('receipts')}
            className="flex flex-col items-center text-center min-w-[90px] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all mb-1.5">
              <Factory className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">1. Vendor</span>
            <span className="text-[10px] text-slate-400">POs & Suppliers</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 2 */}
          <div
            onClick={() => setActiveView('receipts')}
            className="flex flex-col items-center text-center min-w-[90px] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all mb-1.5">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">2. Receipt</span>
            <span className="text-[10px] text-emerald-600 font-semibold">+Stock Added</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 3 */}
          <div
            onClick={() => setActiveView('warehouses')}
            className="flex flex-col items-center text-center min-w-[90px] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all mb-1.5">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">3. Warehouse</span>
            <span className="text-[10px] text-slate-400">Rack Bins</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 4 */}
          <div
            onClick={() => setActiveView('transfers')}
            className="flex flex-col items-center text-center min-w-[90px] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all mb-1.5">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">4. Transfer</span>
            <span className="text-[10px] text-purple-600 font-semibold">Location Move</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 5 */}
          <div
            onClick={() => setActiveView('stock')}
            className="flex flex-col items-center text-center min-w-[90px] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all mb-1.5">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">5. Production</span>
            <span className="text-[10px] text-slate-400">Shop Floor Feed</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 6 */}
          <div
            onClick={() => setActiveView('deliveries')}
            className="flex flex-col items-center text-center min-w-[90px] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all mb-1.5">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">6. Delivery</span>
            <span className="text-[10px] text-red-600 font-semibold">-Stock Deducted</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* Step 7 */}
          <div
            onClick={() => setActiveView('deliveries')}
            className="flex flex-col items-center text-center min-w-[90px] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all mb-1.5">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">7. Customer</span>
            <span className="text-[10px] text-slate-400">Order Fulfilled</span>
          </div>
        </div>

        {/* Audit Sub-path */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Audit Rule:</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
              Stock Adjustment (Difference = Count - System)
            </span>
            <span>➔</span>
            <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
              Stock Ledger Immutable Entry
            </span>
          </div>
          <button
            onClick={() => setActiveView('history')}
            className="text-blue-600 font-semibold hover:underline"
          >
            View Live Ledger ➔
          </button>
        </div>
      </div>

      {/* Quick Access Panels: Receipts & Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipts Quick Access */}
        <div className="card">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                Incoming Receipts (Goods Inbound)
              </h3>
              <p className="text-[11px] text-slate-500">Track and receive supplier shipments at docks</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('receipts')}
                className="btn btn-primary btn-sm text-xs"
              >
                + New Receipt
              </button>
              <button
                onClick={() => setActiveView('receipts')}
                className="btn btn-secondary btn-sm text-xs"
              >
                View All
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Draft / Waiting</span>
                <span className="block text-base font-bold text-slate-800">{pendingReceipts}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Ready at Dock</span>
                <span className="block text-base font-bold text-blue-700">{readyReceipts}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Completed</span>
                <span className="block text-base font-bold text-emerald-700">{doneReceipts}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {receipts.slice(0, 3).map(r => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedReceiptId(r.id);
                    setActiveView('receipts');
                  }}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      IN
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">{r.reference}</span>
                        {r.isLate && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-700 font-bold text-[10px] rounded">Late</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-xs">
                        {r.supplier || 'Supplier'} • {(r.items || []).length} line(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      r.status === 'Done' ? 'badge-done' :
                      r.status === 'Ready' ? 'badge-ready' :
                      r.status === 'Waiting' ? 'badge-waiting' : 'badge-draft'
                    }`}>
                      {r.status}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">{r.scheduledDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deliveries Quick Access */}
        <div className="card">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                Outgoing Delivery Orders (Fulfillment)
              </h3>
              <p className="text-[11px] text-slate-500">Pick, pack, stage and dispatch customer orders</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('deliveries')}
                className="btn btn-primary btn-sm text-xs"
              >
                + New Delivery
              </button>
              <button
                onClick={() => setActiveView('deliveries')}
                className="btn btn-secondary btn-sm text-xs"
              >
                View All
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Draft / Waiting</span>
                <span className="block text-base font-bold text-slate-800">{pendingDeliveries}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Ready to Ship</span>
                <span className="block text-base font-bold text-blue-700">{readyDeliveries}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Dispatched</span>
                <span className="block text-base font-bold text-emerald-700">{doneDeliveries}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {(deliveries || []).slice(0, 3).map(d => (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDeliveryId(d.id);
                    setActiveView('deliveries');
                  }}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      OUT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">{d.reference}</span>
                        {d.isLate && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-700 font-bold text-[10px] rounded">Late</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-xs">
                        {d.customer || 'Customer'} • {(d.items || []).length} line(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      d.status === 'Done' ? 'badge-done' :
                      d.status === 'Ready' ? 'badge-ready' :
                      d.status === 'Waiting' ? 'badge-waiting' : 'badge-draft'
                    }`}>
                      {d.status}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">{d.scheduledDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Stock Movement Trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Weekly Stock Velocity & Movement</h3>
            <span className="text-[11px] font-semibold text-slate-400">Last 7 Days</span>
          </div>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Category Valuation */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Stock Volume by Category</h3>
            <span className="text-[11px] font-semibold text-slate-400">Categorical Breakdown</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%' }} />
          </div>
        </div>

        {/* Chart 3: Warehouse Capacity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Warehouse Storage Load vs Free Cap</h3>
            <span className="text-[11px] font-semibold text-slate-400">Across 4 Facilities</span>
          </div>
          <div className="h-64">
            <Bar data={whBarData} options={{ ...chartOptions, scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </div>
        </div>

        {/* Chart 4: Inbound vs Outbound Bar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Incoming vs Outgoing Throughput</h3>
            <span className="text-[11px] font-semibold text-slate-400">By High-Velocity Product</span>
          </div>
          <div className="h-64">
            <Bar data={inVsOutData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
