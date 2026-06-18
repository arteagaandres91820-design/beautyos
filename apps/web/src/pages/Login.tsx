import { useState, FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

export function Login() {
  const { user, login, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@beautyos.co');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      toast('Credenciales incorrectas. Intenta de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left â€” branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#083D42] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg viewBox="0 0 22 22" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <rect x="1"  y="15" width="4" height="6"    rx="1.2" fill="#fff" opacity="0.45"/>
                <rect x="6.5" y="11" width="4" height="10"  rx="1.2" fill="#fff" opacity="0.65"/>
                <rect x="12" y="6.5" width="4" height="14.5" rx="1.2" fill="#fff" opacity="0.82"/>
                <rect x="17.5" y="2" width="3.5" height="19" rx="1.2" fill="#fff"/>
              </svg>
            </div>
            <span className="font-display text-2xl font-bold text-white">BeautyOS</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="font-display text-4xl font-bold text-white leading-tight">
              La plataforma que<br />tu salÃ³n necesita
            </h2>
            <p className="mt-4 text-white/80 text-lg leading-relaxed">
              GestiÃ³n inteligente de clientes, agenda y caja. Con NailAI Studio: deja que tus clientas prueben los diseÃ±os antes de reservar.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '200+', label: 'DiseÃ±os IA' },
              { value: 'PWA', label: 'App instalable' },
              { value: 'Latam', label: 'DiseÃ±ado para' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                <p className="font-display text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/70 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          Â© 2026 BeautyOS Â· Hecho con ðŸ’… en LatinoamÃ©rica
        </div>
      </div>

      {/* Right â€” form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:hidden">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#083D42] flex items-center justify-center shadow-beauty">
                <svg viewBox="0 0 22 22" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1"  y="15" width="4" height="6"    rx="1.2" fill="#fff" opacity="0.45"/>
                  <rect x="6.5" y="11" width="4" height="10"  rx="1.2" fill="#fff" opacity="0.65"/>
                  <rect x="12" y="6.5" width="4" height="14.5" rx="1.2" fill="#fff" opacity="0.82"/>
                  <rect x="17.5" y="2" width="3.5" height="19" rx="1.2" fill="#fff"/>
                </svg>
              </div>
              <span className="font-display text-2xl font-bold">
                <span className="text-ink">Beauty</span><span className="text-primary">OS</span>
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Bienvenida ðŸ‘‹</h1>
            <p className="text-muted mt-1">Ingresa con tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Correo electrÃ³nico</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="tu@ejemplo.com" required autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">ContraseÃ±a</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢" required autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 text-base">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</> : 'Ingresar'}
            </button>
          </form>

          <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-xs font-medium text-primary-800 mb-1">Demo â€” credenciales de prueba</p>
            <p className="text-xs text-ink/70 font-mono">admin@beautyos.co / 123456</p>
          </div>

          <p className="text-center text-sm text-muted">
            Â¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Crear salÃ³n gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

