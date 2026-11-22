import { DatabaseSync } from 'node:sqlite';
import type { CartItem, CartSummary, CheckoutPayload, OrderConfirmation } from '../../shared/types.ts';

export class CartError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface CartIdentity {
  usuarioId?: number | null;
  sessionId?: string | null;
}

export function getOrCreateCartId(db: DatabaseSync, identity: CartIdentity): number {
  const { usuarioId, sessionId } = identity;
  if (!usuarioId && !sessionId) {
    throw new CartError('Se requiere identificador de sesión o usuario autenticado.', 400);
  }

  if (usuarioId) {
    const existing = db.prepare(
      "SELECT id FROM carritos WHERE usuario_id = ? AND estado = 'activo' ORDER BY id DESC LIMIT 1"
    ).get(usuarioId) as { id: number } | undefined;

    if (existing) {
      return existing.id;
    }

    if (sessionId) {
      const guestCart = db.prepare(
        "SELECT id FROM carritos WHERE session_id = ? AND usuario_id IS NULL AND estado = 'activo' ORDER BY id DESC LIMIT 1"
      ).get(sessionId) as { id: number } | undefined;

      if (guestCart) {
        db.prepare("UPDATE carritos SET usuario_id = ?, updated_at = datetime('now') WHERE id = ?").run(usuarioId, guestCart.id);
        return guestCart.id;
      }
    }

    const res = db.prepare(
      "INSERT INTO carritos (usuario_id, session_id, estado) VALUES (?, ?, 'activo')"
    ).run(usuarioId, sessionId || null);
    return Number(res.lastInsertRowid);
  }

  const guestExisting = db.prepare(
    "SELECT id FROM carritos WHERE session_id = ? AND estado = 'activo' ORDER BY id DESC LIMIT 1"
  ).get(sessionId!) as { id: number } | undefined;

  if (guestExisting) {
    return guestExisting.id;
  }

  const res = db.prepare(
    "INSERT INTO carritos (usuario_id, session_id, estado) VALUES (NULL, ?, 'activo')"
  ).run(sessionId!);
  return Number(res.lastInsertRowid);
}

export function getCartSummary(db: DatabaseSync, identity: CartIdentity): CartSummary {
  const carritoId = getOrCreateCartId(db, identity);

  const rows = db.prepare(`
    SELECT cd.id, cd.producto_id, cd.cantidad,
           p.nombre, p.modelo, p.imagen_url, p.precio, p.precio_promocional,
           m.nombre AS marca_nombre, c.nombre AS categoria_nombre,
           i.stock_actual AS stock_disponible
    FROM carrito_detalles cd
    INNER JOIN productos p ON p.id = cd.producto_id
    INNER JOIN marcas m ON m.id = p.marca_id
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN inventario i ON i.producto_id = p.id
    WHERE cd.carrito_id = ? AND p.activo = 1
    ORDER BY cd.id ASC
  `).all(carritoId) as Array<{
    id: number;
    producto_id: number;
    cantidad: number;
    nombre: string;
    modelo: string;
    imagen_url: string;
    precio: number;
    precio_promocional: number | null;
    marca_nombre: string;
    categoria_nombre: string;
    stock_disponible: number;
  }>;

  let totalUnidades = 0;
  let subtotalLista = 0;
  let descuentoTotal = 0;
  let totalPagar = 0;

  const items: CartItem[] = rows.map((row) => {
    const precioLista = Number(row.precio);
    const precioUnitario = row.precio_promocional !== null ? Number(row.precio_promocional) : precioLista;
    const descuentoUnitario = Number((precioLista - precioUnitario).toFixed(2));
    const subtotal = Number((precioUnitario * row.cantidad).toFixed(2));

    totalUnidades += row.cantidad;
    subtotalLista = Number((subtotalLista + precioLista * row.cantidad).toFixed(2));
    descuentoTotal = Number((descuentoTotal + descuentoUnitario * row.cantidad).toFixed(2));
    totalPagar = Number((totalPagar + subtotal).toFixed(2));

    return {
      id: row.id,
      producto_id: row.producto_id,
      nombre: row.nombre,
      modelo: row.modelo,
      marca_nombre: row.marca_nombre,
      categoria_nombre: row.categoria_nombre,
      imagen_url: row.imagen_url,
      cantidad: row.cantidad,
      precio_lista: precioLista,
      precio_unitario: precioUnitario,
      subtotal,
      descuento_unitario: descuentoUnitario,
      stock_disponible: Number(row.stock_disponible),
    };
  });

  return {
    carrito_id: carritoId,
    items,
    total_unidades: totalUnidades,
    subtotal_lista: subtotalLista,
    descuento_total: descuentoTotal,
    total_pagar: totalPagar,
  };
}

export function addToCart(
  db: DatabaseSync,
  identity: CartIdentity,
  productoId: number,
  cantidad: number
): CartSummary {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new CartError('La cantidad debe ser un número entero mayor a cero.', 400);
  }

  const product = db.prepare(`
    SELECT p.id, p.nombre, p.activo, i.stock_actual
    FROM productos p
    INNER JOIN inventario i ON i.producto_id = p.id
    WHERE p.id = ?
  `).get(productoId) as { id: number; nombre: string; activo: number; stock_actual: number } | undefined;

  if (!product || !product.activo) {
    throw new CartError('El producto solicitado no existe o no está disponible.', 404);
  }
  if (product.stock_actual <= 0) {
    throw new CartError(`El producto "${product.nombre}" se encuentra sin stock disponible.`, 409);
  }

  const carritoId = getOrCreateCartId(db, identity);

  const existingItem = db.prepare(
    'SELECT id, cantidad FROM carrito_detalles WHERE carrito_id = ? AND producto_id = ?'
  ).get(carritoId, productoId) as { id: number; cantidad: number } | undefined;

  const nuevaCantidad = (existingItem ? existingItem.cantidad : 0) + cantidad;
  if (nuevaCantidad > product.stock_actual) {
    throw new CartError(
      `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock_actual} unidades.`,
      409
    );
  }

  if (existingItem) {
    db.prepare('UPDATE carrito_detalles SET cantidad = ? WHERE id = ?').run(nuevaCantidad, existingItem.id);
  } else {
    db.prepare('INSERT INTO carrito_detalles (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)').run(
      carritoId,
      productoId,
      nuevaCantidad
    );
  }
  db.prepare("UPDATE carritos SET updated_at = datetime('now') WHERE id = ?").run(carritoId);

  return getCartSummary(db, identity);
}

export function updateCartItemQuantity(
  db: DatabaseSync,
  identity: CartIdentity,
  productoId: number,
  cantidad: number
): CartSummary {
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    throw new CartError('La cantidad ingresada no es válida. No se permiten valores negativos.', 400);
  }

  const carritoId = getOrCreateCartId(db, identity);
  const existing = db.prepare(
    'SELECT id FROM carrito_detalles WHERE carrito_id = ? AND producto_id = ?'
  ).get(carritoId, productoId) as { id: number } | undefined;

  if (!existing) {
    throw new CartError('El producto no se encuentra en tu carrito.', 404);
  }

  if (cantidad === 0) {
    db.prepare('DELETE FROM carrito_detalles WHERE id = ?').run(existing.id);
    db.prepare("UPDATE carritos SET updated_at = datetime('now') WHERE id = ?").run(carritoId);
    return getCartSummary(db, identity);
  }

  const inv = db.prepare(`
    SELECT p.nombre, i.stock_actual
    FROM productos p
    INNER JOIN inventario i ON i.producto_id = p.id
    WHERE p.id = ?
  `).get(productoId) as { nombre: string; stock_actual: number } | undefined;

  if (!inv) {
    throw new CartError('Producto no encontrado en inventario.', 404);
  }
  if (cantidad > inv.stock_actual) {
    throw new CartError(
      `Cantidad solicitada supera el stock disponible de "${inv.nombre}" (${inv.stock_actual} unidades).`,
      409
    );
  }

  db.prepare('UPDATE carrito_detalles SET cantidad = ? WHERE id = ?').run(cantidad, existing.id);
  db.prepare("UPDATE carritos SET updated_at = datetime('now') WHERE id = ?").run(carritoId);
  return getCartSummary(db, identity);
}

export function removeFromCart(db: DatabaseSync, identity: CartIdentity, productoId: number): CartSummary {
  const carritoId = getOrCreateCartId(db, identity);
  db.prepare('DELETE FROM carrito_detalles WHERE carrito_id = ? AND producto_id = ?').run(carritoId, productoId);
  db.prepare("UPDATE carritos SET updated_at = datetime('now') WHERE id = ?").run(carritoId);
  return getCartSummary(db, identity);
}

export function checkoutCart(
  db: DatabaseSync,
  usuarioId: number,
  payload: CheckoutPayload,
  sessionId?: string | null
): OrderConfirmation {
  const direccion = (payload.direccion_envio || '').trim();
  if (direccion.length < 5) {
    throw new CartError('Ingresa una dirección de envío válida para confirmar el pedido.', 400);
  }

  const cliente = db.prepare('SELECT id FROM clientes WHERE usuario_id = ?').get(usuarioId) as
    | { id: number }
    | undefined;
  if (!cliente) {
    throw new CartError('Perfil de cliente no encontrado para procesar el pedido.', 404);
  }

  const summary = getCartSummary(db, { usuarioId, sessionId });
  if (summary.items.length === 0) {
    throw new CartError('Tu carrito está vacío. Agrega productos antes de confirmar el pedido.', 400);
  }

  const codigoPedido = `ET-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 899999))}`;
  const referencia = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`;

  db.exec('BEGIN;');
  try {
    // Recheck stock inside transaction
    for (const item of summary.items) {
      const inv = db.prepare('SELECT stock_actual FROM inventario WHERE producto_id = ?').get(item.producto_id) as
        | { stock_actual: number }
        | undefined;
      if (!inv || inv.stock_actual < item.cantidad) {
        throw new CartError(
          `Stock insuficiente para "${item.nombre}" al momento de confirmar.`,
          409
        );
      }
      db.prepare("UPDATE inventario SET stock_actual = stock_actual - ?, updated_at = datetime('now') WHERE producto_id = ?").run(
        item.cantidad,
        item.producto_id
      );
    }

    const pedRes = db.prepare(`
      INSERT INTO pedidos (usuario_id, cliente_id, codigo_pedido, subtotal, descuento, total, estado, direccion_envio, notas)
      VALUES (?, ?, ?, ?, ?, ?, 'Confirmado', ?, ?)
    `).run(
      usuarioId,
      cliente.id,
      codigoPedido,
      summary.subtotal_lista,
      summary.descuento_total,
      summary.total_pagar,
      direccion,
      (payload.notas || '').trim()
    );
    const pedidoId = Number(pedRes.lastInsertRowid);

    const insertDet = db.prepare(`
      INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of summary.items) {
      insertDet.run(pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal);
    }

    db.prepare(`
      INSERT INTO pagos (pedido_id, metodo_pago, monto, estado_pago, referencia_transaccion)
      VALUES (?, ?, ?, 'Aprobado', ?)
    `).run(pedidoId, payload.metodo_pago || 'Tarjeta de Crédito', summary.total_pagar, referencia);

    db.prepare('DELETE FROM carrito_detalles WHERE carrito_id = ?').run(summary.carrito_id);
    db.prepare("UPDATE carritos SET estado = 'convertido', updated_at = datetime('now') WHERE id = ?").run(
      summary.carrito_id
    );

    db.exec('COMMIT;');

    const created = db.prepare('SELECT created_at FROM pedidos WHERE id = ?').get(pedidoId) as { created_at: string };

    return {
      pedido_id: pedidoId,
      codigo_pedido: codigoPedido,
      subtotal: summary.subtotal_lista,
      descuento: summary.descuento_total,
      total: summary.total_pagar,
      estado: 'Confirmado',
      metodo_pago: payload.metodo_pago || 'Tarjeta de Crédito',
      referencia_transaccion: referencia,
      direccion_envio: direccion,
      created_at: created.created_at,
      items: summary.items.map((it) => ({
        producto_id: it.producto_id,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        subtotal: it.subtotal,
      })),
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
