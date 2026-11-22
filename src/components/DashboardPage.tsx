import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Box,
  CheckCircle2,
  ClipboardList,
  Database,
  DollarSign,
  LayoutDashboard,
  Lock,
  Package,
  PlusCircle,
  ShoppingCart,
  Users,
} from 'lucide-react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Swal from 'sweetalert2';
import { api } from '../services/api.ts';
import type { AuthUser, Brand, Category, DashboardMetrics, Product } from '../../shared/types.ts';
import type { AppView } from './Navbar.tsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardPageProps {
  user: AuthUser | null;
  categories: Category[];
  brands: Brand[];
  onNavigate: (view: AppView) => void;
  onCatalogMutated: () => void;
}

type DashTab = 'resumen' | 'pedidos' | 'inventario' | 'arquitectura';

export function DashboardPage({ user, categories, brands, onNavigate, onCatalogMutated }: DashboardPageProps) {
  const [tab, setTab] = useState<DashTab>('resumen');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nuevo producto form state
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCatId, setNewCatId] = useState<number>(categories[0]?.id || 1);
  const [newBrandId, setNewBrandId] = useState<number>(brands[0]?.id || 1);
  const [newPrice, setNewPrice] = useState('');
  const [newPromo, setNewPromo] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newDesc, setNewDesc] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, prodRes] = await Promise.all([
        api.getDashboardMetrics(),
        api.getProducts({ limit: 50 }),
      ]);
      setMetrics(dashRes);
      setProducts(prodRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas administrativas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol === 'Administrador') {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (categories.length > 0 && !newCatId) setNewCatId(categories[0].id);
    if (brands.length > 0 && !newBrandId) setNewBrandId(brands[0].id);
  }, [categories, brands, newCatId, newBrandId]);

  // Protección de ruta privada por rol
  if (!user || user.rol !== 'Administrador') {
    return (
      <section className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="glass-surface-elevated rounded-2xl p-8">
          <Lock className="mx-auto h-10 w-10 text-[#00E5FF]" />
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Acceso Restringido</h1>
          <p className="mt-2 text-sm text-slate-300">
            El Panel Administrativo de ELECTROTECH requiere una sesión autenticada con rol{' '}
            <strong className="text-white">Administrador</strong>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 cursor-pointer"
            >
              Iniciar sesión como Administrador
            </button>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              Ir al catálogo
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleOrderStatus = async (orderId: number, estado: string) => {
    try {
      await api.updateOrderStatus(orderId, estado);
      await loadDashboardData();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al actualizar pedido',
        text: err instanceof Error ? err.message : 'Intenta nuevamente.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  const handleRestock = async (productId: number, newQty: number) => {
    try {
      await api.updateStock(productId, newQty);
      await loadDashboardData();
      onCatalogMutated();
      await Swal.fire({
        icon: 'success',
        title: 'Inventario actualizado',
        text: `Stock actualizado a ${newQty} unidades.`,
        timer: 1400,
        showConfirmButton: false,
        background: '#0F172A',
        color: '#F8FAFC',
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de inventario',
        text: err instanceof Error ? err.message : 'No se pudo actualizar el stock.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        categoria_id: Number(newCatId),
        marca_id: Number(newBrandId),
        nombre: newName,
        modelo: newModel,
        descripcion: newDesc || 'Artefacto electrónico certificado ELECTROTECH.',
        precio: Number(newPrice),
        precio_promocional: newPromo ? Number(newPromo) : null,
        stock_actual: Number(newStock),
      });
      setNewName('');
      setNewModel('');
      setNewPrice('');
      setNewPromo('');
      setNewStock('10');
      setNewDesc('');
      await loadDashboardData();
      onCatalogMutated();
      await Swal.fire({
        icon: 'success',
        title: 'Producto registrado',
        text: 'El artefacto ha sido publicado en el catálogo e inventario.',
        timer: 1600,
        showConfirmButton: false,
        background: '#0F172A',
        color: '#F8FAFC',
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Validación',
        text: err instanceof Error ? err.message : 'Verifica los datos ingresados.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  const lineChartData = {
    labels: metrics?.ventasMensuales.map((m) => m.mes) || [],
    datasets: [
      {
        label: 'Ingresos Mensuales (USD)',
        data: metrics?.ventasMensuales.map((m) => m.ingresos) || [],
        borderColor: '#00E5FF',
        backgroundColor: 'rgba(0, 229, 255, 0.14)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#00E5FF',
        pointRadius: 4,
      },
    ],
  };

  const barChartData = {
    labels: metrics?.productosMasVendidos.map((p) => p.nombre.slice(0, 20)) || [],
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: metrics?.productosMasVendidos.map((p) => p.unidades_vendidas) || [],
        backgroundColor: ['#2563EB', '#00E5FF', '#8B5CF6', '#3B82F6', '#06B6D4', '#6366F1'],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#CBD5E1', font: { family: 'Plus Jakarta Sans', size: 12 } },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94A3B8', font: { size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
      },
      y: {
        ticks: { color: '#94A3B8', font: { size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
      },
    },
  };

  const sidebarItems: Array<{ id: DashTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard },
    { id: 'pedidos', label: 'Pedidos e Ingresos', icon: ClipboardList },
    { id: 'inventario', label: 'Inventario y Catálogo', icon: Package },
    { id: 'arquitectura', label: 'Base de Datos y QA', icon: Database },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      {/* Menú lateral dinámico */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="rounded-2xl border border-slate-800 bg-[#0E1425] p-4">
          <div className="border-b border-slate-800 pb-4">
            <p className="text-xs font-medium text-[#00E5FF]">Panel Administrativo</p>
            <p className="mt-1 truncate font-display text-sm font-semibold text-white">{user.nombre}</p>
          </div>
          <nav className="mt-4 space-y-1.5" aria-label="Menú del Dashboard">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Área principal */}
      <main className="min-w-0 flex-1 space-y-8">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs text-slate-400">ELECTROTECH / Administración / {sidebarItems.find((i) => i.id === tab)?.label}</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              {sidebarItems.find((i) => i.id === tab)?.label}
            </h1>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="self-start rounded-lg border border-slate-700 bg-[#0F1629] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#00E5FF]/50 hover:text-white cursor-pointer"
          >
            Actualizar métricas
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>
        )}

        {loading || !metrics ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-[#111829]" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'resumen' && (
              <>
                {/* 7 Indicadores Estadísticos Reales con Acentos Cromáticos */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-xs font-medium">Total de productos</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/15 text-[#00E5FF]">
                        <Box className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-bold text-white tabular-nums">
                      {metrics.kpis.totalProductos}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-xs font-medium">Total de clientes</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#60A5FA]">
                        <Users className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-bold text-[#60A5FA] tabular-nums">
                      {metrics.kpis.totalClientes}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-xs font-medium">Ventas realizadas</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/20 text-[#A78BFA]">
                        <ShoppingCart className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-bold text-[#A78BFA] tabular-nums">
                      {metrics.kpis.ventasRealizadas}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-xs font-medium">Ingresos totales</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <DollarSign className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-bold text-[#00E5FF] tabular-nums">
                      ${metrics.kpis.ingresosTotales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-xs font-medium">Productos disponibles</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                      {metrics.kpis.productosDisponibles}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-xs font-medium">Productos con stock bajo</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-bold text-amber-400 tabular-nums">
                      {metrics.kpis.productosStockBajo}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-5 sm:col-span-2">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-xs font-medium">Pedidos registrados totales</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-[#00E5FF]">
                        <BarChart3 className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-bold text-white tabular-nums">
                      {metrics.kpis.pedidosRegistrados}
                    </p>
                  </div>
                </div>

                {/* Gráficos Interactivos Chart.js */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="card-surface rounded-2xl p-6">
                    <h2 className="font-display text-base font-semibold text-white">Ventas Mensuales</h2>
                    <p className="mt-1 text-xs text-slate-300">Evolución de ingresos registrados en SQLite.</p>
                    <div className="mt-5 h-64">
                      <Line data={lineChartData} options={chartOptions} />
                    </div>
                  </div>

                  <div className="card-surface rounded-2xl p-6">
                    <h2 className="font-display text-base font-semibold text-white">Productos Más Vendidos</h2>
                    <p className="mt-1 text-xs text-slate-300">Ranking por unidades confirmadas en pedidos.</p>
                    <div className="mt-5 h-64">
                      <Bar data={barChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Notificaciones y Actividad Reciente */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                  <div className="rounded-2xl border border-slate-800 bg-[#111829] p-6 xl:col-span-5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#00E5FF]" />
                      <h2 className="font-display text-base font-semibold text-white">
                        Notificaciones y Actividad Reciente
                      </h2>
                    </div>
                    <ul className="mt-4 divide-y divide-slate-800/80 text-sm">
                      {metrics.notificaciones.map((n) => (
                        <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                          <p className="font-medium text-white">
                            <span
                              className={`mr-2 text-xs font-semibold ${
                                n.tipo === 'stock_bajo' ? 'text-amber-400' : 'text-[#00E5FF]'
                              }`}
                            >
                              [{n.tipo === 'stock_bajo' ? 'ALERTA' : 'PEDIDO'}]
                            </span>
                            {n.titulo}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{n.detalle}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#111829] p-6 xl:col-span-7">
                    <h2 className="font-display text-base font-semibold text-white">Últimos Pedidos</h2>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-800 text-slate-400">
                          <tr>
                            <th className="py-2.5 pr-3 font-medium">Código</th>
                            <th className="py-2.5 pr-3 font-medium">Cliente</th>
                            <th className="py-2.5 pr-3 font-medium">Estado</th>
                            <th className="py-2.5 text-right font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {metrics.ultimosPedidos.slice(0, 6).map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-800/30">
                              <td className="py-2.5 pr-3 font-mono font-semibold text-[#00E5FF]">
                                {ord.codigo_pedido}
                              </td>
                              <td className="py-2.5 pr-3 text-slate-200">{ord.cliente_nombre}</td>
                              <td className="py-2.5 pr-3 text-slate-300">{ord.estado}</td>
                              <td className="py-2.5 text-right font-mono font-semibold text-white tabular-nums">
                                ${Number(ord.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'pedidos' && (
              <div className="rounded-2xl border border-slate-800 bg-[#111829] p-6">
                <h2 className="font-display text-lg font-semibold text-white">Gestión de Pedidos Registrados</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Actualiza el estado operativo de cada orden en la base de datos.
                </p>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-800 text-xs text-slate-400">
                      <tr>
                        <th className="py-3 pr-4 font-medium">Código</th>
                        <th className="py-3 pr-4 font-medium">Cliente</th>
                        <th className="py-3 pr-4 font-medium">Pago</th>
                        <th className="py-3 pr-4 font-medium">Fecha</th>
                        <th className="py-3 pr-4 font-medium">Estado</th>
                        <th className="py-3 text-right font-medium">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {metrics.ultimosPedidos.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/30">
                          <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#00E5FF]">
                            {ord.codigo_pedido}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-white">{ord.cliente_nombre}</p>
                            <p className="text-xs text-slate-400">{ord.cliente_email}</p>
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-300">{ord.metodo_pago}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-slate-400 tabular-nums">
                            {ord.created_at.slice(0, 10)}
                          </td>
                          <td className="py-3 pr-4">
                            <select
                              value={ord.estado}
                              onChange={(e) => handleOrderStatus(ord.id, e.target.value)}
                              aria-label={`Estado de ${ord.codigo_pedido}`}
                              className="rounded-lg border border-slate-700 bg-[#0B1120] px-2.5 py-1.5 text-xs text-white focus:border-[#00E5FF] focus:outline-none"
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="Confirmado">Confirmado</option>
                              <option value="En preparación">En preparación</option>
                              <option value="Enviado">Enviado</option>
                              <option value="Entregado">Entregado</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-white tabular-nums">
                            ${Number(ord.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'inventario' && (
              <div className="space-y-8">
                {/* Alertas de stock bajo */}
                <div className="rounded-2xl border border-slate-800 bg-[#111829] p-6">
                  <h2 className="font-display text-lg font-semibold text-white">Control de Stock e Inventario</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Reposición directa sobre la tabla <code className="font-mono text-[#00E5FF]">inventario</code>.
                  </p>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-800 text-xs text-slate-400">
                        <tr>
                          <th className="py-3 pr-4 font-medium">Producto</th>
                          <th className="py-3 pr-4 font-medium">Categoría / Marca</th>
                          <th className="py-3 pr-4 font-medium">Ubicación</th>
                          <th className="py-3 pr-4 text-right font-medium">Stock actual</th>
                          <th className="py-3 text-right font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/30">
                            <td className="py-3 pr-4">
                              <p className="font-medium text-white">{p.nombre}</p>
                              <p className="font-mono text-xs text-slate-500">{p.modelo}</p>
                            </td>
                            <td className="py-3 pr-4 text-xs text-slate-300">
                              {p.marca_nombre} · {p.categoria_nombre}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-slate-400">{p.ubicacion_almacen}</td>
                            <td className="py-3 pr-4 text-right font-mono tabular-nums">
                              <span
                                className={`font-semibold ${
                                  p.stock_actual <= p.stock_minimo ? 'text-amber-400' : 'text-emerald-400'
                                }`}
                              >
                                {p.stock_actual}
                              </span>
                              <span className="text-xs text-slate-500"> / mín {p.stock_minimo}</span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRestock(p.id, p.stock_actual + 5)}
                                className="rounded-lg border border-slate-700 bg-[#0B1120] px-3 py-1.5 text-xs font-medium text-[#00E5FF] hover:border-[#00E5FF] cursor-pointer"
                              >
                                +5 unidades
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Registrar nuevo producto */}
                <form
                  onSubmit={handleCreateProduct}
                  className="rounded-2xl border border-slate-800 bg-[#111829] p-6 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-[#00E5FF]" />
                    <h2 className="font-display text-lg font-semibold text-white">Registrar Nuevo Producto</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs text-slate-300">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej. Monitor Studio OLED 32"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300">Modelo *</label>
                      <input
                        type="text"
                        required
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        placeholder="ET-OLED32-PRO"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300">Categoría *</label>
                      <select
                        value={newCatId}
                        onChange={(e) => setNewCatId(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300">Marca *</label>
                      <select
                        value={newBrandId}
                        onChange={(e) => setNewBrandId(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300">Precio Regular (USD) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="999.00"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300">Precio Promocional (opcional)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={newPromo}
                        onChange={(e) => setNewPromo(e.target.value)}
                        placeholder="899.00"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300">Stock Inicial *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-300">Descripción técnica</label>
                      <input
                        type="text"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Especificaciones y beneficios principales del equipo"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 cursor-pointer"
                  >
                    Guardar producto en base de datos
                  </button>
                </form>
              </div>
            )}

            {tab === 'arquitectura' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-[#111829] p-6">
                  <h2 className="font-display text-lg font-semibold text-white">
                    Modelo Relacional de Base de Datos (12 Tablas)
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Integridad referencial activa (<code className="font-mono text-[#00E5FF]">PRAGMA foreign_keys = ON</code>)
                    e índices optimizados para consultas transaccionales.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                    {[
                      '1. roles (PK id, nombre)',
                      '2. usuarios (PK id, FK rol_id, email UNIQUE)',
                      '3. clientes (PK id, FK usuario_id UNIQUE)',
                      '4. categorias (PK id, nombre, slug UNIQUE)',
                      '5. marcas (PK id, nombre UNIQUE)',
                      '6. productos (PK id, FK categoria_id, FK marca_id)',
                      '7. inventario (PK id, FK producto_id UNIQUE, stock_actual)',
                      '8. carritos (PK id, FK usuario_id, session_id)',
                      '9. carrito_detalles (PK id, FK carrito_id, FK producto_id)',
                      '10. pedidos (PK id, FK usuario_id, FK cliente_id, total)',
                      '11. pedido_detalles (PK id, FK pedido_id, FK producto_id)',
                      '12. pagos (PK id, FK pedido_id UNIQUE, referencia)',
                    ].map((tbl) => (
                      <div key={tbl} className="rounded-xl border border-slate-800 bg-[#0B1120] px-3.5 py-2.5 font-mono text-slate-300">
                        {tbl}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#111829] p-6">
                  <h2 className="font-display text-lg font-semibold text-white">
                    Arquitectura Modular y Calidad de Software (FIRST)
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    El backend expone servicios independientes para Autenticación (JWT + bcrypt), Catálogo (filtros y
                    paginación SQL), Carrito Transaccional (cálculo en servidor y bloqueo de sobreventa) y Analítica del
                    Dashboard. Todas las suites de pruebas automatizadas en <code className="font-mono text-[#00E5FF]">tests/</code>{' '}
                    se ejecutan mediante <code className="font-mono text-[#00E5FF]">npm run test:coverage</code> sobre
                    bases de datos aisladas en memoria.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
