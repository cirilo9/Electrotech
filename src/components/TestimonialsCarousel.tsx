import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

export interface TestimonialItem {
  id: number;
  nombre: string;
  cargo: string;
  organizacion: string;
  equipoAdquirido: string;
  calificacion: number;
  testimonio: string;
  fecha: string;
  acento: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 1,
    nombre: 'Ing. Rodrigo Santisteban',
    cargo: 'Director de Infraestructura',
    organizacion: 'Grupo Andino Tech',
    equipoAdquirido: 'MacBook Pro 16 M4 Max',
    calificacion: 5.0,
    testimonio:
      'Antes demorábamos semanas validando stock real con proveedores tradicionales. Al migrar nuestras compras a ELECTROTECH recibimos 8 estaciones M4 Max en 48 horas con facturación y garantía verificada.',
    fecha: 'Octubre 2026',
    acento: 'from-[#00E5FF] to-[#2563EB]',
  },
  {
    id: 2,
    nombre: 'Arq. Camila Villalobos',
    cargo: 'Directora de Visualización 3D',
    organizacion: 'Estudio Kinetik Lima',
    equipoAdquirido: 'Precision Tower Pro & RTX 5080',
    calificacion: 5.0,
    testimonio:
      'Nuestros renders arquitectónicos 4K sufrían cuellos de botella constantes. Con las workstations y tarjetas RTX 5080 asesoradas por ELECTROTECH redujimos los tiempos de renderizado en un 62%.',
    fecha: 'Noviembre 2026',
    acento: 'from-[#8B5CF6] to-[#2563EB]',
  },
  {
    id: 3,
    nombre: 'Dra. Mariana Echevarría',
    cargo: 'Jefa de Innovación Digital',
    organizacion: 'Clínica San Gabriel',
    equipoAdquirido: 'HP LaserJet Pro MFP & Tablets OLED',
    calificacion: 4.9,
    testimonio:
      'Necesitábamos renovar equipamiento médico-administrativo sin errores de inventario. El seguimiento por código de pedido y el cálculo transparente en plataforma agilizaron nuestra auditoría interna.',
    fecha: 'Septiembre 2026',
    acento: 'from-[#10B981] to-[#00E5FF]',
  },
  {
    id: 4,
    nombre: 'Lic. Sebastián Quiroz',
    cargo: 'Productor Audiovisual',
    organizacion: 'Norte Studio Media',
    equipoAdquirido: 'LG OLED evo G5 65" & Sony ANC',
    calificacion: 5.0,
    testimonio:
      'La fidelidad de color en nuestras salas de etalonaje era inconsistente. Tras incorporar el panel OLED evo G5 calibrado y monitoreo Sony WH-1000XM6 entregamos dos campañas nacionales sin correcciones.',
    fecha: 'Octubre 2026',
    acento: 'from-[#00E5FF] to-[#8B5CF6]',
  },
  {
    id: 5,
    nombre: 'Ing. Fabiola Montesinos',
    cargo: 'Gerente de Operaciones TI',
    organizacion: 'Logística Pacífico Sur',
    equipoAdquirido: 'ROG Zephyrus G16 & Periféricos MX',
    calificacion: 4.9,
    testimonio:
      'Anteriormente sufríamos demoras en reposiciones para gerencia. Con ELECTROTECH el despacho asegurado y la garantía de 24 meses nos dieron continuidad operativa inmediata en tres sedes.',
    fecha: 'Agosto 2026',
    acento: 'from-[#3B82F6] to-[#10B981]',
  },
  {
    id: 6,
    nombre: 'Mg. Alonso Benavides',
    cargo: 'Coordinador de Laboratorio',
    organizacion: 'Instituto TechNova',
    equipoAdquirido: 'Workstations HP Z2 Mini G9',
    calificacion: 5.0,
    testimonio:
      'Equipar un laboratorio de ingeniería exigía precios promocionales claros y disponibilidad confirmada. ELECTROTECH entregó 12 unidades compactas en una sola orden sin quiebres de stock.',
    fecha: 'Noviembre 2026',
    acento: 'from-[#8B5CF6] to-[#00E5FF]',
  },
];

function getInitials(name: string): string {
  const parts = name
    .replace(/^(Ing\.|Arq\.|Dra\.|Lic\.|Mg\.)\s*/i, '')
    .trim()
    .split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export function TestimonialsCarousel() {
  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = TESTIMONIALS.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % total);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % total);
  };

  // Tres tarjetas visibles en orden circular para escritorio, 2 en tablet, 1 en móvil
  const visibleItems = [
    TESTIMONIALS[startIndex % total],
    TESTIMONIALS[(startIndex + 1) % total],
    TESTIMONIALS[(startIndex + 2) % total],
  ];

  return (
    <section
      aria-label="Testimonios de clientes"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="border-t border-cyan-500/20 bg-gradient-to-b from-[#080B16] via-[#0B1228] to-[#090F22] py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera y controles del carrusel */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest text-[#00E5FF]">
              CONFIANZA COMPROBADA
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              Experiencias reales de nuestros clientes
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Empresas, estudios de ingeniería y profesionales que confían su equipamiento tecnológico a ELECTROTECH.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Testimonio anterior"
              className="glass-surface inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-[#00E5FF]/60 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente testimonio"
              className="glass-surface inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-[#00E5FF]/60 hover:text-white cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carrusel de tarjetas */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item, idx) => (
            <article
              key={`${item.id}-${startIndex}`}
              className={`card-surface flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${
                idx === 1 ? 'hidden md:flex' : idx === 2 ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <Quote className="h-5 w-5 text-[#00E5FF]/80" aria-hidden="true" />
                  <div className="flex items-center gap-1 text-amber-400 tabular-nums">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span className="font-mono text-xs font-semibold">{item.calificacion.toFixed(1)}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-200">
                  &ldquo;{item.testimonio}&rdquo;
                </p>
              </div>

              <div className="mt-6 border-t border-slate-700/60 pt-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.acento} font-display text-xs font-bold text-white shadow-md`}
                    aria-hidden="true"
                  >
                    {getInitials(item.nombre)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-semibold text-white">{item.nombre}</h3>
                    <p className="truncate text-xs text-slate-300">
                      {item.cargo} · {item.organizacion}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate font-medium text-cyan-300/90">{item.equipoAdquirido}</span>
                  <span className="ml-2 shrink-0">{item.fecha}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Indicadores de posición del carrusel */}
        <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Seleccionar testimonio">
          {TESTIMONIALS.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStartIndex(idx)}
              aria-label={`Mostrar testimonio de ${t.nombre}`}
              aria-selected={startIndex === idx}
              className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                startIndex === idx ? 'w-8 bg-[#00E5FF]' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
