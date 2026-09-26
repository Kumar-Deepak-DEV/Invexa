// StockSense TypeScript Domain Types
// "Smart Inventory. Simple Control."

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type OperationStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';
export type MoveDirection = 'IN' | 'OUT' | 'TRANSFER';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reserved: number;
  available: number;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  reorderLevel: number;
  maxStock: number;
  reorderQty: number;
  description: string;
  status: StockStatus;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  shortName: string;
  city: string;
  address: string;
  type: string;
  capacity: number;
  manager: string;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export interface StorageLocation {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouseName: string;
  type: 'Storage' | 'Production' | 'Receiving Dock' | 'Dispatch Dock' | 'Secure Cage' | 'Cross-Dock';
  capacity: number;
  occupied: number;
  aisle: string;
  shelf: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  icon: string;
  productCount: number;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  unit: string;
  location: string;
  unitCost: number;
  totalCost?: number;
}

export interface Receipt {
  id: string;
  reference: string;
  supplier: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  scheduledDate: string;
  responsible: string;
  status: OperationStatus;
  notes: string;
  items: ReceiptItem[];
  createdAt: string;
  validatedAt: string | null;
  isLate?: boolean;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  sku: string;
  requestedQty: number;
  deliveredQty: number;
  unit: string;
  location: string;
  availableStock: number;
}

export interface DeliveryOrder {
  id: string;
  reference: string;
  customer: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  scheduledDate: string;
  responsible: string;
  status: OperationStatus;
  notes: string;
  carrier: string;
  items: DeliveryItem[];
  createdAt: string;
  validatedAt: string | null;
  isLate?: boolean;
}

export interface InternalTransfer {
  id: string;
  reference: string;
  productId: string;
  productName: string;
  sku: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  fromLocationId: string;
  fromLocationName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  toLocationId: string;
  toLocationName: string;
  quantity: number;
  unit: string;
  reason: string;
  responsible: string;
  status: 'Done' | 'Draft' | 'Canceled';
  date: string;
  createdAt: string;
}

export interface InventoryAdjustment {
  id: string;
  reference: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  systemQuantity: number;
  physicalCount: number;
  difference: number;
  unit: string;
  reason: string;
  responsible: string;
  status: 'Applied' | 'Pending';
  date: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  reference: string;
  productId: string;
  productName: string;
  operation: string;
  changeType: MoveDirection;
  qtyChange: number;
  unit: string;
  prevStock: number;
  newStock: number;
  warehouse: string;
  location: string;
  user: string;
}

export interface MoveHistoryEntry {
  id: string;
  date: string;
  reference: string;
  type: string;
  product: string;
  from: string;
  to: string;
  quantity: string;
  direction: MoveDirection;
  user: string;
  status: string;
}

export interface ReorderRule {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  minStock: number;
  maxStock: number;
  reorderQty: number;
  warehouseId: string;
  warehouseName: string;
  unit: string;
  status: string;
  autoPO: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  icon: string;
  time: string;
  read: boolean;
  link: string;
  saved?: boolean;
  category?: string;
  date?: string;
}

export interface UserProfile {
  id: string;
  loginId: string;
  fullName: string;
  email: string;
  role: string;
  warehouse: string;
  phone: string;
  avatar: string;
  department: string;
  joinedDate: string;
}

export interface DashboardKPIs {
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  internalTransfers: number;
  warehouses: number;
}
