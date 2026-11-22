import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthUser, UserRole } from '../../shared/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'electrotech-2026-secure-jwt-signing-key';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function verifyToken(token: string): { sub: number; email: string; rol: UserRole } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; email: string; rol: UserRole };
    return decoded;
  } catch {
    throw new AuthError('Sesión inválida o expirada. Inicia sesión nuevamente.', 401);
  }
}

export function loginUser(
  db: DatabaseSync,
  emailRaw: string,
  passwordRaw: string,
  remember = false
): AuthResult {
  const email = (emailRaw || '').trim().toLowerCase();
  const password = passwordRaw || '';

  if (!email || !password) {
    throw new AuthError('El correo electrónico y la contraseña son obligatorios.', 400);
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new AuthError('El formato del correo electrónico no es válido.', 400);
  }

  const row = db.prepare(`
    SELECT u.id, u.nombre, u.email, u.password_hash, u.activo, r.nombre AS rol,
           c.id AS cliente_id, c.telefono, c.direccion, c.ciudad
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    LEFT JOIN clientes c ON c.usuario_id = u.id
    WHERE LOWER(u.email) = ?
  `).get(email) as {
    id: number;
    nombre: string;
    email: string;
    password_hash: string;
    activo: number;
    rol: UserRole;
    cliente_id: number | null;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
  } | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new AuthError('Credenciales incorrectas. Verifica tu correo y contraseña.', 401);
  }
  if (!row.activo) {
    throw new AuthError('La cuenta se encuentra suspendida.', 403);
  }

  const token = jwt.sign(
    { sub: row.id, email: row.email, rol: row.rol },
    JWT_SECRET,
    { expiresIn: remember ? '30d' : '12h' }
  );

  if (remember) {
    db.prepare('UPDATE usuarios SET remember_token = ? WHERE id = ?').run(token.slice(-24), row.id);
  }

  return {
    token,
    user: {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol,
      cliente_id: row.cliente_id,
      telefono: row.telefono,
      direccion: row.direccion,
      ciudad: row.ciudad,
    },
  };
}

export function registerClient(
  db: DatabaseSync,
  payload: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  }
): AuthResult {
  const nombre = (payload.nombre || '').trim();
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';

  if (!nombre || !email || !password) {
    throw new AuthError('Nombre, correo electrónico y contraseña son campos obligatorios.', 400);
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new AuthError('Ingresa un correo electrónico válido.', 400);
  }
  if (password.length < 6) {
    throw new AuthError('La contraseña debe tener al menos 6 caracteres.', 400);
  }

  const exists = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = ?').get(email);
  if (exists) {
    throw new AuthError('Ya existe una cuenta registrada con ese correo electrónico.', 409);
  }

  const clientRole = db.prepare("SELECT id FROM roles WHERE nombre = 'Cliente'").get() as { id: number } | undefined;
  if (!clientRole) {
    throw new AuthError('Configuración de roles no disponible.', 500);
  }

  const hash = bcrypt.hashSync(password, 10);
  db.exec('BEGIN;');
  try {
    const uRes = db.prepare(
      'INSERT INTO usuarios (rol_id, nombre, email, password_hash, activo) VALUES (?, ?, ?, ?, 1)'
    ).run(clientRole.id, nombre, email, hash);
    const usuarioId = Number(uRes.lastInsertRowid);

    const cRes = db.prepare(
      'INSERT INTO clientes (usuario_id, telefono, direccion, ciudad) VALUES (?, ?, ?, ?)'
    ).run(
      usuarioId,
      (payload.telefono || '').trim(),
      (payload.direccion || 'Huancayo Centro').trim(),
      (payload.ciudad || 'Huancayo').trim()
    );
    const clienteId = Number(cRes.lastInsertRowid);
    db.exec('COMMIT;');

    const token = jwt.sign(
      { sub: usuarioId, email, rol: 'Cliente' as UserRole },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return {
      token,
      user: {
        id: usuarioId,
        nombre,
        email,
        rol: 'Cliente',
        cliente_id: clienteId,
        telefono: payload.telefono || '',
        direccion: payload.direccion || 'Huancayo Centro',
        ciudad: payload.ciudad || 'Huancayo',
      },
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function getUserById(db: DatabaseSync, userId: number): AuthUser | null {
  const row = db.prepare(`
    SELECT u.id, u.nombre, u.email, r.nombre AS rol,
           c.id AS cliente_id, c.telefono, c.direccion, c.ciudad
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    LEFT JOIN clientes c ON c.usuario_id = u.id
    WHERE u.id = ? AND u.activo = 1
  `).get(userId) as AuthUser | undefined;
  return row || null;
}

export function recoverPassword(db: DatabaseSync, emailRaw: string, newPasswordRaw?: string): { message: string } {
  const email = (emailRaw || '').trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AuthError('Ingresa un correo electrónico válido para recuperar el acceso.', 400);
  }
  const user = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = ?').get(email) as { id: number } | undefined;
  if (!user) {
    throw new AuthError('No se encontró ninguna cuenta asociada a ese correo electrónico.', 404);
  }
  if (newPasswordRaw) {
    if (newPasswordRaw.length < 6) {
      throw new AuthError('La nueva contraseña debe tener al menos 6 caracteres.', 400);
    }
    const hash = bcrypt.hashSync(newPasswordRaw, 10);
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hash, user.id);
    return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }
  return { message: `Código de verificación enviado a ${email}. Ingresa tu nueva contraseña para completar el restablecimiento.` };
}
