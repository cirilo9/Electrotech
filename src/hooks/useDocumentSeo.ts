import { useEffect } from 'react';
import type { Product } from '../../shared/types.ts';
import type { AppView } from '../components/Navbar.tsx';

interface SeoConfig {
  title: string;
  description: string;
  robots: string;
}

const VIEW_SEO: Record<AppView, SeoConfig> = {
  welcome: {
    title: 'ELECTROTECH — Tienda de Tecnología y Hardware',
    description:
      'Explora laptops, smartphones, OLED 4K y componentes de PC en ELECTROTECH. Stock en tiempo real, ofertas exclusivas y despacho seguro.',
    robots: 'index, follow',
  },
  catalog: {
    title: 'Catálogo de Productos Electrónicos | ELECTROTECH',
    description:
      'Busca y compara laptops, computadoras, smartphones, televisores OLED, impresoras y componentes de PC con stock verificado en ELECTROTECH.',
    robots: 'index, follow',
  },
  cart: {
    title: 'Mi Carrito y Checkout | ELECTROTECH',
    description:
      'Revisa tu orden, aplica precios promocionales validados y confirma tu compra electrónica con envío seguro en ELECTROTECH.',
    robots: 'noindex, nofollow',
  },
  login: {
    title: 'Iniciar Sesión | ELECTROTECH',
    description:
      'Accede a tu cuenta de ELECTROTECH para gestionar tus pedidos, historial de compras y panel administrativo.',
    robots: 'noindex, nofollow',
  },
  dashboard: {
    title: 'Panel Administrativo | ELECTROTECH',
    description: 'Indicadores de ventas, métricas de inventario y gestión comercial en ELECTROTECH.',
    robots: 'noindex, nofollow',
  },
};

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(payload: Record<string, unknown>): void {
  const scriptId = 'electrotech-dynamic-jsonld';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}

export function useDocumentSeo(
  view: AppView,
  inspectedProduct: Product | null,
  featuredProducts: Product[]
): void {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const origin = window.location.origin;
    const canonicalUrl = `${origin}${window.location.pathname}`;
    const baseSeo = VIEW_SEO[view];

    const title = inspectedProduct
      ? `${inspectedProduct.nombre} (${inspectedProduct.marca_nombre}) | ELECTROTECH`
      : baseSeo.title;

    const description = inspectedProduct
      ? `${inspectedProduct.descripcion.slice(0, 140)} — $${inspectedProduct.precio_efectivo.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })} en ELECTROTECH.`
      : baseSeo.description;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', baseSeo.robots);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertCanonical(canonicalUrl);

    if (inspectedProduct) {
      const imageUrl = inspectedProduct.imagen_url.startsWith('http')
        ? inspectedProduct.imagen_url
        : `${origin}${inspectedProduct.imagen_url}`;

      upsertJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: inspectedProduct.nombre,
        description: inspectedProduct.descripcion,
        sku: inspectedProduct.modelo,
        image: imageUrl,
        brand: {
          '@type': 'Brand',
          name: inspectedProduct.marca_nombre,
        },
        category: inspectedProduct.categoria_nombre,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: inspectedProduct.calificacion.toFixed(1),
          reviewCount: Math.max(12, Math.round(inspectedProduct.calificacion * 8)),
        },
        offers: {
          '@type': 'Offer',
          url: `${origin}/?producto=${inspectedProduct.id}`,
          priceCurrency: 'USD',
          price: inspectedProduct.precio_efectivo.toFixed(2),
          availability:
            inspectedProduct.stock_actual > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'ELECTROTECH',
          },
        },
      });
      return;
    }

    if ((view === 'welcome' || view === 'catalog') && featuredProducts.length > 0) {
      upsertJsonLd({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Equipos destacados ELECTROTECH',
        itemListElement: featuredProducts.slice(0, 6).map((prod, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: prod.nombre,
            image: prod.imagen_url.startsWith('http') ? prod.imagen_url : `${origin}${prod.imagen_url}`,
            brand: { '@type': 'Brand', name: prod.marca_nombre },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'USD',
              price: prod.precio_efectivo.toFixed(2),
              availability: prod.stock_actual > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          },
        })),
      });
      return;
    }

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonicalUrl,
    });
  }, [view, inspectedProduct, featuredProducts]);
}
