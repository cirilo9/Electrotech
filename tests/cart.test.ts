import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestServer, type TestServerContext } from './testHelper.ts';
import { CartDrawer } from '../src/components/CartDrawer.tsx';
import type { CartSummary } from '../shared/types.ts';

let ctx: TestServerContext | null = null;

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
});

describe('Módulo 05: Carrito de Compras y Checkout (6.5)', () => {
  const sessionHeaders = {
    'Content-Type': 'application/json',
    'x-cart-session': 'test-session-cart-01',
  };

  it('agrega productos, evita duplicaciones incorrectas e incrementa/disminuye cantidades', async () => {
    ctx = await createTestServer();

    const add1 = await fetch(`${ctx.baseUrl}/cart/items`, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({ producto_id: 1, cantidad: 1 }),
    });
    expect(add1.status).toBe(201);

    // Agregar el mismo producto incrementa cantidad en la misma fila
    const add2 = await fetch(`${ctx.baseUrl}/cart/items`, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({ producto_id: 1, cantidad: 2 }),
    });
    const cart2 = await add2.json();
    expect(cart2.items).toHaveLength(1);
    expect(cart2.items[0].cantidad).toBe(3);
    expect(cart2.total_pagar).toBeCloseTo(cart2.items[0].precio_unitario * 3, 2);

    // Disminuir cantidad
    const decRes = await fetch(`${ctx.baseUrl}/cart/items/1`, {
      method: 'PATCH',
      headers: sessionHeaders,
      body: JSON.stringify({ cantidad: 1 }),
    });
    const decCart = await decRes.json();
    expect(decCart.items[0].cantidad).toBe(1);

    // Eliminar producto
    const delRes = await fetch(`${ctx.baseUrl}/cart/items/1`, {
      method: 'DELETE',
      headers: sessionHeaders,
    });
    const delCart = await delRes.json();
    expect(delCart.items).toHaveLength(0);
    expect(delCart.total_pagar).toBe(0);
  });

  it('valida stock disponible, rechaza cantidades negativas y productos inexistentes', async () => {
    ctx = await createTestServer();

    // Producto inexistente
    const notFound = await fetch(`${ctx.baseUrl}/cart/items`, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({ producto_id: 99999, cantidad: 1 }),
    });
    expect(notFound.status).toBe(404);

    // Cantidad negativa al agregar
    const negAdd = await fetch(`${ctx.baseUrl}/cart/items`, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({ producto_id: 1, cantidad: -2 }),
    });
    expect(negAdd.status).toBe(400);

    // Exceder stock disponible (producto 17 tiene stock 2)
    const overStock = await fetch(`${ctx.baseUrl}/cart/items`, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({ producto_id: 17, cantidad: 99 }),
    });
    expect(overStock.status).toBe(409);

    // Agregar 1 unidad válida y luego intentar actualizar a -1
    await fetch(`${ctx.baseUrl}/cart/items`, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({ producto_id: 17, cantidad: 1 }),
    });
    const negPatch = await fetch(`${ctx.baseUrl}/cart/items/17`, {
      method: 'PATCH',
      headers: sessionHeaders,
      body: JSON.stringify({ cantidad: -5 }),
    });
    expect(negPatch.status).toBe(400);
  });

  it('procesa checkout transaccional, calcula totales en backend y descuenta stock', async () => {
    ctx = await createTestServer();

    const loginRes = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cliente@electrotech.pe', password: 'Cliente2026!' }),
    });
    const { token } = await loginRes.json();

    // Producto 17 tiene stock inicial 2
    await fetch(`${ctx.baseUrl}/cart/items`, {
      method: 'POST',
      headers: { ...sessionHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ producto_id: 17, cantidad: 1 }),
    });

    const checkoutRes = await fetch(`${ctx.baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: { ...sessionHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        direccion_envio: 'Av. Javier Prado 4200, Lima',
        metodo_pago: 'Tarjeta de Crédito',
      }),
    });
    const checkoutBody = await checkoutRes.json();

    expect(checkoutRes.status).toBe(201);
    expect(checkoutBody.order.codigo_pedido).toMatch(/^ET-/);
    expect(checkoutBody.order.total).toBe(1299);

    // Verificar descuento de inventario (2 - 1 = 1)
    const prodRes = await fetch(`${ctx.baseUrl}/catalog/products/17`);
    const prodBody = await prodRes.json();
    expect(prodBody.item.stock_actual).toBe(1);
  });

  it('renderiza el drawer lateral de carrito en estados vacío, con productos y cerrado', () => {
    const emptyCart: CartSummary = {
      carrito_id: 1,
      items: [],
      total_unidades: 0,
      subtotal_lista: 0,
      descuento_total: 0,
      total_pagar: 0,
    };

    const closedHtml = renderToStaticMarkup(
      React.createElement(CartDrawer, {
        isOpen: false,
        onClose: () => {},
        cart: emptyCart,
        onCartUpdated: () => {},
        onNavigate: () => {},
      })
    );
    expect(closedHtml).toBe('');

    const emptyHtml = renderToStaticMarkup(
      React.createElement(CartDrawer, {
        isOpen: true,
        onClose: () => {},
        cart: emptyCart,
        onCartUpdated: () => {},
        onNavigate: () => {},
      })
    );
    expect(emptyHtml).toContain('Mi Carrito');
    expect(emptyHtml).toContain('Tu carrito está vacío');
    expect(emptyHtml).toContain('Explorar catálogo');

    const populatedCart: CartSummary = {
      carrito_id: 2,
      items: [
        {
          id: 10,
          producto_id: 1,
          nombre: 'ElectroBook Pro 16',
          modelo: 'EB-P16-2026',
          marca_nombre: 'NovaCore',
          categoria_nombre: 'Laptops',
          imagen_url: '/src/assets/images/prod_laptop_pro_1795190964479.jpg',
          cantidad: 2,
          precio_lista: 1899,
          precio_unitario: 1699,
          descuento_unitario: 200,
          subtotal: 3398,
          stock_disponible: 12,
        },
      ],
      total_unidades: 2,
      subtotal_lista: 3798,
      descuento_total: 400,
      total_pagar: 3398,
    };

    const populatedHtml = renderToStaticMarkup(
      React.createElement(CartDrawer, {
        isOpen: true,
        onClose: () => {},
        cart: populatedCart,
        onCartUpdated: () => {},
        onNavigate: () => {},
      })
    );
    expect(populatedHtml).toContain('ElectroBook Pro 16');
    expect(populatedHtml).toContain('2 unidades seleccionadas');
    expect(populatedHtml).toContain('3,398.00');
    expect(populatedHtml).toContain('Descuentos promocionales');
    expect(populatedHtml).toContain('Ir a finalizar compra');
    expect(populatedHtml).toContain('Seguir comprando');
  });
});
