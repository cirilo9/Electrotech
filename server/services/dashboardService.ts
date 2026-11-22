import { DatabaseSync } from 'node:sqlite';
import type { DashboardMetrics } from '../../shared/types.ts';

export function getDashboardMetrics(db: DatabaseSync): DashboardMetrics {
  const totalProductosRow = db.prepare('SELECT COUNT(*) AS c FROM productos WHERE activo = 1').get() as { c: number };
  const totalClientesRow = db.prepare(`
    SELECT COUNT(*) AS c FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE r.nombre = 'Cliente'
  `).get() as { c: number };

  const ventasRow = db.prepare(`
    SELECT COUNT(*) AS ventas, COALESCE(SUM(total), 0) AS ingresos
    FROM pedidos
    WHERE estado != 'Cancelado'
  `).get() as { ventas: number; ingresos: number };

  const disponiblesRow = db.prepare(`
    SELECT COUNT(*) AS c FROM inventario i
    INNER JOIN productos p ON p.id = i.producto_id
    WHERE p.activo = 1 AND i.stock_actual > 0
  `).get() as { c: number };

  const stockBajoLista = db.prepare(`
    SELECT p.id, p.nombre, p.modelo, m.nombre AS marca_nombre,
           i.stock_actual, i.stock_minimo, i.ubicacion_almacen
    FROM inventario i
    INNER JOIN productos p ON p.id = i.producto_id
    INNER JOIN marcas m ON m.id = p.marca_id
    WHERE p.activo = 1 AND i.stock_actual <= i.stock_minimo
    ORDER BY i.stock_actual ASC
  `).all() as DashboardMetrics['stockBajoLista'];

  const pedidosRegistradosRow = db.prepare('SELECT COUNT(*) AS c FROM pedidos').get() as { c: number };

  const ventasMensuales = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS mes,
           ROUND(SUM(total), 2) AS ingresos,
           COUNT(*) AS pedidos
    FROM pedidos
    WHERE estado != 'Cancelado'
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY mes ASC
    LIMIT 12
  `).all() as DashboardMetrics['ventasMensuales'];

  const productosMasVendidos = db.prepare(`
    SELECT p.id AS producto_id, p.nombre, m.nombre AS marca_nombre,
           SUM(pd.cantidad) AS unidades_vendidas,
           ROUND(SUM(pd.subtotal), 2) AS ingresos
    FROM pedido_detalles pd
    INNER JOIN pedidos ped ON ped.id = pd.pedido_id AND ped.estado != 'Cancelado'
    INNER JOIN productos p ON p.id = pd.producto_id
    INNER JOIN marcas m ON m.id = p.marca_id
    GROUP BY p.id
    ORDER BY unidades_vendidas DESC, ingresos DESC
    LIMIT 6
  `).all() as DashboardMetrics['productosMasVendidos'];

  const ultimosPedidos = db.prepare(`
    SELECT ped.id, ped.codigo_pedido, u.nombre AS cliente_nombre, u.email AS cliente_email,
           ped.total, ped.estado, COALESCE(pg.metodo_pago, 'Pendiente') AS metodo_pago,
           ped.created_at
    FROM pedidos ped
    INNER JOIN usuarios u ON u.id = ped.usuario_id
    LEFT JOIN pagos pg ON pg.pedido_id = ped.id
    ORDER BY ped.created_at DESC, ped.id DESC
    LIMIT 8
  `).all() as DashboardMetrics['ultimosPedidos'];

  const notificaciones: DashboardMetrics['notificaciones'] = [
    ...stockBajoLista.map((item) => ({
      id: `stock-${item.id}`,
      tipo: 'stock_bajo' as const,
      titulo: `Stock bajo: ${item.nombre}`,
      detalle: `Quedan ${item.stock_actual} unidades (mínimo ${item.stock_minimo}) en ${item.ubicacion_almacen}.`,
      fecha: new Date().toISOString().slice(0, 10),
    })),
    ...ultimosPedidos.slice(0, 3).map((ord) => ({
      id: `order-${ord.id}`,
      tipo: 'nuevo_pedido' as const,
      titulo: `Pedido ${ord.codigo_pedido} — ${ord.estado}`,
      detalle: `${ord.cliente_nombre} · $${Number(ord.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      fecha: ord.created_at.slice(0, 10),
    })),
  ];

  return {
    kpis: {
      totalProductos: Number(totalProductosRow.c),
      totalClientes: Number(totalClientesRow.c),
      ventasRealizadas: Number(ventasRow.ventas),
      ingresosTotales: Number(Number(ventasRow.ingresos).toFixed(2)),
      productosDisponibles: Number(disponiblesRow.c),
      productosStockBajo: stockBajoLista.length,
      pedidosRegistrados: Number(pedidosRegistradosRow.c),
    },
    ventasMensuales,
    productosMasVendidos,
    ultimosPedidos,
    stockBajoLista,
    notificaciones,
  };
}
