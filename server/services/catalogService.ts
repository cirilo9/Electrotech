import { DatabaseSync } from 'node:sqlite';
import type { Brand, CatalogQuery, CatalogResponse, Category, Product } from '../../shared/types.ts';

interface RawProductRow {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  categoria_slug: string;
  marca_id: number;
  marca_nombre: string;
  nombre: string;
  modelo: string;
  descripcion: string;
  precio: number;
  precio_promocional: number | null;
  precio_efectivo: number;
  calificacion: number;
  imagen_url: string;
  especificaciones_json: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_almacen: string;
  activo: number;
}

function mapProduct(row: RawProductRow): Product {
  let specs: Record<string, string> = {};
  try {
    specs = JSON.parse(row.especificaciones_json || '{}');
  } catch {
    specs = {};
  }
  return {
    id: row.id,
    categoria_id: row.categoria_id,
    categoria_nombre: row.categoria_nombre,
    categoria_slug: row.categoria_slug,
    marca_id: row.marca_id,
    marca_nombre: row.marca_nombre,
    nombre: row.nombre,
    modelo: row.modelo,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    precio_promocional: row.precio_promocional !== null ? Number(row.precio_promocional) : null,
    precio_efectivo: Number(row.precio_efectivo),
    calificacion: Number(row.calificacion),
    imagen_url: row.imagen_url,
    especificaciones: specs,
    stock_actual: Number(row.stock_actual),
    stock_minimo: Number(row.stock_minimo),
    ubicacion_almacen: row.ubicacion_almacen,
    activo: row.activo,
  };
}

export function listCategories(db: DatabaseSync): Category[] {
  return db.prepare(`
    SELECT c.id, c.nombre, c.slug, c.descripcion, COUNT(p.id) AS total_productos
    FROM categorias c
    LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
    GROUP BY c.id
    ORDER BY c.id ASC
  `).all() as unknown as Category[];
}

export function listBrands(db: DatabaseSync): Brand[] {
  return db.prepare(`
    SELECT id, nombre, pais_origen
    FROM marcas
    ORDER BY nombre ASC
  `).all() as unknown as Brand[];
}

export function listProducts(db: DatabaseSync, query: CatalogQuery = {}): CatalogResponse {
  const search = (query.search || '').trim();
  const categoria = (query.categoria || '').trim();
  const marca = (query.marca || '').trim();
  const sort = query.sort || 'destacados';
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 9));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = ['p.activo = 1'];
  const params: Array<string | number> = [];

  if (search) {
    whereClauses.push(`(LOWER(p.nombre) LIKE ? OR LOWER(p.modelo) LIKE ? OR LOWER(p.descripcion) LIKE ? OR LOWER(m.nombre) LIKE ?)`);
    const likeTerm = `%${search.toLowerCase()}%`;
    params.push(likeTerm, likeTerm, likeTerm, likeTerm);
  }

  if (categoria && categoria !== 'todas') {
    whereClauses.push(`(c.slug = ? OR LOWER(c.nombre) = LOWER(?))`);
    params.push(categoria, categoria);
  }

  if (marca && marca !== 'todas') {
    whereClauses.push(`LOWER(m.nombre) = LOWER(?)`);
    params.push(marca);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  let orderSql = 'ORDER BY p.calificacion DESC, p.id ASC';
  if (sort === 'precio_asc') {
    orderSql = 'ORDER BY COALESCE(p.precio_promocional, p.precio) ASC, p.id ASC';
  } else if (sort === 'precio_desc') {
    orderSql = 'ORDER BY COALESCE(p.precio_promocional, p.precio) DESC, p.id ASC';
  } else if (sort === 'nombre_asc') {
    orderSql = 'ORDER BY p.nombre ASC';
  } else if (sort === 'nombre_desc') {
    orderSql = 'ORDER BY p.nombre DESC';
  }

  const countRow = db.prepare(`
    SELECT COUNT(*) AS total
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN marcas m ON m.id = p.marca_id
    ${whereSql}
  `).get(...params) as { total: number };

  const total = Number(countRow.total);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows = db.prepare(`
    SELECT p.id, p.categoria_id, c.nombre AS categoria_nombre, c.slug AS categoria_slug,
           p.marca_id, m.nombre AS marca_nombre, p.nombre, p.modelo, p.descripcion,
           p.precio, p.precio_promocional, COALESCE(p.precio_promocional, p.precio) AS precio_efectivo,
           p.calificacion, p.imagen_url, p.especificaciones_json, p.activo,
           i.stock_actual, i.stock_minimo, i.ubicacion_almacen
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN marcas m ON m.id = p.marca_id
    INNER JOIN inventario i ON i.producto_id = p.id
    ${whereSql}
    ${orderSql}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as unknown as RawProductRow[];

  return {
    items: rows.map(mapProduct),
    total,
    page,
    limit,
    totalPages,
  };
}

export function getProductById(db: DatabaseSync, productId: number): Product | null {
  const row = db.prepare(`
    SELECT p.id, p.categoria_id, c.nombre AS categoria_nombre, c.slug AS categoria_slug,
           p.marca_id, m.nombre AS marca_nombre, p.nombre, p.modelo, p.descripcion,
           p.precio, p.precio_promocional, COALESCE(p.precio_promocional, p.precio) AS precio_efectivo,
           p.calificacion, p.imagen_url, p.especificaciones_json, p.activo,
           i.stock_actual, i.stock_minimo, i.ubicacion_almacen
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN marcas m ON m.id = p.marca_id
    INNER JOIN inventario i ON i.producto_id = p.id
    WHERE p.id = ? AND p.activo = 1
  `).get(productId) as unknown as RawProductRow | undefined;

  return row ? mapProduct(row) : null;
}

export function updateProductStock(db: DatabaseSync, productId: number, stockActual: number): Product | null {
  if (!Number.isInteger(stockActual) || stockActual < 0) {
    throw new Error('El stock debe ser un número entero mayor o igual a cero.');
  }
  const res = db.prepare(`
    UPDATE inventario
    SET stock_actual = ?, updated_at = datetime('now')
    WHERE producto_id = ?
  `).run(stockActual, productId);

  if (res.changes === 0) {
    return null;
  }
  return getProductById(db, productId);
}

export function createProduct(
  db: DatabaseSync,
  payload: {
    categoria_id: number;
    marca_id: number;
    nombre: string;
    modelo: string;
    descripcion: string;
    precio: number;
    precio_promocional?: number | null;
    imagen_url?: string;
    stock_actual: number;
    stock_minimo?: number;
  }
): Product {
  if (!payload.nombre?.trim() || !payload.modelo?.trim() || payload.precio <= 0) {
    throw new Error('Nombre, modelo y precio válido son obligatorios.');
  }
  if (payload.precio_promocional && payload.precio_promocional >= payload.precio) {
    throw new Error('El precio promocional debe ser menor al precio regular.');
  }
  if (!Number.isInteger(payload.stock_actual) || payload.stock_actual < 0) {
    throw new Error('El stock inicial debe ser un entero positivo o cero.');
  }

  db.exec('BEGIN;');
  try {
    const prodRes = db.prepare(`
      INSERT INTO productos (categoria_id, marca_id, nombre, modelo, descripcion, precio, precio_promocional, calificacion, imagen_url, especificaciones_json, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 4.8, ?, ?, 1)
    `).run(
      payload.categoria_id,
      payload.marca_id,
      payload.nombre.trim(),
      payload.modelo.trim(),
      (payload.descripcion || 'Equipo electrónico certificado de alto desempeño.').trim(),
      payload.precio,
      payload.precio_promocional ?? null,
      payload.imagen_url || '/src/assets/images/prod_laptop_pro_1795190964479.jpg',
      JSON.stringify({ Garantía: '2 años ELECTROTECH Care', Estado: 'Nuevo sellado' })
    );

    const productoId = Number(prodRes.lastInsertRowid);
    db.prepare(`
      INSERT INTO inventario (producto_id, stock_actual, stock_minimo, ubicacion_almacen)
      VALUES (?, ?, ?, 'Almacén Central A1')
    `).run(productoId, payload.stock_actual, payload.stock_minimo ?? 5);

    db.exec('COMMIT;');
    return getProductById(db, productoId)!;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
