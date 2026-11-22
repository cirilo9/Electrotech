import { afterEach, describe, expect, it } from 'vitest';
import { createTestServer, type TestServerContext } from './testHelper.ts';

let ctx: TestServerContext | null = null;

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
});

describe('Módulo 02: Login y Autenticación (6.2)', () => {
  it('inicia sesión correctamente con credenciales válidas de Administrador y Cliente', async () => {
    ctx = await createTestServer();

    const adminRes = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@electrotech.pe', password: 'Admin2026!', remember: true }),
    });
    const adminBody = await adminRes.json();

    expect(adminRes.status).toBe(200);
    expect(adminBody.token).toBeTruthy();
    expect(adminBody.user.rol).toBe('Administrador');

    const clientRes = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cliente@electrotech.pe', password: 'Cliente2026!' }),
    });
    const clientBody = await clientRes.json();

    expect(clientRes.status).toBe(200);
    expect(clientBody.user.rol).toBe('Cliente');
  });

  it('rechaza inicio de sesión con contraseña incorrecta', async () => {
    ctx = await createTestServer();
    const res = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@electrotech.pe', password: 'ClaveIncorrecta999' }),
    });

    expect(res.status).toBe(401);
  });

  it('valida el formato de correo electrónico y campos vacíos', async () => {
    ctx = await createTestServer();

    const emptyRes = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });
    expect(emptyRes.status).toBe(400);

    const invalidEmailRes = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'correo-invalido', password: 'Admin2026!' }),
    });
    expect(invalidEmailRes.status).toBe(400);
  });

  it('restringe rutas privadas a usuarios no autenticados y por rol', async () => {
    ctx = await createTestServer();

    const anonRes = await fetch(`${ctx.baseUrl}/admin/dashboard`);
    expect(anonRes.status).toBe(401);

    const clientLogin = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cliente@electrotech.pe', password: 'Cliente2026!' }),
    });
    const { token } = await clientLogin.json();

    const forbiddenRes = await fetch(`${ctx.baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(forbiddenRes.status).toBe(403);
  });

  it('permite registrar un nuevo cliente, recuperar contraseña y cerrar sesión', async () => {
    ctx = await createTestServer();

    const regRes = await fetch(`${ctx.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Andrea QA',
        email: 'andrea.qa@correo.pe',
        password: 'Password2026!',
      }),
    });
    const regBody = await regRes.json();
    expect(regRes.status).toBe(201);
    expect(regBody.user.rol).toBe('Cliente');

    const recRes = await fetch(`${ctx.baseUrl}/auth/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'andrea.qa@correo.pe', newPassword: 'NewPassword2026!' }),
    });
    expect(recRes.status).toBe(200);

    const logoutRes = await fetch(`${ctx.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${regBody.token}` },
    });
    expect(logoutRes.status).toBe(200);
  });
});
