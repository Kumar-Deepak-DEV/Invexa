import React, { useState, useMemo } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import { Category, ReorderRule } from '../../types';
import {
  Tag,
  Settings2,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Zap,
  PackageCheck,
  Building2,
  ArrowRight,
  Sparkles,
  Sliders,
  FolderTree,
  ShieldAlert,
  X,
  PlusCircle,
  FileCheck
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

export const CategoriesRulesView: React.FC = () => {
  const {
    categories,
    reorderingRules,
    products,
    warehouses,
    addCategory,
    addReorderRule,
    createReceipt,
    showToast,
    setActiveView,
    setSelectedReceiptId
  } = useStockSense();

  const [activeTab, setActiveTab] = useState<'categories' | 'rules'>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('blue');

  // New Rule Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [ruleWarehouseId, setRuleWarehouseId] = useState(warehouses[0]?.id || '');
  const [minStock, setMinStock] = useState(50);
  const [maxStock, setMaxStock] = useState(250);
  const [reorderQty, setReorderQty] = useState(100);
  const [autoPO, setAutoPO] = useState(true);

  // Reorder Trigger Evaluation
  const breachedProducts = useMemo(() => {
    return products.filter((p) => {
      const rule = reorderingRules.find((r) => r.productId === p.id || r.sku === p.sku);
      const min = rule ? rule.minStock : p.reorderLevel;
      return p.stock <= min;
    });
  }, [products, reorderingRules]);

  // Statistics
  const stats = useMemo(() => {
    const autoPOCount = reorderingRules.filter((r) => r.autoPO).length;
    return {
      categoryCount: categories.length,
      rulesCount: reorderingRules.length,
      breachedCount: breachedProducts.length,
      autoPOCount,
    };
  }, [categories, reorderingRules, breachedProducts]);

  // Handle Add Category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }

    addCategory({
      name: newCatName,
      code: newCatCode || newCatName.slice(0, 3).toUpperCase(),
      description: newCatDesc || 'General classification category',
      color: newCatColor,
      productCount: 0,
    });

    setNewCatName('');
    setNewCatCode('');
    setNewCatDesc('');
    setIsAddCategoryOpen(false);
  };

  // Handle Add Rule
  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    const wh = warehouses.find((w) => w.id === ruleWarehouseId);

    if (!prod || !wh) {
      showToast('Please select valid product and warehouse', 'warning');
      return;
    }

    addReorderRule({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      minStock: Number(minStock),
      maxStock: Number(maxStock),
      reorderQty: Number(reorderQty),
      warehouseId: wh.id,
      warehouseName: wh.name,
      unit: prod.unit,
      status: 'Active',
      autoPO,
    });

    setIsAddRuleOpen(false);
  };

  // Auto Generate Purchase Order / Receipt for Breached Items
  const handleAutoGeneratePO = (product: typeof products[0]) => {
    const rule = reorderingRules.find((r) => r.productId === product.id);
    const qtyToOrder = rule ? rule.reorderQty : product.reorderQty || 100;

    const receipt = createReceipt({
      supplier: 'Global Logistics & Supply Hub',
      warehouseId: product.warehouseId,
      warehouseName: product.warehouseName,
      locationId: product.locationId,
      locationName: product.locationName,
      responsible: 'Alex Rivera (Automated Rule)',
      notes: `Automated reorder replenishment triggered by Safety Stock Rule (Min: ${product.reorderLevel}, Current: ${product.stock} ${product.unit})`,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          expectedQty: qtyToOrder,
          receivedQty: 0,
          unit: product.unit,
          location: product.locationName,
          unitCost: product.costPrice,
          totalCost: product.costPrice * qtyToOrder,
        },
      ],
    });

    showToast(`Replenishment Receipt ${receipt.reference} created for ${product.name}!`, 'success');
    setSelectedReceiptId(receipt.id);
    setActiveView('receipts');
  };

  const getCategoryColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      case 'cyan':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Tag className="w-4 h-4 text-blue-500" />
            Product Classification & Hierarchy
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Product Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage product taxonomy, classification codes, and catalog organization hierarchies.
          </p>
        </div>

        {/* Tab switcher + Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Categories
              <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]">
                {categories.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'rules'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Safety Rules & Auto-PO
              <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[10px]">
                {reorderingRules.length}
              </span>
            </button>
          </div>

          {activeTab === 'categories' ? (
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          ) : (
            <button
              onClick={() => setIsAddRuleOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Reorder Rule
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Categories</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.categoryCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{products.length} Products Cataloged</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Reorder Rules</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.rulesCount}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{stats.autoPOCount} Auto-PO Enabled</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Safety Stock Breached</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.breachedCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Below Reorder Level</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Protection Level</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">99.4%</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Stockout Prevention Active</div>
          </div>
        </div>
      </div>

      {/* TAB 1: PRODUCT CATEGORIES GRID */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat.name || p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border font-bold text-sm ${getCategoryColorClasses(
                          cat.color
                        )}`}
                      >
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {cat.name}
                        </h3>
                        <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                          CODE: {cat.code}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {count} items
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                    {cat.description}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setActiveView('products')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-1.5 transition-all"
                    >
                      View Category Products
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400">ID: {cat.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REORDERING RULES & SAFETY STOCK */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Breached Stock Alert Panel with 1-Click PO Replenishment */}
          {breachedProducts.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Automated Reorder Trigger: {breachedProducts.length} Items Require Restock</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                The following products have dipped below their defined safety stock thresholds. Click <strong>Generate PO Receipt</strong> to immediately draft an inbound shipment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {breachedProducts.map((p) => {
                  const rule = reorderingRules.find((r) => r.productId === p.id);
                  const orderQty = rule ? rule.reorderQty : p.reorderQty || 100;
                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap">
                            Stock: {p.stock} {p.unit}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Safety Min: <strong className="text-slate-800 dark:text-slate-200">{p.reorderLevel} {p.unit}</strong> | Target: <strong className="text-slate-800 dark:text-slate-200">{orderQty} {p.unit}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAutoGeneratePO(p)}
                        className="mt-3 w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Generate PO Receipt (+{orderQty} {p.unit})
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rules Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configured Safety Stock Rules</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {reorderingRules.length} rules
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Rule ID</th>
                    <th className="py-3 px-4">Product Name & SKU</th>
                    <th className="py-3 px-4">Warehouse Facility</th>
                    <th className="py-3 px-4 text-right">Min Threshold</th>
                    <th className="py-3 px-4 text-right">Max Capacity</th>
                    <th className="py-3 px-4 text-right">Order Batch (Qty)</th>
                    <th className="py-3 px-4 text-center">Auto-PO Trigger</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {reorderingRules.map((rule) => {
                    const linkedProduct = products.find((p) => p.id === rule.productId || p.sku === rule.sku);
                    const isBreached = linkedProduct && linkedProduct.stock <= rule.minStock;

                    return (
                      <tr key={rule.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {rule.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{rule.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{rule.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {rule.warehouseName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-bold ${isBreached ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                            {rule.minStock} {rule.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          {rule.maxStock} {rule.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                          +{rule.reorderQty} {rule.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {rule.autoPO ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ENABLED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              MANUAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {rule.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {linkedProduct && (
                            <button
                              onClick={() => handleAutoGeneratePO(linkedProduct)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-all"
                            >
                              Run PO
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Category</h3>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Electronics, Fasteners, Tools"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Code (3-4 Letters)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ELEC, HARD, PACK"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Theme Badge Color
                </label>
                <div className="flex gap-2">
                  {['blue', 'purple', 'emerald', 'amber', 'rose', 'cyan'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-full capitalize border-2 transition-all ${
                        newCatColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent opacity-70'
                      } ${
                        c === 'blue'
                          ? 'bg-blue-500'
                          : c === 'purple'
                          ? 'bg-purple-500'
                          : c === 'emerald'
                          ? 'bg-emerald-500'
                          : c === 'amber'
                          ? 'bg-amber-500'
                          : c === 'rose'
                          ? 'bg-rose-500'
                          : 'bg-cyan-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe classification purposes and inventory handling guidelines..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD REORDER RULE */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Safety Stock Rule</h3>
              </div>
              <button
                onClick={() => setIsAddRuleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRuleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Product *
                </label>
                <CustomSelect
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  options={products.map((p) => ({
                    value: p.id,
                    label: p.name,
                    subLabel: `SKU: ${p.sku} • Stock: ${p.stock} ${p.unit}`,
                    badge: `${p.stock} ${p.unit}`
                  }))}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Warehouse Facility *
                </label>
                <CustomSelect
                  value={ruleWarehouseId}
                  onChange={(val) => setRuleWarehouseId(val)}
                  options={warehouses.map((wh) => ({
                    value: wh.id,
                    label: wh.name,
                    subLabel: `${wh.city} • ${wh.code}`,
                    badge: wh.code
                  }))}
                  size="md"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxStock}
                    onChange={(e) => setMaxStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reorder Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reorderQty}
                    onChange={(e) => setReorderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Enable Automated PO Generation</div>
                  <div className="text-[11px] text-slate-400">Trigger procurement draft when stock dips below min</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoPO}
                  onChange={(e) => setAutoPO(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Save Reorder Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
