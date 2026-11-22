import type { DatabaseSync } from 'node:sqlite';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function resolveBaseUrl(appUrlEnv: string | undefined, protocol: string, host: string | undefined): string {
  const candidate = appUrlEnv && appUrlEnv !== 'MY_APP_URL' ? appUrlEnv : `${protocol}://${host || 'localhost:3000'}`;
  return candidate.replace(/\/+$/, '');
}

export function buildRobotsTxt(baseUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/admin/',
    'Disallow: /api/auth/',
    'Disallow: /api/cart/',
    'Disallow: /api/orders/',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export function buildSitemapXml(db: DatabaseSync, baseUrl: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const categories = db
    .prepare('SELECT slug FROM categorias ORDER BY id ASC')
    .all() as Array<{ slug: string }>;
  const products = db
    .prepare('SELECT id, created_at FROM productos WHERE activo = 1 ORDER BY id ASC')
    .all() as Array<{ id: number; created_at: string | null }>;

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/?view=catalog`, lastmod: today, changefreq: 'daily', priority: '0.9' },
  ];

  for (const cat of categories) {
    urls.push({
      loc: `${baseUrl}/?categoria=${encodeURIComponent(cat.slug)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  for (const prod of products) {
    const lastmod = prod.created_at ? prod.created_at.slice(0, 10) : today;
    urls.push({
      loc: `${baseUrl}/?producto=${prod.id}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  const body = urls
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
