import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { buildRobotsTxt, buildSitemapXml, resolveBaseUrl } from '../server/services/seoService.ts';
import { listCategories, listProducts } from '../server/services/catalogService.ts';
import { WelcomePage } from '../src/components/WelcomePage.tsx';
import { createTestServer, type TestServerContext } from './testHelper.ts';

let ctx: TestServerContext | null = null;

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
});

describe('Rendimiento, SEO y Metadatos Estructurados', () => {
  it('genera robots.txt y sitemap.xml válidos con categorías y productos activos', async () => {
    ctx = await createTestServer();
    const baseUrl = resolveBaseUrl('MY_APP_URL', 'https', 'electrotech.pe');
    expect(baseUrl).toBe('https://electrotech.pe');

    const robots = buildRobotsTxt(baseUrl);
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Disallow: /api/admin/');
    expect(robots).toContain('Sitemap: https://electrotech.pe/sitemap.xml');

    const sitemap = buildSitemapXml(ctx.db, baseUrl);
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<loc>https://electrotech.pe/</loc>');
    expect(sitemap).toContain('<loc>https://electrotech.pe/?categoria=laptops</loc>');
    expect(sitemap).toContain('<loc>https://electrotech.pe/?producto=1</loc>');
  });

  it('incluye metadatos SEO, OpenGraph, Twitter Card, JSON-LD y preload LCP en index.html', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');

    expect(html).toContain('<title>ELECTROTECH — Tienda de Tecnología y Hardware</title>');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('rel="preload"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type": "Store"');
    expect(html).toContain('"@type": "WebSite"');
  });

  it('prioriza imágenes hero (eager/high) y difiere imágenes secundarias (lazy/async)', async () => {
    ctx = await createTestServer();
    const categories = listCategories(ctx.db);
    const featured = listProducts(ctx.db, { limit: 3 }).items;

    const html = renderToStaticMarkup(
      React.createElement(WelcomePage, {
        featuredProducts: featured,
        categories,
        onNavigate: () => {},
        onSelectCategory: () => {},
        onInspectProduct: () => {},
        onAddToCart: () => {},
      })
    );

    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });
});
