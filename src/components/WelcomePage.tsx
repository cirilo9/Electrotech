import { useState, type MouseEvent } from 'react';
import { ArrowRight, Cpu, Layers, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import type { Category, Product } from '../../shared/types.ts';
import type { AppView } from './Navbar.tsx';
import { ProductImage } from './ProductImage.tsx';
import { TestimonialsCarousel } from './TestimonialsCarousel.tsx';

interface WelcomePageProps {
  featuredProducts: Product[];
  categories: Category[];
  onNavigate: (view: AppView) => void;
  onSelectCategory: (slug: string) => void;
  onInspectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const SHOWROOM_IMAGE = '/src/assets/images/hero_electrotech_showroom_1795191996120.jpg';

const HERO_GALLERY = [
  {
    id: 'ecosistema',
    label: 'Ecosistema',
    src: '/src/assets/images/hero_electrotech_showcase_1795190964109.jpg',
    subtitle: 'Ecosistema Serie 2026',
    title: 'Workstations, Telefonía y Audio Espacial',
    desc: 'Hardware seleccionado con validación automática de inventario y despacho asegurado.',
  },
  {
    id: 'laptops',
    label: 'Laptops',
    src: '/src/assets/images/prod_laptop_pro_1795190964479.jpg',
    subtitle: 'Estaciones Portátiles',
    title: 'Ultrabooks y Laptops de Ingeniería',
    desc: 'Arquitectura de aluminio CNC, pantallas OLED de alta frecuencia y potencia profesional.',
  },
  {
    id: 'smartphones',
    label: 'Smartphones',
    src: '/src/assets/images/prod_smartphone_ultra_1795190963623.jpg',
    subtitle: 'Telefonía Insignia 5G',
    title: 'Smartphones de Titanio y Óptica Pro',
    desc: 'Conectividad 5G ultrarrápida y fotografía computacional de precisión.',
  },
  {
    id: 'televisores',
    label: 'Televisores',
    src: '/src/assets/images/prod_oled_tv_1795190964805.jpg',
    subtitle: 'Pantallas OLED 4K / 8K',
    title: 'Televisores Cinematográficos sin Marcos',
    desc: 'Contraste infinito, tasa de refresco de 144Hz y audio espacial integrado.',
  },
];

const CATEGORY_ACCENTS = [
  'hover:border-[#00E5FF]/60 text-[#00E5FF]',
  'hover:border-[#3B82F6]/60 text-[#60A5FA]',
  'hover:border-[#8B5CF6]/60 text-[#A78BFA]',
  'hover:border-[#10B981]/60 text-[#34D399]',
  'hover:border-[#06B6D4]/60 text-[#22D3EE]',
];

export function WelcomePage({
  featuredProducts,
  categories,
  onNavigate,
  onSelectCategory,
  onInspectProduct,
  onAddToCart,
}: WelcomePageProps) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [activeSlide, setActiveSlide] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: Number((-y * 8).toFixed(2)),
      rotateY: Number((x * 10).toFixed(2)),
    });
  };

  const resetTilt = () => setTilt({ rotateX: 0, rotateY: 0 });
  const currentHero = HERO_GALLERY[activeSlide];

  return (
    <div className="relative overflow-hidden bg-[#080B16]">
      {/* SECCIÓN 1: HERO FUTURISTA MULTICOLOR */}
      <section className="relative overflow-hidden border-b border-cyan-500/20">
        {/* Imagen panorámica de showroom futurista con iluminación vibrante */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <img
            src={SHOWROOM_IMAGE}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-60 brightness-110 saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080B16]/95 via-[#0B142E]/78 to-[#13123A]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080B16] via-transparent to-[#0A1026]/50" />
          <div className="absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-[#2563EB]/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8 lg:pt-16 lg:pb-24">
          <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-12">
            {/* Columna izquierda: Contenido principal */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-center lg:col-span-6"
            >
              <p className="text-xs font-semibold tracking-widest text-[#00E5FF]">
                ELECTROTECH · INNOVACIÓN Y HARDWARE DE PRECISIÓN
              </p>

              <h1 className="hero-title-gradient mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.35rem]">
                EL FUTURO DE LA TECNOLOGÍA ESTÁ AQUÍ
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
                Descubre una nueva experiencia tecnológica. Encuentra los mejores artefactos electrónicos, innovación y
                calidad en un solo lugar
              </p>

              {/* Acciones principales */}
              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="btn-tech-primary inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
                >
                  <span>Explorar productos</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="glass-surface inline-flex items-center rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-[#8B5CF6]/60 hover:bg-[#1E294D]/90 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
                >
                  Iniciar sesión
                </button>

                <a
                  href="#nuestra-tienda"
                  className="inline-flex items-center rounded-xl px-4 py-3.5 text-sm font-medium text-cyan-200 transition-colors hover:text-[#00E5FF] whitespace-nowrap"
                >
                  Conocer nuestra tienda
                </a>
              </div>

              {/* Datos verificables con paleta diferenciada */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-cyan-500/20 pt-7">
                <div>
                  <p className="font-display text-2xl font-bold text-[#00E5FF] tabular-nums">{categories.length || 9}</p>
                  <p className="mt-1 text-xs text-slate-200">Categorías técnicas</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#60A5FA] tabular-nums">100%</p>
                  <p className="mt-1 text-xs text-slate-200">Stock en tiempo real</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#A78BFA] tabular-nums">24m</p>
                  <p className="mt-1 text-xs text-slate-200">Garantía certificada</p>
                </div>
              </div>
            </motion.div>

            {/* Columna derecha: Escaparate 3D interactivo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-3 lg:col-span-6"
            >
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={resetTilt}
                style={{
                  transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                  transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="glass-surface-elevated relative w-full flex-1 overflow-hidden rounded-2xl"
              >
                <div className="relative h-full min-h-[340px] lg:min-h-[430px]">
                  <ProductImage
                    src={currentHero.src}
                    alt={`${currentHero.title} — ELECTROTECH`}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080B16]/90 via-[#0B1228]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <p className="text-xs font-semibold text-[#00E5FF]">{currentHero.subtitle}</p>
                    <p className="mt-1 font-display text-xl font-semibold text-white">{currentHero.title}</p>
                    <p className="mt-1.5 text-sm text-slate-200">{currentHero.desc}</p>
                  </div>
                </div>
              </div>

              {/* Selector interactivo de imágenes destacadas */}
              <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Galería de equipos insignia">
                {HERO_GALLERY.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap truncate cursor-pointer ${
                      activeSlide === idx
                        ? 'btn-tech-primary text-white'
                        : 'glass-surface text-slate-200 hover:border-[#00E5FF]/50 hover:text-white'
                    }`}
                  >
                    {slide.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: COLECCIÓN DESTACADA */}
      <section className="relative bg-gradient-to-b from-[#0C1329] via-[#0E1733] to-[#090F22] py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Equipos destacados del catálogo
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Selección actualizada directamente desde nuestra base de datos de inventario.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00E5FF] transition-colors hover:text-cyan-200 whitespace-nowrap cursor-pointer"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.slice(0, 3).map((product) => (
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
                  <div className="flex items-center gap-2 text-xs text-cyan-300/90">
                    <span className="font-medium">{product.marca_nombre}</span>
                    <span aria-hidden="true" className="text-slate-500">·</span>
                    <span className="text-slate-300">{product.categoria_nombre}</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-white">{product.nombre}</h3>
                  <p className="mt-1 text-xs font-mono text-slate-400">{product.modelo}</p>

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
                    <span className="text-xs font-medium text-emerald-400 tabular-nums">{product.stock_actual} disp.</span>
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

          {/* Explorar por categoría con acentos policromáticos */}
          <div className="mt-12 border-t border-slate-700/60 pt-10">
            <h3 className="font-display text-base font-semibold text-white">Explorar por categoría</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((cat, idx) => {
                const accent = CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length];
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.slug);
                      onNavigate('catalog');
                    }}
                    className={`glass-surface flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5 cursor-pointer ${accent.split(' ')[0]}`}
                  >
                    <span className="truncate text-sm font-medium text-slate-100">{cat.nombre}</span>
                    <span className={`ml-2 font-mono text-xs font-semibold tabular-nums ${accent.split(' ')[1]}`}>
                      {cat.total_productos ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: CONOCER NUESTRA TIENDA */}
      <section id="nuestra-tienda" className="border-t border-indigo-500/20 bg-gradient-to-b from-[#090F22] to-[#080B16] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold tracking-widest text-[#A78BFA]">
                EXPERIENCIA ELECTROTECH
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                Nuestra tienda y arquitectura comercial
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-200">
                ELECTROTECH combina hardware certificado de fabricantes líderes con una plataforma de compra segura,
                cálculo de precios validado en servidor y control estricto de inventario en cada transacción.
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="glass-surface-elevated aspect-[16/9] overflow-hidden rounded-2xl">
                <ProductImage
                  src={SHOWROOM_IMAGE}
                  alt="Showroom arquitectónico ELECTROTECH con exhibición de laptops, televisores OLED y audio"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="card-surface rounded-2xl p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E5FF]/25 to-[#2563EB]/25 text-[#00E5FF]">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">Hardware verificado</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Nueve líneas especializadas desde laptops y workstations hasta componentes de PC, OLED 4K y audio de
                estudio con trazabilidad de modelo.
              </p>
            </div>

            <div className="card-surface rounded-2xl p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB]/25 to-[#8B5CF6]/25 text-[#60A5FA]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">Transacciones íntegras</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Cada subtotal, descuento promocional y reserva de stock se procesa en el servidor mediante transacciones
                relacionales para evitar inconsistencias.
              </p>
            </div>

            <div className="card-surface rounded-2xl p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/25 to-[#10B981]/25 text-[#A78BFA]">
                <div className="flex items-center gap-1">
                  <Layers className="h-5 w-5" />
                  <Truck className="h-5 w-5 text-[#34D399]" />
                </div>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">Despacho y soporte</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Cobertura nacional con código de seguimiento inmediato al confirmar el pedido y soporte técnico
                especializado de 24 meses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: TESTIMONIOS DE CLIENTES */}
      <TestimonialsCarousel />
    </div>
  );
}
