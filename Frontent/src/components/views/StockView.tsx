import React, { useState } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import { Layers, Search, Filter, ArrowLeftRight, Tune, Eye } from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

export const StockView: React.FC = () => {
  const { products, warehouses, categories, setSelectedProductId, setActiveView } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = products.filter(p => {
    const matchesWH = filterWarehouse === 'All' || p.warehouseId === filterWarehouse;
    const matchesCat = filterCategory === 'All' || p.category === filterCategory;
    const matchesSt = filterStatus === 'All' || p.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.locationName.toLowerCase().includes(q);
    return matchesWH && matchesCat && matchesSt && matchesSearch;
  });

  const totalOnHand = filtered.reduce((sum, p) => sum + p.stock, 0);
  const totalReserved = filtered.reduce((sum, p) => sum + (p.reserved || 0), 0);
  const totalAvailable = filtered.reduce((sum, p) => sum + p.available, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              Live Stock Balances
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">Automatic Real-Time Sync</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">Stock & Available Quantities</h1>
          <p className="text-xs text-slate-500">
            Monitor on-hand counts, allocated reservations, and free-to-use stock across warehouse racks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('transfers')}
            className="btn btn-secondary text-xs"
          >
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => setActiveView('transfers')}
            className="btn btn-primary text-xs"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Internal Transfer</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total On-Hand Stock</span>
            <span className="text-xl font-bold text-slate-900 font-display">
              {totalOnHand.toLocaleString()} <small className="text-xs font-normal text-slate-400">units</small>
            </span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Reserved (Allocated to Orders)</span>
            <span className="text-xl font-bold text-amber-600 font-display">
              {totalReserved.toLocaleString()} <small className="text-xs font-normal text-slate-400">units</small>
            </span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Free to Use (Available)</span>
            <span className="text-xl font-bold text-emerald-600 font-display">
              {totalAvailable.toLocaleString()} <small className="text-xs font-normal text-slate-400">units</small>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stock by product name, SKU, or rack location..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[180px]">
              <CustomSelect
                value={filterWarehouse}
                onChange={(val) => setFilterWarehouse(val)}
                options={[
                  { value: 'All', label: 'All Facilities' },
                  ...warehouses.map(w => ({
                    value: w.id,
                    label: w.name,
                    subLabel: w.city,
                    badge: w.code
                  }))
                ]}
                size="sm"
              />
            </div>

            <div className="min-w-[170px]">
              <CustomSelect
                value={filterCategory}
                onChange={(val) => setFilterCategory(val)}
                options={['All', ...categories.map(c => c.name)]}
                size="sm"
              />
            </div>

            <div className="min-w-[160px]">
              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                options={[
                  { value: 'All', label: 'All Stock Status' },
                  { value: 'In Stock', label: 'In Stock', badge: 'Good', badgeColor: 'bg-emerald-50 text-emerald-700' },
                  { value: 'Low Stock', label: 'Low Stock', badge: 'Low', badgeColor: 'bg-amber-50 text-amber-700' },
                  { value: 'Out of Stock', label: 'Out of Stock', badge: 'Zero', badgeColor: 'bg-rose-50 text-rose-700' }
                ]}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Matrix Table */}
      <div className="card overflow-hidden border border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="stock-table min-w-[1050px]">
            <thead>
              <tr>
                <th className="min-w-[200px]">Product Item</th>
                <th className="w-28">SKU Code</th>
                <th className="w-36">Facility</th>
                <th className="w-28">Current Stock</th>
                <th className="w-28">Reserved Stock</th>
                <th className="w-36">Free to Use (Available)</th>
                <th className="w-32">Assigned Location</th>
                <th className="w-28 text-center">Status</th>
                <th className="w-28 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                    No matching stock entries found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <button
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setActiveView('products');
                        }}
                        className="font-bold text-xs text-slate-900 hover:text-blue-600 text-left block"
                      >
                        {p.name}
                      </button>
                      <span className="text-[10px] text-slate-400">{p.category}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {p.sku}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700 font-medium">
                      {p.warehouseName || 'Main Warehouse'}
                    </td>
                    <td>
                      <span className={`font-bold text-xs font-mono ${p.stock <= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {p.stock} {p.unit || 'pcs'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 font-mono">
                        {p.reserved || 0} {p.unit || 'pcs'}
                      </span>
                    </td>
                    <td>
                      <span className={`font-bold text-xs font-mono ${p.available <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {p.available} {p.unit || 'pcs'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                        {p.locationName || 'Rack A - Primary'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'In Stock' ? 'badge-in-stock' :
                        p.status === 'Low Stock' ? 'badge-low-stock' : 'badge-out-of-stock'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setActiveView('products');
                          }}
                          className="btn btn-subtle btn-sm text-xs"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => setActiveView('transfers')}
                          className="btn btn-secondary btn-sm text-xs"
                          title="Adjust"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
