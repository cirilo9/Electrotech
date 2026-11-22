export type UserRole = 'Administrador' | 'Cliente';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  cliente_id?: number | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
}

export interface Category {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  total_productos?: number;
}

export interface Brand {
  id: number;
  nombre: string;
  pais_origen: string;
}

export interface Product {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  categoria_slug: string;
  marca_id: number;
  marca_nombre: string;
  nombre: string;
  modelo: string;
  descripcion: string;
  precio: number;
  precio_promocional: number | null;
  precio_efectivo: number;
  calificacion: number;
  imagen_url: string;
  especificaciones: Record<string, string>;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_almacen: string;
  activo: number;
}

export interface CatalogQuery {
  search?: string;
  categoria?: string;
  marca?: string;
  sort?: 'precio_asc' | 'precio_desc' | 'nombre_asc' | 'nombre_desc' | 'destacados';
  page?: number;
  limit?: number;
}

export interface CatalogResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItem {
  id: number;
  producto_id: number;
  nombre: string;
  modelo: string;
  marca_nombre: string;
  categoria_nombre: string;
  imagen_url: string;
  cantidad: number;
  precio_lista: number;
  precio_unitario: number;
  subtotal: number;
  descuento_unitario: number;
  stock_disponible: number;
}

export interface CartSummary {
  carrito_id: number;
  items: CartItem[];
  total_unidades: number;
  subtotal_lista: number;
  descuento_total: number;
  total_pagar: number;
}

export interface CheckoutPayload {
  direccion_envio: string;
  metodo_pago: 'Tarjeta de Crédito' | 'Transferencia Bancaria' | 'Yape / Plin' | 'Pago Contra Entrega';
  notas?: string;
}

export interface OrderConfirmation {
  pedido_id: number;
  codigo_pedido: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  metodo_pago: string;
  referencia_transaccion: string;
  direccion_envio: string;
  created_at: string;
  items: Array<{
    producto_id: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

export interface DashboardMetrics {
  kpis: {
    totalProductos: number;
    totalClientes: number;
    ventasRealizadas: number;
    ingresosTotales: number;
    productosDisponibles: number;
    productosStockBajo: number;
    pedidosRegistrados: number;
  };
  ventasMensuales: Array<{
    mes: string;
    ingresos: number;
    pedidos: number;
  }>;
  productosMasVendidos: Array<{
    producto_id: number;
    nombre: string;
    marca_nombre: string;
    unidades_vendidas: number;
    ingresos: number;
  }>;
  ultimosPedidos: Array<{
    id: number;
    codigo_pedido: string;
    cliente_nombre: string;
    cliente_email: string;
    total: number;
    estado: string;
    metodo_pago: string;
    created_at: string;
  }>;
  stockBajoLista: Array<{
    id: number;
    nombre: string;
    modelo: string;
    marca_nombre: string;
    stock_actual: number;
    stock_minimo: number;
    ubicacion_almacen: string;
  }>;
  notificaciones: Array<{
    id: string;
    tipo: 'stock_bajo' | 'nuevo_pedido';
    titulo: string;
    detalle: string;
    fecha: string;
  }>;
}
