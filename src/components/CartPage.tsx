import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api.ts';
import type { AuthUser, CartSummary, CheckoutPayload, OrderConfirmation } from '../../shared/types.ts';
import type { AppView } from './Navbar.tsx';
import { ProductImage } from './ProductImage.tsx';

interface CartPageProps {
  cart: CartSummary;
  user: AuthUser | null;
  onCartUpdated: (cart: CartSummary) => void;
  onNavigate: (view: AppView) => void;
}

export function CartPage({ cart, user, onCartUpdated, onNavigate }: CartPageProps) {
  const [direccion, setDireccion] = useState(user?.direccion || '');
  const [metodoPago, setMetodoPago] = useState<CheckoutPayload['metodo_pago']>('Tarjeta de Crédito');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [myOrders, setMyOrders] = useState<
    Array<{
      id: number;
      codigo_pedido: string;
      total: number;
      estado: string;
      metodo_pago: string;
      created_at: string;
    }>
  >([]);

  useEffect(() => {
    if (user?.direccion && !direccion) {
      setDireccion(user.direccion);
    }
    if (user) {
      api.getMyOrders().then((res) => setMyOrders(res.items)).catch(() => {});
    }
  }, [user, direccion]);

  const handleQuantityChange = async (productoId: number, nextQty: number, stockDisponible: number) => {
    if (nextQty > stockDisponible) {
      await Swal.fire({
        icon: 'warning',
        title: 'Stock máximo alcanzado',
        text: `Solo existen ${stockDisponible} unidades disponibles en inventario.`,
        background: '#0F172A',
        color: '#F8FAFC',
        confirmButtonColor: '#2563EB',
      });
      return;
    }
    try {
      const updated = await api.updateCartQuantity(productoId, nextQty);
      onCartUpdated(updated);
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de inventario',
        text: err instanceof Error ? err.message : 'No se pudo actualizar la cantidad.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  const handleRemove = async (productoId: number) => {
    try {
      const updated = await api.removeFromCart(productoId);
      onCartUpdated(updated);
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'No se pudo eliminar el producto.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      const result = await Swal.fire({
        icon: 'info',
        title: 'Inicia sesión para confirmar',
        text: 'Tu carrito se conservará automáticamente al ingresar con tu cuenta.',
        showCancelButton: true,
        confirmButtonText: 'Ir a Iniciar sesión',
        cancelButtonText: 'Cancelar',
        background: '#0F172A',
        color: '#F8FAFC',
        confirmButtonColor: '#2563EB',
      });
      if (result.isConfirmed) {
        onNavigate('login');
      }
      return;
    }

    if (direccion.trim().length < 5) {
      await Swal.fire({
        icon: 'warning',
        title: 'Dirección requerida',
        text: 'Ingresa una dirección de envío válida (mínimo 5 caracteres).',
        background: '#0F172A',
        color: '#F8FAFC',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.checkout({
        direccion_envio: direccion.trim(),
        metodo_pago: metodoPago,
        notas: notas.trim(),
      });
      setConfirmedOrder(res.order);
      const refreshedCart = await api.getCart();
      onCartUpdated(refreshedCart);
      const ordersRes = await api.getMyOrders();
      setMyOrders(ordersRes.items);

      await Swal.fire({
        icon: 'success',
        title: `Pedido ${res.order.codigo_pedido} confirmado`,
        text: `Pago aprobado por $${res.order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
        background: '#0F172A',
        color: '#F8FAFC',
        confirmButtonColor: '#2563EB',
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo confirmar el pedido',
        text: err instanceof Error ? err.message : 'Verifica tu conexión e inténtalo nuevamente.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="font-display text-3xl font-bold text-white">Mi Carrito de Compras</h1>
        <p className="mt-2 text-sm text-slate-400">
          Los precios unitarios, descuentos y disponibilidad de stock se validan en tiempo real desde el servidor.
        </p>
      </div>

      {/* Comprobante de pedido recién confirmado */}
      {confirmedOrder && (
        <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/25 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Pedido {confirmedOrder.codigo_pedido} Confirmado — Preparando Envío
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Referencia de pago: <span className="font-mono text-[#00E5FF]">{confirmedOrder.referencia_transaccion}</span> ·{' '}
                  {confirmedOrder.metodo_pago}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 whitespace-nowrap cursor-pointer"
            >
              Seguir explorando
            </button>
          </div>

          <div className="mt-6 border-t border-emerald-500/20 pt-4 text-sm">
            <div className="space-y-2">
              {confirmedOrder.items.map((item) => (
                <div key={item.producto_id} className="flex justify-between text-slate-300">
                  <span>
                    {item.nombre} × {item.cantidad}
                  </span>
                  <span className="font-mono tabular-nums">
                    ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-emerald-500/20 pt-3 font-semibold text-white">
              <span>Total pagado ({confirmedOrder.direccion_envio})</span>
              <span className="font-mono text-lg text-[#00E5FF] tabular-nums">
                ${confirmedOrder.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Carrito vacío */}
      {cart.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-800 bg-[#0F1629] px-6 py-16 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-4 font-display text-xl font-semibold text-white">Tu carrito está vacío</h2>
          <p className="mt-2 text-sm text-slate-400">
            Aún no has agregado artefactos electrónicos a tu orden de compra.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 cursor-pointer"
          >
            <span>Explorar catálogo</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Lista de productos */}
          <div className="space-y-4 lg:col-span-7">
            {cart.items.map((item) => (
              <article
                key={item.producto_id}
                className="card-surface flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-[#0B1120] sm:w-32">
                  <ProductImage
                    src={item.imagen_url}
                    alt={`${item.marca_nombre} ${item.nombre}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">
                    {item.marca_nombre} · {item.categoria_nombre}
                  </p>
                  <h2 className="mt-1 truncate font-display text-base font-semibold text-white">{item.nombre}</h2>
                  <p className="font-mono text-xs text-slate-500">{item.modelo}</p>

                  <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                    <span className="font-mono text-sm font-semibold text-[#00E5FF] tabular-nums">
                      ${item.precio_unitario.toLocaleString('en-US', { minimumFractionDigits: 2 })} c/u
                    </span>
                    {item.descuento_unitario > 0 && (
                      <span className="font-mono text-xs text-slate-500 line-through tabular-nums">
                        ${item.precio_lista.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 tabular-nums">
                      ({item.stock_disponible} disp.)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="inline-flex items-center rounded-xl border border-slate-700 bg-[#0B1120]">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.producto_id, item.cantidad - 1, item.stock_disponible)}
                      className="px-2.5 py-2 text-slate-300 hover:text-white cursor-pointer"
                      aria-label={`Disminuir cantidad de ${item.nombre}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center font-mono text-sm font-semibold text-white tabular-nums">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.producto_id, item.cantidad + 1, item.stock_disponible)}
                      className="px-2.5 py-2 text-slate-300 hover:text-white cursor-pointer"
                      aria-label={`Incrementar cantidad de ${item.nombre}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-white tabular-nums">
                      ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.producto_id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-950/60 hover:text-red-400 cursor-pointer"
                      aria-label={`Eliminar ${item.nombre} del carrito`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Resumen de compra y confirmación */}
          <div className="lg:col-span-5">
            <div className="glass-surface-elevated rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold text-white">Resumen de compra</h2>

              <div className="mt-4 space-y-2.5 border-b border-slate-800 pb-4 text-sm">
                {cart.items.map((item) => (
                  <div key={item.producto_id} className="flex justify-between gap-4 text-slate-300">
                    <span className="truncate">
                      {item.nombre} × {item.cantidad}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">
                      ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal precio lista ({cart.total_unidades} u.)</span>
                  <span className="font-mono tabular-nums">
                    ${cart.subtotal_lista.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Descuentos promocionales</span>
                  <span className="font-mono tabular-nums">
                    -${cart.descuento_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-3 text-base font-bold text-white">
                  <span>Total a pagar</span>
                  <span className="font-mono text-xl text-[#00E5FF] tabular-nums">
                    ${cart.total_pagar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="mt-6 space-y-4 border-t border-slate-800 pt-5">
                <div>
                  <label htmlFor="checkout-dir" className="block text-xs font-medium text-slate-300">
                    Dirección de envío *
                  </label>
                  <input
                    id="checkout-dir"
                    type="text"
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle Real 640, Huancayo"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-pay" className="block text-xs font-medium text-slate-300">
                    Método de pago
                  </label>
                  <select
                    id="checkout-pay"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as CheckoutPayload['metodo_pago'])}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                  >
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito / Débito</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Yape / Plin">Yape / Plin</option>
                    <option value="Pago Contra Entrega">Pago Contra Entrega</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="checkout-notes" className="block text-xs font-medium text-slate-300">
                    Notas adicionales (opcional)
                  </label>
                  <input
                    id="checkout-notes"
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Horario de entrega o referencia"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-tech-primary w-full rounded-xl px-5 py-3.5 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Procesando pedido...' : 'Confirmar pedido'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Historial de pedidos del usuario autenticado */}
      {user && myOrders.length > 0 && (
        <div className="mt-14 border-t border-slate-800/80 pt-10">
          <h2 className="font-display text-xl font-semibold text-white">Tus pedidos recientes</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-[#111829]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Método de pago</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {myOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#00E5FF]">{ord.codigo_pedido}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 tabular-nums">{ord.created_at.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-slate-300">{ord.metodo_pago}</td>
                    <td className="px-4 py-3 text-slate-200">{ord.estado}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-white tabular-nums">
                      ${Number(ord.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
