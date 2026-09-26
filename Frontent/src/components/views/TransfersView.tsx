import React, { useState } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  ArrowLeftRight,
  Tune,
  PlusCircle,
  X,
  CheckCircle2,
  Info
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

export const TransfersView: React.FC = () => {
  const {
    transfers,
    adjustments,
    products,
    warehouses,
    locations,
    createTransfer,
    createAdjustment
  } = useStockSense();

  const [activeTab, setActiveTab] = useState<'transfers' | 'adjustments'>('transfers');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);

  // Transfer Form
  const [trfForm, setTrfForm] = useState({
    productId: products[0]?.id || 'PROD-001',
    fromWarehouseId: warehouses[0]?.id || 'WH-001',
    fromLocationId: locations[0]?.id || 'LOC-001',
    toWarehouseId: warehouses[1]?.id || warehouses[0]?.id || 'WH-002',
    toLocationId: locations[5]?.id || locations[1]?.id || 'LOC-006',
    quantity: 10,
    reason: 'Shop floor manufacturing production allocation'
  });

  // Adjustment Form
  const [adjForm, setAdjForm] = useState({
    productId: products[0]?.id || 'PROD-001',
    physicalCount: products[0]?.stock || 0,
    reason: 'Damaged in material handling'
  });

  const selectedAdjProd = products.find(p => p.id === adjForm.productId) || products[0];
  const diff = adjForm.physicalCount - (selectedAdjProd?.stock || 0);

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    createTransfer(trfForm);
    setIsTransferModalOpen(false);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    createAdjustment(adjForm);
    setIsAdjModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
              Relocations & Audit Corrections
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{transfers.length} Transfers, {adjustments.length} Audits</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">Internal Transfers & Inventory Adjustments</h1>
          <p className="text-xs text-slate-500">
            Relocate inventory between warehouse bays with zero stock drift, or correct physical count discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAdjModalOpen(true)}
            className="btn btn-secondary text-xs"
          >
            <span>+ Stock Adjustment</span>
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="btn btn-primary text-xs"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>+ Internal Transfer</span>
          </button>
        </div>
      </div>

      {/* Logic Explainer Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-purple-900">
            <ArrowLeftRight className="w-4 h-4 text-purple-600" />
            Internal Transfer Principle
          </div>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            Moves inventory between racks or facilities. <strong>Total company stock remains strictly unchanged</strong> (e.g. Rack A: 100 ➔ Rack A: 0, Production: 100. Total: 100).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Info className="w-4 h-4 text-amber-600" />
            Stock Adjustment Audit Rule
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Calculates <strong>Difference = Physical Count - System Qty</strong>. Directly updates catalog balances and writes an immutable audit record to the Stock Ledger.
          </p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`py-2 px-4 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'transfers' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 inline mr-1" />
          Internal Transfers ({transfers.length})
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`py-2 px-4 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'adjustments' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cycle Count Adjustments ({adjustments.length})
        </button>
      </div>

      {/* Tables */}
      {activeTab === 'transfers' ? (
        <div className="card overflow-hidden border border-slate-200 shadow-sm">
          <div className="table-responsive">
            <table className="stock-table min-w-[1050px]">
              <thead>
                <tr>
                  <th className="w-32">Transfer Ref ID</th>
                  <th className="min-w-[180px]">Product & SKU</th>
                  <th className="min-w-[180px]">Origin Facility & Rack</th>
                  <th className="min-w-[180px]">Destination Facility & Rack</th>
                  <th className="w-28 text-center">Quantity Moved</th>
                  <th className="min-w-[160px]">Reason / Workflow</th>
                  <th className="w-28">Date</th>
                  <th className="w-28 text-center pr-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      No internal transfers recorded.
                    </td>
                  </tr>
                ) : (
                  transfers.map(t => {
                    const prod = products.find(p => p.id === (t.productId || (t as any).lines?.[0]?.productId));
                    const pName = t.productName || prod?.name || 'Steel Rods (12mm High-Grade)';
                    const pSku = t.sku || prod?.sku || 'STL-001';
                    const fromWhName = t.fromWarehouseName || 'Main Warehouse';
                    const fromLocName = t.fromLocationName || 'Rack A - Heavy Metals';
                    const toWhName = t.toWarehouseName || 'Production Warehouse';
                    const toLocName = t.toLocationName || 'Production Rack';
                    const qty = t.quantity || (t as any).lines?.[0]?.quantity || 10;
                    const unit = t.unit || prod?.unit || 'kg';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="font-mono text-xs font-bold text-blue-600 whitespace-nowrap">{t.reference || 'WH/TRF/0001'}</td>
                        <td>
                          <span className="font-bold text-xs text-slate-900">{pName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{pSku}</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-700 font-medium">{fromWhName}</span>
                          <span className="block text-[10px] font-mono text-slate-400">{fromLocName}</span>
                        </td>
                        <td>
                          <span className="text-xs text-blue-700 font-medium">{toWhName}</span>
                          <span className="block text-[10px] font-mono text-blue-600">{toLocName}</span>
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <span className="font-bold text-xs text-purple-600 font-mono">{qty} {unit}</span>
                        </td>
                        <td className="text-xs text-slate-600">{t.reason || 'Material handling transfer'}</td>
                        <td className="text-xs font-mono text-slate-500 whitespace-nowrap">{t.date || '2026-09-26'}</td>
                        <td className="text-center pr-6 whitespace-nowrap">
                          <span className="badge badge-done">
                            <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> {t.status || 'Done'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden border border-slate-200 shadow-sm">
          <div className="table-responsive">
            <table className="stock-table min-w-[1050px]">
              <thead>
                <tr>
                  <th className="w-32">Adjustment Ref ID</th>
                  <th className="min-w-[180px]">Product Item</th>
                  <th className="w-36">Warehouse Facility</th>
                  <th className="w-28 text-right">System Qty</th>
                  <th className="w-28 text-right">Physical Count</th>
                  <th className="w-28 text-center">Difference</th>
                  <th className="min-w-[160px]">Audit Reason</th>
                  <th className="w-28">Date</th>
                  <th className="w-28 pr-6">Auditor</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                      No adjustments on record.
                    </td>
                  </tr>
                ) : (
                  adjustments.map(a => {
                    const prod = products.find(p => p.id === a.productId);
                    const pName = a.productName || prod?.name || 'Steel Rods (12mm High-Grade)';
                    const pSku = a.sku || prod?.sku || 'STL-001';
                    const whName = a.warehouseName || 'Main Warehouse';
                    const unit = a.unit || prod?.unit || 'kg';
                    const sysQty = a.systemQuantity !== undefined ? a.systemQuantity : 100;
                    const physCount = a.physicalCount !== undefined ? a.physicalCount : 97;
                    const diff = a.difference !== undefined ? a.difference : (physCount - sysQty);

                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="font-mono text-xs font-bold text-amber-600">{a.reference || 'WH/ADJ/0001'}</td>
                        <td>
                          <span className="font-bold text-xs text-slate-900">{pName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{pSku}</span>
                        </td>
                        <td className="text-xs text-slate-700 font-medium">{whName}</td>
                        <td className="text-xs text-slate-600">{sysQty} {unit}</td>
                        <td className="text-xs font-bold text-slate-900">{physCount} {unit}</td>
                        <td>
                          <span className={`font-bold text-xs font-mono px-2 py-0.5 rounded ${
                            diff < 0 ? 'bg-red-50 text-red-600' :
                            diff > 0 ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600'
                          }`}>
                            {diff > 0 ? '+' : ''}{diff} {unit}
                          </span>
                        </td>
                        <td className="text-xs font-semibold text-slate-700">{a.reason || 'Physical count audit'}</td>
                        <td className="text-xs font-mono text-slate-500">{a.date || '2026-09-26'}</td>
                        <td className="text-xs text-slate-600">{a.responsible || 'Alex Rivera'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Internal Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                Initiate Internal Transfer
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Select Product *</label>
                  <CustomSelect
                    value={trfForm.productId}
                    onChange={(val) => setTrfForm({ ...trfForm, productId: val })}
                    options={products.map(p => ({
                      value: p.id,
                      label: p.name,
                      subLabel: `Stock: ${p.stock} ${p.unit} in ${p.warehouseName}`,
                      badge: `${p.stock} ${p.unit}`
                    }))}
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">From Warehouse</label>
                    <CustomSelect
                      value={trfForm.fromWarehouseId}
                      onChange={(val) => setTrfForm({ ...trfForm, fromWarehouseId: val })}
                      options={warehouses.map(w => ({
                        value: w.id,
                        label: w.name,
                        subLabel: `${w.city} • ${w.code}`,
                        badge: w.code
                      }))}
                      size="md"
                    />
                  </div>
                  <div>
                    <label className="form-label">From Rack</label>
                    <CustomSelect
                      value={trfForm.fromLocationId}
                      onChange={(val) => setTrfForm({ ...trfForm, fromLocationId: val })}
                      options={locations.map(l => ({
                        value: l.id,
                        label: l.name,
                        subLabel: l.type
                      }))}
                      size="md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">To Warehouse *</label>
                    <CustomSelect
                      value={trfForm.toWarehouseId}
                      onChange={(val) => setTrfForm({ ...trfForm, toWarehouseId: val })}
                      options={warehouses.map(w => ({
                        value: w.id,
                        label: w.name,
                        subLabel: `${w.city} • ${w.code}`,
                        badge: w.code
                      }))}
                      size="md"
                    />
                  </div>
                  <div>
                    <label className="form-label">To Rack *</label>
                    <CustomSelect
                      value={trfForm.toLocationId}
                      onChange={(val) => setTrfForm({ ...trfForm, toLocationId: val })}
                      options={locations.map(l => ({
                        value: l.id,
                        label: l.name,
                        subLabel: l.type
                      }))}
                      size="md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Transfer Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={trfForm.quantity}
                      onChange={(e) => setTrfForm({ ...trfForm, quantity: Number(e.target.value) })}
                      className="form-control text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="form-label">Transfer Purpose</label>
                    <CustomSelect
                      value={trfForm.reason}
                      onChange={(val) => setTrfForm({ ...trfForm, reason: val })}
                      options={[
                        'Shop floor manufacturing production allocation',
                        'Cross-Dock Warehouse Rebalancing',
                        'Damaged Goods Quarantine',
                        'Packaging Staging'
                      ]}
                      size="md"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Record Stock Adjustment & Audit
              </h3>
              <button onClick={() => setIsAdjModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="form-label">Product Under Audit *</label>
                  <CustomSelect
                    value={adjForm.productId}
                    onChange={(val) => {
                      const p = products.find(prod => prod.id === val);
                      setAdjForm({
                        ...adjForm,
                        productId: val,
                        physicalCount: p ? p.stock : 0
                      });
                    }}
                    options={products.map(p => ({
                      value: p.id,
                      label: p.name,
                      subLabel: `SKU: ${p.sku} | ${p.category}`,
                      badge: `${p.stock} ${p.unit} in Stock`
                    }))}
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">System Recorded Qty</label>
                    <input
                      type="text"
                      readOnly
                      value={`${selectedAdjProd?.stock || 0} ${selectedAdjProd?.unit || 'units'}`}
                      className="form-control text-xs bg-slate-100 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="form-label">Physical Count *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={adjForm.physicalCount}
                      onChange={(e) => setAdjForm({ ...adjForm, physicalCount: Number(e.target.value) })}
                      className="form-control text-xs font-bold text-blue-600"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Calculated Difference:</span>
                  <span className={`font-bold font-mono text-sm ${diff < 0 ? 'text-red-600' : (diff > 0 ? 'text-emerald-600' : 'text-slate-800')}`}>
                    {diff > 0 ? `+${diff}` : diff} {selectedAdjProd?.unit}
                  </span>
                </div>

                <div>
                  <label className="form-label">Audit Discrepancy Reason *</label>
                  <CustomSelect
                    value={adjForm.reason}
                    onChange={(val) => setAdjForm({ ...adjForm, reason: val })}
                    options={[
                      'Damaged in storage / material handling',
                      'Lost / Missing inventory',
                      'Found extra stock',
                      'Counting Error / Typo correction',
                      'Expired or Scrapped'
                    ]}
                    size="md"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsAdjModalOpen(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
