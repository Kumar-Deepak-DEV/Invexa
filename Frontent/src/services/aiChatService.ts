import { Product, Warehouse, StorageLocation, Receipt, DeliveryOrder, InternalTransfer, ReorderRule, DashboardKPIs } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actionButtons?: {
    label: string;
    view: string;
    icon?: string;
    productId?: string;
  }[];
  dataCard?: {
    type: 'products' | 'receipts' | 'deliveries' | 'warehouses' | 'kpi' | 'help';
    title: string;
    items?: Array<{
      title: string;
      subtitle?: string;
      badge?: string;
      badgeColor?: string;
      value?: string;
    }>;
  };
}

export interface InventoryContextPayload {
  products: Product[];
  warehouses: Warehouse[];
  locations: StorageLocation[];
  receipts: Receipt[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  reorderingRules: ReorderRule[];
  kpis: DashboardKPIs;
  activeWarehouseId?: string;
}

/**
 * Pluggable AI query function.
 * Attempts to call real backend /api/ai/chat if configured,
 * otherwise falls back seamlessly to the Invexa High-Precision Context Engine.
 */
export async function queryInvexaAI(
  userQuery: string,
  history: ChatMessage[],
  context: InventoryContextPayload,
  backendApiUrl?: string
): Promise<ChatMessage> {
  const queryTrimmed = userQuery.trim();
  const q = queryTrimmed.toLowerCase();
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Check if an external backend AI/Database API endpoint is configured and reachable
  if (backendApiUrl) {
    try {
      const response = await fetch(backendApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryTrimmed,
          history,
          context: {
            productCount: context.products.length,
            warehouseCount: context.warehouses.length,
            pendingReceipts: context.receipts.filter(r => r.status !== 'Done').length,
            pendingDeliveries: context.deliveries.filter(d => d.status !== 'Done').length,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || data.text || 'Database query returned successfully.',
          timestamp: now,
          actionButtons: data.actionButtons,
          dataCard: data.dataCard
        };
      }
    } catch (err) {
      console.warn('Backend AI endpoint unreachable, switching to Invexa Context Engine:', err);
    }
  }

  // 2. High-Precision Client Context Knowledge Engine
  return generateContextualResponse(q, queryTrimmed, context, now);
}

function generateContextualResponse(
  q: string,
  rawQuery: string,
  ctx: {
    products: Product[];
    warehouses: Warehouse[];
    locations: StorageLocation[];
    receipts: Receipt[];
    deliveries: DeliveryOrder[];
    transfers: InternalTransfer[];
    reorderingRules: ReorderRule[];
    kpis: DashboardKPIs;
  },
  now: string
): ChatMessage {
  const { products, warehouses, receipts, deliveries, transfers, reorderingRules, kpis } = ctx;

  // --- A. Low Stock & Out of Stock Queries ---
  if (
    q.includes('low stock') ||
    q.includes('shortage') ||
    q.includes('out of stock') ||
    q.includes('reorder') ||
    q.includes('critical stock') ||
    q.includes('low on stock') ||
    q.includes('what is low')
  ) {
    const lowStockItems = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock' || p.available <= p.reorderLevel);

    if (lowStockItems.length === 0) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `**Stock Levels Normal:** All **${products.length} inventory items** are currently operating above their configured minimum reorder thresholds across all facilities.`,
        timestamp: now,
        actionButtons: [
          { label: 'View All Products', view: 'products' },
          { label: 'Check Reorder Rules', view: 'rules' }
        ]
      };
    }

    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `Found **${lowStockItems.length} items** requiring replenishment attention based on current reorder levels and active reservation allocations:`,
      timestamp: now,
      dataCard: {
        type: 'products',
        title: `Low Stock & Shortage Alerts (${lowStockItems.length})`,
        items: lowStockItems.map(p => ({
          title: p.name,
          subtitle: `SKU: ${p.sku} • Location: ${p.locationName} (${p.warehouseName})`,
          badge: `${p.available} ${p.unit} Available`,
          badgeColor: p.available === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
          value: `Min: ${p.reorderLevel}`
        }))
      },
      actionButtons: [
        { label: 'Open Stock Matrix', view: 'stock' },
        { label: 'Create Inbound PO Receipt', view: 'receipts' },
        { label: 'Configure Automated Rules', view: 'rules' }
      ]
    };
  }

  // --- B. Specific Product Query by Name or SKU ---
  const matchingProduct = products.find(
    p =>
      q.includes(p.name.toLowerCase()) ||
      q.includes(p.sku.toLowerCase()) ||
      p.name.toLowerCase().split(' ').some(word => word.length > 3 && q.includes(word))
  );

  if (matchingProduct && (q.includes('stock') || q.includes('how many') || q.includes('where is') || q.includes('details') || q.includes('count') || q.includes('price') || q.includes('sku') || q.includes('product'))) {
    const isLow = matchingProduct.available <= matchingProduct.reorderLevel;
    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `**${matchingProduct.name}** (\`${matchingProduct.sku}\`):\n\n` +
        `• **On-Hand Total:** ${matchingProduct.stock} ${matchingProduct.unit}\n` +
        `• **Reserved for Orders:** ${matchingProduct.reserved || 0} ${matchingProduct.unit}\n` +
        `• **Free to Use (Available):** **${matchingProduct.available} ${matchingProduct.unit}**\n` +
        `• **Assigned Facility:** ${matchingProduct.warehouseName} → \`${matchingProduct.locationName}\`\n` +
        `• **Category:** ${matchingProduct.category}\n` +
        `• **Stock Status:** ${matchingProduct.status} ${isLow ? '(Under Reorder Threshold)' : '(Healthy)'}\n` +
        `• **Unit Price:** $${matchingProduct.unitPrice.toFixed(2)} | **Total Valuation:** $${(matchingProduct.stock * matchingProduct.unitPrice).toLocaleString()}`,
      timestamp: now,
      actionButtons: [
        { label: 'View in Products', view: 'products', productId: matchingProduct.id },
        { label: 'Transfer This Item', view: 'transfers', productId: matchingProduct.id },
        { label: 'View Stock Matrix', view: 'stock' }
      ]
    };
  }

  // --- C. Deliveries & Outbound Shipments ---
  if (
    q.includes('delivery') ||
    q.includes('deliveries') ||
    q.includes('dispatch') ||
    q.includes('shipping') ||
    q.includes('shipment') ||
    q.includes('outbound') ||
    q.includes('customer order')
  ) {
    const pendingDeliveries = deliveries.filter(d => d.status !== 'Done');
    const waitingDeliveries = deliveries.filter(d => d.status === 'Waiting');
    const readyDeliveries = deliveries.filter(d => d.status === 'Ready');

    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `**Outbound Deliveries Status:**\n\n` +
        `• **Total Orders:** ${deliveries.length}\n` +
        `• **Ready for Dispatch:** **${readyDeliveries.length}** order(s)\n` +
        `• **Waiting (Stock Shortage):** **${waitingDeliveries.length}** order(s)\n` +
        `• **Completed & Dispatched:** ${deliveries.filter(d => d.status === 'Done').length} order(s)`,
      timestamp: now,
      dataCard: {
        type: 'deliveries',
        title: `Active Delivery Orders (${pendingDeliveries.length} Pending)`,
        items: pendingDeliveries.slice(0, 5).map(d => ({
          title: `${d.reference} - ${d.customer}`,
          subtitle: `Facility: ${d.warehouseName} • Scheduled: ${d.scheduledDate}`,
          badge: d.status,
          badgeColor: d.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : (d.status === 'Waiting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'),
          value: `${(d.items || []).length} items`
        }))
      },
      actionButtons: [
        { label: 'Open Deliveries View', view: 'deliveries' },
        { label: 'Create New Delivery', view: 'deliveries' }
      ]
    };
  }

  // --- D. Receipts & Inbound Purchase Orders ---
  if (
    q.includes('receipt') ||
    q.includes('receipts') ||
    q.includes('inbound') ||
    q.includes('incoming') ||
    q.includes('supplier') ||
    q.includes('purchase order') ||
    q.includes('dock') ||
    q.includes('po')
  ) {
    const pendingReceipts = receipts.filter(r => r.status !== 'Done');
    const readyDock = receipts.filter(r => r.status === 'Ready');

    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `**Inbound Receipts Overview:**\n\n` +
        `• **Total Receipts:** ${receipts.length}\n` +
        `• **Awaiting Inspection at Dock:** **${readyDock.length}** receipt(s)\n` +
        `• **Draft / In-Transit:** ${receipts.filter(r => r.status === 'Draft' || r.status === 'Waiting').length} receipt(s)\n` +
        `• **Validated & Stocked:** ${receipts.filter(r => r.status === 'Done').length} receipt(s)`,
      timestamp: now,
      dataCard: {
        type: 'receipts',
        title: `Active Inbound Shipments (${pendingReceipts.length})`,
        items: pendingReceipts.slice(0, 5).map(r => ({
          title: `${r.reference} - ${r.supplier}`,
          subtitle: `Destination: ${r.warehouseName} • Date: ${r.scheduledDate}`,
          badge: r.status,
          badgeColor: r.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700',
          value: `${(r.items || []).length} line items`
        }))
      },
      actionButtons: [
        { label: 'Open Receipts Dashboard', view: 'receipts' },
        { label: 'Create Inbound Receipt', view: 'receipts' }
      ]
    };
  }

  // --- E. Warehouse Facilities & Capacity ---
  if (
    q.includes('warehouse') ||
    q.includes('warehouses') ||
    q.includes('facility') ||
    q.includes('facilities') ||
    q.includes('capacity') ||
    q.includes('location') ||
    q.includes('rack')
  ) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `**INVEXA Warehouse Infrastructure:**\n\n` +
        `You currently manage **${warehouses.length} active facilities** with **${ctx.locations.length} designated storage racks & bins**:`,
      timestamp: now,
      dataCard: {
        type: 'warehouses',
        title: `Operational Facilities Matrix (${warehouses.length})`,
        items: warehouses.map(w => {
          const locCount = ctx.locations.filter(l => l.warehouseId === w.id).length;
          const whProducts = products.filter(p => p.warehouseId === w.id);
          const totalStock = whProducts.reduce((sum, p) => sum + p.stock, 0);
          return {
            title: `${w.name} (${w.code})`,
            subtitle: `${w.city} • ${w.type} • ${locCount} Bins`,
            badge: `${totalStock.toLocaleString()} / ${w.capacity.toLocaleString()} Units`,
            badgeColor: 'bg-blue-50 text-blue-700'
          };
        })
      },
      actionButtons: [
        { label: 'Explore Warehouses & Racks', view: 'warehouses' },
        { label: 'Internal Stock Transfer', view: 'transfers' }
      ]
    };
  }

  // --- F. Valuation & KPIs Analytics ---
  if (
    q.includes('valuation') ||
    q.includes('value') ||
    q.includes('kpi') ||
    q.includes('analytics') ||
    q.includes('total stock') ||
    q.includes('summary') ||
    q.includes('revenue') ||
    q.includes('worth')
  ) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `**Live Inventory Executive Summary:**\n\n` +
        `• **Total Portfolio Valuation:** **$${kpis.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n` +
        `• **Total Products Registered:** **${kpis.totalProducts} unique SKUs**\n` +
        `• **On-Hand Stock Volume:** **${kpis.totalStock.toLocaleString()} units**\n` +
        `• **Low Stock / Shortage Alerts:** **${kpis.lowStockCount} items**\n` +
        `• **Out of Stock Items:** **${kpis.outOfStockCount} items**\n` +
        `• **Pending Dock Operations:** **${kpis.pendingReceipts} receipts** & **${kpis.pendingDeliveries} deliveries**`,
      timestamp: now,
      actionButtons: [
        { label: 'View Live Dashboard', view: 'dashboard' },
        { label: 'Check Move Ledger', view: 'ledger' }
      ]
    };
  }

  // --- G. Transfers & Adjustments ---
  if (
    q.includes('transfer') ||
    q.includes('adjust') ||
    q.includes('audit') ||
    q.includes('move') ||
    q.includes('internal move') ||
    q.includes('cycle count')
  ) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `**Internal Stock Transfers & Cycle Audits:**\n\n` +
        `• **Recorded Transfers:** ${transfers.length} completed moves\n` +
        `• **How to Transfer:** Use the Transfers module to move inventory between facilities or storage racks with automatic real-time ledger updates.\n` +
        `• **Stock Adjustments:** Perform physical inventory audits to reconcile discrepancy variances.`,
      timestamp: now,
      actionButtons: [
        { label: 'Open Transfers & Audits', view: 'transfers' },
        { label: 'Audit Move Ledger', view: 'ledger' }
      ]
    };
  }

  // --- H. Help & Navigation Guidance ---
  if (
    q.includes('help') ||
    q.includes('how to') ||
    q.includes('what can you do') ||
    q.includes('guide') ||
    q.includes('commands') ||
    q.includes('hi') ||
    q.includes('hello')
  ) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `**Hello! I am your INVEXA Inventory Copilot.**\n\n` +
        `I am connected directly to your active ERP database. You can ask me questions about your inventory:\n\n` +
        `• "Which products are low on stock?"\n` +
        `• "What is the stock of Industrial Fasteners or Steel Plates?"\n` +
        `• "Show pending deliveries and outbound shipments"\n` +
        `• "Give me a warehouse capacity overview"\n` +
        `• "What is the total inventory valuation?"\n` +
        `• "How do I transfer stock between racks?"`,
      timestamp: now,
      actionButtons: [
        { label: 'Low Stock Alerts', view: 'stock' },
        { label: 'Pending Deliveries', view: 'deliveries' },
        { label: 'Inbound Receipts', view: 'receipts' },
        { label: 'Warehouse Status', view: 'warehouses' }
      ]
    };
  }

  // --- I. Default Intelligent Fallback ---
  return {
    id: `ai-${Date.now()}`,
    sender: 'assistant',
    text: `Searched active inventory database for **"${rawQuery}"**.\n\n` +
      `Here is a summary of current operations:\n` +
      `• **Total Products:** ${products.length} SKUs across ${warehouses.length} facilities\n` +
      `• **Total Stock On-Hand:** ${kpis.totalStock.toLocaleString()} units ($${kpis.totalValuation.toLocaleString()})\n` +
      `• **Active Alerts:** ${kpis.lowStockCount} items low, ${deliveries.filter(d => d.status === 'Waiting').length} orders awaiting stock.\n\n` +
      `You can ask for a specific SKU, product name, warehouse status, or click a quick link below:`,
    timestamp: now,
    actionButtons: [
      { label: 'Check Stock Levels', view: 'stock' },
      { label: 'View Deliveries', view: 'deliveries' },
      { label: 'View Receipts', view: 'receipts' },
      { label: 'Open Dashboard', view: 'dashboard' }
    ]
  };
}
