import React, { useState } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import { Receipt, ReceiptItem } from '../../types';
import {
  ArrowDownLeft,
  PlusCircle,
  Table,
  Kanban,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ArrowLeft,
  X,
  Building2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

export const ReceiptsView: React.FC = () => {
  const {
    receipts,
    warehouses,
    locations,
    products,
    createReceipt,
    validateReceipt,
    updateReceiptStatus,
    selectedReceiptId,
    setSelectedReceiptId,
    setActiveView
  } = useStockSense();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Multi-step Wizard State
  const [wizardData, setWizardData] = useState({
    reference: '',
    supplier: 'Azure Interior & Metal Works',
    warehouseId: warehouses[0]?.id || 'WH-001',
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: 'Dock delivery staged from supplier purchase order.',
    items: [
      {
        productId: products[0]?.id || 'PROD-001',
        productName: products[0]?.name || 'Steel Rods',
        sku: products[0]?.sku || 'STL-001',
        expectedQty: 50,
        receivedQty: 50,
        unit: products[0]?.unit || 'kg',
        location: products[0]?.locationName || 'Rack A',
        unitCost: products[0]?.costPrice || 85
      }
    ]
  });

  const filteredReceipts = receipts.filter(r => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || r.reference.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q) || r.warehouseName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const openNewWizard = () => {
    const nextRef = `WH/IN/${String(receipts.length + 1).padStart(4, '0')}`;
    const p = products[0];
    setWizardData({
      reference: nextRef,
      supplier: 'Azure Interior & Metal Works',
      warehouseId: warehouses[0]?.id || 'WH-001',
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: 'Dock delivery staged from supplier purchase order.',
      items: [
        {
          productId: p?.id || 'PROD-001',
          productName: p?.name || 'Steel Rods',
          sku: p?.sku || 'STL-001',
          expectedQty: 50,
          receivedQty: 50,
          unit: p?.unit || 'kg',
          location: p?.locationName || 'Rack A',
          unitCost: p?.costPrice || 85
        }
      ]
    });
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleAddWizardItem = () => {
    const p = products[0];
    setWizardData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          expectedQty: 25,
          receivedQty: 25,
          unit: p.unit,
          location: p.locationName,
          unitCost: p.costPrice || 50
        }
      ]
    }));
  };

  const handleUpdateWizardItem = (idx: number, prodId: string) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;
    setWizardData(prev => {
      const updated = [...prev.items];
      updated[idx] = {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        expectedQty: 25,
        receivedQty: 25,
        unit: p.unit,
        location: p.locationName,
        unitCost: p.costPrice || 50
      };
      return { ...prev, items: updated };
    });
  };

  const handleUpdateWizardQty = (idx: number, val: number) => {
    setWizardData(prev => {
      const updated = [...prev.items];
      updated[idx].expectedQty = val;
      updated[idx].receivedQty = val;
      return { ...prev, items: updated };
    });
  };

  const handleRemoveWizardItem = (idx: number) => {
    setWizardData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleCompleteReceiptCreation = (status: 'Draft' | 'Done') => {
    const newRcv = createReceipt({
      supplier: wizardData.supplier,
      warehouseId: wizardData.warehouseId,
      scheduledDate: wizardData.scheduledDate,
      notes: wizardData.notes,
      status: status,
      items: wizardData.items
    });

    if (status === 'Done') {
      validateReceipt(newRcv.id);
    }
    setIsWizardOpen(false);
  };

  // Detailed Receipt View (WH/IN/0001)
  if (selectedReceiptId) {
    const r = receipts.find(item => item.id === selectedReceiptId || item.reference === selectedReceiptId) || receipts[0];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={() => setSelectedReceiptId(null)} className="hover:text-blue-600 font-medium">
              Receipts
            </button>
            <span>/</span>
            <span className="font-bold text-slate-800 font-mono">{r.reference}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn btn-secondary btn-sm text-xs">
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receiving Slip</span>
            </button>
            <button onClick={() => setSelectedReceiptId(null)} className="btn btn-subtle btn-sm text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to List</span>
            </button>
          </div>
        </div>

        {/* Receipt Header Card */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 font-display">{r.reference}</h1>
                <span className={`badge ${
                  r.status === 'Done' ? 'badge-done' :
                  r.status === 'Ready' ? 'badge-ready' :
                  r.status === 'Waiting' ? 'badge-waiting' : 'badge-draft'
                }`}>
                  {r.status}
                </span>
                {r.status === 'Done' && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stock Updated & Logged in Ledger
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Receive From: <strong className="text-slate-800">{r.supplier}</strong> • Destination: <strong className="text-slate-800">{r.warehouseName}</strong>
              </p>
            </div>

            {/* Action Buttons depending on status */}
            <div className="flex items-center gap-2">
              {r.status === 'Draft' && (
                <button
                  onClick={() => updateReceiptStatus(r.id, 'Ready')}
                  className="btn btn-primary btn-sm text-xs"
                >
                  Mark as Ready for Dock
                </button>
              )}
              {(r.status === 'Ready' || r.status === 'Waiting') && (
                <button
                  onClick={() => validateReceipt(r.id)}
                  className="btn btn-success btn-sm text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validate & Increase Stock</span>
                </button>
              )}
              <button
                onClick={openNewWizard}
                className="btn btn-secondary btn-sm text-xs"
              >
                + New Receipt
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Scheduled Date:</span>
              <span className="font-bold text-slate-800 font-mono">{r.scheduledDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Responsible Operator:</span>
              <span className="font-bold text-slate-800">{r.responsible}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Inbound Dock Location:</span>
              <span className="font-bold text-slate-800 font-mono">{r.locationName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Created Date:</span>
              <span className="font-bold text-slate-800 font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Received Products Table */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Inbound Product Lines & Storage Target</h3>
          <div className="table-responsive">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Product Item</th>
                  <th>SKU Code</th>
                  <th>Expected Qty</th>
                  <th>Received Qty</th>
                  <th>Unit</th>
                  <th>Target Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-bold text-xs text-slate-900">{item.productName}</td>
                    <td className="font-mono text-xs text-slate-600">{item.sku}</td>
                    <td className="text-xs">{item.expectedQty}</td>
                    <td className="font-bold text-xs text-blue-600">{item.receivedQty || item.expectedQty}</td>
                    <td className="text-xs text-slate-500">{item.unit}</td>
                    <td className="font-mono text-xs text-slate-700">{item.location}</td>
                    <td>
                      <span className={`badge ${r.status === 'Done' ? 'badge-done' : 'badge-ready'}`}>
                        {r.status === 'Done' ? 'Added to Stock' : 'Staged for Inspection'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              Inbound Logistics
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{receipts.length} Shipments</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">Receipts (Incoming Goods)</h1>
          <p className="text-xs text-slate-500">
            Track PO receipts from suppliers, inspect dock shipments, and automatically increase on-hand stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* List / Kanban View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 inline mr-1" />
              Kanban
            </button>
          </div>

          <button onClick={openNewWizard} className="btn btn-primary text-xs">
            <PlusCircle className="w-4 h-4" />
            <span>+ New Receipt</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Reference (WH/IN/0001), Supplier, Warehouse..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 min-w-[180px]">
            <CustomSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Draft', label: 'Draft', badge: 'Draft', badgeColor: 'bg-slate-100 text-slate-700' },
                { value: 'Waiting', label: 'Waiting (Blocked)', badge: 'Waiting', badgeColor: 'bg-amber-100 text-amber-700' },
                { value: 'Ready', label: 'Ready at Dock', badge: 'Ready', badgeColor: 'bg-emerald-100 text-emerald-700' },
                { value: 'Done', label: 'Done (Validated)', badge: 'Done', badgeColor: 'bg-blue-100 text-blue-700' }
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* View Rendering (List or Kanban) */}
      {viewMode === 'list' ? (
        <div className="card overflow-hidden border border-slate-200 shadow-sm">
          <div className="table-responsive">
            <table className="stock-table min-w-[1050px]">
              <thead>
                <tr>
                  <th className="w-32">Receipt Ref ID</th>
                  <th className="min-w-[160px]">Supplier / Vendor</th>
                  <th className="min-w-[200px]">Line Items</th>
                  <th className="w-28 text-center">Expected Qty</th>
                  <th className="w-36">Destination WH</th>
                  <th className="w-32">Scheduled Date</th>
                  <th className="w-28">Operator</th>
                  <th className="w-28 text-center">Status</th>
                  <th className="w-36 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                      No receipts found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(r => {
                    const totalQty = r.items.reduce((sum, i) => sum + Number(i.expectedQty), 0);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="whitespace-nowrap">
                          <button
                            onClick={() => setSelectedReceiptId(r.id)}
                            className="font-mono text-xs font-bold text-blue-600 hover:underline"
                          >
                            {r.reference}
                          </button>
                        </td>
                        <td>
                          <span className="font-bold text-xs text-slate-900 block">{r.supplier}</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-700 block line-clamp-1">{r.items.map(i => i.productName).join(', ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{r.items.length} line(s)</span>
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <span className="font-bold text-xs text-slate-900">{totalQty} units</span>
                        </td>
                        <td className="text-xs text-slate-700 font-medium whitespace-nowrap">{r.warehouseName}</td>
                        <td className="text-xs text-slate-600 font-mono whitespace-nowrap">
                          {r.scheduledDate}
                          {r.isLate && r.status !== 'Done' && (
                            <span className="ml-1 text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded">Late</span>
                          )}
                        </td>
                        <td className="text-xs text-slate-500 whitespace-nowrap">{r.responsible}</td>
                        <td className="text-center whitespace-nowrap">
                          <span className={`badge ${
                            r.status === 'Done' ? 'badge-done' :
                            r.status === 'Ready' ? 'badge-ready' :
                            r.status === 'Waiting' ? 'badge-waiting' : 'badge-draft'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedReceiptId(r.id)}
                              className="btn btn-secondary btn-sm text-xs px-2.5 py-1"
                            >
                              Details
                            </button>
                            {r.status !== 'Done' && (
                              <button
                                onClick={() => validateReceipt(r.id)}
                                className="btn btn-success btn-sm text-xs px-2.5 py-1"
                              >
                                Validate
                              </button>
                            )}
                          </div>
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
        /* Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['Draft', 'Waiting', 'Ready', 'Done'] as const).map(st => {
            const colReceipts = filteredReceipts.filter(r => r.status === st);
            return (
              <div key={st} className="p-3 bg-slate-100 rounded-2xl min-h-[420px] flex flex-col gap-3">
                <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-200">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">{st}</span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 text-xs font-bold rounded-full shadow-2xs">
                    {colReceipts.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colReceipts.map(r => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReceiptId(r.id)}
                      className="card p-3.5 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-blue-600">{r.reference}</span>
                        {r.isLate && r.status !== 'Done' && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] font-bold rounded">Late</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{r.supplier}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{r.items.map(i => i.productName).join(', ')}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <span>{r.scheduledDate}</span>
                        <span className="font-sans font-bold text-slate-700">{r.warehouseName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}      {/* Multi-Step Create Receipt Modal Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] my-auto">
            <div className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                  Create Inbound Receipt
                </h3>
                <span className="text-[11px] font-mono text-blue-600 font-bold">{wizardData.reference}</span>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Wizard Header */}
            <div className="shrink-0 px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
              <div className={`flex items-center gap-2 ${wizardStep === 1 ? 'text-blue-600 font-bold' : (wizardStep > 1 ? 'text-emerald-600' : 'text-slate-400')}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 1 ? 'bg-blue-600 text-white' : (wizardStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600')}`}>1</span>
                <span>1. General Info</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-200 mx-3"></div>
              <div className={`flex items-center gap-2 ${wizardStep === 2 ? 'text-blue-600 font-bold' : (wizardStep > 2 ? 'text-emerald-600' : 'text-slate-400')}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 2 ? 'bg-blue-600 text-white' : (wizardStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600')}`}>2</span>
                <span>2. Products</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-200 mx-3"></div>
              <div className={`flex items-center gap-2 ${wizardStep === 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                <span>3. Review & Validate</span>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Receipt Reference</label>
                      <input type="text" readOnly value={wizardData.reference} className="form-control text-xs font-mono bg-slate-100 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="form-label">Supplier Name *</label>
                      <input
                        type="text"
                        required
                        value={wizardData.supplier}
                        onChange={(e) => setWizardData({ ...wizardData, supplier: e.target.value })}
                        className="form-control text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Destination Facility *</label>
                      <CustomSelect
                        value={wizardData.warehouseId}
                        onChange={(val) => setWizardData({ ...wizardData, warehouseId: val })}
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
                      <label className="form-label">Scheduled Date *</label>
                      <input
                        type="date"
                        required
                        value={wizardData.scheduledDate}
                        onChange={(e) => setWizardData({ ...wizardData, scheduledDate: e.target.value })}
                        className="form-control text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">PO Notes & Cargo Notes</label>
                    <textarea
                      rows={2}
                      value={wizardData.notes}
                      onChange={(e) => setWizardData({ ...wizardData, notes: e.target.value })}
                      className="form-control text-xs"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Inbound Product Lines</span>
                    <button type="button" onClick={handleAddWizardItem} className="btn btn-secondary btn-sm text-xs">
                      + Add Another Product
                    </button>
                  </div>

                  <div className="space-y-3">
                    {wizardData.items.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-2">
                          <label className="form-label text-[11px]">Product</label>
                          <CustomSelect
                            value={item.productId}
                            onChange={(val) => handleUpdateWizardItem(idx, val)}
                            options={products.map(p => ({
                              value: p.id,
                              label: p.name,
                              subLabel: `SKU: ${p.sku} | ${p.category}`,
                              badge: `${p.unit}`
                            }))}
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-[11px]">Qty Received ({item.unit})</label>
                          <input
                            type="number"
                            min="1"
                            value={item.expectedQty}
                            onChange={(e) => handleUpdateWizardQty(idx, Number(e.target.value))}
                            className="form-control text-xs font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="form-label text-[11px]">Rack</label>
                            <input type="text" readOnly value={item.location} className="form-control text-xs bg-slate-100 text-slate-500 font-mono" />
                          </div>
                          {wizardData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveWizardItem(idx)}
                              className="btn-icon text-red-500 mb-0.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Confirming receipt will automatically increase stock in designated racks and create ledger entries.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div><span className="text-slate-400">Supplier:</span> <strong className="text-slate-800">{wizardData.supplier}</strong></div>
                    <div><span className="text-slate-400">Scheduled Date:</span> <strong className="text-slate-800 font-mono">{wizardData.scheduledDate}</strong></div>
                    <div><span className="text-slate-400">Facility:</span> <strong className="text-slate-800">{warehouses.find(w => w.id === wizardData.warehouseId)?.name}</strong></div>
                    <div><span className="text-slate-400">Status:</span> <strong className="text-emerald-600 font-bold">Ready to Validate</strong></div>
                  </div>

                  <div className="table-responsive">
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Qty</th>
                          <th>Target Location</th>
                          <th>Stock Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wizardData.items.map((i, idx) => {
                          const prod = products.find(p => p.id === i.productId);
                          const curr = prod ? prod.stock : 0;
                          return (
                            <tr key={idx}>
                              <td className="font-bold text-xs">{i.productName}</td>
                              <td className="font-mono text-xs text-slate-500">{i.sku}</td>
                              <td className="font-bold text-xs text-blue-600">{i.expectedQty} {i.unit}</td>
                              <td className="font-mono text-xs text-slate-700">{i.location}</td>
                              <td className="text-xs text-emerald-600 font-bold">
                                {curr} ➔ {curr + i.expectedQty} {i.unit} (+{i.expectedQty})
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {wizardStep > 1 ? (
                <button type="button" onClick={() => setWizardStep(wizardStep - 1)} className="btn btn-secondary text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <button type="button" onClick={() => setIsWizardOpen(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
              )}

              <div className="flex items-center gap-2">
                {wizardStep < 3 ? (
                  <button type="button" onClick={() => setWizardStep(wizardStep + 1)} className="btn btn-primary text-xs">
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCompleteReceiptCreation('Draft')}
                      className="btn btn-secondary text-xs"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompleteReceiptCreation('Done')}
                      className="btn btn-success text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Increase Stock</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
