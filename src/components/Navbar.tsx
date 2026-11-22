import { useId, useState } from 'react';
import { LogOut, Menu, ShoppingBag, User, X } from 'lucide-react';
import type { AuthUser } from '../../shared/types.ts';

export type AppView = 'welcome' | 'catalog' | 'cart' | 'login' | 'dashboard';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenCartDrawer?: () => void;
  user: AuthUser | null;
  cartCount: number;
  onLogout: () => void;
}

export function ElectrotechLogo({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const uid = useId().replace(/:/g, '');
  const bgGradId = `et-bg-${uid}`;
  const strokeGradId = `et-stroke-${uid}`;
  const boltGradId = `et-bolt-${uid}`;

  const iconSize = size === 'sm' ? 30 : size === 'lg' ? 42 : 36;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <span className={`group inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 drop-shadow-[0_0_10px_rgba(0,229,255,0.28)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id={bgGradId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#162246" />
            <stop offset="55%" stopColor="#0D152E" />
            <stop offset="100%" stopColor="#1A133B" />
          </linearGradient>
          <linearGradient id={strokeGradId} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id={boltGradId} x1="14" y1="8" x2="26" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Escudo hexagonal de precisión */}
        <path
          d="M20 2.5L35 11.2V28.8L20 37.5L5 28.8V11.2L20 2.5Z"
          fill={`url(#${bgGradId})`}
          stroke={`url(#${strokeGradId})`}
          strokeWidth="1.75"
        />

        {/* Marco interno hexagonal */}
        <path
          d="M20 6.5L31.5 13.1V26.9L20 33.5L8.5 26.9V13.1L20 6.5Z"
          stroke="#38BDF8"
          strokeOpacity="0.25"
          strokeWidth="1"
        />

        {/* Pistas de circuito laterales */}
        <path
          d="M8.5 16H12.5L14.5 14M31.5 24H27.5L25.5 26"
          stroke="#00E5FF"
          strokeOpacity="0.65"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="16" r="1.35" fill="#00E5FF" />
        <circle cx="31.5" cy="24" r="1.35" fill="#A855F7" />

        {/* Rayo central de alto contraste */}
        <path
          d="M22.2 9.5L13.2 21.3H19.4L17.4 30.5L26.8 18.5H20.4L22.2 9.5Z"
          fill={`url(#${boltGradId})`}
        />
      </svg>

      <span className={`font-display ${textSize} font-extrabold tracking-tight text-white`}>
        ELECTRO
        <span className="bg-gradient-to-r from-[#00F5FF] via-[#38BDF8] to-[#A78BFA] bg-clip-text text-transparent">
          TECH
        </span>
      </span>
    </span>
  );
}

export function Navbar({ currentView, onNavigate, onOpenCartDrawer, user, cartCount, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (view: AppView) => {
    setMobileOpen(false);
    onNavigate(view);
  };

  const handleCartClick = () => {
    setMobileOpen(false);
    if (onOpenCartDrawer) {
      onOpenCartDrawer();
    } else {
      onNavigate('cart');
    }
  };

  const navLinkClass = (active: boolean) =>
    `relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] rounded ${
      active
        ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00E5FF]'
        : 'text-slate-300 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-[#0A1022]/85 backdrop-blur-xl shadow-lg shadow-blue-950/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('welcome')}
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] rounded-lg"
          aria-label="Ir al inicio de ELECTROTECH"
        >
          <ElectrotechLogo />
        </button>

        {/* Zone 2: 4 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
          <button type="button" onClick={() => handleNav('welcome')} className={navLinkClass(currentView === 'welcome')}>
            Inicio
          </button>
          <button type="button" onClick={() => handleNav('catalog')} className={navLinkClass(currentView === 'catalog')}>
            Catálogo
          </button>
          <button
            type="button"
            onClick={handleCartClick}
            className={`${navLinkClass(currentView === 'cart')} inline-flex items-center gap-1.5 cursor-pointer`}
            aria-label="Abrir drawer lateral del carrito"
          >
            <ShoppingBag className="h-4 w-4 text-[#00E5FF]" />
            <span>Mi Carrito</span>
            <span className="font-mono text-xs tabular-nums text-[#00E5FF]">({cartCount})</span>
          </button>
          {user?.rol === 'Administrador' && (
            <button
              type="button"
              onClick={() => handleNav('dashboard')}
              className={navLinkClass(currentView === 'dashboard')}
            >
              Dashboard
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-200 whitespace-nowrap max-w-[180px] truncate">
                <User className="mr-1.5 inline h-3.5 w-3.5 text-[#00E5FF]" />
                {user.nombre}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-[#131D38] px-3.5 py-2 text-xs font-medium text-slate-100 transition-colors hover:border-[#00E5FF] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-[#00E5FF]" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleNav('login')}
              className="btn-tech-primary rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
            >
              Iniciar sesión
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={handleCartClick}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-white cursor-pointer"
            aria-label="Abrir carrito"
          >
            <ShoppingBag className="h-4 w-4 text-[#00E5FF]" />
            <span className="font-mono tabular-nums">{cartCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-200 hover:text-white"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-[#0B1020] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleNav('welcome')}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-800/70"
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => handleNav('catalog')}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-800/70"
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={handleCartClick}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-800/70"
            >
              Mi Carrito ({cartCount})
            </button>
            {user?.rol === 'Administrador' && (
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#00E5FF] hover:bg-slate-800/70"
              >
                Dashboard Administrativo
              </button>
            )}
            <div className="mt-2 border-t border-slate-800 pt-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="w-full rounded-lg border border-slate-700 px-3 py-2.5 text-left text-sm font-medium text-slate-200"
                >
                  Cerrar sesión ({user.nombre})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
