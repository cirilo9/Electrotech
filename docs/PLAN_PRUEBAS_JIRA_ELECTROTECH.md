# Plan de Pruebas ELECTROTECH Adaptado a Jira y Confluence

Este documento adapta toda la arquitectura, módulos, credenciales, flujos y **20 casos de prueba reales** de **ELECTROTECH** al flujo de trabajo completo de **Jira (Team-managed)** y **Confluence**.

- **URL de la aplicación:** `https://ais-pre-b57vdmbzswnmv7p5l533y3-138457229136.us-east1.run.app` (local: `http://localhost:3000`)
- **Credenciales de prueba Administrador:** `admin@electrotech.pe` / `Admin2026!`
- **Credenciales de prueba Cliente:** `cliente@electrotech.pe` / `Cliente2026!`
- **Sede y contacto verificados:** `Calle Real 640, Huancayo, Perú` · `+51 914356362` · `contacto@electrotech.pe`

---

## Paso 1: Crear el Proyecto en Jira (Espacio de Trabajo)

1. En la pantalla principal de Jira, haz clic en **Proyectos (Projects)** → **Crear proyecto (Create project)**.
2. Selecciona la plantilla **Seguimiento de software (Software development)** → elige **Scrum** o **Kanban**.
3. Haz clic en **Usar plantilla** y selecciona **Gestionado por el equipo (Team-managed)**.
4. Completa los campos:
   - **Nombre del proyecto:** `Plan de Pruebas Sistema Web ELECTROTECH`
   - **Clave (Key):** `PTET`
5. Haz clic en **Crear proyecto**.

**Verificación:** En la barra superior del tablero aparecerá el proyecto **Plan de Pruebas Sistema Web ELECTROTECH (`PTET`)**.

---

## Importación Directa Todo-en-Uno (Archivo `docs/jira_import_electrotech.csv`)

El archivo `docs/jira_import_electrotech.csv` incluye las **33 incidencias completas** (`6` Épicas + `6` Historias + `20` Casos de Prueba + `1` Bug histórico resuelto) ya enlazadas automáticamente mediante `Issue Id`, `Parent`, `Link "Relates"` y `Link "Blocks"`.

1. En Jira, ve a **Configuración (⚙️) → Sistema → Importación externa del sistema → CSV** (o en tu proyecto: **Configuración del proyecto / Lista → Importar desde CSV**).
2. Selecciona el archivo **`docs/jira_import_electrotech.csv`** (codificación `UTF-8`, separador `,`).
3. Elige tu proyecto destino **`Plan de Pruebas Sistema Web ELECTROTECH (PTET)`**.
4. Mapea las columnas exactamente así:

| Columna del CSV | Campo en Jira | Notas |
| :--- | :--- | :--- |
| `Issue Id` | **Issue ID** | Permite que Jira cree la jerarquía y enlaces automáticamente |
| `Issue Type` | **Issue Type** | `Epic`, `Story`, `Task`, `Bug` |
| `Summary` | **Summary** | Título del ticket |
| `Description` | **Description** | Plantilla completa `[Precondiciones]`, `[Pasos]`, `[Resultado]` |
| `Priority` | **Priority** | `Highest`, `High`, `Medium` |
| `Status` | **Status** | Marca *Map field value* y asigna `Done` a tu estado final (`Listo` / `Finalizada` / `Done`) |
| `Parent` | **Parent** | Vincula cada Historia y Tarea con su Épica correspondiente |
| `Link "Relates"` | **Link "Relates"** | Vincula cada Caso de Prueba (`TC01`–`TC20`) con su Historia de Usuario |
| `Link "Blocks"` | **Link "Blocks"** | Vincula el Bug `B01` con el Caso de Prueba `TC18` |
| `Labels` | **Labels** | Etiquetas por módulo y caso de prueba |

5. Haz clic en **Begin Import**: en pocos segundos tendrás todo el tablero, las épicas, las historias, los 20 casos de prueba vinculados y el bug listos en Jira.

---

*(Si prefieres crearlo manualmente paso a paso sin usar CSV, sigue las secciones Paso 2 a Paso 6 a continuación.)*

---

## Paso 2: Crear las Épicas (Módulos de ELECTROTECH)

En la barra superior de Jira haz clic en **Crear (Create)**, selecciona **Tipo de incidencia: Épica (Epic)** y crea las siguientes 6 Épicas:

| Código sugerido | Resumen (Summary) | Descripción (Description) |
| :--- | :--- | :--- |
| **PTET-1** | `Plan de Pruebas - Módulo 01: Pantalla de Bienvenida y Navegación` | Ciclo de pruebas funcionales y visuales para la portada futurista de ELECTROTECH, logotipo hexagonal, escaparate 3D interactivo, carrusel de testimonios y ruta de salud `/api/health` (v1.0). |
| **PTET-2** | `Plan de Pruebas - Módulo 02: Login, Registro y Control de Roles (RBAC)` | Pruebas de autenticación JWT + bcrypt, validaciones de correo/campos vacíos, recuperación de contraseña, registro de clientes, recordar sesión y protección de rutas privadas según rol (`Administrador` y `Cliente`). |
| **PTET-3** | `Plan de Pruebas - Módulo 03: Dashboard Administrativo y Analítica` | Validación de los 7 indicadores KPI reales desde SQLite (`18` productos, `5` clientes, `8` ventas, ingresos, `3` alertas de stock bajo), gráficos Chart.js, reposición de inventario y registro de nuevos artefactos. |
| **PTET-4** | `Plan de Pruebas - Módulo 04: Catálogo de Productos, Búsqueda y Filtros` | Pruebas del catálogo de `18` productos y `9` categorías, búsqueda inmediata por nombre o descripción, filtros por categoría/marca, ordenamiento, paginación y modal de detalle técnico. |
| **PTET-5** | `Plan de Pruebas - Módulo 05: Carrito de Compras, Drawer Lateral y Checkout` | Pruebas de agregar/incrementar/disminuir/eliminar productos, drawer lateral deslizable, validación estricta de inventario en servidor y confirmación transaccional ACID de pedidos con descuento de stock. |
| **PTET-6** | `Plan de Pruebas - Módulo 06: Footer Huancayo, SEO Técnico y Rendimiento` | Validación del pie de página (`Calle Real 640, Huancayo`, `+51 914356362`), metadatos SEO/OpenGraph/JSON-LD, `/robots.txt`, `/sitemap.xml`, code splitting y carga `eager`/`lazy` de imágenes. |

---

## Paso 3: Crear las Historias de Usuario (Requisitos)

Haz clic en **Crear (Create)**, selecciona **Tipo de incidencia: Historia (Story)** y vincula cada una en **Épica primaria (Parent / Epic)**:

| Código sugerido | Resumen (Summary) | Épica primaria (Parent) | Descripción breve |
| :--- | :--- | :--- | :--- |
| **PTET-7** | `Como visitante quiero explorar la bienvenida futurista, escaparate 3D y testimonios para conocer ELECTROTECH` | **PTET-1** | Verificar disponibilidad del sistema, renderizado del título degradado, botones de acción y carrusel de experiencias reales. |
| **PTET-8** | `Como usuario quiero iniciar sesión, registrarme o recuperar mi clave para acceder según mi rol` | **PTET-2** | Permitir acceso diferenciado a `Cliente` (compra) y `Administrador` (dashboard), bloqueando accesos no autorizados (`401`/`403`). |
| **PTET-9** | `Como administrador quiero ver KPIs reales, gráficos Chart.js y gestionar stock/productos en el Dashboard` | **PTET-3** | Consultar ventas mensuales, ranking de productos más vendidos, alertas de stock bajo y ejecutar reposiciones o altas de inventario. |
| **PTET-10** | `Como comprador quiero buscar productos por nombre/descripción y filtrar por 9 categorías y marca` | **PTET-4** | Explorar las 9 líneas de hardware electrónico, verificar precios promocionales, stock disponible y ficha técnica. |
| **PTET-11** | `Como cliente quiero gestionar mi compra desde el drawer lateral y confirmar pedidos validando stock` | **PTET-5** | Evitar duplicados en carrito, impedir cantidades negativas o superiores al inventario (`400`/`409`) y generar código de pedido `ET-*`. |
| **PTET-12** | `Como usuario y buscador quiero acceder al footer de Huancayo, carga rápida y metadatos SEO` | **PTET-6** | Validar enlaces rápidos, contacto `+51 914356362` en Huancayo, `robots.txt`, `sitemap.xml` y prioridad de carga LCP. |

---

## Paso 4: Crear los Casos de Prueba (`Tarea` / `Task`) y Vincularlos

Para cada caso de prueba siguiente:
1. Haz clic en **Crear (Create)** → **Tipo de incidencia: Tarea (Task)**.
2. Copia el **Resumen** y la **Descripción** exacta.
3. En **Incidencias vinculadas (Linked Issues)** elige relación **`probado por (is tested by)`** o **`se relaciona con (relates to)`** apuntando a la **Historia (PTET-7 a PTET-12)** indicada.
4. Estado actual verificado en suite QA: **Finalizado / Aprobado** (capturas en `docs/screenshots/`).

---

### Casos de Prueba — Módulo 01 (`Relacionar con PTET-7`)

#### `TC01 - Validar Ruta de Salud del Servidor ELECTROTECH`
```text
[Precondiciones]
1. Servidor Express + SQLite iniciado en el puerto 3000.
2. Base de datos inicializada con la semilla de 18 productos.

[Pasos de Ejecución]
1. Enviar petición HTTP GET a /api/health.
2. Inspeccionar el código de estado y el cuerpo JSON devuelto.

[Resultado Esperado]
El servidor responde HTTP 200 con { "ok": true, "app": "ELECTROTECH", "productos": 18 } (>= 18).
```

#### `TC02 - Validar Pantalla de Bienvenida, Logotipo, Escaparate 3D y Testimonios`
```text
[Precondiciones]
1. Navegador Google Chrome (resolución 1440x900).
2. Usuario accede a la ruta raíz "/" de ELECTROTECH.

[Pasos de Ejecución]
1. Cargar la pantalla principal de bienvenida.
2. Verificar la presencia del logotipo hexagonal ELECTROTECH y el título principal.
3. Interactuar con las pestañas del escaparate 3D (Ecosistema, Laptops, Smartphones, Televisores).
4. Desplazarse al carrusel de testimonios y pulsar "Siguiente testimonio" / "Testimonio anterior".

[Resultado Esperado]
Se muestra el título "EL FUTURO DE LA TECNOLOGÍA ESTÁ AQUÍ", descripción corporativa, botones "Explorar productos", "Iniciar sesión", enlace "#nuestra-tienda" y el carrusel de testimonios funcional.
Evidencia: docs/screenshots/01_pantalla_bienvenida.png y 02_testimonios_y_footer.png
```

---

### Casos de Prueba — Módulo 02 (`Relacionar con PTET-8`)

#### `TC03 - Validar Inicio de Sesión Exitoso (Administrador y Cliente)`
```text
[Precondiciones]
1. Usuarios registrados en BD: admin@electrotech.pe y cliente@electrotech.pe.
2. Navegador Google Chrome.

[Pasos de Ejecución]
1. Ingresar a la vista "Iniciar sesión" de ELECTROTECH.
2. Escribir correo: admin@electrotech.pe y contraseña: Admin2026!.
3. Marcar "Recordar sesión" y hacer clic en "Iniciar sesión".
4. Cerrar sesión y repetir con cliente@electrotech.pe / Cliente2026!.

[Resultado Esperado]
El endpoint POST /api/auth/login devuelve HTTP 200 y token JWT. El Administrador es redirigido al Dashboard (/dashboard) y el Cliente al Catálogo o Carrito según su estado.
Evidencia: docs/screenshots/05_login_roles.png
```

#### `TC04 - Validar Rechazo de Inicio de Sesión con Contraseña Incorrecta`
```text
[Precondiciones]
1. Usuario admin@electrotech.pe existente en base de datos.

[Pasos de Ejecución]
1. Ingresar a la vista "Iniciar sesión".
2. Escribir correo: admin@electrotech.pe.
3. Escribir contraseña errónea: ClaveIncorrecta999.
4. Hacer clic en "Iniciar sesión".

[Resultado Esperado]
El backend responde HTTP 401 (No autorizado) y la interfaz muestra alerta clara sin crear sesión ni token.
```

#### `TC05 - Validar Campos Vacíos y Formato de Correo Electrónico en Login`
```text
[Precondiciones]
1. Pantalla de "Iniciar sesión" abierta.

[Pasos de Ejecución]
1. Hacer clic en "Iniciar sesión" dejando correo y contraseña vacíos.
2. Escribir correo con formato inválido ("correo-invalido") y una contraseña válida.
3. Intentar enviar el formulario.

[Resultado Esperado]
El sistema bloquea el envío y el endpoint devuelve HTTP 400 indicando correo electrónico inválido o campos obligatorios faltantes.
```

#### `TC06 - Validar Restricción de Rutas Privadas por Rol (RBAC)`
```text
[Precondiciones]
1. Usuario sin autenticar o autenticado con rol "Cliente" (cliente@electrotech.pe).

[Pasos de Ejecución]
1. Realizar petición GET /api/admin/dashboard sin cabecera Authorization.
2. Iniciar sesión como Cliente (rol = "Cliente").
3. Realizar petición GET /api/admin/dashboard enviando el JWT del Cliente.

[Resultado Esperado]
Sin token el servidor responde HTTP 401; con token de Cliente responde HTTP 403 (Acceso prohibido solo para Administrador).
```

#### `TC07 - Validar Registro de Cliente, Recuperación de Contraseña y Cierre de Sesión`
```text
[Precondiciones]
1. Correo andrea.qa@correo.pe no registrado previamente.

[Pasos de Ejecución]
1. Cambiar a modo "¿No tienes cuenta? Regístrate como Cliente" y enviar nombre, correo y clave Password2026!.
2. Usar "¿Olvidaste tu contraseña?" para andrea.qa@correo.pe y actualizar a NewPassword2026!.
3. Hacer clic en el botón "Salir" de la barra superior.

[Resultado Esperado]
El registro devuelve HTTP 201 con rol "Cliente", la recuperación actualiza la clave con bcrypt (HTTP 200) y el cierre de sesión limpia el token (HTTP 200).
```

---

### Casos de Prueba — Módulo 03 (`Relacionar con PTET-9`)

#### `TC08 - Validar Carga de Indicadores KPI Reales y Gráficos en Dashboard`
```text
[Precondiciones]
1. Sesión iniciada con rol Administrador (admin@electrotech.pe / Admin2026!).

[Pasos de Ejecución]
1. Acceder a la pestaña "Dashboard" en la barra de navegación.
2. Esperar la respuesta de GET /api/admin/dashboard.
3. Revisar las 7 tarjetas estadísticas, gráficos Chart.js y tabla de últimos pedidos.

[Resultado Esperado]
El dashboard muestra datos reales de BD: Total productos (18), Total clientes (5), Ventas realizadas (8), Ingresos totales ($26,988.00), Productos disponibles (18), Stock bajo (3) y Pedidos registrados (8), junto a gráficos de Ventas Mensuales y Productos Más Vendidos.
Evidencia: docs/screenshots/06_dashboard_admin.png
```

#### `TC09 - Validar Reposición de Inventario y Alta de Nuevo Producto (Admin)`
```text
[Precondiciones]
1. Sesión activa como Administrador en la sección "Inventario y Catálogo" del Dashboard.

[Pasos de Ejecución]
1. Actualizar el stock del producto ID 1 (ElectroBook Pro 16) a 30 unidades mediante el control de reposición.
2. Completar el formulario de nuevo producto (MacBook Air M4 15, modelo MBA15-M4-2026, precio $1,699, stock 12) y guardar.

[Resultado Esperado]
PATCH /api/admin/inventory/1 responde HTTP 200 con stock_actual = 30. POST /api/admin/products responde HTTP 201 y refleja el nuevo producto en el catálogo.
```

---

### Casos de Prueba — Módulo 04 (`Relacionar con PTET-10`)

#### `TC10 - Validar Listado Completo de Productos y 9 Categorías`
```text
[Precondiciones]
1. Base de datos sembrada con 9 categorías y 18 artefactos electrónicos.

[Pasos de Ejecución]
1. Ingresar a la pestaña "Catálogo".
2. Verificar las pestañas de categorías disponibles y el contador total de productos.

[Resultado Esperado]
Se muestran las 9 categorías (Laptops, Computadoras, Smartphones, Tablets, Televisores, Impresoras, Parlantes y audífonos, Accesorios tecnológicos, Componentes de PC) y los 18 productos registrados.
Evidencia: docs/screenshots/03_catalogo_productos.png
```

#### `TC11 - Validar Búsqueda Instantánea y Filtros por Categoría y Marca`
```text
[Precondiciones]
1. Usuario ubicado en la pantalla de Catálogo.

[Pasos de Ejecución]
1. Escribir "MacBook" en la barra de búsqueda y verificar coincidencia por nombre.
2. Escribir "titanio" para validar coincidencia en descripción técnica.
3. Filtrar por categoría "Smartphones" y luego por marca "NVIDIA".

[Resultado Esperado]
Los resultados se filtran al instante (0ms en cliente y SQL en API), cumpliendo precio_efectivo <= precio y stock_actual > 0.
```

#### `TC12 - Validar Detalle Técnico del Producto y Búsqueda Sin Resultados`
```text
[Precondiciones]
1. Catálogo cargado con productos activos.

[Pasos de Ejecución]
1. Hacer clic en "Ver detalles" sobre cualquier tarjeta para abrir el modal técnico.
2. Consultar un ID inexistente en API (/api/catalog/products/9999).
3. Buscar el texto "DispositivoInexistenteXYZ" en la barra del catálogo.

[Resultado Esperado]
El modal muestra especificaciones, calificación y stock (HTTP 200). El ID inexistente devuelve HTTP 404 y la búsqueda sin coincidencias muestra el estado vacío con el botón "Limpiar filtros".
```

---

### Casos de Prueba — Módulo 05 (`Relacionar con PTET-11`)

#### `TC13 - Validar Consolidación de Productos y Control de Cantidades en Carrito`
```text
[Precondiciones]
1. Carrito vacío en sesión actual.

[Pasos de Ejecución]
1. Agregar 1 unidad de un producto al carrito y luego volver a agregar 2 unidades del mismo producto.
2. Disminuir la cantidad a 1 unidad desde el control "-".
3. Pulsar el botón de eliminar (papelera).

[Resultado Esperado]
No se duplican filas (se consolida en cantidad = 3 con subtotal recalculado en backend), luego baja a 1 y finalmente queda en 0 ítems y total $0.00.
```

#### `TC14 - Validar Restricciones de Stock, Cantidades Negativas e Ítem Inexistente`
```text
[Precondiciones]
1. Producto ID 17 (GeForce RTX 5080 Founders) con stock_actual = 2.

[Pasos de Ejecución]
1. Intentar agregar producto ID 99999 (inexistente).
2. Intentar agregar o actualizar una cantidad negativa (-2 o -5).
3. Intentar agregar 99 unidades de GeForce RTX 5080 Founders (stock = 2).

[Resultado Esperado]
Producto inexistente retorna HTTP 404; cantidad negativa retorna HTTP 400; superar inventario disponible retorna HTTP 409 ("Stock insuficiente") y bloquea la acción en UI.
```

#### `TC15 - Validar Checkout Transaccional y Descuento Real de Inventario`
```text
[Precondiciones]
1. Usuario autenticado como Cliente (cliente@electrotech.pe).
2. Producto ID 17 (stock inicial = 2, precio = $1,299.00) agregado al carrito.

[Pasos de Ejecución]
1. Ir a "Mi Carrito" → "Ir a finalizar compra".
2. Ingresar dirección de envío ("Calle Real 640, Huancayo") y método de pago ("Tarjeta de Crédito").
3. Hacer clic en "Confirmar pedido".

[Resultado Esperado]
POST /api/orders/checkout responde HTTP 201, genera código ET-*, calcula total en backend ($1,299.00) y descuenta el inventario en SQLite de 2 a 1 unidad.
```

#### `TC16 - Validar Drawer Lateral de Carrito en Estados Cerrado, Vacío y Poblado`
```text
[Precondiciones]
1. Usuario en cualquier vista (Inicio o Catálogo).

[Pasos de Ejecución]
1. Verificar que el drawer permanece oculto inicialmente.
2. Hacer clic en "Mi Carrito (0)" en la barra superior para abrir el drawer vacío.
3. Cerrar, agregar "GeForce RTX 5080 Founders" o "ElectroBook Pro 16" y validar la apertura automática del drawer lateral.

[Resultado Esperado]
El drawer muestra estado vacío con botón "Explorar catálogo"; al tener productos muestra miniatura, controles -/+, stock disponible, descuentos promocionales, total estimado y botón "Ir a finalizar compra".
Evidencia: docs/screenshots/04_drawer_carrito.png
```

---

### Casos de Prueba — Módulo 06, SEO y Rendimiento (`Relacionar con PTET-12`)

#### `TC17 - Validar Footer Corporativo, Ubicación Huancayo y Teléfono +51 914356362`
```text
[Precondiciones]
1. Usuario en cualquier vista de ELECTROTECH desplazado hasta el pie de página.

[Pasos de Ejecución]
1. Revisar el logotipo, enlaces rápidos (Inicio, Catálogo, Mi carrito, Contacto) y enlaces legales.
2. Verificar la dirección física, el enlace telefónico y el texto legal de copyright.

[Resultado Esperado]
Muestra "Calle Real 640, Huancayo · Lun–Sáb 09:00–20:00", enlace tel:+51914356362 ("+51 914356362"), sello "Comercio electrónico verificado · Huancayo, Perú" y "© 2026 ELECTROTECH. Todos los derechos reservados. Tecnología e innovación para tu futuro".
Evidencia: docs/screenshots/02_testimonios_y_footer.png
```

#### `TC18 - Validar Endpoints Dinámicos robots.txt y sitemap.xml`
```text
[Precondiciones]
1. Servidor Express activo con categorías y productos en SQLite.

[Pasos de Ejecución]
1. Solicitar GET /robots.txt.
2. Solicitar GET /sitemap.xml.

[Resultado Esperado]
robots.txt permite "/" y bloquea /api/admin/, /api/auth/, /api/cart/ y /api/orders/. sitemap.xml devuelve XML UTF-8 válido listando portada, categorías (?categoria=laptops) y productos (?producto=1).
```

#### `TC19 - Validar Metadatos SEO, OpenGraph, Twitter Card y Schema.org JSON-LD`
```text
[Precondiciones]
1. Archivo index.html y hook useDocumentSeo cargados.

[Pasos de Ejecución]
1. Inspeccionar las etiquetas <head> del documento HTML inicial.
2. Abrir la ficha de un producto y verificar la actualización dinámica de metadatos.

[Resultado Esperado]
Contiene <title>, meta description, og:title, og:image, twitter:card="summary_large_image", preload de imagen hero y JSON-LD Store/WebSite (y Product + Offer al abrir detalles).
```

#### `TC20 - Validar Estrategia de Carga de Imágenes (Eager/High vs Lazy/Async)`
```text
[Precondiciones]
1. Pantalla de bienvenida renderizada.

[Pasos de Ejecución]
1. Inspeccionar atributos de las imágenes del Hero principal.
2. Inspeccionar atributos de las imágenes de tarjetas inferiores y secciones secundarias.

[Resultado Esperado]
Las imágenes hero utilizan loading="eager" y fetchPriority="high" para optimizar LCP; las imágenes bajo el pliegue usan loading="lazy" y decoding="async".
```

---

## Paso 5: Flujo para Reportar Fallos o Errores (`Bug`) en Jira

Si durante una futura regresión alguno de los casos `TC01`–`TC20` falla:
1. Abre la **Tarea (`Task`)** del caso de prueba fallido (ejemplo: `PTET-15` correspondiente a `TC03`).
2. Cambia su estado de **Por hacer** a **Bloqueado** (o **Fallido**).
3. Haz clic en **Crear (Create)** → **Tipo de incidencia: Error (Bug)**.
4. Completa el reporte siguiendo estos ejemplos adaptados a **ELECTROTECH**:

| Ejemplo de Bug | Resumen (Summary) | Prioridad | Descripción | Vinculación (`Linked Issues`) |
| :--- | :--- | :--- | :--- | :--- |
| **B01** | `B01 - Error 500 al confirmar pedido con stock concurrente en Checkout` | **Bloqueante (Highest)** | Al confirmar dos clientes simultáneamente la última unidad de *GeForce RTX 5080 Founders*, el servidor retorna HTTP 500 en lugar de controlar el conflicto con HTTP 409. Adjuntar captura de red y payload de `/api/orders/checkout`. | `bloquea a (blocks)` → Tarea `TC15` |
| **B02** | `B02 - Error 500 en /sitemap.xml por columna inexistente en tabla categorias` *(Histórico QA — Corregido)* | **Alta (High)** | Durante la ejecución de `seo_perf.test.ts`, la consulta SQL solicitaba `WHERE activo = 1` en `categorias` generando error SQLite `no such column: activo`. Corregido en `seoService.ts` y verificado en verde. | `bloquea a (blocks)` → Tarea `TC18` |
| **B03** | `B03 - Botón "Agregar al carrito" permite superar stock en modo offline` | **Media (Medium)** | Si se pierde conexión tras cargar el catálogo, el botón de incremento en el drawer debe mantener bloqueo local al alcanzar `stock_disponible` y mostrar alerta SweetAlert2. | `bloquea a (blocks)` → Tarea `TC14` |

---

## Paso 6: Mostrar el Estado Automáticamente en Confluence

1. Abre tu página de reporte en **Confluence** (ej. *Reporte QA — ELECTROTECH v1.0*).
2. Presiona la tecla `/` en el editor, escribe **`Jira`** y presiona **Enter**.
3. En el buscador de Jira dentro de Confluence, pega cualquiera de estas consultas **JQL** según la sección del documento:

- **Tabla 1 — Todas las Épicas y Módulos:**
  ```jql
  project = PTET AND type = Epic ORDER BY key ASC
  ```
- **Tabla 2 — Historias de Usuario (Requisitos):**
  ```jql
  project = PTET AND type = Story ORDER BY key ASC
  ```
- **Tabla 3 — Matriz de Casos de Prueba (TC01 a TC20):**
  ```jql
  project = PTET AND type = Task ORDER BY key ASC
  ```
- **Tabla 4 — Fallos / Bugs Detectados:**
  ```jql
  project = PTET AND type = Bug ORDER BY priority DESC, created DESC
  ```

4. Haz clic en **Insertar** para cada bloque.

**Verificación:** Confluence mostrará las tablas dinámicas de Épicas, Historias, Casos de Prueba y Bugs sincronizadas en tiempo real con el estado de cada ticket en Jira.
