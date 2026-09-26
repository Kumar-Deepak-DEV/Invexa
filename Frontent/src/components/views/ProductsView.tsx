import React, { useState } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import { Product } from '../../types';
import {
  Package,
  PlusCircle,
  Download,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ArrowLeft,
  X,
  Layers,
  Building2,
  History,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    warehouses,
    locations,
    addProduct,
    updateProduct,
    deleteProduct,
    selectedProductId,
    setSelectedProductId,
    moveHistory,
    adjustments,
    setActiveView
  } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'stock' | 'locations' | 'history' | 'adjustments'>('overview');

  // Form State for Add Product
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: categories[0]?.name || 'Raw Materials',
    unit: 'units',
    stock: 0,
    costPrice: 50,
    sellingPrice: 85,
    warehouseId: warehouses[0]?.id || 'WH-001',
    locationId: locations[0]?.id || 'LOC-001',
    reorderLevel: 20,
    maxStock: 100,
    reorderQty: 40,
    description: ''
  });

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.warehouseName.toLowerCase().includes(q);
    return matchesCat && matchesStatus && matchesSearch;
  });

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct(formData);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      sku: '',
      category: categories[0]?.name || 'Raw Materials',
      unit: 'units',
      stock: 0,
      costPrice: 50,
      sellingPrice: 85,
      warehouseId: warehouses[0]?.id || 'WH-001',
      locationId: locations[0]?.id || 'LOC-001',
      reorderLevel: 20,
      maxStock: 100,
      reorderQty: 40,
      description: ''
    });
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, editingProduct);
    setEditingProduct(null);
  };

  const exportCSV = () => {
    let csv = 'Product ID,Name,SKU,Category,Current Stock,Unit,Warehouse,Location,Reorder Level,Status\n';
    products.forEach(p => {
      csv += `"${p.id}","${p.name}","${p.sku}","${p.category}",${p.stock},"${p.unit}","${p.warehouseName}","${p.locationName}",${p.reorderLevel},"${p.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StockSense_Products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Detailed Product View
  if (selectedProductId) {
    const p = products.find(prod => prod.id === selectedProductId) || products[0];
    const productMoves = moveHistory.filter(m => m.product.includes(p.name) || m.product.includes(p.sku));
    const productAdjs = adjustments.filter(a => a.productId === p.id);

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Detail Top Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={() => setSelectedProductId(null)} className="hover:text-blue-600 font-medium">
              Products Master
            </button>
            <span>/</span>
            <span className="font-bold text-slate-800 font-mono">{p.sku}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingProduct(p)}
              className="btn btn-secondary btn-sm text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
            <button
              onClick={() => setSelectedProductId(null)}
              className="btn btn-subtle btn-sm text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalog</span>
            </button>
          </div>
        </div>

        {/* Product Profile Banner */}
        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20 shrink-0">
                {p.category.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 font-display">{p.name}</h1>
                  <span className={`badge ${
                    p.status === 'In Stock' ? 'badge-in-stock' :
                    p.status === 'Low Stock' ? 'badge-low-stock' : 'badge-out-of-stock'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                    SKU: {p.sku}
                  </span>
                  <span>•</span>
                  <span>Category: <strong className="text-slate-800">{p.category}</strong></span>
                  <span>•</span>
                  <span>Facility: <strong className="text-slate-800">{p.warehouseName}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Balances Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <div className="px-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">On-Hand Stock</span>
                <span className="block text-lg font-bold text-blue-600 font-display">
                  {p.stock} <small className="text-xs font-normal text-slate-500">{p.unit}</small>
                </span>
              </div>
              <div className="px-3 border-l border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Reserved</span>
                <span className="block text-lg font-bold text-slate-700 font-display">
                  {p.reserved || 0} <small className="text-xs font-normal text-slate-500">{p.unit}</small>
                </span>
              </div>
              <div className="px-3 border-l border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Free to Use</span>
                <span className="block text-lg font-bold text-emerald-600 font-display">
                  {p.available} <small className="text-xs font-normal text-slate-500">{p.unit}</small>
                </span>
              </div>
              <div className="px-3 border-l border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Reorder Point</span>
                <span className="block text-lg font-bold text-amber-600 font-display">
                  {p.reorderLevel} <small className="text-xs font-normal text-slate-500">{p.unit}</small>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
            {(['overview', 'stock', 'locations', 'history', 'adjustments'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveDetailTab(tab)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeDetailTab === tab
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'history' ? `Movement Audit (${productMoves.length})` :
                 tab === 'adjustments' ? `Adjustments (${productAdjs.length})` : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Body */}
        {activeDetailTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Product Specification & Description
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Standard Cost Valuation:</span>
                  <span className="font-bold text-slate-900">₹{p.costPrice?.toLocaleString('en-IN')} per {p.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Selling / Outbound Price:</span>
                  <span className="font-bold text-slate-900">₹{p.sellingPrice?.toLocaleString('en-IN')} per {p.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Total Valuation in Storage:</span>
                  <span className="font-bold text-blue-600 font-display text-sm">
                    ₹{(p.stock * (p.costPrice || 50)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Max Storage Capacity:</span>
                  <span className="font-bold text-slate-800">{p.maxStock} {p.unit}</span>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Primary Storage Assignment
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Assigned Warehouse:</span>
                  <span className="font-bold text-slate-800">{p.warehouseName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Rack Location:</span>
                  <span className="font-mono font-bold text-blue-600">{p.locationName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Auto-PO Replenish Qty:</span>
                  <span className="font-bold text-slate-800">+{p.reorderQty} {p.unit}</span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveView('transfers')}
                    className="btn btn-secondary btn-sm w-full text-xs"
                  >
                    Transfer to Another Rack
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'stock' && (
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Stock Breakdown by Location</h3>
            <div className="table-responsive">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Location Code</th>
                    <th>On Hand Stock</th>
                    <th>Reserved</th>
                    <th>Free to Use (Available)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-xs">{p.warehouseName}</td>
                    <td className="font-mono text-xs">{p.locationName}</td>
                    <td className="font-bold text-xs">{p.stock} {p.unit}</td>
                    <td className="text-xs text-slate-500">{p.reserved || 0} {p.unit}</td>
                    <td className="font-bold text-xs text-emerald-600">{p.available} {p.unit}</td>
                    <td>
                      <span className="badge badge-in-stock">{p.status}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeDetailTab === 'locations' && (
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Assigned Facility & Shelf Hierarchy
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Building2 className="w-4 h-4 text-blue-600" />
                {p.warehouseName} (Central Facility Hub)
              </div>
              <div className="pl-6 border-l-2 border-slate-300 space-y-1">
                <div className="text-slate-700">├── Zone: Aisle 1 (Heavy Freight Bay)</div>
                <div className="text-blue-600 font-bold">└── Rack Location: {p.locationName}</div>
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'history' && (
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Stock Movement Audit Trail</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {productMoves.length === 0 ? (
                <p className="text-slate-400 py-6 text-center">No movement history logs recorded for this SKU.</p>
              ) : (
                productMoves.map(m => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        m.direction === 'IN' ? 'bg-emerald-100 text-emerald-700' :
                        m.direction === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {m.direction}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{m.reference}</span> ({m.type})
                        <p className="text-slate-400 text-[11px]">{m.from} ➔ {m.to}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold font-mono ${m.direction === 'IN' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {m.quantity}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{m.date} by {m.user}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeDetailTab === 'adjustments' && (
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Physical Stock Count Adjustments</h3>
            <div className="table-responsive">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>System Qty</th>
                    <th>Physical Count</th>
                    <th>Difference</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Auditor</th>
                  </tr>
                </thead>
                <tbody>
                  {productAdjs.length === 0 ? (
                    <tr><td colspan={7} className="text-center py-6 text-slate-400 text-xs">No adjustments on record. Physical count matches system.</td></tr>
                  ) : (
                    productAdjs.map(a => (
                      <tr key={a.id}>
                        <td className="font-mono text-xs font-bold text-amber-600">{a.reference}</td>
                        <td className="text-xs">{a.systemQuantity} {p.unit}</td>
                        <td className="text-xs font-bold">{a.physicalCount} {p.unit}</td>
                        <td className={`text-xs font-bold ${a.difference < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {a.difference > 0 ? '+' : ''}{a.difference} {p.unit}
                        </td>
                        <td className="text-xs text-slate-700">{a.reason}</td>
                        <td className="text-xs font-mono text-slate-400">{a.date}</td>
                        <td className="text-xs text-slate-600">{a.responsible}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Master Catalog Table View
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              Master Catalog
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{products.length} Products Tracked</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">Products Master Catalog</h1>
          <p className="text-xs text-slate-500">
            Manage product metadata, SKUs, reorder thresholds, and bin allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={exportCSV} className="btn btn-secondary text-xs">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by Name, SKU, Category, Warehouse..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[170px]">
              <CustomSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={['All', ...categories.map(c => c.name)]}
                size="sm"
              />
            </div>

            <div className="min-w-[160px]">
              <CustomSelect
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'In Stock', label: 'In Stock', badge: 'Normal', badgeColor: 'bg-emerald-50 text-emerald-700' },
                  { value: 'Low Stock', label: 'Low Stock', badge: 'Alert', badgeColor: 'bg-amber-50 text-amber-700' },
                  { value: 'Out of Stock', label: 'Out of Stock', badge: 'Empty', badgeColor: 'bg-rose-50 text-rose-700' }
                ]}
                size="sm"
              />
            </div>

            {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                }}
                className="btn btn-subtle btn-sm text-xs"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden border border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="stock-table min-w-[1080px]">
            <thead>
              <tr>
                <th className="min-w-[220px]">Product Item</th>
                <th className="w-28">SKU Code</th>
                <th className="w-32">Category</th>
                <th className="w-28">Current Stock</th>
                <th className="w-20">Unit</th>
                <th className="w-36">Warehouse</th>
                <th className="w-32">Rack Location</th>
                <th className="w-28">Reorder Level</th>
                <th className="w-28 text-center">Status</th>
                <th className="w-32 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No products found</h4>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your filters or create a new product.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.category.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedProductId(p.id)}
                            className="font-bold text-xs text-slate-900 hover:text-blue-600 text-left block"
                          >
                            {p.name}
                          </button>
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">{p.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {p.sku}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 font-medium">{p.category}</span>
                    </td>
                    <td>
                      <span className={`font-bold text-xs font-mono ${
                        p.stock <= 0 ? 'text-red-600' :
                        p.stock <= p.reorderLevel ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {p.stock.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">{p.unit}</span>
                    </td>
                    <td className="text-xs text-slate-700 font-medium">
                      {p.warehouseName || 'Main Warehouse'}
                    </td>
                    <td>
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                        {p.locationName || 'Rack A - Primary'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600">{p.reorderLevel} {p.unit}</span>
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
                          onClick={() => setSelectedProductId(p.id)}
                          className="btn-icon"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="btn-icon"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="btn-icon text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                Create New Catalog Product
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Steel Rods (12mm High-Grade)"
                    className="form-control text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      placeholder="STL-001"
                      className="form-control text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="form-label">Category *</label>
                    <CustomSelect
                      value={formData.category}
                      onChange={(val) => setFormData({ ...formData, category: val })}
                      options={categories.map(c => c.name)}
                      size="md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Unit of Measure *</label>
                    <CustomSelect
                      value={formData.unit}
                      onChange={(val) => setFormData({ ...formData, unit: val })}
                      options={[
                        { value: 'kg', label: 'kg (Kilograms)' },
                        { value: 'units', label: 'units (Pieces)' },
                        { value: 'meters', label: 'meters' },
                        { value: 'pcs', label: 'pcs (Packaging)' },
                        { value: 'boxes', label: 'boxes' }
                      ]}
                      size="md"
                    />
                  </div>
                  <div>
                    <label className="form-label">Initial Stock Count</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="form-control text-xs"
                    />
                  </div>
                  <div>
                    <label className="form-label">Reorder Trigger Level *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                      className="form-control text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Primary Warehouse *</label>
                    <CustomSelect
                      value={formData.warehouseId}
                      onChange={(val) => setFormData({ ...formData, warehouseId: val })}
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
                    <label className="form-label">Bin Location *</label>
                    <CustomSelect
                      value={formData.locationId}
                      onChange={(val) => setFormData({ ...formData, locationId: val })}
                      options={locations.map(l => ({
                        value: l.id,
                        label: l.name,
                        subLabel: l.type
                      }))}
                      size="md"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Product Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Industrial grade specifications and notes..."
                    className="form-control text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Product: {editingProduct.sku}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="form-control text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Category</label>
                    <CustomSelect
                      value={editingProduct.category}
                      onChange={(val) => setEditingProduct({ ...editingProduct, category: val })}
                      options={categories.map(c => c.name)}
                      size="md"
                    />
                  </div>
                  <div>
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingProduct.reorderLevel}
                      onChange={(e) => setEditingProduct({ ...editingProduct, reorderLevel: Number(e.target.value) })}
                      className="form-control text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="form-control text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
