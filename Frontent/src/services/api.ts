const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('stocksense_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('stocksense_auth_token');
    }
    const errorObj = data && typeof data === 'object' && 'error' in data ? (data as { error: { code: string; message: string; details?: Record<string, unknown> } }).error : null;
    const code = errorObj?.code || (response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : 'SERVER_ERROR');
    const message = errorObj?.message || (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    throw new ApiError(response.status, code, message, errorObj?.details);
  }

  return data as T;
}

export const api = {
  // Auth
  signup: (body: Record<string, unknown>) =>
    request<{ token: string; user: any; message: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email?: string; loginId?: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),
  updateProfile: (body: Record<string, unknown>) =>
    request<{ message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string; user: any }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<any[]>(`/products${qs}`);
  },
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (body: Record<string, unknown>) =>
    request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteProduct: (id: string) =>
    request<{ message: string; id: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Warehouses
  getWarehouses: () => request<any[]>('/warehouses'),
  getWarehouse: (id: string) => request<any>(`/warehouses/${id}`),
  createWarehouse: (body: Record<string, unknown>) =>
    request<any>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateWarehouse: (id: string, body: Record<string, unknown>) =>
    request<any>(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteWarehouse: (id: string) =>
    request<{ message: string; id: string }>(`/warehouses/${id}`, {
      method: 'DELETE',
    }),

  // Locations
  getLocations: (warehouseId?: string) => {
    const qs = warehouseId ? `?warehouseId=${warehouseId}` : '';
    return request<any[]>(`/locations${qs}`);
  },
  createLocation: (body: Record<string, unknown>) =>
    request<any>('/locations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateLocation: (id: string, body: Record<string, unknown>) =>
    request<any>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteLocation: (id: string) =>
    request<{ message: string; id: string }>(`/locations/${id}`, {
      method: 'DELETE',
    }),

  // Categories
  getCategories: () => request<any[]>('/categories'),
  createCategory: (body: Record<string, unknown>) =>
    request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateCategory: (id: string, body: Record<string, unknown>) =>
    request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: string) =>
    request<{ message: string; id: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),

  // Receipts
  getReceipts: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{ data: any[]; nextCursor: string | null; hasMore: boolean }>(`/receipts${qs}`);
  },
  createReceipt: (body: Record<string, unknown>) =>
    request<any>('/receipts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getReceipt: (id: string) => request<any>(`/receipts/${id}`),
  updateReceipt: (id: string, body: Record<string, unknown>) =>
    request<any>(`/receipts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  validateReceipt: (id: string) =>
    request<any>(`/receipts/${id}/validate`, {
      method: 'POST',
    }),
  cancelReceipt: (id: string) =>
    request<any>(`/receipts/${id}/cancel`, {
      method: 'POST',
    }),
  reverseReceipt: (id: string) =>
    request<any>(`/receipts/${id}/reverse`, {
      method: 'POST',
    }),

  // Deliveries
  getDeliveries: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{ data: any[]; nextCursor: string | null; hasMore: boolean }>(`/deliveries${qs}`);
  },
  createDelivery: (body: Record<string, unknown>) =>
    request<any>('/deliveries', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getDelivery: (id: string) => request<any>(`/deliveries/${id}`),
  updateDelivery: (id: string, body: Record<string, unknown>) =>
    request<any>(`/deliveries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  validateDelivery: (id: string) =>
    request<any>(`/deliveries/${id}/validate`, {
      method: 'POST',
    }),
  cancelDelivery: (id: string) =>
    request<any>(`/deliveries/${id}/cancel`, {
      method: 'POST',
    }),
  reverseDelivery: (id: string) =>
    request<any>(`/deliveries/${id}/reverse`, {
      method: 'POST',
    }),

  // Transfers
  getTransfers: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{ data: any[]; nextCursor: string | null; hasMore: boolean }>(`/transfers${qs}`);
  },
  createTransfer: (body: Record<string, unknown>) =>
    request<any>('/transfers', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getTransfer: (id: string) => request<any>(`/transfers/${id}`),
  updateTransfer: (id: string, body: Record<string, unknown>) =>
    request<any>(`/transfers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  validateTransfer: (id: string) =>
    request<any>(`/transfers/${id}/validate`, {
      method: 'POST',
    }),
  cancelTransfer: (id: string) =>
    request<any>(`/transfers/${id}/cancel`, {
      method: 'POST',
    }),
  reverseTransfer: (id: string) =>
    request<any>(`/transfers/${id}/reverse`, {
      method: 'POST',
    }),

  // Adjustments
  getAdjustments: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{ data: any[]; nextCursor: string | null; hasMore: boolean }>(`/adjustments${qs}`);
  },
  createAdjustment: (body: Record<string, unknown>) =>
    request<any>('/adjustments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  validateAdjustment: (id: string) =>
    request<any>(`/adjustments/${id}/validate`, {
      method: 'POST',
    }),
  cancelAdjustment: (id: string) =>
    request<any>(`/adjustments/${id}/cancel`, {
      method: 'POST',
    }),
  reverseAdjustment: (id: string) =>
    request<any>(`/adjustments/${id}/reverse`, {
      method: 'POST',
    }),

  // Ledger & Dashboard
  getLedger: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{ data: any[]; nextCursor: string | null; hasMore: boolean }>(`/ledger${qs}`);
  },
  getDashboardKPIs: () => request<any>('/dashboard/kpis'),
  getMoveHistory: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{ data: any[]; nextCursor: string | null; hasMore: boolean }>(`/move-history${qs}`);
  },
};
