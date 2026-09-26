import React, { useState, useEffect } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  Search,
  Package,
  ArrowDownLeft,
  Truck,
  ArrowLeftRight,
  Sliders,
  PlusCircle,
  Inbox,
  X
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    products,
    receipts,
    deliveries,
    setActiveView,
    setSelectedProductId,
    setSelectedReceiptId,
    setSelectedDeliveryId
  } = useStockSense();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  // Search Results
  const matchedProducts = products.filter(
    p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  );

  const matchedReceipts = receipts.filter(
    r => r.reference.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q)
  );

  const matchedDeliveries = deliveries.filter(
    d => d.reference.toLowerCase().includes(q) || d.customer.toLowerCase().includes(q)
  );

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setActiveView('products');
    setIsCommandPaletteOpen(false);
  };

  const handleSelectReceipt = (id: string) => {
    setSelectedReceiptId(id);
    setActiveView('receipts');
    setIsCommandPaletteOpen(false);
  };

  const handleSelectDelivery = (id: string) => {
    setSelectedDeliveryId(id);
    setActiveView('deliveries');
    setIsCommandPaletteOpen(false);
  };

  const handleNav = (view: string) => {
    setActiveView(view);
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Box */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Type a SKU, product name, receipt, or action..."
            className="w-full text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Operational Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('receipts')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>+ New Inbound Receipt (WH/IN/...)</span>
                </div>
                <span className="text-[10px] text-slate-400">Jump to Inbound</span>
              </button>

              <button
                onClick={() => handleNav('deliveries')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>+ New Delivery Order (WH/OUT/...)</span>
                </div>
                <span className="text-[10px] text-slate-400">Jump to Outbound</span>
              </button>

              <button
                onClick={() => handleNav('transfers')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                  <span>Initiate Internal Transfer / Rebalance</span>
                </div>
                <span className="text-[10px] text-slate-400">Zero Stock Drift</span>
              </button>

              <button
                onClick={() => handleNav('inbox')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-amber-600" />
                  <span>Open Notification Inbox & Alerts</span>
                </div>
                <span className="text-[10px] text-slate-400">View All</span>
              </button>
            </div>
          </div>

          {/* Matched Products */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Products ({matchedProducts.length})
              </div>
              <div className="space-y-1">
                {matchedProducts.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{p.sku} • {p.warehouseName}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 shrink-0 font-mono">
                      {p.stock} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Receipts */}
          {matchedReceipts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Receipts ({matchedReceipts.length})
              </div>
              <div className="space-y-1">
                {matchedReceipts.slice(0, 3).map(r => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReceipt(r.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 font-mono block">{r.reference}</span>
                        <span className="text-[10px] text-slate-500 truncate block">{r.supplier}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Deliveries */}
          {matchedDeliveries.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Deliveries ({matchedDeliveries.length})
              </div>
              <div className="space-y-1">
                {matchedDeliveries.slice(0, 3).map(d => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDelivery(d.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 font-mono block">{d.reference}</span>
                        <span className="text-[10px] text-slate-500 truncate block">{d.customer}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
