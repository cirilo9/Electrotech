import { afterEach, describe, expect, it } from 'vitest';
import { createTestServer, type TestServerContext } from './testHelper.ts';

let ctx: TestServerContext | null = null;

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
});

describe('Módulo 04: Catálogo de Productos (6.4)', () => {
  it('muestra productos registrados y las 9 categorías requeridas', async () => {
    ctx = await createTestServer();

    const catRes = await fetch(`${ctx.baseUrl}/catalog/categories`);
    const catBody = await catRes.json();
    expect(catRes.status).toBe(200);
    expect(catBody.items).toHaveLength(9);

    const prodRes = await fetch(`${ctx.baseUrl}/catalog/products?limit=20`);
    const prodBody = await prodRes.json();
    expect(prodRes.status).toBe(200);
    expect(prodBody.total).toBe(18);
  });

  it('busca productos por nombre, filtra por categoría y marca, y valida precios', async () => {
    ctx = await createTestServer();

    const searchRes = await fetch(`${ctx.baseUrl}/catalog/products?search=MacBook`);
    const searchBody = await searchRes.json();
    expect(searchBody.items.length).toBeGreaterThanOrEqual(1);
    expect(searchBody.items[0].nombre).toContain('MacBook');
    expect(searchBody.items[0].precio_efectivo).toBeLessThanOrEqual(searchBody.items[0].precio);
    expect(searchBody.items[0].stock_actual).toBeGreaterThan(0);

    const descSearchRes = await fetch(`${ctx.baseUrl}/catalog/products?search=titanio`);
    const descSearchBody = await descSearchRes.json();
    expect(descSearchBody.items.length).toBeGreaterThanOrEqual(1);
    expect(descSearchBody.items.some((p: { descripcion: string }) => p.descripcion.toLowerCase().includes('titanio'))).toBe(true);

    const catRes = await fetch(`${ctx.baseUrl}/catalog/products?categoria=smartphones`);
    const catBody = await catRes.json();
    expect(catBody.items.every((p: { categoria_slug: string }) => p.categoria_slug === 'smartphones')).toBe(true);

    const brandRes = await fetch(`${ctx.baseUrl}/catalog/products?marca=NVIDIA`);
    const brandBody = await brandRes.json();
    expect(brandBody.items.every((p: { marca_nombre: string }) => p.marca_nombre === 'NVIDIA')).toBe(true);
  });

  it('consulta detalles de un producto y maneja búsquedas sin resultados', async () => {
    ctx = await createTestServer();

    const detailRes = await fetch(`${ctx.baseUrl}/catalog/products/1`);
    const detailBody = await detailRes.json();
    expect(detailRes.status).toBe(200);
    expect(detailBody.item.id).toBe(1);

    const notFoundRes = await fetch(`${ctx.baseUrl}/catalog/products/9999`);
    expect(notFoundRes.status).toBe(404);

    const emptyRes = await fetch(`${ctx.baseUrl}/catalog/products?search=DispositivoInexistenteXYZ`);
    const emptyBody = await emptyRes.json();
    expect(emptyRes.status).toBe(200);
    expect(emptyBody.items).toEqual([]);
    expect(emptyBody.total).toBe(0);
  });
});
