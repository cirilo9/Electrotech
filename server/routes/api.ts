import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import {
  AuthError,
  getUserById,
  loginUser,
  recoverPassword,
  registerClient,
  verifyToken,
} from '../services/authService.ts';
import {
  createProduct,
  getProductById,
  listBrands,
  listCategories,
  listProducts,
  updateProductStock,
} from '../services/catalogService.ts';
import {
  addToCart,
  CartError,
  checkoutCart,
  getCartSummary,
  removeFromCart,
  updateCartItemQuantity,
} from '../services/cartService.ts';
import { getDashboardMetrics } from '../services/dashboardService.ts';
import type { AuthUser, CatalogQuery, UserRole } from '../../shared/types.ts';

interface AuthenticatedRequest extends express.Request {
  authUser?: AuthUser;
}

export function createApiRouter(db: DatabaseSync): express.Router {
  const router = express.Router();

  const extractUser = (req: express.Request): AuthUser | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    const payload = verifyToken(token);
    return getUserById(db, payload.sub);
  };

  const requireAuth = (roles?: UserRole[]): express.RequestHandler => {
    return (req: AuthenticatedRequest, res, next) => {
      try {
        const user = extractUser(req);
        if (!user) {
          res.status(401).json({ error: 'Acceso no autorizado. Debes iniciar sesión.' });
          return;
        }
        if (roles && !roles.includes(user.rol)) {
          res.status(403).json({ error: 'No tienes permisos suficientes para acceder a este recurso.' });
          return;
        }
        req.authUser = user;
        next();
      } catch (err) {
        if (err instanceof AuthError) {
          res.status(err.statusCode).json({ error: err.message });
          return;
        }
        res.status(401).json({ error: 'Token inválido.' });
      }
    };
  };

  const getCartIdentity = (req: express.Request) => {
    let usuarioId: number | null = null;
    try {
      const user = extractUser(req);
      if (user) usuarioId = user.id;
    } catch {
      usuarioId = null;
    }
    const sessionId = (req.headers['x-cart-session'] as string | undefined) || 'guest-default-session';
    return { usuarioId, sessionId };
  };

  // Healthcheck
  router.get('/health', (_req, res) => {
    const row = db.prepare('SELECT COUNT(*) AS productos FROM productos').get() as { productos: number };
    res.json({ ok: true, app: 'ELECTROTECH', productos: row.productos });
  });

  // Auth routes
  router.post('/auth/login', (req, res) => {
    try {
      const { email, password, remember } = req.body || {};
      const result = loginUser(db, email, password, Boolean(remember));
      res.json(result);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error interno al autenticar.' });
    }
  });

  router.post('/auth/register', (req, res) => {
    try {
      const result = registerClient(db, req.body || {});
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error interno al registrar usuario.' });
    }
  });

  router.post('/auth/recover', (req, res) => {
    try {
      const { email, newPassword } = req.body || {};
      const result = recoverPassword(db, email, newPassword);
      res.json(result);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error interno al recuperar contraseña.' });
    }
  });

  router.post('/auth/logout', requireAuth(), (req: AuthenticatedRequest, res) => {
    if (req.authUser) {
      db.prepare('UPDATE usuarios SET remember_token = NULL WHERE id = ?').run(req.authUser.id);
    }
    res.json({ ok: true, message: 'Sesión cerrada correctamente.' });
  });

  router.get('/auth/me', requireAuth(), (req: AuthenticatedRequest, res) => {
    res.json({ user: req.authUser });
  });

  // Catalog routes
  router.get('/catalog/categories', (_req, res) => {
    res.json({ items: listCategories(db) });
  });

  router.get('/catalog/brands', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ items: listBrands(db) });
  });

  router.get('/catalog/products', (req, res) => {
    const query: CatalogQuery = {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      categoria: typeof req.query.categoria === 'string' ? req.query.categoria : undefined,
      marca: typeof req.query.marca === 'string' ? req.query.marca : undefined,
      sort: (req.query.sort as CatalogQuery['sort']) || 'destacados',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 9,
    };
    res.json(listProducts(db, query));
  });

  router.get('/catalog/products/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Identificador de producto inválido.' });
      return;
    }
    const product = getProductById(db, id);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }
    res.json({ item: product });
  });

  // Cart routes
  router.get('/cart', (req, res) => {
    try {
      const summary = getCartSummary(db, getCartIdentity(req));
      res.json(summary);
    } catch (err) {
      if (err instanceof CartError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error al consultar el carrito.' });
    }
  });

  router.post('/cart/items', (req, res) => {
    try {
      const productoId = Number(req.body?.producto_id);
      const cantidad = req.body?.cantidad !== undefined ? Number(req.body.cantidad) : 1;
      const summary = addToCart(db, getCartIdentity(req), productoId, cantidad);
      res.status(201).json(summary);
    } catch (err) {
      if (err instanceof CartError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error al agregar producto al carrito.' });
    }
  });

  router.patch('/cart/items/:productoId', (req, res) => {
    try {
      const productoId = Number(req.params.productoId);
      const cantidad = Number(req.body?.cantidad);
      const summary = updateCartItemQuantity(db, getCartIdentity(req), productoId, cantidad);
      res.json(summary);
    } catch (err) {
      if (err instanceof CartError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error al actualizar la cantidad.' });
    }
  });

  router.delete('/cart/items/:productoId', (req, res) => {
    try {
      const productoId = Number(req.params.productoId);
      const summary = removeFromCart(db, getCartIdentity(req), productoId);
      res.json(summary);
    } catch (err) {
      if (err instanceof CartError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error al eliminar producto del carrito.' });
    }
  });

  // Checkout & Orders
  router.post('/orders/checkout', requireAuth(['Cliente', 'Administrador']), (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = (req.headers['x-cart-session'] as string | undefined) || null;
      const confirmation = checkoutCart(db, req.authUser!.id, req.body || {}, sessionId);
      res.status(201).json({ order: confirmation });
    } catch (err) {
      if (err instanceof CartError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Error al confirmar el pedido.' });
    }
  });

  router.get('/orders/my', requireAuth(['Cliente', 'Administrador']), (req: AuthenticatedRequest, res) => {
    const orders = db.prepare(`
      SELECT p.id, p.codigo_pedido, p.subtotal, p.descuento, p.total, p.estado,
             p.direccion_envio, p.created_at, pg.metodo_pago, pg.referencia_transaccion
      FROM pedidos p
      LEFT JOIN pagos pg ON pg.pedido_id = p.id
      WHERE p.usuario_id = ?
      ORDER BY p.created_at DESC, p.id DESC
    `).all(req.authUser!.id);
    res.json({ items: orders });
  });

  // Admin Dashboard & Inventory routes (Protected for Administrador only)
  router.get('/admin/dashboard', requireAuth(['Administrador']), (_req, res) => {
    res.json(getDashboardMetrics(db));
  });

  router.patch('/admin/inventory/:productoId', requireAuth(['Administrador']), (req, res) => {
    try {
      const productoId = Number(req.params.productoId);
      const stockActual = Number(req.body?.stock_actual);
      const updated = updateProductStock(db, productoId, stockActual);
      if (!updated) {
        res.status(404).json({ error: 'Producto no encontrado en inventario.' });
        return;
      }
      res.json({ item: updated });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Error al actualizar stock.' });
    }
  });

  router.post('/admin/products', requireAuth(['Administrador']), (req, res) => {
    try {
      const created = createProduct(db, req.body || {});
      res.status(201).json({ item: created });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Error al crear producto.' });
    }
  });

  router.patch('/admin/orders/:orderId/status', requireAuth(['Administrador']), (req, res) => {
    const orderId = Number(req.params.orderId);
    const estado = String(req.body?.estado || '');
    const allowed = ['Pendiente', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];
    if (!allowed.includes(estado)) {
      res.status(400).json({ error: 'Estado de pedido inválido.' });
      return;
    }
    const result = db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, orderId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Pedido no encontrado.' });
      return;
    }
    res.json({ ok: true, id: orderId, estado });
  });

  return router;
}
