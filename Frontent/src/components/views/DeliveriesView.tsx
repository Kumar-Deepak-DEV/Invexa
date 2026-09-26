import React, { useState } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import { DeliveryOrder } from '../../types';
import {
  Truck,
  PlusCircle,
  Table,
  Kanban,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ArrowLeft,
  ArrowRight,
  X,
  Trash2,
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

export const DeliveriesView: React.FC = () => {
  const {
    deliveries,
    warehouses,
    locations,
    products,
    createDelivery,
    validateDelivery,
    updateDeliveryStatus,
    selectedDeliveryId,
    setSelectedDeliveryId,
    showToast
  } = useStockSense();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Multi-step Wizard State
  const [wizardData, setWizardData] = useState({
    reference: '',
    customer: 'Skyline Infrastructure Pvt Ltd',
    warehouseId: warehouses[0]?.id || 'WH-001',
    carrier: 'BlueDart Express Logis',
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: 'Outbound sales dispatch staged at loading bay.',
    items: [
      {
        productId: products[0]?.id || 'PROD-001',
        productName: products[0]?.name || 'Steel Rods',
        sku: products[0]?.sku || 'STL-001',
        availableStock: products[0]?.available || 230,
        requestedQty: 20,
        deliveredQty: 20,
        unit: products[0]?.unit || 'kg',
        location: products[0]?.locationName || 'Rack A'
      }
    ]
  });

  const filteredDeliveries = deliveries.filter(d => {
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || d.reference.toLowerCase().includes(q) || d.customer.toLowerCase().includes(q) || d.warehouseName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const openNewWizard = () => {
    const nextRef = `WH/OUT/${String(deliveries.length + 1).padStart(4, '0')}`;
    const p = products[0];
    setWizardData({
      reference: nextRef,
      customer: 'Skyline Infrastructure Pvt Ltd',
      warehouseId: warehouses[0]?.id || 'WH-001',
      carrier: 'BlueDart Express Logis',
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: 'Outbound sales dispatch staged at loading bay.',
      items: [
        {
          productId: p?.id || 'PROD-001',
          productName: p?.name || 'Steel Rods',
          sku: p?.sku || 'STL-001',
          availableStock: p?.available || 230,
          requestedQty: 10,
          deliveredQty: 10,
          unit: p?.unit || 'kg',
          location: p?.locationName || 'Rack A'
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
          availableStock: p.available,
          requestedQty: Math.min(5, p.available),
          deliveredQty: Math.min(5, p.available),
          unit: p.unit,
          location: p.locationName
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
        availableStock: p.available,
        requestedQty: Math.min(5, p.available),
        deliveredQty: Math.min(5, p.available),
        unit: p.unit,
        location: p.locationName
      };
      return { ...prev, items: updated };
    });
  };

  const handleUpdateWizardQty = (idx: number, val: number) => {
    setWizardData(prev => {
      const updated = [...prev.items];
      updated[idx].requestedQty = val;
      updated[idx].deliveredQty = val;
      return { ...prev, items: updated };
    });
  };

  const handleRemoveWizardItem = (idx: number) => {
    setWizardData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleCompleteDeliveryCreation = (status: 'Draft' | 'Done') => {
    // Check over-delivery guard
    if (status === 'Done') {
      for (const item of wizardData.items) {
        const p = products.find(prod => prod.id === item.productId);
        if (p && item.requestedQty > p.available) {
          showToast(`Insufficient stock available for ${p.name}. Available: ${p.available} ${p.unit}.`, 'danger');
          return;
        }
      }
    }

    const newDel = createDelivery({
      customer: wizardData.customer,
      warehouseId: wizardData.warehouseId,
      carrier: wizardData.carrier,
      scheduledDate: wizardData.scheduledDate,
      notes: wizardData.notes,
      status: status,
      items: wizardData.items
    });

    if (status === 'Done') {
      validateDelivery(newDel.id);
    }
    setIsWizardOpen(false);
  };

  // Detailed Delivery Order View (WH/OUT/0001)
  if (selectedDeliveryId) {
    const d = deliveries.find(item => item.id === selectedDeliveryId || item.reference === selectedDeliveryId) || deliveries[0];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={() => setSelectedDeliveryId(null)} className="hover:text-blue-600 font-medium">
              Delivery Orders
            </button>
            <span>/</span>
            <span className="font-bold text-slate-800 font-mono">{d.reference}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn btn-secondary btn-sm text-xs">
              <Printer className="w-3.5 h-3.5" />
              <span>Print Shipping Manifest</span>
            </button>
            <button onClick={() => setSelectedDeliveryId(null)} className="btn btn-subtle btn-sm text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to List</span>
            </button>
          </div>
        </div>

        {/* Delivery Header Card */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 font-display">{d.reference}</h1>
                <span className={`badge ${
                  d.status === 'Done' ? 'badge-done' :
                  d.status === 'Ready' ? 'badge-ready' :
                  d.status === 'Waiting' ? 'badge-waiting' : 'badge-draft'
                }`}>
                  {d.status}
                </span>
                {d.status === 'Done' && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stock Deducted & Dispatched
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customer: <strong className="text-slate-800">{d.customer}</strong> • Carrier: <strong className="text-slate-800">{d.carrier || 'Standard Freight'}</strong>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {d.status === 'Draft' && (
                <>
                  <button onClick={() => updateDeliveryStatus(d.id, 'Waiting')} className="btn btn-secondary btn-sm text-xs">
                    Allocate Stock
                  </button>
                  <button onClick={() => updateDeliveryStatus(d.id, 'Ready')} className="btn btn-primary btn-sm text-xs">
                    Pick & Stage
                  </button>
                </>
              )}
              {d.status === 'Waiting' && (
                <button onClick={() => updateDeliveryStatus(d.id, 'Ready')} className="btn btn-primary btn-sm text-xs">
                  Mark Ready for Dispatch
                </button>
              )}
              {d.status === 'Ready' && (
                <button onClick={() => validateDelivery(d.id)} className="btn btn-success btn-sm text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validate & Dispatch (Deduct Stock)</span>
                </button>
              )}
              <button onClick={openNewWizard} className="btn btn-secondary btn-sm text-xs">
                + New Order
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Scheduled Date:</span>
              <span className="font-bold text-slate-800 font-mono">{d.scheduledDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Origin Facility:</span>
              <span className="font-bold text-slate-800">{d.warehouseName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Staging Bay:</span>
              <span className="font-bold text-slate-800 font-mono">{d.locationName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Created Date:</span>
              <span className="font-bold text-slate-800 font-mono">{new Date(d.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Outbound Line Items</h3>
          <div className="table-responsive">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Product Item</th>
                  <th>SKU Code</th>
                  <th>Requested Quantity</th>
                  <th>Dispatched Quantity</th>
                  <th>Pick Rack Location</th>
                  <th>Available In Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(d.items || []).map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  return (
                    <tr key={idx}>
                      <td className="font-bold text-xs text-slate-900">{item.productName}</td>
                      <td className="font-mono text-xs text-slate-600">{item.sku}</td>
                      <td className="font-bold text-xs">{item.requestedQty} {item.unit}</td>
                      <td className="font-bold text-xs text-blue-600">{item.deliveredQty || item.requestedQty} {item.unit}</td>
                      <td className="font-mono text-xs text-slate-700">{item.location}</td>
                      <td className="text-xs font-semibold">{prod ? prod.available : item.availableStock} {item.unit}</td>
                      <td>
                        <span className={`badge ${d.status === 'Done' ? 'badge-done' : 'badge-ready'}`}>
                          {d.status === 'Done' ? 'Dispatched' : 'Staged for Pick'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
              Outbound Fulfillment
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{deliveries.length} Deliveries</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">Delivery Orders (Outgoing Goods)</h1>
          <p className="text-xs text-slate-500">
            Manage customer sales orders, pick & pack staging, carrier dispatch, and automated stock deductions.
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
            <span>+ New Delivery</span>
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
              placeholder="Search by Reference (WH/OUT/0001), Customer, Warehouse..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 min-w-[180px]">
            <CustomSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Draft', label: 'Draft', badge: 'New', badgeColor: 'bg-slate-100 text-slate-700' },
                { value: 'Waiting', label: 'Waiting (Shortage)', badge: 'Blocked', badgeColor: 'bg-amber-100 text-amber-700' },
                { value: 'Ready', label: 'Ready to Ship', badge: 'Ready', badgeColor: 'bg-emerald-100 text-emerald-700' },
                { value: 'Done', label: 'Done (Dispatched)', badge: 'Done', badgeColor: 'bg-blue-100 text-blue-700' }
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* List vs Kanban */}
      {viewMode === 'list' ? (
        <div className="card overflow-hidden border border-slate-200 shadow-sm">
          <div className="table-responsive">
            <table className="stock-table min-w-[1050px]">
              <thead>
                <tr>
                  <th className="w-32">Delivery Ref ID</th>
                  <th className="min-w-[160px]">Client / Customer</th>
                  <th className="min-w-[200px]">Line Items</th>
                  <th className="w-28 text-center">Total Units</th>
                  <th className="w-36">Dispatch WH</th>
                  <th className="w-32">Scheduled Date</th>
                  <th className="w-36">Logistics Carrier</th>
                  <th className="w-28 text-center">Status</th>
                  <th className="w-36 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                      No delivery orders found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map(d => {
                    const totalUnits = (d.items || []).reduce((sum, i) => sum + Number(i.requestedQty || 0), 0);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="whitespace-nowrap">
                          <button
                            onClick={() => setSelectedDeliveryId(d.id)}
                            className="font-mono text-xs font-bold text-blue-600 hover:underline"
                          >
                            {d.reference}
                          </button>
                        </td>
                        <td>
                          <span className="font-bold text-xs text-slate-900 block">{d.customer}</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-700 block line-clamp-1">{(d.items || []).map(i => i.productName).join(', ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{(d.items || []).length} item(s)</span>
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <span className="font-bold text-xs text-slate-900">{totalUnits} units</span>
                        </td>
                        <td className="text-xs text-slate-700 font-medium whitespace-nowrap">{d.warehouseName}</td>
                        <td className="text-xs text-slate-600 font-mono whitespace-nowrap">
                          {d.scheduledDate}
                          {d.isLate && d.status !== 'Done' && (
                            <span className="ml-1 text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded">Late</span>
                          )}
                        </td>
                        <td className="text-xs text-slate-500 whitespace-nowrap">{d.carrier || 'Pending'}</td>
                        <td className="text-center whitespace-nowrap">
                          <span className={`badge ${
                            d.status === 'Done' ? 'badge-done' :
                            d.status === 'Ready' ? 'badge-ready' :
                            d.status === 'Waiting' ? 'badge-waiting' : 'badge-draft'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDeliveryId(d.id)}
                              className="btn btn-secondary btn-sm text-xs px-2.5 py-1"
                            >
                              Details
                            </button>
                            {d.status !== 'Done' && (
                              <button
                                onClick={() => validateDelivery(d.id)}
                                className="btn btn-primary btn-sm text-xs px-2.5 py-1"
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
            const colDeliveries = filteredDeliveries.filter(d => d.status === st);
            return (
              <div key={st} className="p-3 bg-slate-100 rounded-2xl min-h-[420px] flex flex-col gap-3">
                <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-200">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">{st}</span>
                  <span className="px-2 py-0.5 bg-white text-slate-700 text-xs font-bold rounded-full shadow-2xs">
                    {colDeliveries.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colDeliveries.map(d => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDeliveryId(d.id)}
                      className="card p-3.5 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-blue-600">{d.reference}</span>
                        {d.isLate && d.status !== 'Done' && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] font-bold rounded">Late</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{d.customer}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{(d.items || []).map(i => i.productName).join(', ')}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <span>{d.scheduledDate}</span>
                        <span className="font-sans font-bold text-slate-700">{d.warehouseName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}      {/* Multi-Step Create Delivery Modal Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] my-auto">
            <div className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  Create Outbound Delivery Order
                </h3>
                <span className="text-[11px] font-mono text-indigo-600 font-bold">{wizardData.reference}</span>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Wizard Header */}
            <div className="shrink-0 px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
              <div className={`flex items-center gap-2 ${wizardStep === 1 ? 'text-blue-600 font-bold' : (wizardStep > 1 ? 'text-emerald-600' : 'text-slate-400')}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 1 ? 'bg-blue-600 text-white' : (wizardStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600')}`}>1</span>
                <span>1. Order Info</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-200 mx-3"></div>
              <div className={`flex items-center gap-2 ${wizardStep === 2 ? 'text-blue-600 font-bold' : (wizardStep > 2 ? 'text-emerald-600' : 'text-slate-400')}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 2 ? 'bg-blue-600 text-white' : (wizardStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600')}`}>2</span>
                <span>2. Select Products</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-200 mx-3"></div>
              <div className={`flex items-center gap-2 ${wizardStep === 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                <span>3. Availability Check</span>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Delivery Reference</label>
                      <input type="text" readOnly value={wizardData.reference} className="form-control text-xs font-mono bg-slate-100 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="form-label">Customer / Client Name *</label>
                      <input
                        type="text"
                        required
                        value={wizardData.customer}
                        onChange={(e) => setWizardData({ ...wizardData, customer: e.target.value })}
                        className="form-control text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Dispatch Facility *</label>
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
                      <label className="form-label">Scheduled Dispatch Date *</label>
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
                    <label className="form-label">Logistics Carrier & Tracking Info</label>
                    <input
                      type="text"
                      value={wizardData.carrier}
                      onChange={(e) => setWizardData({ ...wizardData, carrier: e.target.value })}
                      className="form-control text-xs"
                    />
                  </div>

                  <div>
                    <label className="form-label">Order Notes & Packing Guidelines</label>
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
                    <span className="text-xs font-bold text-slate-800">Select Items to Deliver</span>
                    <button type="button" onClick={handleAddWizardItem} className="btn btn-secondary btn-sm text-xs">
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {wizardData.items.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-2">
                          <label className="form-label text-[11px]">Product Item</label>
                          <CustomSelect
                            value={item.productId}
                            onChange={(val) => handleUpdateWizardItem(idx, val)}
                            options={products.map(p => ({
                              value: p.id,
                              label: p.name,
                              subLabel: `SKU: ${p.sku} | ${p.category}`,
                              badge: `${p.available} ${p.unit} Avail`,
                              badgeColor: p.available > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }))}
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-[11px]">Requested Qty ({item.unit})</label>
                          <input
                            type="number"
                            min="1"
                            value={item.requestedQty}
                            onChange={(e) => handleUpdateWizardQty(idx, Number(e.target.value))}
                            className="form-control text-xs font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="form-label text-[11px]">Pick Rack</label>
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
                  <div className="table-responsive">
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Available Stock</th>
                          <th>Requested Qty</th>
                          <th>Validation Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wizardData.items.map((i, idx) => {
                          const prod = products.find(p => p.id === i.productId);
                          const avail = prod ? prod.available : 0;
                          const isShort = i.requestedQty > avail;

                          return (
                            <tr key={idx} className={isShort ? 'bg-red-50' : ''}>
                              <td className="font-bold text-xs">{i.productName}</td>
                              <td className="font-mono text-xs text-slate-500">{i.sku}</td>
                              <td className="font-bold text-xs text-slate-800">{avail} {i.unit}</td>
                              <td className="font-bold text-xs text-blue-600">{i.requestedQty} {i.unit}</td>
                              <td>
                                {isShort ? (
                                  <span className="badge badge-out-of-stock">
                                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> Insufficient Stock!
                                  </span>
                                ) : (
                                  <span className="badge badge-in-stock">
                                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Available ({avail} - {i.requestedQty} = {avail - i.requestedQty} {i.unit})
                                  </span>
                                )}
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
                      onClick={() => handleCompleteDeliveryCreation('Draft')}
                      className="btn btn-secondary text-xs"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompleteDeliveryCreation('Done')}
                      className="btn btn-primary text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Deduct Stock</span>
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
