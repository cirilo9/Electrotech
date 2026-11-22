import type {
  AuthUser,
  Brand,
  CartSummary,
  CatalogQuery,
  CatalogResponse,
  Category,
  CheckoutPayload,
  DashboardMetrics,
  OrderConfirmation,
  Product,
} from '../../shared/types.ts';

const TOKEN_KEY = 'electrotech_jwt_token';
const SESSION_KEY = 'electrotech_cart_session';

export function getCartSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `et-sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null, remember: boolean): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (!token) return;
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-cart-session': getCartSessionId(),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status} al comunicarse con el servidor.`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string, remember: boolean) =>
    request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    }),

  register: (payload: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  }) =>
    request<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  recoverPassword: (email: string, newPassword?: string) =>
    request<{ message: string }>('/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),

  logout: () =>
    request<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<{ user: AuthUser }>('/auth/me'),

  // Catalog
  getCategories: () => request<{ items: Category[] }>('/catalog/categories'),
  getBrands: () => request<{ items: Brand[] }>('/catalog/brands'),
  getProducts: (query: CatalogQuery = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.categoria && query.categoria !== 'todas') params.set('categoria', query.categoria);
    if (query.marca && query.marca !== 'todas') params.set('marca', query.marca);
    if (query.sort) params.set('sort', query.sort);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return request<CatalogResponse>(`/catalog/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id: number) => request<{ item: Product }>(`/catalog/products/${id}`),

  // Cart & Orders
  getCart: () => request<CartSummary>('/cart'),
  addToCart: (productoId: number, cantidad = 1) =>
    request<CartSummary>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ producto_id: productoId, cantidad }),
    }),
  updateCartQuantity: (productoId: number, cantidad: number) =>
    request<CartSummary>(`/cart/items/${productoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ cantidad }),
    }),
  removeFromCart: (productoId: number) =>
    request<CartSummary>(`/cart/items/${productoId}`, {
      method: 'DELETE',
    }),
  checkout: (payload: CheckoutPayload) =>
    request<{ order: OrderConfirmation }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyOrders: () =>
    request<{
      items: Array<{
        id: number;
        codigo_pedido: string;
        subtotal: number;
        descuento: number;
        total: number;
        estado: string;
        direccion_envio: string;
        created_at: string;
        metodo_pago: string;
        referencia_transaccion: string;
      }>;
    }>('/orders/my'),

  // Admin Dashboard
  getDashboardMetrics: () => request<DashboardMetrics>('/admin/dashboard'),
  updateStock: (productoId: number, stockActual: number) =>
    request<{ item: Product }>(`/admin/inventory/${productoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_actual: stockActual }),
    }),
  createProduct: (payload: {
    categoria_id: number;
    marca_id: number;
    nombre: string;
    modelo: string;
    descripcion: string;
    precio: number;
    precio_promocional?: number | null;
    stock_actual: number;
    stock_minimo?: number;
  }) =>
    request<{ item: Product }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateOrderStatus: (orderId: number, estado: string) =>
    request<{ ok: boolean }>(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
};
