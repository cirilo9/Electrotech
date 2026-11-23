<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

⚡ Electrotech — E-Commerce & Management Platform
![CI Pipeline](https://github.com/electrotech/electrotech/actions/workflows/ci.yml/badge.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)
![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-7852B0)
Electrotech es una plataforma integral de comercio electrónico y gestión orientada al sector de tecnología y componentes informáticos. El proyecto combina una experiencia de usuario fluida e interactiva en la tienda con un panel de administración en tiempo real (Dashboard), respaldado por una sólida suite de pruebas QA y arquitectura lista para producción.
---
🚀 Características Principales
🛒 Plataforma E-Commerce (Cliente)
Catálogo Interactivo: Filtrado y exploración por categorías (Laptops, Componentes PC, Audio, TVs, Tablets y Accesorios).
Detalle de Producto: Modal enriquecido con especificaciones técnicas, precio y disponibilidad.
Carrito de Compras (Drawer): Gestión dinámica de ítems, resumen de costos y proceso de checkout interactivo.
Autenticación y Roles: Sistema de inicio de sesión diferenciado para clientes y administradores.
📊 Dashboard de Administración
Métricas e Indicadores KPI: Visualización de ventas, pedidos y stock en tiempo real.
Gráficos Interactivos: Integración de gráficos mediante `Chart.js` y `react-chartjs-2`.
Gestión de Productos e Inventario: Control de existencias e incorporación de nuevos productos.
🧪 QA & Cobertura de Pruebas
Pruebas Unitarias y de Integración: Cobertura integral con Vitest y React Testing Library.
Generación de Reportes: Cobertura detallada almacenada en la carpeta `/coverage`.
Documentación de Pruebas: Planes de prueba formato Jira/Confluence y reporte formal de errores y ejecuciones en `/docs`.
---
🛠️ Stack Tecnológico
Capa	Tecnología / Herramienta
Frontend Framework	React 18 + TypeScript
Build Tool & Server	Vite / Bun
Estilos & UI	Tailwind CSS, Lucide Icons, SweetAlert2
Animaciones & Gráficos	Motion (`motion-react`), Chart.js, React-Chartjs-2
Base de Datos	SQLite (`electrotech.db`) / Script MySQL 8 (`database_mysql8.sql`)
Testing	Vitest, React Testing Library
Contenedorización & CI/CD	Docker, Docker Compose, GitHub Actions
---
📁 Estructura del Proyecto
```text
electrotech/
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline Integración Continua (CI)
├── docs/                        # Documentación QA y Arquitectura
│   ├── ARQUITECTURA_Y_ENTREGABLES.md
│   ├── PLAN_PRUEBAS_CONFLUENCE_ELECTROTECH.md
│   ├── PLAN_PRUEBAS_JIRA_ELECTROTECH.md
│   ├── REPORTE_DE_PRUEBAS_QA.md
│   ├── database_mysql8.sql       # Script de migración base de datos MySQL 8
│   ├── jira_import_electrotech.csv
│   └── screenshots/             # Capturas de pantalla y evidencias QA
├── src/                         # Código fuente de la aplicación
│   ├── assets/                  # Imágenes y recursos estáticos
│   ├── components/              # Componentes reutilizables (Modales, Cart, etc.)
│   ├── pages/                   # Páginas (CatalogPage, DashboardPage, LoginPage, CartPage)
│   └── tests/                   # Pruebas unitarias e integración
├── coverage/                    # Reportes de cobertura de código (Vitest)
├── Dockerfile                   # Configuración de Docker
├── docker-compose.yml           # Configuración Docker Compose
├── electrotech.db               # Base de datos local SQLite
├── package.json
└── vite.config.ts
```
---
💻 Requisitos Previos
Asegúrate de tener instalado en tu sistema:
Node.js v18.0 o superior (o Bun)
npm, pnpm o bun
Docker y Docker Compose (opcional para despliegue en contenedores)
---
⚡ Instalación y Configuración Local
Clonar el repositorio:
```bash
   git clone https://github.com/tu-usuario/electrotech.git
   cd electrotech
   ```
Instalar dependencias:
```bash
   npm install
   # o utilizando Bun
   bun install
   ```
Variables de entorno:
Copia el archivo `.env.example` y configura tus variables locales según sea necesario:
```bash
   cp .env.example .env
   ```
Iniciar el servidor de desarrollo:
```bash
   npm run dev
   # o con Bun
   bun dev
   ```
La aplicación estará disponible en `http://localhost:5173`.
---
🧪 Ejecución de Pruebas (QA)
Para ejecutar la suite de pruebas unitarias y verificar el estado del código:
Ejecutar pruebas en modo observador (Watch):
```bash
  npm run test
  ```
Generar reporte de cobertura:
```bash
  npm run coverage
  ```
Los resultados del reporte de cobertura se guardan en la carpeta `/coverage` e incluyen archivos resumen en JSON e HTML.
---
🐳 Despliegue con Docker
Usando Docker Build y Run
Construir la imagen de Docker:
```bash
   docker build -t electrotech:latest .
   ```
Ejecutar el contenedor:
```bash
   docker run -d -p 8080:80 --name electrotech_app electrotech:latest
   ```
Accede a la aplicación en `http://localhost:8080`.
Usando Docker Compose
```bash
docker-compose up -d
```
---
