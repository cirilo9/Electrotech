import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { api } from '../services/api.ts';
import type { Brand, CatalogQuery, Category, Product } from '../../shared/types.ts';
import { ProductImage } from './ProductImage.tsx';

interface CatalogPageProps {
  categories: Category[];
  brands: Brand[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  onInspectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const PAGE_SIZE = 9;

export function CatalogPage({
  categories,
  brands,
  selectedCategory,
  onCategoryChange,
  onInspectProduct,
  onAddToCart,
}: CatalogPageProps) {
  const [search, setSearch] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('search') || '' : ''
  );
  const [selectedBrand, setSelectedBrand] = useState('todas');
  const [sort, setSort] = useState<CatalogQuery['sort']>('destacados');
  const [page, setPage] = useState(1);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getProducts({ limit: 50 })
      .then((res) => {
        if (!active) return;
        setAllProducts(res.items);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Error al cargar el catálogo.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedBrand, sort]);

  // Filtrado inmediato (0ms) por nombre, descripción, modelo, marca y categoría
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = allProducts.filter((p) => {
      if (selectedCategory !== 'todas' && p.categoria_slug !== selectedCategory) {
        return false;
      }
      if (selectedBrand !== 'todas' && p.marca_nombre.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      if (term) {
        const matchesName = p.nombre.toLowerCase().includes(term);
        const matchesDesc = p.descripcion.toLowerCase().includes(term);
        const matchesModel = p.modelo.toLowerCase().includes(term);
        const matchesBrand = p.marca_nombre.toLowerCase().includes(term);
        if (!matchesName && !matchesDesc && !matchesModel && !matchesBrand) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered];
    if (sort === 'precio_asc') {
      sorted.sort((a, b) => a.precio_efectivo - b.precio_efectivo);
    } else if (sort === 'precio_desc') {
      sorted.sort((a, b) => b.precio_efectivo - a.precio_efectivo);
    } else if (sort === 'nombre_asc') {
      sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    } else if (sort === 'nombre_desc') {
      sorted.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'));
    } else {
      sorted.sort((a, b) => b.calificacion - a.calificacion || a.id - b.id);
    }

    return sorted;
  }, [allProducts, search, selectedCategory, selectedBrand, sort]);

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const products = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setSearch('');
    onCategoryChange('todas');
    setSelectedBrand('todas');
    setSort('destacados');
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Encabezado de catálogo */}
      <div className="flex flex-col justify-between gap-4 border-b border-cyan-500/20 pb-8 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Catálogo de Productos</h1>
          <p className="mt-2 text-sm text-slate-300">
            Explora nuestras 9 categorías especializadas con búsqueda instantánea por nombre o descripción.
          </p>
        </div>
        <p className="font-mono text-xs text-[#00E5FF] tabular-nums">
          {total} {total === 1 ? 'producto encontrado' : 'productos encontrados'}
        </p>
      </div>

      {/* Barra de búsqueda inmediata y ordenamiento */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="relative lg:col-span-6">
          <Search className="pointer-events-none absolute top-3.5 left-4 h-4 w-4 text-[#00E5FF]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos por nombre o descripción..."
            aria-label="Buscar productos por nombre o descripción"
            className="glass-surface-elevated w-full rounded-xl py-3 pr-10 pl-11 text-sm text-white placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              className="absolute top-2.5 right-3 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#00E5FF]" />
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              aria-label="Filtrar por marca"
              className="glass-surface w-full rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
            >
              <option value="todas" className="bg-[#0F172A]">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.nombre} className="bg-[#0F172A]">
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CatalogQuery['sort'])}
              aria-label="Ordenar productos"
              className="glass-surface w-full rounded-xl px-3.5 py-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
            >
              <option value="destacados" className="bg-[#0F172A]">Ordenar: Destacados</option>
              <option value="precio_asc" className="bg-[#0F172A]">Precio: menor a mayor</option>
              <option value="precio_desc" className="bg-[#0F172A]">Precio: mayor a menor</option>
              <option value="nombre_asc" className="bg-[#0F172A]">Alfabético: A - Z</option>
              <option value="nombre_desc" className="bg-[#0F172A]">Alfabético: Z - A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtros por categoría (botones funcionales) */}
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoría">
        <button
          type="button"
          onClick={() => onCategoryChange('todas')}
          className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategory === 'todas'
              ? 'btn-tech-primary text-white'
              : 'glass-surface text-slate-200 hover:border-[#00E5FF]/50 hover:text-white'
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.slug)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat.slug
                ? 'btn-tech-primary text-white'
                : 'glass-surface text-slate-200 hover:border-[#00E5FF]/50 hover:text-white'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Estado de error */}
      {error && (
        <div className="mt-8 rounded-xl border border-red-500/40 bg-red-950/40 p-6 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Estado de carga inicial */}
      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-[430px] animate-pulse rounded-2xl border border-slate-700/60 bg-[#131D38]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Estado sin resultados */
        <div className="card-surface mt-12 rounded-2xl px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-white">No se encontraron artefactos</h2>
          <p className="mt-2 text-sm text-slate-300">
            Ningún producto coincide con &ldquo;{search || 'los filtros seleccionados'}&rdquo;.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-tech-primary mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        /* Cuadrícula de productos */
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="card-surface group flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#0D152C]">
                <ProductImage
                  src={product.imagen_url}
                  alt={`${product.marca_nombre} ${product.nombre}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="truncate">
                    <span className="font-medium text-cyan-300">{product.marca_nombre}</span>{' '}
                    <span aria-hidden="true" className="text-slate-500">·</span> {product.categoria_nombre}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-400 tabular-nums shrink-0">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    {product.calificacion.toFixed(1)}
                  </span>
                </div>

                <h2 className="mt-2 font-display text-lg font-semibold text-white">{product.nombre}</h2>
                <p className="mt-0.5 font-mono text-xs text-violet-300/80">{product.modelo}</p>
                <p className="mt-2.5 line-clamp-2 text-sm text-slate-300">{product.descripcion}</p>

                <div className="mt-auto pt-5 flex items-baseline justify-between border-t border-slate-700/60">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-lg font-bold text-[#00E5FF] tabular-nums">
                      ${product.precio_efectivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    {product.precio_promocional && (
                      <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                        ${product.precio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      product.stock_actual === 0
                        ? 'text-red-400'
                        : product.stock_actual <= product.stock_minimo
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {product.stock_actual > 0 ? `${product.stock_actual} en stock` : 'Agotado'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onInspectProduct(product)}
                    className="rounded-lg border border-slate-600/80 bg-[#182444] px-3 py-2 text-xs font-medium text-slate-100 transition-colors hover:border-[#00E5FF]/60 hover:text-white cursor-pointer"
                  >
                    Ver detalles
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock_actual <= 0}
                    className="btn-tech-primary rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="glass-surface inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#00E5FF]/50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const p = idx + 1;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-lg font-mono text-xs font-semibold tabular-nums transition-all cursor-pointer ${
                  safePage === p
                    ? 'btn-tech-primary text-white'
                    : 'glass-surface text-slate-200 hover:border-[#00E5FF]/50'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="glass-surface inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#00E5FF]/50 disabled:opacity-40 cursor-pointer"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
