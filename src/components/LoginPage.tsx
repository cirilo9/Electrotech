import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api.ts';
import type { AuthUser } from '../../shared/types.ts';
import { ElectrotechLogo } from './Navbar.tsx';

interface LoginPageProps {
  onSuccess: (user: AuthUser, token: string, remember: boolean) => void;
  onCancel: () => void;
}

type AuthMode = 'login' | 'register' | 'recover';

export function LoginPage({ onSuccess, onCancel }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoverStep, setRecoverStep] = useState<1 | 2>(1);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg('Completa el correo electrónico y la contraseña.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.login(email, password, remember);
        await Swal.fire({
          icon: 'success',
          title: `Bienvenido, ${res.user.nombre}`,
          text: `Acceso verificado con rol ${res.user.rol}.`,
          timer: 1500,
          showConfirmButton: false,
          background: '#0F172A',
          color: '#F8FAFC',
        });
        onSuccess(res.user, res.token, remember);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!nombre.trim() || !email.trim() || !password) {
        setErrorMsg('Nombre, correo y contraseña son campos obligatorios.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.register({ nombre, email, password, telefono, direccion });
        await Swal.fire({
          icon: 'success',
          title: 'Cuenta creada',
          text: 'Tu cuenta de Cliente ha sido registrada correctamente.',
          timer: 1600,
          showConfirmButton: false,
          background: '#0F172A',
          color: '#F8FAFC',
        });
        onSuccess(res.user, res.token, true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'No se pudo registrar la cuenta.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Recover mode
    if (!email.trim()) {
      setErrorMsg('Ingresa tu correo electrónico registrado.');
      return;
    }
    setLoading(true);
    try {
      if (recoverStep === 1) {
        const res = await api.recoverPassword(email);
        setSuccessMsg(res.message);
        setRecoverStep(2);
      } else {
        const res = await api.recoverPassword(email, newPassword);
        setSuccessMsg(res.message);
        setMode('login');
        setRecoverStep(1);
        setPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo procesar la recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPass, true);
      onSuccess(res.user, res.token, true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar sesión demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,229,255,0.16),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.18),transparent_50%)]"
      />

      <div className="glass-surface-elevated relative w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a la tienda</span>
        </button>

        <div className="mt-5">
          <ElectrotechLogo size="sm" className="mb-3" />
          <h1 className="font-display text-2xl font-bold text-white">
            {mode === 'login' && 'Iniciar sesión en ELECTROTECH'}
            {mode === 'register' && 'Crear cuenta de Cliente'}
            {mode === 'recover' && 'Recuperar contraseña'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {mode === 'login' && 'Accede según tu rol para comprar o administrar la plataforma.'}
            {mode === 'register' && 'Regístrate para guardar tu carrito y confirmar pedidos.'}
            {mode === 'recover' && 'Restablece tu clave de acceso de forma segura.'}
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-xs font-medium text-red-200"
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-xs font-medium text-emerald-200"
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-nombre" className="block text-xs font-medium text-slate-300">
                Nombre completo *
              </label>
              <input
                id="auth-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Andrea Torres"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300">
              Correo electrónico *
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-500" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@electrotech.pe"
                className="w-full rounded-xl border border-slate-700 bg-[#0B1120] py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>

          {mode !== 'recover' && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300">
                Contraseña *
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-[#0B1120] py-2.5 pr-11 pl-10 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-2.5 right-3 rounded p-1 text-slate-400 hover:text-white cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'recover' && recoverStep === 2 && (
            <div>
              <label htmlFor="auth-new-password" className="block text-xs font-medium text-slate-300">
                Nueva contraseña (mínimo 6 caracteres) *
              </label>
              <input
                id="auth-new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="auth-tel" className="block text-xs font-medium text-slate-300">
                  Teléfono
                </label>
                <input
                  id="auth-tel"
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+51 999 000 111"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="auth-dir" className="block text-xs font-medium text-slate-300">
                  Dirección de envío
                </label>
                <input
                  id="auth-dir"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Principal 123"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-[#2563EB] focus:ring-[#00E5FF]"
                />
                <span>Recordar sesión</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setMode('recover');
                  setRecoverStep(1);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-medium text-[#00E5FF] hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-tech-primary w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? 'Procesando...'
              : mode === 'login'
                ? 'Iniciar sesión'
                : mode === 'register'
                  ? 'Registrar cuenta'
                  : recoverStep === 1
                    ? 'Verificar correo'
                    : 'Actualizar contraseña'}
          </button>
        </form>

        {/* Cambio entre Login y Registro */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-[#00E5FF] cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>¿No tienes cuenta? Regístrate como Cliente</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-[#00E5FF] cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Volver al inicio de sesión</span>
            </button>
          )}
        </div>

        {/* Accesos de prueba por rol */}
        {mode === 'login' && (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="text-xs font-medium text-slate-400">Acceso rápido por rol (entorno académico)</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => quickDemoLogin('admin@electrotech.pe', 'Admin2026!')}
                className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-[#00E5FF]/50 hover:text-white cursor-pointer"
              >
                Demo Administrador
              </button>
              <button
                type="button"
                onClick={() => quickDemoLogin('cliente@electrotech.pe', 'Cliente2026!')}
                className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-[#2563EB]/60 hover:text-white cursor-pointer"
              >
                Demo Cliente
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
