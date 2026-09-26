import React, { useState } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Shield,
  Box,
  Truck,
  TrendingUp,
  BarChart3,
  Package,
  Zap,
  Star,
  Building2,
  Sliders,
  Play,
  UserCheck,
  Warehouse as WarehouseIcon
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { setActiveView, showToast } = useStockSense();

  const [simulationTab, setSimulationTab] = useState<'inbound' | 'outbound' | 'locations' | 'matrix'>('inbound');
  const [demoEmail, setDemoEmail] = useState('');

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail.trim()) {
      showToast('Please enter your corporate email address', 'warning');
      return;
    }
    showToast(`Thank you! A solution architect will contact ${demoEmail} within 15 minutes.`, 'success');
    setDemoEmail('');
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-1 flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <img src="/invexa_logo.png" alt="INVEXA Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">INVEXA</span>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-orange-600">Smart Inventory ERP</span>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 rounded-full border border-orange-200/80">
                SOLUTIONS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
            <a href="#operations" className="hover:text-orange-600 transition-colors">Operations</a>
            <a href="#warehouses" className="hover:text-orange-600 transition-colors">Warehouses & Locations</a>
            <a href="#integrations" className="hover:text-orange-600 transition-colors">Integrations</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing</a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setActiveView('auth')}
              className="text-xs font-bold text-slate-700 hover:text-orange-600 px-3 py-2 cursor-pointer transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveView('auth')}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:from-orange-700 active:to-amber-800 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-extrabold shadow-lg shadow-orange-500/25 flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-orange-500/40 transform hover:-translate-y-0.5"
            >
              Starter Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
              <UserCheck className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 sm:pt-16 pb-20 bg-gradient-to-b from-orange-50/40 via-white to-slate-50/50 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-orange-200/30 via-amber-200/20 to-sky-200/20 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Release Badge */}
          <div
            onClick={() => setActiveView('auth')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold mb-6 shadow-sm hover:border-orange-300 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>NEW: ENTERPRISE MATRIX v2.4 RELEASED</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] max-w-5xl mx-auto">
            Smart Inventory. Simple Control. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500">
              Built for Scale.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Empower your enterprise supply chain with real-time multi-warehouse balance, zero-drift internal transfers, automated receipts, delivery dispatching, and cryptographic audit logs.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => setActiveView('auth')}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:from-orange-700 active:to-amber-800 text-white px-7 py-3.5 rounded-full text-xs sm:text-sm font-extrabold shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              Start Free 14-Day Trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-4 h-4 text-orange-500 fill-orange-500" />
              Watch 2-Min Product Tour
            </button>
          </div>

          {/* Trust points */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sub-Second Stock Sync
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> SOC-2 Type II Enterprise Ready
            </span>
          </div>

          {/* 3. HERO SHOWCASE MOCKUP CARD */}
          <div className="mt-12 max-w-6xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-slate-950 group">
            {/* Background Warehouse Photo with Overlay */}
            <div
              className="h-[380px] sm:h-[480px] lg:h-[540px] bg-cover bg-center relative flex flex-col justify-between p-4 sm:p-6 lg:p-8"
              style={{ backgroundImage: `url('/warehouse1.jpg')` }}
            >
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/40 backdrop-blur-[1px]" />

              {/* Top Floating Status Tags on Photo */}
              <div className="relative z-20 flex items-center justify-between text-xs font-bold text-white">
                <span className="px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  📍 WAREHOUSE 01: MAIN MATRIX (WH-001)
                </span>
                <span className="px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-slate-200 font-mono text-[11px]">
                  894 ACTIVE SKUS | TEMP 18.5°C
                </span>
              </div>

              {/* Center Floating Glassmorphic ERP Monitor Card */}
              <div className="relative z-20 max-w-4xl mx-auto w-full bg-white/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/40 text-slate-900 text-left">
                {/* Window Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="ml-2 text-xs font-extrabold text-slate-800">
                      INVEXA Core v2.4 — Live System Monitor
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded">
                      WH-001 (MAIN HUB)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    SYSTEM ACCURACY: 99.98%
                  </span>
                </div>

                {/* 4 KPI Metric Pills */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Inbound Receipts (Pending)</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      14 <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Today</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Waiting receiving docks</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Internal Transfers (Active)</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      29 <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Work in progress balance</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Delivery Orders (Dispatch)</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      112 <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">Moving</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Outbound staging bays</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Stock Drift Variance</div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-0.5">0.00%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[99.98%]" />
                    </div>
                  </div>
                </div>

                {/* Mini Transfer Log Table Preview */}
                <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Reference</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">From / To Location</th>
                        <th className="py-2 px-3">Qty / Quantity</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px] font-medium bg-white">
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-900">WH-001-TRF-882</td>
                        <td className="py-2 px-3"><span className="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded font-semibold">Transfer</span></td>
                        <td className="py-2 px-3">Rack A ➔ Production Floor</td>
                        <td className="py-2 px-3 font-mono">450 Units</td>
                        <td className="py-2 px-3 text-right"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">In Transit</span></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-900">WH-001-REC-019</td>
                        <td className="py-2 px-3"><span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">Receiving</span></td>
                        <td className="py-2 px-3">Vendor Dock 1 ➔ Staging B</td>
                        <td className="py-2 px-3 font-mono">1,200 Units</td>
                        <td className="py-2 px-3 text-right"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Ready</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Warehouse Location Badge */}
              <div className="relative z-20 text-center text-[10px] tracking-widest uppercase text-slate-400 font-bold">
                TRUSTED BY 2,500+ ENTERPRISE DISTRIBUTION CENTERS & LOGISTICS NETWORKS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CLIENT LOGO TRUST BANNER */}
      <section className="py-8 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-6">
            TRUSTED BY 2,500+ ENTERPRISE DISTRIBUTION CENTERS & LOGISTICS NETWORKS
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-85 text-slate-300 font-bold text-sm sm:text-base tracking-wider">
            <span className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <Zap className="w-5 h-5 text-orange-500" /> AEROLOGIX
            </span>
            <span className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <Building2 className="w-5 h-5 text-sky-400" /> MULTIWAY WH
            </span>
            <span className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <Package className="w-5 h-5 text-amber-400" /> GAMBA GLOBAL
            </span>
            <span className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <Truck className="w-5 h-5 text-emerald-400" /> TRANS-GLOBAL
            </span>
            <span className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <Sliders className="w-5 h-5 text-purple-400" /> KINETIC SUPPLY
            </span>
          </div>
        </div>
      </section>

      {/* 5. SECTION 1: ARCHITECTURE / MODULE CARDS */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200/70 inline-block mb-3">
            ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Multi-Zone Warehouse Orchestration
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Eliminate stock discrepancies, unmanaged internal moves, and synchronize stores with physical rack locations using native three-state automation.
          </p>

          {/* 4 Feature Cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Card 01 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <WarehouseIcon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">MODULE 01</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Warehousing Rack Hierarchy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structure multi-warehouses into Zone, Rack, Shelf, and Bin. Auto-generate spatial 2D barcodes for instant handheld scanner mapping.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-all">
                <span>WH-STRUCTURE</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 02 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-5 group-hover:bg-sky-500 group-hover:text-white transition-all">
                  <Box className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">MODULE 02</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Inbound Receipts (WH-IN)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct vendor dock management with rapid 3-step stock verification. Draft ➔ Ready ➔ Done. Single-click batch reception & QA level release.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-all">
                <span>RECEIVING DOCK</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 03 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-5 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">MODULE 03</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delivery Orders (WH-OUT)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automate picking lists, batch authorization, and stock reservation. Prevent negative stock dispatch before items arrive at outbound loading bays.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-all">
                <span>DISPATCH ENGINE</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 04 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-5 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">MODULE 04</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Zero-Drift Stock Matrix</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cryptographic double-entry inventory ledger. Moving physical unit never breaks balance logs or audit history.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-all">
                <span>LEDGER MATRIX</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION 2: INTERACTIVE LIVE SIMULATION */}
      <section id="operations" className="py-20 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200/70 inline-block mb-3">
            LIVE SIMULATION
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Deep-Dive Into Operational Workflows
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Switch between core ERP modules to view simulated live stock, automated reservation rules, and emergency replenishment flows.
          </p>

          {/* Interactive Simulation Tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 p-1.5 bg-slate-200/70 rounded-full max-w-3xl mx-auto text-xs font-bold">
            <button
              onClick={() => setSimulationTab('inbound')}
              className={`px-5 py-2.5 rounded-full transition-all cursor-pointer ${
                simulationTab === 'inbound'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vendor Inbound Queue
            </button>
            <button
              onClick={() => setSimulationTab('outbound')}
              className={`px-5 py-2.5 rounded-full transition-all cursor-pointer ${
                simulationTab === 'outbound'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              WH-OUT Delivery
            </button>
            <button
              onClick={() => setSimulationTab('locations')}
              className={`px-5 py-2.5 rounded-full transition-all cursor-pointer ${
                simulationTab === 'locations'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rack & Locations
            </button>
            <button
              onClick={() => setSimulationTab('matrix')}
              className={`px-5 py-2.5 rounded-full transition-all cursor-pointer ${
                simulationTab === 'matrix'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Balance Matrix
            </button>
          </div>

          {/* Dynamic Tab Box Content */}
          <div className="mt-8 max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left">
            {simulationTab === 'inbound' && (
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Vendor Inbound Queue
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">12 Pending Receiving</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Inspecting freight from external supplier & 3-step automatic stock putaway staging.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      📄 Print Reception Sheet
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow-md hover:bg-orange-700">
                      + New Inbound Order
                    </button>
                  </div>
                </div>

                {/* Step indicator */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs font-bold">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600">Step 1: Inbound Dock Staging</div>
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">Step 2: Receiving Inspection (Active)</div>
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600">Step 3: Rack Putaway Done</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Receipt Code</th>
                        <th className="py-2.5 px-3">Supplier Name</th>
                        <th className="py-2.5 px-3">Destination Warehouse</th>
                        <th className="py-2.5 px-3">SKU & Product Description</th>
                        <th className="py-2.5 px-3">Ordered</th>
                        <th className="py-2.5 px-3">Received</th>
                        <th className="py-2.5 px-3 text-right">Action Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-orange-600">WH-IN-TRK-881</td>
                        <td className="py-2.5 px-3">Apex Metal Components</td>
                        <td className="py-2.5 px-3"><span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-semibold">WH-001 (MAIN HUB)</span></td>
                        <td className="py-2.5 px-3">Heavy Steel Cylinder Block (HSC-900)</td>
                        <td className="py-2.5 px-3">450</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">+450</td>
                        <td className="py-2.5 px-3 text-right"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-sm">Validate & Receive</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-orange-600">WH-IN-TRK-882</td>
                        <td className="py-2.5 px-3">Precision Logistics Freight</td>
                        <td className="py-2.5 px-3"><span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-semibold">WH-002 (PRODUCTION)</span></td>
                        <td className="py-2.5 px-3">Full Synthetics Engine Oil (SEO-5L)</td>
                        <td className="py-2.5 px-3">1,200</td>
                        <td className="py-2.5 px-3 font-bold text-amber-600">+1,200</td>
                        <td className="py-2.5 px-3 text-right"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">In Staging</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {simulationTab === 'outbound' && (
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Outbound Delivery Dispatch
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">112 Moving Orders</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Automated batch pick lists, customer shipment reservations, and dock loading validation.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Delivery Order</th>
                        <th className="py-2.5 px-3">Client / Carrier</th>
                        <th className="py-2.5 px-3">Dispatch Warehouse</th>
                        <th className="py-2.5 px-3">Total Items</th>
                        <th className="py-2.5 px-3">Picking Status</th>
                        <th className="py-2.5 px-3 text-right">Dispatch Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-indigo-600">DEL-2026-901</td>
                        <td className="py-2.5 px-3">Global HyperMarkets (FedEx Freight)</td>
                        <td className="py-2.5 px-3"><span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-semibold">WH-001 (MAIN HUB)</span></td>
                        <td className="py-2.5 px-3 font-mono">1,850 Units</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">100% Picked</span></td>
                        <td className="py-2.5 px-3 text-right"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 text-white shadow-sm">Authorize Dispatch</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {simulationTab === 'locations' && (
              <div className="p-6">
                <h4 className="text-base font-bold text-slate-900 mb-2">Rack & Spatial Storage Hierarchy</h4>
                <p className="text-xs text-slate-500 mb-4">Visualizing Zone A01 to Zone C04 capacity utilization in real-time.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900">Rack A — Heavy Metals</div>
                    <div className="text-[10px] text-slate-500">Zone WH-001 • Aisle 1</div>
                    <div className="mt-2 flex justify-between font-bold text-[11px]">
                      <span>64% Occupied</span>
                      <span className="text-slate-600">3,200/5,000</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-sky-500 h-full w-[64%]" />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900">Rack B — Finished Goods</div>
                    <div className="text-[10px] text-slate-500">Zone WH-001 • Aisle 2</div>
                    <div className="mt-2 flex justify-between font-bold text-[11px]">
                      <span>51% Occupied</span>
                      <span className="text-slate-600">1,800/3,500</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[51%]" />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900">Rack C — Secure Electronics</div>
                    <div className="text-[10px] text-slate-500">Zone WH-001 • Locked Bay</div>
                    <div className="mt-2 flex justify-between font-bold text-[11px]">
                      <span>22% Occupied</span>
                      <span className="text-slate-600">450/2,000</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-purple-500 h-full w-[22%]" />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900">Dock 1 — Inbound Staging</div>
                    <div className="text-[10px] text-slate-500">Gate North • Staging Floor</div>
                    <div className="mt-2 flex justify-between font-bold text-[11px]">
                      <span>41% Occupied</span>
                      <span className="text-slate-600">620/1,500</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-amber-500 h-full w-[41%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {simulationTab === 'matrix' && (
              <div className="p-6 text-xs text-slate-700">
                <h4 className="text-base font-bold text-slate-900 mb-2">Cryptographic Double-Entry Stock Matrix</h4>
                <p className="text-xs text-slate-500 mb-4">Every physical movement updates Debit and Credit balance ledgers instantaneously.</p>
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed">
                  <div>[2026-09-26 12:14:00] TX_HASH: 0x8f2a99c1e... verified by WH-001 Node</div>
                  <div className="text-emerald-400">+ CREDIT: WH-002 Production Feed Bay (+450 HSC-900)</div>
                  <div className="text-rose-400">- DEBIT: WH-001 Main Warehouse Rack A (-450 HSC-900)</div>
                  <div className="text-sky-300">BALANCE DRIFT: 0.00000000 SKUs (Cryptographic Ledger Verified)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. SECTION 3: METRICS & IMPACT */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200/70 inline-block mb-3">
            PROVEN BUSINESS IMPACT
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Measurable Gains From Shift One
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Leading 3PL and manufacturing distribution networks replace legacy spreadsheet friction with high-precision autonomous store control.
          </p>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tight">99.98%</div>
                <div className="text-xs font-bold text-slate-800 mt-1 mb-2">Inventory Accuracy</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Eliminate human counting errors and inventory drift with automated double-entry verification.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span>Based on 12M+ scanned items</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tight">4.2x</div>
                <div className="text-xs font-bold text-slate-800 mt-1 mb-2">Faster Receiving & Docks</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accelerate vendor dock unloading with single-click barcode batch scanning.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-bold text-amber-600 flex items-center gap-1">
                <span>From 45 mins down to 10 mins</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-sky-50/40 border border-sky-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tight">0%</div>
                <div className="text-xs font-bold text-slate-800 mt-1 mb-2">Unaccounted Stock Loss</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cryptographic ledger tracks every single item location change with immutable timestamp.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-bold text-sky-600 flex items-center gap-1">
                <span>100% audit compliance & traceability</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-rose-50/40 border border-rose-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tight">45%</div>
                <div className="text-xs font-bold text-slate-800 mt-1 mb-2">Carrying Cost Reduction</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Smart replenishment algorithms keep minimum safety stock without over-purchasing.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <span>Average ROI reached in 60 days</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECTION 4: TESTIMONIAL CARD */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden border border-slate-800">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              {/* 5 Stars */}
              <div className="flex items-center gap-1 text-amber-400 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed tracking-tight text-slate-100 italic">
                "INVEXA replaced our legacy spreadsheets and manual inventory count overnight. Our warehouse floor staff adapted to the handheld barcode workflow in less than 30 minutes. We eliminated inventory discrepancies completely and dispatched 12,500 orders during Cyber Week without a single lost shipment."
              </blockquote>

              {/* Author Info */}
              <div className="mt-8 flex items-center gap-4 pt-6 border-t border-slate-800">
                <img
                  src="/elena_rostov.jpg"
                  alt="Elena Rostov"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-md shrink-0"
                />
                <div>
                  <div className="text-base font-extrabold text-white">Elena Rostov</div>
                  <div className="text-xs text-orange-400 font-medium">Senior VP of Global Supply Chain, HyperMarket Logistics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. SECTION 5: FINAL CTA BANNER */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-orange-50/80 via-white to-amber-50/50 border border-orange-200/80 shadow-xl relative overflow-hidden">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200 inline-block mb-4">
              FREE 14-DAY TRIAL • NO CREDIT CARD REQUIRED
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Modernize your warehouse operations today.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Connect your ERP, barcode scanners, and freight carriers to the highest-velocity smart inventory ledger.
            </p>

            {/* Email Input Form */}
            <form onSubmit={handleDemoSubmit} className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                required
                placeholder="Enter your corporate email address..."
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-full text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:from-orange-700 active:to-amber-800 text-white px-6 py-3 rounded-full text-xs font-extrabold shadow-lg shadow-orange-500/25 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                Request Live Demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="mt-4 text-[11px] text-slate-500">
              Need a custom private cloud or dedicated enterprise deployment?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('auth'); }} className="text-orange-600 font-bold hover:underline">
                Talk with a Solution Architect
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800 text-xs">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('landing')}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 p-1 flex items-center justify-center shadow-md">
                  <img src="/invexa_logo.png" alt="INVEXA Logo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-white">INVEXA</span>
                  <span className="block text-[8px] uppercase font-bold tracking-widest text-orange-400">Smart Inventory ERP</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                High-velocity enterprise intelligence & real-time stock sync matrix across distribution hubs, production racks, and outbound logistics.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                All Systems Operational
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <div className="font-bold uppercase tracking-wider text-slate-200 mb-3 text-[11px]">PRODUCT</div>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#features" className="hover:text-white transition-colors">Inventory Telemetry</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Replenishment Logic</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Multi-Zone Routing</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">White-Glove Onboarding</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Enterprise Security</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <div className="font-bold uppercase tracking-wider text-slate-200 mb-3 text-[11px]">RESOURCES</div>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security Whitepaper</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>

            {/* Column 4: Compliance */}
            <div>
              <div className="font-bold uppercase tracking-wider text-slate-200 mb-3 text-[11px]">COMPLIANCE</div>
              <ul className="space-y-2 text-[11px]">
                <li>SOC-2 Type II Certified</li>
                <li>GDPR & HIPAA Ready</li>
                <li>256-Bit TLS Encryption</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} INVEXA Core v2.4 • Enterprise Inventory ERP. All rights reserved.
            </div>
            <div className="flex items-center gap-6 mt-4 sm:mt-0 font-medium">
              <a href="#" className="hover:text-slate-300">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300">Terms of Service</a>
              <a href="#" className="hover:text-slate-300">Trust Center</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
