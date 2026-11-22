import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WelcomePage } from '../src/components/WelcomePage.tsx';
import { listCategories, listProducts } from '../server/services/catalogService.ts';
import { createTestServer, type TestServerContext } from './testHelper.ts';

let ctx: TestServerContext | null = null;

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
});

describe('Módulo 01: Pantalla de Bienvenida Futurista (6.1)', () => {
  it('carga la ruta de salud del servidor sin errores HTTP', async () => {
    ctx = await createTestServer();
    const res = await fetch(`${ctx.baseUrl}/health`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.app).toBe('ELECTROTECH');
    expect(body.productos).toBeGreaterThanOrEqual(18);
  });

  it('renderiza el título principal, descripción y los botones requeridos', async () => {
    ctx = await createTestServer();
    const categories = listCategories(ctx.db);
    const featured = listProducts(ctx.db, { limit: 3 }).items;

    const html = renderToStaticMarkup(
      React.createElement(WelcomePage, {
        featuredProducts: featured,
        categories,
        onNavigate: () => {},
        onSelectCategory: () => {},
        onInspectProduct: () => {},
        onAddToCart: () => {},
      })
    );

    expect(html).toContain('EL FUTURO DE LA TECNOLOGÍA ESTÁ AQUÍ');
    expect(html).toContain('Descubre una nueva experiencia tecnológica');
    expect(html).toContain('Explorar productos');
    expect(html).toContain('Iniciar sesión');
    expect(html).toContain('Conocer nuestra tienda');
    expect(html).toContain('href="#nuestra-tienda"');
    expect(html).toContain('Experiencias reales de nuestros clientes');
    expect(html).toContain('Testimonio anterior');
    expect(html).toContain('Siguiente testimonio');
  });
});
