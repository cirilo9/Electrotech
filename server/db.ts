import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

export function createDatabase(dbPath: string = 'electrotech.db'): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  initializeSchema(db);
  return db;
}

export function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE CHECK(nombre IN ('Administrador', 'Cliente')),
      descripcion TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rol_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
      remember_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (rol_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL UNIQUE,
      telefono TEXT NOT NULL DEFAULT '',
      direccion TEXT NOT NULL DEFAULT '',
      ciudad TEXT NOT NULL DEFAULT 'Lima',
      documento TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      descripcion TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS marcas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      pais_origen TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria_id INTEGER NOT NULL,
      marca_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      modelo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      precio REAL NOT NULL CHECK(precio > 0),
      precio_promocional REAL CHECK(precio_promocional IS NULL OR (precio_promocional > 0 AND precio_promocional < precio)),
      calificacion REAL NOT NULL DEFAULT 4.8 CHECK(calificacion >= 1 AND calificacion <= 5),
      imagen_url TEXT NOT NULL,
      especificaciones_json TEXT NOT NULL DEFAULT '{}',
      activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (marca_id) REFERENCES marcas(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL UNIQUE,
      stock_actual INTEGER NOT NULL DEFAULT 0 CHECK(stock_actual >= 0),
      stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK(stock_minimo >= 0),
      ubicacion_almacen TEXT NOT NULL DEFAULT 'Almacén Central A1',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS carritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      session_id TEXT,
      estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'convertido', 'abandonado')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS carrito_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrito_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL CHECK(cantidad > 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(carrito_id, producto_id),
      FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      codigo_pedido TEXT NOT NULL UNIQUE,
      subtotal REAL NOT NULL CHECK(subtotal >= 0),
      descuento REAL NOT NULL DEFAULT 0 CHECK(descuento >= 0),
      total REAL NOT NULL CHECK(total >= 0),
      estado TEXT NOT NULL DEFAULT 'Confirmado' CHECK(estado IN ('Pendiente', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado')),
      direccion_envio TEXT NOT NULL,
      notas TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pedido_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL CHECK(cantidad > 0),
      precio_unitario REAL NOT NULL CHECK(precio_unitario > 0),
      subtotal REAL NOT NULL CHECK(subtotal >= 0),
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL UNIQUE,
      metodo_pago TEXT NOT NULL,
      monto REAL NOT NULL CHECK(monto >= 0),
      estado_pago TEXT NOT NULL DEFAULT 'Aprobado' CHECK(estado_pago IN ('Pendiente', 'Aprobado', 'Rechazado', 'Reembolsado')),
      referencia_transaccion TEXT NOT NULL UNIQUE,
      fecha_pago TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
    CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca_id);
    CREATE INDEX IF NOT EXISTS idx_carritos_session ON carritos(session_id);
    CREATE INDEX IF NOT EXISTS idx_carritos_usuario ON carritos(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_carrito_detalles_carrito ON carrito_detalles(carrito_id);
    CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(created_at);
    CREATE INDEX IF NOT EXISTS idx_pedido_detalles_producto ON pedido_detalles(producto_id);
  `);
}

export function seedDatabase(db: DatabaseSync): void {
  const existingRoles = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (existingRoles.count > 0) {
    return;
  }

  db.exec('BEGIN;');
  try {
    // 1. Roles
    const insertRole = db.prepare('INSERT INTO roles (nombre, descripcion) VALUES (?, ?)');
    const adminRoleRes = insertRole.run('Administrador', 'Control total del catálogo, inventario, analítica y órdenes.');
    const clientRoleRes = insertRole.run('Cliente', 'Acceso a catálogo, carrito de compras y seguimiento de pedidos.');
    const adminRoleId = Number(adminRoleRes.lastInsertRowid);
    const clientRoleId = Number(clientRoleRes.lastInsertRowid);

    // 2. Usuarios y Clientes
    const adminHash = bcrypt.hashSync('Admin2026!', 10);
    const clientHash = bcrypt.hashSync('Cliente2026!', 10);

    const insertUser = db.prepare(
      'INSERT INTO usuarios (rol_id, nombre, email, password_hash, activo) VALUES (?, ?, ?, ?, 1)'
    );
    const insertCliente = db.prepare(
      'INSERT INTO clientes (usuario_id, telefono, direccion, ciudad, documento) VALUES (?, ?, ?, ?, ?)'
    );

    const adminUser = insertUser.run(adminRoleId, 'Ing. Mateo Valdivia', 'admin@electrotech.pe', adminHash);
    insertCliente.run(Number(adminUser.lastInsertRowid), '+51 998 112 400', 'Av. Javier Prado Este 4200', 'Lima', '45821903');

    const clientesSeed = [
      { nombre: 'Lucía Mendoza Ríos', email: 'cliente@electrotech.pe', tel: '+51 987 441 210', dir: 'Calle Los Pinos 340, San Isidro', ciudad: 'Lima', doc: '71892341' },
      { nombre: 'Carlos Paredes Quispe', email: 'carlos.paredes@correo.pe', tel: '+51 945 201 889', dir: 'Av. Arequipa 1890, Lince', ciudad: 'Lima', doc: '48201934' },
      { nombre: 'Sofía Castro Delgado', email: 'sofia.castro@correo.pe', tel: '+51 912 778 334', dir: 'Urb. El Golf 215, Víctor Larco', ciudad: 'Trujillo', doc: '70239182' },
      { nombre: 'Diego Torres Huamán', email: 'diego.torres@correo.pe', tel: '+51 966 552 019', dir: 'Av. Ejército 710, Yanahuara', ciudad: 'Arequipa', doc: '46192018' },
      { nombre: 'Valeria Salazar León', email: 'valeria.salazar@correo.pe', tel: '+51 954 881 740', dir: 'Malecón Cisneros 920, Miraflores', ciudad: 'Lima', doc: '72910455' },
    ];

    const clienteIds: Array<{ usuarioId: number; clienteId: number; direccion: string }> = [];
    for (const c of clientesSeed) {
      const uRes = insertUser.run(clientRoleId, c.nombre, c.email, clientHash);
      const uId = Number(uRes.lastInsertRowid);
      const cRes = insertCliente.run(uId, c.tel, c.dir, c.ciudad, c.doc);
      clienteIds.push({ usuarioId: uId, clienteId: Number(cRes.lastInsertRowid), direccion: c.dir });
    }

    // 3. Categorías (exactamente las 9 solicitadas)
    const categoriasSeed = [
      { nombre: 'Laptops', slug: 'laptops', desc: 'Estaciones portátiles de alto rendimiento y ultrabooks profesionales.' },
      { nombre: 'Computadoras', slug: 'computadoras', desc: 'Workstations y equipos de escritorio de arquitectura modular.' },
      { nombre: 'Smartphones', slug: 'smartphones', desc: 'Teléfonos insignia 5G con fotografía computacional avanzada.' },
      { nombre: 'Tablets', slug: 'tablets', desc: 'Tabletas OLED de precisión para diseño, ingeniería y productividad.' },
      { nombre: 'Televisores', slug: 'televisores', desc: 'Pantallas 4K y 8K OLED/Mini-LED de calibración cinematográfica.' },
      { nombre: 'Impresoras', slug: 'impresoras', desc: 'Equipos láser y multifuncionales inalámbricos de oficina.' },
      { nombre: 'Parlantes y audífonos', slug: 'parlantes-y-audifonos', desc: 'Audio espacial de estudio con cancelación activa adaptativa.' },
      { nombre: 'Accesorios tecnológicos', slug: 'accesorios-tecnologicos', desc: 'Periféricos mecánicos CNC, docks Thunderbolt y ergonomía.' },
      { nombre: 'Componentes de PC', slug: 'componentes-de-pc', desc: 'Tarjetas gráficas, procesadores, memorias DDR5 y almacenamiento NVMe.' },
    ];

    const catMap = new Map<string, number>();
    const insertCat = db.prepare('INSERT INTO categorias (nombre, slug, descripcion) VALUES (?, ?, ?)');
    for (const cat of categoriasSeed) {
      const r = insertCat.run(cat.nombre, cat.slug, cat.desc);
      catMap.set(cat.slug, Number(r.lastInsertRowid));
    }

    // 4. Marcas
    const marcasSeed = [
      { nombre: 'Apple', pais: 'Estados Unidos' },
      { nombre: 'Samsung', pais: 'Corea del Sur' },
      { nombre: 'Sony', pais: 'Japón' },
      { nombre: 'ASUS', pais: 'Taiwán' },
      { nombre: 'Dell', pais: 'Estados Unidos' },
      { nombre: 'LG', pais: 'Corea del Sur' },
      { nombre: 'HP', pais: 'Estados Unidos' },
      { nombre: 'Logitech', pais: 'Suiza' },
      { nombre: 'NVIDIA', pais: 'Estados Unidos' },
    ];

    const marcaMap = new Map<string, number>();
    const insertMarca = db.prepare('INSERT INTO marcas (nombre, pais_origen) VALUES (?, ?)');
    for (const m of marcasSeed) {
      const r = insertMarca.run(m.nombre, m.pais);
      marcaMap.set(m.nombre, Number(r.lastInsertRowid));
    }

    // 5. Productos e Inventario (18 productos reales en las 9 categorías)
    const IMG_LAPTOP = '/src/assets/images/prod_laptop_pro_1795190964479.jpg';
    const IMG_PHONE = '/src/assets/images/prod_smartphone_ultra_1795190963623.jpg';
    const IMG_TV = '/src/assets/images/prod_oled_tv_1795190964805.jpg';
    const IMG_AUDIO = '/src/assets/images/prod_audio_headphones_1795190963796.jpg';
    const IMG_TABLET = '/src/assets/images/prod_tablet_studio_1795190963953.jpg';
    const IMG_PC = '/src/assets/images/prod_desktop_pc_gpu_1795190963795.jpg';
    const IMG_PRINTER = '/src/assets/images/prod_printer_accessories_1795190963133.jpg';

    const productosSeed = [
      {
        cat: 'laptops', marca: 'Apple', nombre: 'MacBook Pro 16 M4 Max', modelo: 'MBP16-M4MAX-2026',
        desc: 'Estación portátil con chip M4 Max de 16 núcleos, pantalla Liquid Retina XDR de 120Hz y 36GB de memoria unificada.',
        precio: 3499.00, promo: 3299.00, calif: 4.9, img: IMG_LAPTOP,
        specs: { Procesador: 'Apple M4 Max 16-Core', Memoria: '36 GB Unificada', Almacenamiento: '1 TB SSD NVMe', Pantalla: '16.2" Liquid Retina XDR' },
        stock: 14, min: 5, ubicacion: 'Bóveda A-01'
      },
      {
        cat: 'laptops', marca: 'ASUS', nombre: 'ROG Zephyrus G16 OLED', modelo: 'GU605-RTX5080',
        desc: 'Chasis CNC de aluminio ultrafino con panel OLED Nebula 240Hz y aceleración gráfica dedicada para ingeniería e IA.',
        precio: 2699.00, promo: 2499.00, calif: 4.8, img: IMG_LAPTOP,
        specs: { Procesador: 'Intel Core Ultra 9 285H', Memoria: '32 GB LPDDR5X', Almacenamiento: '2 TB PCIe 4.0', Gráficos: 'RTX 5080 16GB' },
        stock: 9, min: 4, ubicacion: 'Bóveda A-02'
      },
      {
        cat: 'laptops', marca: 'Dell', nombre: 'XPS 14 Precision Studio', modelo: 'XPS-9450-OLED',
        desc: 'Diseño minimalista en aluminio mecanizado, pantalla táctil 3.2K OLED y batería de autonomía extendida para ejecutivos.',
        precio: 2150.00, promo: null, calif: 4.7, img: IMG_LAPTOP,
        specs: { Procesador: 'Intel Core Ultra 7', Memoria: '32 GB RAM', Almacenamiento: '1 TB SSD', Peso: '1.68 kg' },
        stock: 3, min: 5, ubicacion: 'Bóveda A-03' // Stock bajo intencional
      },
      {
        cat: 'computadoras', marca: 'Dell', nombre: 'Precision Tower Pro Compact', modelo: 'OPT-W7010-PRO',
        desc: 'Workstation de torre compacta con refrigeración laminar silenciosa, preparada para compilación y modelado 3D.',
        precio: 2890.00, promo: 2690.00, calif: 4.9, img: IMG_PC,
        specs: { Procesador: 'Intel Core i9-14900K', Memoria: '64 GB DDR5 ECC', Almacenamiento: '2 TB NVMe Gen4', Fuente: '850W 80+ Platinum' },
        stock: 8, min: 3, ubicacion: 'Rack B-01'
      },
      {
        cat: 'computadoras', marca: 'HP', nombre: 'Z2 Mini G9 Workstation', modelo: 'HP-Z2M-G9',
        desc: 'Arquitectura modular de escritorio ultracompacta con soporte multi-monitor 4K y certificación ISV empresarial.',
        precio: 1840.00, promo: null, calif: 4.6, img: IMG_PC,
        specs: { Procesador: 'Intel Core i7-14700', Memoria: '32 GB DDR5', Almacenamiento: '1 TB SSD', Conectividad: 'Wi-Fi 7 + 2.5GbE' },
        stock: 11, min: 4, ubicacion: 'Rack B-02'
      },
      {
        cat: 'smartphones', marca: 'Apple', nombre: 'iPhone 17 Pro Titanium', modelo: 'A3290-512GB',
        desc: 'Estructura aeroespacial de titanio grado 5, sistema triple cámara tetraprisma 48MP y chip neural A19 Pro.',
        precio: 1399.00, promo: 1299.00, calif: 4.9, img: IMG_PHONE,
        specs: { Pantalla: '6.3" ProMotion 120Hz', Chip: 'A19 Pro 3nm', Almacenamiento: '512 GB', Conectividad: '5G + USB-C 10Gbps' },
        stock: 22, min: 6, ubicacion: 'Bóveda C-01'
      },
      {
        cat: 'smartphones', marca: 'Samsung', nombre: 'Galaxy S26 Ultra 5G', modelo: 'SM-S948B-512',
        desc: 'Panel Dynamic AMOLED 2X antirreflejo con S-Pen integrado, zoom óptico de precisión 10x y marco de titanio.',
        precio: 1349.00, promo: 1229.00, calif: 4.8, img: IMG_PHONE,
        specs: { Pantalla: '6.8" QHD+ 120Hz', Procesador: 'Snapdragon 8 Elite', Almacenamiento: '512 GB', Batería: '5000 mAh 45W' },
        stock: 16, min: 5, ubicacion: 'Bóveda C-02'
      },
      {
        cat: 'tablets', marca: 'Apple', nombre: 'iPad Pro 13 Tandem OLED', modelo: 'IPAD-M4-13',
        desc: 'Perfil de 5.1 mm con pantalla Ultra Retina XDR en tándem, compatibilidad con Apple Pencil Pro y Thunderbolt.',
        precio: 1499.00, promo: null, calif: 4.9, img: IMG_TABLET,
        specs: { Pantalla: '13" Tandem OLED', Chip: 'Apple M4', Almacenamiento: '512 GB', Grosor: '5.1 mm' },
        stock: 12, min: 4, ubicacion: 'Bóveda C-04'
      },
      {
        cat: 'tablets', marca: 'Samsung', nombre: 'Galaxy Tab S10 Ultra', modelo: 'SM-X920-256',
        desc: 'Lienzo AMOLED de 14.6 pulgadas resistente al agua IP68 con lápiz óptico de baja latencia incluido.',
        precio: 1199.00, promo: 1099.00, calif: 4.7, img: IMG_TABLET,
        specs: { Pantalla: '14.6" AMOLED 120Hz', Memoria: '12 GB RAM', Almacenamiento: '256 GB + microSD', Protección: 'IP68' },
        stock: 4, min: 5, ubicacion: 'Bóveda C-05' // Stock bajo intencional
      },
      {
        cat: 'televisores', marca: 'LG', nombre: 'OLED evo G5 65" 4K', modelo: 'OLED65G5PSA',
        desc: 'Televisor OLED de arquitectura One Wall sin marcos, procesador Alpha 11 AI y Dolby Vision Gaming a 144Hz.',
        precio: 2599.00, promo: 2349.00, calif: 4.9, img: IMG_TV,
        specs: { Tamaño: '65 Pulgadas', Panel: '4K OLED evo MLA', Tasa: '144 Hz VRR', Audio: 'Dolby Atmos 60W' },
        stock: 7, min: 3, ubicacion: 'Nave D-01'
      },
      {
        cat: 'televisores', marca: 'Samsung', nombre: 'Neo QLED 8K QN900D 65"', modelo: 'QN65QN900D',
        desc: 'Resolución 8K nativa con Quantum Matrix Pro Mini-LED y diseño Infinity Air prácticamente sin biseles.',
        precio: 3199.00, promo: 2899.00, calif: 4.8, img: IMG_TV,
        specs: { Tamaño: '65 Pulgadas', Panel: 'Mini-LED 8K', Procesador: 'NQ8 AI Gen3', HDMI: '4x HDMI 2.1' },
        stock: 5, min: 2, ubicacion: 'Nave D-02'
      },
      {
        cat: 'impresoras', marca: 'HP', nombre: 'LaserJet Pro MFP 4103fdw', modelo: 'HP-2Z629A',
        desc: 'Impresora láser multifunción dúplex automática de alta velocidad con conectividad Wi-Fi de doble banda.',
        precio: 489.00, promo: 439.00, calif: 4.6, img: IMG_PRINTER,
        specs: { Velocidad: '40 ppm Láser', Funciones: 'Imprime, Escanea, Copia', Dúplex: 'Automático', Red: 'Wi-Fi Dual + Gigabit' },
        stock: 15, min: 4, ubicacion: 'Pasillo E-01'
      },
      {
        cat: 'impresoras', marca: 'HP', nombre: 'Smart Tank 7605 Wireless', modelo: 'HP-4WF66A',
        desc: 'Sistema continuo de tinta de alta eficiencia para impresión a color sin bordes y administración móvil.',
        precio: 369.00, promo: null, calif: 4.5, img: IMG_PRINTER,
        specs: { Tecnología: 'Inyección Tanque', Conectividad: 'Wi-Fi + USB-C', Ciclo: '5000 páginas/mes', Dúplex: 'Sí' },
        stock: 10, min: 3, ubicacion: 'Pasillo E-02'
      },
      {
        cat: 'parlantes-y-audifonos', marca: 'Sony', nombre: 'WH-1000XM6 Studio ANC', modelo: 'WH1000XM6-BLK',
        desc: 'Audífonos inalámbricos de referencia con 8 micrófonos de cancelación de ruido adaptativa y códec LDAC Hi-Res.',
        precio: 429.00, promo: 379.00, calif: 4.9, img: IMG_AUDIO,
        specs: { Drivers: '30 mm Fibra Carbono', Autonomía: '40 horas ANC', Códecs: 'LDAC / AAC / LC3', Peso: '248 g' },
        stock: 25, min: 6, ubicacion: 'Estante F-01'
      },
      {
        cat: 'parlantes-y-audifonos', marca: 'Sony', nombre: 'Spatial Sound Cylinder One', modelo: 'SRS-SPATIAL-1',
        desc: 'Altavoz inteligente acústico 360° con calibración automática de sala y transmisión Lossless por Wi-Fi.',
        precio: 349.00, promo: null, calif: 4.7, img: IMG_AUDIO,
        specs: { Potencia: '60W RMS Bi-Amp', Conectividad: 'Wi-Fi / AirPlay 2 / BT 5.4', Micrófonos: 'Matriz Far-Field', Respuesta: '42Hz - 22kHz' },
        stock: 13, min: 4, ubicacion: 'Estante F-02'
      },
      {
        cat: 'accesorios-tecnologicos', marca: 'Logitech', nombre: 'MX Mechanical CNC & Master 3S', modelo: 'LOGI-MX-PRO-KIT',
        desc: 'Combo profesional de teclado mecánico táctil silencioso en aluminio anodizado y mouse electromagnético 8000 DPI.',
        precio: 279.00, promo: 249.00, calif: 4.8, img: IMG_PRINTER,
        specs: { Switches: 'Tactile Quiet Low-Profile', Sensor: 'Darkfield 8000 DPI', Conexión: 'Multi-Host 3 Dispositivos', Carga: 'USB-C Rápida' },
        stock: 19, min: 5, ubicacion: 'Estante G-01'
      },
      {
        cat: 'componentes-de-pc', marca: 'NVIDIA', nombre: 'GeForce RTX 5080 Founders', modelo: 'NV-RTX5080-FE',
        desc: 'Arquitectura Blackwell con 16GB GDDR7, trazado de rayos neuronal y sistema térmico dual flow-through.',
        precio: 1299.00, promo: null, calif: 5.0, img: IMG_PC,
        specs: { Memoria: '16 GB GDDR7', Interfaz: 'PCIe 5.0 x16', Salidas: '3x DP 2.1 + HDMI 2.1b', TDP: '360 W' },
        stock: 2, min: 4, ubicacion: 'Bóveda H-01' // Stock bajo intencional
      },
      {
        cat: 'componentes-de-pc', marca: 'ASUS', nombre: 'ROG Maximus Z890 Hero', modelo: 'ROG-Z890-HERO',
        desc: 'Placa base ATX entusiasta con VRM de 22+1+2 fases, cinco ranuras M.2 NVMe y soporte Wi-Fi 7 integrado.',
        precio: 689.00, promo: 639.00, calif: 4.8, img: IMG_PC,
        specs: { Socket: 'LGA 1851', Memoria: 'DDR5 hasta 9200+ MT/s', Almacenamiento: '5x M.2 (3x PCIe 5.0)', Red: 'Dual LAN 5Gb + Wi-Fi 7' },
        stock: 11, min: 3, ubicacion: 'Bóveda H-02'
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO productos (categoria_id, marca_id, nombre, modelo, descripcion, precio, precio_promocional, calificacion, imagen_url, especificaciones_json, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const insertInv = db.prepare(`
      INSERT INTO inventario (producto_id, stock_actual, stock_minimo, ubicacion_almacen)
      VALUES (?, ?, ?, ?)
    `);

    const productRecords: Array<{ id: number; precioEfectivo: number }> = [];
    for (const p of productosSeed) {
      const pRes = insertProd.run(
        catMap.get(p.cat)!,
        marcaMap.get(p.marca)!,
        p.nombre,
        p.modelo,
        p.desc,
        p.precio,
        p.promo,
        p.calif,
        p.img,
        JSON.stringify(p.specs)
      );
      const prodId = Number(pRes.lastInsertRowid);
      insertInv.run(prodId, p.stock, p.min, p.ubicacion);
      productRecords.push({ id: prodId, precioEfectivo: p.promo ?? p.precio });
    }

    // 6. Pedidos históricos reales (últimos 6 meses) para analítica del Dashboard
    const insertPedido = db.prepare(`
      INSERT INTO pedidos (usuario_id, cliente_id, codigo_pedido, subtotal, descuento, total, estado, direccion_envio, notas, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPedidoDet = db.prepare(`
      INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertPago = db.prepare(`
      INSERT INTO pagos (pedido_id, metodo_pago, monto, estado_pago, referencia_transaccion, fecha_pago)
      VALUES (?, ?, ?, 'Aprobado', ?, ?)
    `);

    const historicalOrders = [
      { idx: 0, code: 'ET-2026-0601', fecha: '2026-06-14 10:20:00', estado: 'Entregado', metodo: 'Tarjeta de Crédito', items: [{ pIdx: 0, qty: 1 }, { pIdx: 13, qty: 2 }] },
      { idx: 1, code: 'ET-2026-0704', fecha: '2026-07-09 15:45:00', estado: 'Entregado', metodo: 'Transferencia Bancaria', items: [{ pIdx: 5, qty: 2 }, { pIdx: 15, qty: 1 }] },
      { idx: 2, code: 'ET-2026-0812', fecha: '2026-08-22 11:10:00', estado: 'Entregado', metodo: 'Tarjeta de Crédito', items: [{ pIdx: 9, qty: 1 }, { pIdx: 14, qty: 2 }] },
      { idx: 3, code: 'ET-2026-0918', fecha: '2026-09-18 16:30:00', estado: 'Entregado', metodo: 'Yape / Plin', items: [{ pIdx: 1, qty: 1 }, { pIdx: 7, qty: 1 }] },
      { idx: 4, code: 'ET-2026-1005', fecha: '2026-10-05 09:50:00', estado: 'Enviado', metodo: 'Tarjeta de Crédito', items: [{ pIdx: 6, qty: 2 }, { pIdx: 16, qty: 1 }] },
      { idx: 0, code: 'ET-2026-1029', fecha: '2026-10-29 14:15:00', estado: 'Enviado', metodo: 'Transferencia Bancaria', items: [{ pIdx: 3, qty: 1 }, { pIdx: 11, qty: 2 }] },
      { idx: 2, code: 'ET-2026-1108', fecha: '2026-11-08 18:05:00', estado: 'Confirmado', metodo: 'Tarjeta de Crédito', items: [{ pIdx: 5, qty: 1 }, { pIdx: 13, qty: 1 }, { pIdx: 15, qty: 2 }] },
      { idx: 4, code: 'ET-2026-1117', fecha: '2026-11-17 12:40:00', estado: 'En preparación', metodo: 'Yape / Plin', items: [{ pIdx: 10, qty: 1 }, { pIdx: 17, qty: 1 }] },
    ];

    historicalOrders.forEach((ord, i) => {
      const cli = clienteIds[ord.idx];
      let subtotal = 0;
      const lineItems = ord.items.map((it) => {
        const prod = productRecords[it.pIdx];
        const lineSub = Number((prod.precioEfectivo * it.qty).toFixed(2));
        subtotal += lineSub;
        return { productoId: prod.id, qty: it.qty, unit: prod.precioEfectivo, lineSub };
      });
      const pedRes = insertPedido.run(
        cli.usuarioId,
        cli.clienteId,
        ord.code,
        subtotal,
        0,
        subtotal,
        ord.estado,
        cli.direccion,
        'Entrega prioritaria verificada',
        ord.fecha
      );
      const pedidoId = Number(pedRes.lastInsertRowid);
      for (const li of lineItems) {
        insertPedidoDet.run(pedidoId, li.productoId, li.qty, li.unit, li.lineSub);
      }
      insertPago.run(pedidoId, ord.metodo, subtotal, `TXN-ET-${10000 + i}`, ord.fecha);
    });

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
