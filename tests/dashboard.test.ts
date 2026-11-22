import { afterEach, describe, expect, it } from 'vitest';
import { createTestServer, type TestServerContext } from './testHelper.ts';

let ctx: TestServerContext | null = null;

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
});

describe('Módulo 03: Dashboard Administrativo (6.3)', () => {
  it('carga indicadores reales de productos, clientes, ventas e ingresos para Administrador', async () => {
    ctx = await createTestServer();

    const loginRes = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@electrotech.pe', password: 'Admin2026!' }),
    });
    const { token } = await loginRes.json();

    const dashRes = await fetch(`${ctx.baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await dashRes.json();

    expect(dashRes.status).toBe(200);
    expect(data.kpis.totalProductos).toBe(18);
    expect(data.kpis.totalClientes).toBe(5);
    expect(data.kpis.ventasRealizadas).toBe(8);
    expect(data.kpis.ingresosTotales).toBeGreaterThan(0);
    expect(data.kpis.productosDisponibles).toBe(18);
    expect(data.kpis.productosStockBajo).toBe(3);
    expect(data.kpis.pedidosRegistrados).toBe(8);
    expect(data.ventasMensuales.length).toBeGreaterThan(0);
    expect(data.productosMasVendidos.length).toBeGreaterThan(0);
    expect(data.ultimosPedidos.length).toBeGreaterThan(0);
  });

  it('permite al administrador reponer inventario y crear nuevos productos', async () => {
    ctx = await createTestServer();

    const loginRes = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@electrotech.pe', password: 'Admin2026!' }),
    });
    const { token } = await loginRes.json();

    const restockRes = await fetch(`${ctx.baseUrl}/admin/inventory/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock_actual: 30 }),
    });
    const restockBody = await restockRes.json();
    expect(restockRes.status).toBe(200);
    expect(restockBody.item.stock_actual).toBe(30);

    const createRes = await fetch(`${ctx.baseUrl}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        categoria_id: 1,
        marca_id: 1,
        nombre: 'MacBook Air M4 15',
        modelo: 'MBA15-M4-2026',
        descripcion: 'Ultrabook ligero de alto rendimiento.',
        precio: 1699,
        stock_actual: 12,
      }),
    });
    expect(createRes.status).toBe(201);
  });
});
