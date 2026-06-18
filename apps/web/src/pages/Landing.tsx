import { useNavigate } from 'react-router-dom';
import { Sparkles, CalendarDays, Users, BarChart2, Megaphone, Gift, Crown, ChevronRight, CheckCircle2, Smartphone, Star, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Agenda inteligente',
    desc: 'Citas, recordatorios automÃ¡ticos y horario por profesional. Todo en un solo lugar.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Sparkles,
    title: 'NailAI Studio',
    desc: 'PropÃ³n diseÃ±os de uÃ±as con IA. Tu cliente los prueba virtualmente y aprueba el que mÃ¡s le gusta.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Smartphone,
    title: 'Portal del cliente',
    desc: 'App PWA para tus clientas. Exploran diseÃ±os, agendan citas y aprueban propuestas desde su celular.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Users,
    title: 'CRM de clientes',
    desc: 'Historial, etiquetas VIP, cumpleaÃ±os, fidelizaciÃ³n por puntos y mensajes de WhatsApp masivos.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: BarChart2,
    title: 'Reportes y caja',
    desc: 'Ingresos por dÃ­a, servicios top, rendimiento de equipo y cierre de caja. Todo exportable a CSV.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Gift,
    title: 'Gift cards y paquetes',
    desc: 'Vende paquetes de servicios y gift cards. Gestiona descuentos y cÃ³digos promo fÃ¡cilmente.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

const PLANS = [
  {
    name: 'BÃ¡sico',
    price: '$79.000',
    period: '/mes',
    features: ['Hasta 2 profesionales', 'Agenda y citas', 'Portal de clientes', 'Reportes bÃ¡sicos'],
    cta: 'Comenzar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$149.000',
    period: '/mes',
    badge: 'MÃ¡s popular',
    features: ['Profesionales ilimitados', 'NailAI Studio completo', 'CampaÃ±as WhatsApp', 'Gift Cards & Paquetes', 'Reportes avanzados', 'Soporte prioritario'],
    cta: 'Elegir Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'A medida',
    period: '',
    features: ['Multi-sucursal', 'IntegraciÃ³n personalizada', 'CapacitaciÃ³n presencial', 'SLA garantizado'],
    cta: 'Contactar ventas',
    highlight: false,
  },
];

const TESTIMONIALS = [
  { name: 'Laura JimÃ©nez', role: 'Nail Studio MedellÃ­n', text: 'Mis clientas aman poder ver los diseÃ±os antes de la cita. El NailAI es un diferenciador enorme.', stars: 5 },
  { name: 'Valentina Cruz', role: 'SalÃ³n de Belleza BogotÃ¡', text: 'Antes usaba Excel para todo. Ahora con BeautyOS ahorro 3 horas diarias en administraciÃ³n.', stars: 5 },
  { name: 'Marcela Torres', role: 'Nail Bar Cali', text: 'El portal de clientes parece una app profesional. Mis redes sociales han crecido muchÃ­simo.', stars: 5 },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-body">
      {/* â”€â”€ Nav â”€â”€ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#083D42] flex items-center justify-center">
              <svg viewBox="0 0 22 22" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <rect x="1"  y="15" width="4" height="6"    rx="1.2" fill="#fff" opacity="0.5"/>
                <rect x="6.5" y="11" width="4" height="10"  rx="1.2" fill="#fff" opacity="0.7"/>
                <rect x="12" y="6.5" width="4" height="14.5" rx="1.2" fill="#fff" opacity="0.88"/>
                <rect x="17.5" y="2" width="3.5" height="19" rx="1.2" fill="#fff"/>
              </svg>
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">BeautyOS</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-primary transition-colors">Funciones</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Planes</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Testimonios</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="hidden sm:block text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
              Iniciar sesiÃ³n
            </button>
            <button onClick={() => navigate('/register')}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-600 transition-colors shadow-beauty">
              Probar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F0FEFA] via-white to-[#EEF0FF] pt-20 pb-24 px-6">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-violet-100/60 blur-2xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full mb-6 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma #1 para nail studios en Latam
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Gestiona tu salÃ³n<br />
            <span className="text-primary">con inteligencia.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Agenda, CRM, caja, NailAI Studio y portal para tus clientas. Todo en una sola plataforma diseÃ±ada para salones de belleza y nail studios en LatinoamÃ©rica.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-primary-600 transition-all shadow-beauty active:scale-[0.98]">
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => { window.open('/cliente/bienvenida', '_blank'); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold px-8 py-4 rounded-2xl text-base border border-gray-200 hover:border-primary/40 transition-all">
              Ver portal de clientes
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">Sin tarjeta de crÃ©dito Â· 14 dÃ­as gratis Â· Cancela cuando quieras</p>
        </div>

        {/* App mockup cards */}
        <div className="relative max-w-5xl mx-auto mt-16 grid grid-cols-3 gap-4 px-4">
          {[
            { label: 'Citas hoy', value: '12', sub: 'â†‘ 3 vs ayer', color: 'border-blue-100 bg-blue-50/50' },
            { label: 'Ingresos mes', value: '$4.2M', sub: 'â†‘ 18% vs mes ant.', color: 'border-primary/20 bg-primary/5' },
            { label: 'Clientes activos', value: '284', sub: '8 cumpleaÃ±os esta sem.', color: 'border-violet-100 bg-violet-50/50' },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl border p-4 shadow-sm ${c.color}`}>
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <p className="text-2xl font-display font-bold text-gray-800 mt-1">{c.value}</p>
              <p className="text-[11px] text-primary font-semibold mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ Features â”€â”€ */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Todo lo que necesitas</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Una plataforma completa</h2>
            <p className="text-gray-400 mt-3 text-lg max-w-xl mx-auto">Sin apps separadas. Sin Excel. Sin caos. Solo BeautyOS.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-card transition-all group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-gray-800 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ NailAI highlight â”€â”€ */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#F0FEFA] to-[#EEF9F7]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-primary/20">
              <Sparkles className="w-3 h-3" />
              NailAI Studio
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Tus clientas prueban<br />
              <span className="text-primary">antes de decidir.</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Con la cÃ¡mara de su celular, tu clienta ve en tiempo real cÃ³mo le quedan los diseÃ±os. Aprueba con un toque. TÃº propones, ella decide â€” sin sorpresas en la cita.
            </p>
            <ul className="space-y-3 mb-8">
              {['MÃ¡s de 200 diseÃ±os de uÃ±as disponibles', 'Try-on con cÃ¡mara en vivo (no fotos)', 'El cliente aprueba el diseÃ±o antes de la cita', 'Elimina malentendidos y devoluciones'].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/register')}
              className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors shadow-beauty">
              Activar NailAI en mi salÃ³n <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl" />
            <div className="relative bg-white rounded-3xl border border-primary/10 shadow-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">NailAI Try-On</p>
                  <p className="text-xs text-gray-400">TecnologÃ­a de prueba virtual</p>
                </div>
              </div>
              {[
                { name: 'Aurora 2026', cat: 'TRENDS_2026', price: '$ 75.000', approved: true },
                { name: 'French ClÃ¡sico', cat: 'FRENCH', price: '$ 55.000', approved: false },
                { name: 'Degradado Rosa', cat: 'GRADIENT', price: '$ 65.000', approved: false },
              ].map((d, i) => (
                <div key={d.name} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${d.approved ? 'border-primary/30 bg-primary/5' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl">
                    {['ðŸ’…', 'ðŸ¤', 'ðŸŒ¸'][i]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.price}</p>
                  </div>
                  {d.approved
                    ? <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Aprobado</span>
                    : <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">En espera</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ Testimonials â”€â”€ */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-gray-900">Lo que dicen nuestras clientas</h2>
            <p className="text-gray-400 mt-3">Salones reales, resultados reales.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-card transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Pricing â”€â”€ */}
      <section id="pricing" className="py-24 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Planes y precios</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Crece con BeautyOS</h2>
            <p className="text-gray-400 mt-3">14 dÃ­as gratis en todos los planes. Sin permanencia.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`relative rounded-3xl p-7 border transition-all ${p.highlight ? 'bg-sidebar text-white border-sidebar shadow-beauty-lg scale-[1.02]' : 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-card'}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {p.badge}
                  </div>
                )}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className={`w-4 h-4 ${p.highlight ? 'text-primary' : 'text-gray-400'}`} />
                    <p className={`font-display font-bold text-lg ${p.highlight ? 'text-white' : 'text-gray-800'}`}>{p.name}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-display font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                    <span className={`text-sm ${p.highlight ? 'text-white/60' : 'text-gray-400'}`}>{p.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${p.highlight ? 'text-white/90' : 'text-gray-600'}`}>
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.highlight ? 'text-primary' : 'text-primary'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(p.name === 'Enterprise' ? '/register' : '/register')}
                  className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all ${p.highlight ? 'bg-primary text-white hover:bg-primary-500 shadow-beauty' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA final â”€â”€ */}
      <section className="py-20 px-6 bg-[#083D42] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <Megaphone className="w-12 h-12 text-white/60 mx-auto mb-6" />
          <h2 className="font-display text-4xl font-bold text-white mb-4">Â¿Lista para modernizar tu salÃ³n?</h2>
          <p className="text-white/80 text-lg mb-8">Ãšnete a los salones que ya gestionan su negocio con BeautyOS. 14 dÃ­as gratis, sin tarjeta.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/register')}
              className="flex items-center justify-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-2xl text-base hover:bg-primary-50 transition-all active:scale-[0.98]">
              Crear cuenta gratis <ArrowRight className="w-5 h-5" />
            </button>
            <a href={`https://wa.me/573001234567?text=${encodeURIComponent('Hola! Quiero saber mÃ¡s sobre BeautyOS para mi salÃ³n.')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-base border border-white/20 hover:bg-white/20 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.103 1.523 5.824L0 24l6.385-1.513A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.007-1.372l-.359-.214-3.724.881.922-3.619-.234-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
              Hablar con ventas
            </a>
          </div>
        </div>
      </section>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="bg-sidebar py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg viewBox="0 0 22 22" width="13" height="13" xmlns="http://www.w3.org/2000/svg">
                <rect x="1"  y="15" width="4" height="6"    rx="1.2" fill="#2DC7B3" opacity="0.5"/>
                <rect x="6.5" y="11" width="4" height="10"  rx="1.2" fill="#2DC7B3" opacity="0.7"/>
                <rect x="12" y="6.5" width="4" height="14.5" rx="1.2" fill="#2DC7B3" opacity="0.88"/>
                <rect x="17.5" y="2" width="3.5" height="19" rx="1.2" fill="#2DC7B3"/>
              </svg>
            </div>
            <span className="font-display font-semibold text-white/80 text-sm">BeautyOS</span>
          </div>
          <p className="text-white/30 text-xs">Â© 2026 BeautyOS Â· Plataforma para salones de belleza en LatinoamÃ©rica</p>
          <div className="flex gap-5 text-xs text-white/40">
            <button onClick={() => navigate('/login')} className="hover:text-white/70 transition-colors">Admin</button>
            <button onClick={() => navigate('/cliente/bienvenida')} className="hover:text-white/70 transition-colors">Portal cliente</button>
            <button onClick={() => navigate('/register')} className="hover:text-white/70 transition-colors">Registrarse</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

