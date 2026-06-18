import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, User, Mail, Lock, Eye, EyeOff, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { User as UserType } from '../types';

export function Register() {
  const { setUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ businessName: '', city: '', name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { toast('La contraseÃ±a debe tener al menos 6 caracteres', 'error'); return; }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      localStorage.setItem('beautyos_token', res.data.token);
      localStorage.setItem('beautyos_user', JSON.stringify(res.data.user));
      setUser(res.data.user as UserType);
      toast(`Â¡Bienvenida a BeautyOS, ${res.data.user.name.split(' ')[0]}!`, 'success');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast(err.response?.data?.error ?? 'Error al crear la cuenta', 'error');
    } finally {
      setLoading(false);
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
              Lleva tu salÃ³n<br />al siguiente nivel
            </h2>
            <p className="mt-4 text-white/80 text-lg leading-relaxed">
              Agenda inteligente, portal de clientes, NailAI Studio con prueba virtual, y mucho mÃ¡s. Todo en un solo lugar.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { emoji: 'ðŸ“…', text: 'GestiÃ³n de citas y agenda semanal' },
              { emoji: 'ðŸ’…', text: 'Propuesta de diseÃ±os con IA' },
              { emoji: 'ðŸ’°', text: 'Control de caja e ingresos' },
              { emoji: 'ðŸ“²', text: 'Portal para tus clientes (PWA)' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <p className="text-white/90 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          Â© 2026 BeautyOS Â· Hecho con ðŸ’… en LatinoamÃ©rica
        </div>
      </div>

      {/* Right â€” form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#083D42] flex items-center justify-center shadow-beauty">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-2xl font-bold">
                <span className="text-ink">Beauty</span><span className="text-primary">OS</span>
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Crear cuenta ðŸ’…</h1>
            <p className="text-muted mt-1 text-sm">Comienza tu perÃ­odo de prueba gratis hoy</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business info */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tu salÃ³n</p>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Nombre del salÃ³n *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Ej: Nail Studio Valentina"
                  value={form.businessName} onChange={e => set('businessName', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Ciudad</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Ej: MedellÃ­n"
                  value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
            </div>

            {/* Admin account */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Tu cuenta</p>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Tu nombre *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Ej: Valentina RÃ­os"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">Correo electrÃ³nico *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" type="email" placeholder="tu@ejemplo.com" autoComplete="email"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80 block mb-1.5">ContraseÃ±a *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9 pr-10" type={showPw ? 'text' : 'password'}
                  placeholder="MÃ­nimo 6 caracteres" autoComplete="new-password"
                  value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                : <><span>Crear mi cuenta gratis</span> <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Â¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Inicia sesiÃ³n</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

