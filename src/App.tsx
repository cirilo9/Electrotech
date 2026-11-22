import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { api, getStoredToken, setStoredToken } from './services/api.ts';
import type { AuthUser, Brand, CartSummary, Category, Product } from '../shared/types.ts';
import { Navbar, type AppView } from './components/Navbar.tsx';
import { WelcomePage } from './components/WelcomePage.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { Footer } from './components/Footer.tsx';
import { useDocumentSeo } from './hooks/useDocumentSeo.ts';

const LoginPage = lazy(() =>
  import('./components/LoginPage.tsx').then((m) => ({ default: m.LoginPage }))
);
const CatalogPage = lazy(() =>
  import('./components/CatalogPage.tsx').then((m) => ({ default: m.CatalogPage }))
);
const CartPage = lazy(() =>
  import('./components/CartPage.tsx').then((m) => ({ default: m.CartPage }))
);
const DashboardPage = lazy(() =>
  import('./components/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage }))
);
const ProductDetailModal = lazy(() =>
  import('./components/ProductDetailModal.tsx').then((m) => ({ default: m.ProductDetailModal }))
);

const EMPTY_CART: CartSummary = {
  carrito_id: 0,
  items: [],
  total_unidades: 0,
  subtotal_lista: 0,
  descuento_total: 0,
  total_pagar: 0,
};

function ViewFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8" aria-busy="true" aria-label="Cargando sección">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-800/80" />
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-800/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-800/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-800/60" />
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>('welcome');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartSummary>(EMPTY_CART);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useDocumentSeo(view, inspectedProduct, featuredProducts);

  const loadBootstrapData = useCallback(async () => {
    try {
      const [catRes, brandRes, prodRes, cartRes] = await Promise.all([
        api.getCategories(),
        api.getBrands(),
        api.getProducts({ limit: 3, sort: 'destacados' }),
        api.getCart(),
      ]);
      setCategories(catRes.items);
      setBrands(brandRes.items);
      setFeaturedProducts(prodRes.items);
      setCart(cartRes);
    } catch (err) {
      console.error('Error cargando datos iniciales de ELECTROTECH:', err);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view');
    const initialCategory = params.get('categoria');
    const initialProductId = Number(params.get('producto'));

    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setView('catalog');
    } else if (initialView === 'catalog' || initialView === 'cart' || initialView === 'login') {
      setView(initialView);
    }

    if (Number.isInteger(initialProductId) && initialProductId > 0) {
      setView('catalog');
      api
        .getProductById(initialProductId)
        .then((res) => setInspectedProduct(res.item))
        .catch(() => {});
    }

    const token = getStoredToken();
    if (token) {
      api
        .getMe()
        .then((res) => setUser(res.user))
        .catch(() => setStoredToken(null, false));
    }
    loadBootstrapData();
  }, [loadBootstrapData]);

  const handleNavigate = (nextView: AppView) => {
    setCartDrawerOpen(false);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = async (loggedUser: AuthUser, token: string, remember: boolean) => {
    setStoredToken(token, remember);
    setUser(loggedUser);
    const updatedCart = await api.getCart().catch(() => EMPTY_CART);
    setCart(updatedCart);

    if (loggedUser.rol === 'Administrador') {
      handleNavigate('dashboard');
    } else if (updatedCart.total_unidades > 0) {
      handleNavigate('cart');
    } else {
      handleNavigate('catalog');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken(null, false);
    setUser(null);
    const guestCart = await api.getCart().catch(() => EMPTY_CART);
    setCart(guestCart);
    handleNavigate('welcome');
    await Swal.fire({
      icon: 'info',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión correctamente.',
      timer: 1400,
      showConfirmButton: false,
      background: '#0F172A',
      color: '#F8FAFC',
    });
  };

  const handleAddToCart = async (product: Product, cantidad = 1) => {
    try {
      const updated = await api.addToCart(product.id, cantidad);
      setCart(updated);
      setCartDrawerOpen(true);
    } catch (err) {
      await Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: err instanceof Error ? err.message : 'No se pudo agregar al carrito.',
        background: '#0F172A',
        color: '#F8FAFC',
        confirmButtonColor: '#2563EB',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#080B16] text-white">
      <Navbar
        currentView={view}
        onNavigate={handleNavigate}
        onOpenCartDrawer={() => setCartDrawerOpen(true)}
        user={user}
        cartCount={cart.total_unidades}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {view === 'welcome' && (
          <WelcomePage
            featuredProducts={featuredProducts}
            categories={categories}
            onNavigate={handleNavigate}
            onSelectCategory={setSelectedCategory}
            onInspectProduct={setInspectedProduct}
            onAddToCart={(p) => handleAddToCart(p, 1)}
          />
        )}

        <Suspense fallback={<ViewFallback />}>
          {view === 'login' && (
            <LoginPage onSuccess={handleLoginSuccess} onCancel={() => handleNavigate('welcome')} />
          )}

          {view === 'catalog' && (
            <CatalogPage
              categories={categories}
              brands={brands}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onInspectProduct={setInspectedProduct}
              onAddToCart={(p) => handleAddToCart(p, 1)}
            />
          )}

          {view === 'cart' && (
            <CartPage cart={cart} user={user} onCartUpdated={setCart} onNavigate={handleNavigate} />
          )}

          {view === 'dashboard' && (
            <DashboardPage
              user={user}
              categories={categories}
              brands={brands}
              onNavigate={handleNavigate}
              onCatalogMutated={loadBootstrapData}
            />
          )}
        </Suspense>
      </main>

      <Footer onNavigate={handleNavigate} />

      <Suspense fallback={null}>
        {inspectedProduct && (
          <ProductDetailModal
            product={inspectedProduct}
            onClose={() => setInspectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </Suspense>

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        onCartUpdated={setCart}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
