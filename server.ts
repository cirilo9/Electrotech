import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createDatabase, seedDatabase } from './server/db.ts';
import { createApiRouter } from './server/routes/api.ts';
import { buildRobotsTxt, buildSitemapXml, resolveBaseUrl } from './server/services/seoService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  app.set('etag', 'strong');
  app.use(express.json());

  const db = createDatabase(path.join(__dirname, 'electrotech.db'));
  seedDatabase(db);

  // SEO endpoints: robots.txt and dynamic XML sitemap
  app.get('/robots.txt', (req, res) => {
    const baseUrl = resolveBaseUrl(process.env.APP_URL, req.protocol, req.get('host'));
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buildRobotsTxt(baseUrl));
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = resolveBaseUrl(process.env.APP_URL, req.protocol, req.get('host'));
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buildSitemapXml(db, baseUrl));
  });

  // Cache static local product/showroom images for fast repeat loads
  app.use(
    '/src/assets/images',
    express.static(path.join(__dirname, 'src', 'assets', 'images'), {
      maxAge: '7d',
      immutable: true,
      etag: true,
    })
  );

  app.use('/api', createApiRouter(db));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '7d',
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ELECTROTECH server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ELECTROTECH server:', err);
  process.exit(1);
});
