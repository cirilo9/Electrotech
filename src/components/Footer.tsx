import { useState } from 'react';
import { ArrowRight, Globe, Mail, MapPin, Phone, Share2, ShieldCheck, X } from 'lucide-react';
import { ElectrotechLogo, type AppView } from './Navbar.tsx';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'contact' | null>(null);

  return (
    <footer
      className="relative overflow-hidden bg-gradient-to-b from-[#0C142B] via-[#091022] to-[#060913] text-slate-200"
      data-testid="electrotech-footer"
    >
      {/* Línea superior luminosa multicapa */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-gradient-to-r from-[#2563EB] via-[#00E5FF] to-[#8B5CF6]"
      />

      {/* Destellos ambientales sutiles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#2563EB]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#8B5CF6]/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 lg:px-8">
        {/* Franja destacada superior del Footer */}
        <div className="glass-surface-elevated mb-12 flex flex-col justify-between gap-6 rounded-2xl p-6 sm:p-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-widest text-[#00E5FF]">
              SOPORTE Y ASESORÍA ESPECIALIZADA
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-white sm:text-2xl">
              Equipa tu proyecto con tecnología certificada
            </h2>
            <p className="mt-1.5 text-sm text-slate-300">
              Stock verificado en tiempo real, despacho prioritario y garantía oficial de hasta 24 meses en cada compra.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="btn-tech-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Explorar catálogo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('contact')}
              className="rounded-xl border border-cyan-500/35 bg-[#131E3B] px-5 py-3 text-xs font-semibold text-white transition-colors hover:border-[#00E5FF] hover:bg-[#19284D] whitespace-nowrap cursor-pointer"
            >
              Contactar asesor
            </button>
          </div>
        </div>

        {/* Cuadrícula principal de 4 columnas */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Columna 1: Identidad y sede */}
          <div className="space-y-4 md:col-span-4">
            <ElectrotechLogo />
            <p className="text-sm leading-relaxed text-slate-300">
              Comercialización especializada de artefactos electrónicos de última generación, hardware de ingeniería y
              soluciones tecnológicas certificadas con respaldo garantizado.
            </p>
            <p className="inline-flex items-start gap-2 text-xs text-slate-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00E5FF]" />
              <span>Calle Real 640, Huancayo · Lun–Sáb 09:00–20:00</span>
            </p>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div className="md:col-span-2">
            <h3 className="font-display text-sm font-semibold text-white">Enlaces rápidos</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('welcome')}
                  className="text-slate-300 transition-colors hover:text-[#00E5FF] cursor-pointer"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="text-slate-300 transition-colors hover:text-[#00E5FF] cursor-pointer"
                >
                  Catálogo
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('cart')}
                  className="text-slate-300 transition-colors hover:text-[#00E5FF] cursor-pointer"
                >
                  Mi carrito
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModal('contact')}
                  className="text-slate-300 transition-colors hover:text-[#00E5FF] cursor-pointer"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal y Seguridad */}
          <div className="md:col-span-3">
            <h3 className="font-display text-sm font-semibold text-white">Información legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="text-slate-300 transition-colors hover:text-[#A78BFA] cursor-pointer"
                >
                  Política de privacidad
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="text-slate-300 transition-colors hover:text-[#A78BFA] cursor-pointer"
                >
                  Términos y condiciones
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-slate-300 transition-colors hover:text-[#00E5FF] cursor-pointer"
                >
                  Acceso de clientes y administradores
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto directo y redes */}
          <div className="md:col-span-3">
            <h3 className="font-display text-sm font-semibold text-white">Contacto directo</h3>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href="mailto:contacto@electrotech.pe"
                className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-[#111B36]/80 px-3.5 py-2.5 text-slate-200 transition-colors hover:border-[#00E5FF]/50 hover:text-white"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00E5FF]/15 text-[#00E5FF]">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="truncate text-xs font-medium">contacto@electrotech.pe</span>
              </a>

              <a
                href="tel:+51914356362"
                className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-[#111B36]/80 px-3.5 py-2.5 text-slate-200 transition-colors hover:border-[#8B5CF6]/50 hover:text-white tabular-nums"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/20 text-[#A78BFA]">
                  <Phone className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium">+51 914356362</span>
              </a>

              <div className="flex items-center gap-2.5 pt-1">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Sitio web corporativo ELECTROTECH"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/70 bg-[#111B36] text-slate-200 transition-all hover:border-[#00E5FF] hover:text-[#00E5FF]"
                >
                  <Globe className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Redes sociales profesionales ELECTROTECH"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/70 bg-[#111B36] text-slate-200 transition-all hover:border-[#8B5CF6] hover:text-[#A78BFA]"
                >
                  <Share2 className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Pie legal final */}
        <div className="mt-12 border-t border-slate-800/90 pt-7 text-center text-xs text-slate-300 sm:flex sm:items-center sm:justify-between sm:text-left">
          <p>© 2026 ELECTROTECH. Todos los derechos reservados. Tecnología e innovación para tu futuro</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-cyan-300/80 sm:mt-0">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00E5FF]" />
            <span>Comercio electrónico verificado · Huancayo, Perú</span>
          </p>
        </div>
      </div>

      {/* Modal informativo para Privacidad, Términos y Contacto */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-surface-elevated w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-4">
              <h4 className="font-display text-lg font-semibold text-white">
                {legalModal === 'privacy' && 'Política de Privacidad'}
                {legalModal === 'terms' && 'Términos y Condiciones'}
                {legalModal === 'contact' && 'Canales de Atención ELECTROTECH'}
              </h4>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-200">
              {legalModal === 'privacy' && (
                <>
                  <p>
                    ELECTROTECH protege los datos personales de sus clientes conforme a la Ley de Protección de Datos
                    Personales. Las contraseñas se almacenan cifradas mediante algoritmos bcrypt y las sesiones utilizan
                    tokens firmados.
                  </p>
                  <p>
                    Tu información de contacto y dirección de envío se utiliza exclusivamente para la gestión y entrega
                    de pedidos verificados.
                  </p>
                </>
              )}
              {legalModal === 'terms' && (
                <>
                  <p>
                    Todos los equipos electrónicos comercializados en ELECTROTECH cuentan con garantía oficial de
                    fábrica de 12 a 24 meses y verificación previa de inventario en tiempo real.
                  </p>
                  <p>
                    Los importes finales, descuentos promocionales y disponibilidad de stock son validados en nuestros
                    servidores al confirmar cada orden de compra.
                  </p>
                </>
              )}
              {legalModal === 'contact' && (
                <>
                  <p>Atención corporativa y soporte técnico de lunes a sábado de 09:00 a 20:00 hrs.</p>
                  <p>
                    <strong className="text-white">Correo:</strong> contacto@electrotech.pe
                  </p>
                  <p>
                    <strong className="text-white">Teléfono:</strong> +51 914356362
                  </p>
                  <p>
                    <strong className="text-white">Centro de Distribución:</strong> Calle Real 640, Huancayo.
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="btn-tech-primary rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
