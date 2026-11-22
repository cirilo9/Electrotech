import { useState } from 'react';
import { Minus, Plus, ShieldCheck, Star, X } from 'lucide-react';
import type { Product } from '../../shared/types.ts';
import { ProductImage } from './ProductImage.tsx';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, cantidad: number) => void;
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const maxQty = Math.max(1, product.stock_actual);
  const clampedQty = Math.min(qty, maxQty);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
    >
      <div className="glass-surface-elevated relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-slate-300 hover:text-white cursor-pointer"
          aria-label="Cerrar detalles del producto"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Galería izquierda */}
          <div className="bg-[#0B1120] p-6 md:col-span-6 flex items-center justify-center">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-800">
              <ProductImage
                src={product.imagen_url}
                alt={`${product.marca_nombre} ${product.nombre}`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Módulo de compra contiguo derecho */}
          <div className="flex flex-col p-6 sm:p-8 md:col-span-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{product.marca_nombre}</span>
              <span aria-hidden="true">·</span>
              <span>{product.categoria_nombre}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-amber-400 tabular-nums">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                {product.calificacion.toFixed(1)}
              </span>
            </div>

            <h2 id="pdp-title" className="mt-2 font-display text-2xl font-bold text-white">
              {product.nombre}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-400">Modelo: {product.modelo}</p>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-white tabular-nums">
                ${product.precio_efectivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {product.precio_promocional && (
                <span className="font-mono text-base text-slate-500 line-through tabular-nums">
                  ${product.precio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">{product.descripcion}</p>

            {/* Especificaciones técnicas */}
            <div className="mt-5 border-t border-slate-800 pt-4">
              <h3 className="text-xs font-semibold tracking-wide text-slate-400">Especificaciones clave</h3>
              <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {Object.entries(product.especificaciones).map(([key, val]) => (
                  <div key={key}>
                    <dt className="text-slate-500">{key}</dt>
                    <dd className="font-medium text-slate-200">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Disponibilidad y acción de compra */}
            <div className="mt-6 border-t border-slate-800 pt-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
                  <span>Garantía oficial ELECTROTECH</span>
                </span>
                <span
                  className={`font-medium tabular-nums ${
                    product.stock_actual > product.stock_minimo
                      ? 'text-emerald-400'
                      : product.stock_actual > 0
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                >
                  {product.stock_actual > 0
                    ? `${product.stock_actual} unidades disponibles`
                    : 'Agotado temporalmente'}
                </span>
              </div>

              {product.stock_actual > 0 && (
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-xl border border-slate-700 bg-[#0B1120]">
                    <button
                      type="button"
                      onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-2.5 text-slate-300 hover:text-white cursor-pointer"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm font-semibold text-white tabular-nums">
                      {clampedQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((prev) => Math.min(maxQty, prev + 1))}
                      className="px-3 py-2.5 text-slate-300 hover:text-white cursor-pointer"
                      aria-label="Incrementar cantidad"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(product, clampedQty);
                      onClose();
                    }}
                    className="flex-1 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 cursor-pointer"
                  >
                    Agregar al carrito
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
