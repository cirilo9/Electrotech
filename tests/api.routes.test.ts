
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServer, type TestServerContext } from './testHelper.ts';

let ctx: TestServerContext | null = null;

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
});

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${ctx!.baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();
  expect(response.status).toBe(200);
  return body.token;
}

describe('API ELECTROTECH: Cobertura adicional de rutas', () => {

  it('consulta categorías, marcas y verifica encabezados de caché', async () => {
    ctx = await createTestServer();

    const categories = await fetch(`${ctx.baseUrl}/catalog/categories`);
    expect(categories.status).toBe(200);
    expect(Array.isArray((await categories.json()).items)).toBe(true);

    const brands = await fetch(`${ctx.baseUrl}/catalog/brands`);
    expect(brands.status).toBe(200);
    expect(brands.headers.get('cache-control')).toContain('max-age=60');
    expect(Array.isArray((await brands.json()).items)).toBe(true);
  });

  it('rechaza identificadores de productos inválidos', async () => {
    ctx = await createTestServer();

    const invalid = await fetch(`${ctx.baseUrl}/catalog/products/abc`);
    expect(invalid.status).toBe(400);

    const negative = await fetch(`${ctx.baseUrl}/catalog/products/-1`);
    expect(negative.status).toBe(400);

    const missing = await fetch(`${ctx.baseUrl}/catalog/products/99999`);
    expect(missing.status).toBe(404);
  });

  it('consulta el perfil del cliente y sus pedidos autenticados', async () => {
    ctx = await createTestServer();

    const unauthorized = await fetch(`${ctx.baseUrl}/auth/me`);
    expect(unauthorized.status).toBe(401);

    const token = await login(
      'cliente@electrotech.pe',
      'Cliente2026!'
    );

    const profile = await fetch(`${ctx.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profileBody = await profile.json();

    expect(profile.status).toBe(200);
    expect(profileBody.user.email).toBe('cliente@electrotech.pe');
    expect(profileBody.user.rol).toBe('Cliente');

    const orders = await fetch(`${ctx.baseUrl}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(orders.status).toBe(200);
    expect(Array.isArray((await orders.json()).items)).toBe(true);
  });

  it('maneja tokens inválidos al consultar el carrito de invitado', async () => {
    ctx = await createTestServer();

    const response = await fetch(`${ctx.baseUrl}/cart`, {
      headers: {
        Authorization: 'Bearer token-invalido',
        'x-cart-session': 'session-invalid-token',
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('protege la administración de inventario según el rol', async () => {
    ctx = await createTestServer();

    const anonymous = await fetch(
      `${ctx.baseUrl}/admin/inventory/1`,
      { method: 'PATCH' }
    );

    expect(anonymous.status).toBe(401);

    const clientToken = await login(
      'cliente@electrotech.pe',
      'Cliente2026!'
    );

    const forbidden = await fetch(
      `${ctx.baseUrl}/admin/inventory/1`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock_actual: 20 }),
      }
    );

    expect(forbidden.status).toBe(403);

    const adminToken = await login(
      'admin@electrotech.pe',
      'Admin2026!'
    );

    const missing = await fetch(
      `${ctx.baseUrl}/admin/inventory/99999`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock_actual: 20 }),
      }
    );

    expect(missing.status).toBe(404);
  });

  it('valida los estados de pedidos y controla el acceso administrativo', async () => {
    ctx = await createTestServer();

    const clientToken = await login(
      'cliente@electrotech.pe',
      'Cliente2026!'
    );

    const forbidden = await fetch(
      `${ctx.baseUrl}/admin/orders/1/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'Enviado' }),
      }
    );

    expect(forbidden.status).toBe(403);

    const adminToken = await login(
      'admin@electrotech.pe',
      'Admin2026!'
    );

    const invalid = await fetch(
      `${ctx.baseUrl}/admin/orders/1/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'EstadoIncorrecto' }),
      }
    );

    expect(invalid.status).toBe(400);

    const order = ctx.db.prepare(
      'SELECT id FROM pedidos LIMIT 1'
    ).get() as { id: number } | undefined;

    expect(order).toBeDefined();

    if (!order) {
      throw new Error('No existen pedidos de prueba.');
    }

    const updated = await fetch(
      `${ctx.baseUrl}/admin/orders/${order.id}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'Confirmado' }),
      }
    );

    expect(updated.status).toBe(200);

    const body = await updated.json();
    expect(body.ok).toBe(true);
    expect(body.estado).toBe('Confirmado');
  });

});
