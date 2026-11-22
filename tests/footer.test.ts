import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Footer } from '../src/components/Footer.tsx';

describe('Módulo 06: Footer (6.6)', () => {
  it('renderiza logotipo, enlaces rápidos, contacto, redes sociales y copyright oficial', () => {
    const html = renderToStaticMarkup(
      React.createElement(Footer, {
        onNavigate: () => {},
      })
    );

    expect(html).toContain('ELECTRO');
    expect(html).toContain('Inicio');
    expect(html).toContain('Catálogo');
    expect(html).toContain('Mi carrito');
    expect(html).toContain('Contacto');
    expect(html).toContain('Política de privacidad');
    expect(html).toContain('Términos y condiciones');
    expect(html).toContain('mailto:contacto@electrotech.pe');
    expect(html).toContain('tel:+51914356362');
    expect(html).toContain('914356362');
    expect(html).toContain('Huancayo');
    expect(html).toContain('https://github.com');
    expect(html).toContain('https://linkedin.com');
    expect(html).toContain(
      '© 2026 ELECTROTECH. Todos los derechos reservados. Tecnología e innovación para tu futuro'
    );
  });
});
