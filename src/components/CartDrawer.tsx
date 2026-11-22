import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api.ts';
import type { CartSummary } from '../../shared/types.ts';
import type { AppView } from './Navbar.tsx';
import { ProductImage } from './ProductImage.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartSummary;
  onCartUpdated: (cart: CartSummary) => void;
  onNavigate: (view: AppView) => void;
}

export function CartDrawer({ isOpen, onClose, cart, onCartUpdated, onNavigate }: CartDrawerProps) {
  const [busyProductId, setBusyProductId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

    setBusyProductId(productoId);
    try {
      const updated =
        nextQty <= 0 ? await api.removeFromCart(productoId) : await api.updateCartQuantity(productoId, nextQty);
      onCartUpdated(updated);
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de inventario',
        text: err instanceof Error ? err.message : 'No se pudo actualizar la cantidad.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    } finally {
      setBusyProductId(null);
    }
  };

  const handleRemove = async (productoId: number) => {
    setBusyProductId(productoId);
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
    } finally {
      setBusyProductId(null);
    }
  };

  const goToView = (targetView: AppView) => {
    onClose();
    onNavigate(targetView);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-cyan-500/25 bg-[#0A1022]/95 shadow-2xl shadow-blue-950/60 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/90 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-[#131D38] text-[#00E5FF]">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="cart-drawer-title" className="font-display text-base font-bold text-white">
                    Mi Carrito
                  </h2>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {cart.total_unidades} {cart.total_unidades === 1 ? 'unidad seleccionada' : 'unidades seleccionadas'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-[#0F172A] text-slate-300 transition-colors hover:border-[#00E5FF]/50 hover:text-white cursor-pointer"
                aria-label="Cerrar carrito lateral"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {cart.items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-[#0F1629]/80 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-[#131D38] text-[#00E5FF]">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">Tu carrito está vacío</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Agrega laptops, smartphones, televisores o componentes de PC para gestionar tu compra al instante.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToView('catalog')}
                    className="btn-tech-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {cart.items.map((item) => {
                    const isBusy = busyProductId === item.producto_id;
                    return (
                      <article
                        key={item.producto_id}
                        className="card-surface flex gap-3.5 rounded-2xl p-3.5 transition-colors"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-[#080B16]">
                          <ProductImage
                            src={item.imagen_url}
                            alt={`${item.marca_nombre} ${item.nombre}`}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[11px] text-slate-400">
                                {item.marca_nombre} · {item.modelo}
                              </p>
                              <h3 className="mt-0.5 line-clamp-2 font-display text-sm font-semibold text-white">
                                {item.nombre}
                              </h3>
                            </div>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRemove(item.producto_id)}
                              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-950/60 hover:text-red-400 disabled:opacity-40 cursor-pointer"
                              aria-label={`Eliminar ${item.nombre} del carrito`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="mt-2 flex flex-wrap items-baseline gap-2">
                            <span className="font-mono text-xs font-semibold text-[#00E5FF] tabular-nums">
                              ${item.precio_unitario.toLocaleString('en-US', { minimumFractionDigits: 2 })} c/u
                            </span>
                            {item.descuento_unitario > 0 && (
                              <span className="font-mono text-[11px] text-slate-500 line-through tabular-nums">
                                ${item.precio_lista.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 tabular-nums">
                              ({item.stock_disponible} disp.)
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center rounded-lg border border-slate-700 bg-[#080B16]">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleQuantityChange(item.producto_id, item.cantidad - 1, item.stock_disponible)
                                }
                                className="px-2 py-1.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                                aria-label={`Disminuir cantidad de ${item.nombre}`}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center font-mono text-xs font-semibold text-white tabular-nums">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleQuantityChange(item.producto_id, item.cantidad + 1, item.stock_disponible)
                                }
                                className="px-2 py-1.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                                aria-label={`Incrementar cantidad de ${item.nombre}`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="font-mono text-sm font-bold text-white tabular-nums">
                              ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="border-t border-cyan-500/20 bg-[#080D1B]/95 px-5 py-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal precio lista ({cart.total_unidades} u.)</span>
                    <span className="font-mono tabular-nums">
                      ${cart.subtotal_lista.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {cart.descuento_total > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuentos promocionales</span>
                      <span className="font-mono tabular-nums">
                        -${cart.descuento_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between border-t border-slate-800 pt-2.5 text-sm font-bold text-white">
                    <span>Total estimado</span>
                    <span className="font-mono text-lg text-[#00E5FF] tabular-nums">
                      ${cart.total_pagar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => goToView('cart')}
                    className="btn-tech-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all cursor-pointer"
                  >
                    <span>Ir a finalizar compra</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-xl border border-slate-700/80 bg-[#0F172A]/80 px-4 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#00E5FF]/40 hover:text-white cursor-pointer"
                  >
                    Seguir comprando
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
