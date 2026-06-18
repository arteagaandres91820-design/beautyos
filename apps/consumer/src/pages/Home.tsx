import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS, ROUTINES, CATEGORIES, DAILY_ROUTINE_ID, USER_NAME } from '../data/mock';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useProfile } from '../context/ProfileContext';

const CONCERN_TO_BENEFITS: Record<string, string[]> = {
  'Hidratación':    ['Hidratación', 'Hidratación 24h', 'Oil-free', 'Equilibrante'],
  'Luminosidad':    ['Luminosidad', 'Antioxidante', 'Iluminador'],
  'Acné':           ['Equilibrante', 'Oil-free', 'Sin fragancia', 'Poros minimizados'],
  'Poros':          ['Poros minimizados', 'Equilibrante', 'Refrescante'],
  'Envejecimiento': ['Antioxidante', 'Regenerador', 'FPS 50+', 'Antienvejecimiento'],
  'Manchas':        ['Iluminador', 'Antioxidante', 'Luminosidad'],
  'Sensibilidad':   ['Sin fragancia', 'Hidratación', 'Calmante'],
  'Ojeras':         ['Hidratación', 'Luminosidad', 'Antioxidante'],
};

export function Home() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { profile } = useProfile();
  const [notifCount] = useState(2);

  const dailyRoutine = ROUTINES.find(r => r.id === DAILY_ROUTINE_ID)!;

  // Flash sale countdown to midnight
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  });
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const fmtTime = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return { h, m, sec };
  };
  const { h, m, sec } = fmtTime(timeLeft);
  const flashProduct = PRODUCTS[0];;

  // Personalize recommendations if profile exists
  const recommended = (() => {
    if (!profile?.concerns?.length) return PRODUCTS.filter(p => p.category === 'facial').slice(0, 6);
    const targetBenefits = new Set(profile.concerns.flatMap(c => CONCERN_TO_BENEFITS[c] ?? []));
    const scored = PRODUCTS.map(p => ({
      product: p,
      score: p.benefits.filter(b => targetBenefits.has(b)).length,
    }));
    const personalized = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.product);
    return personalized.length >= 4 ? personalized.slice(0, 6) : PRODUCTS.filter(p => p.category === 'facial').slice(0, 6);
  })();

  return (
    <div className="page-enter pb-4">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-light text-dark">
              Hola, {USER_NAME} <span className="text-primary text-xl">✦</span>
            </h2>
            <p className="text-muted text-sm font-light mt-0.5">
              {profile?.isOnboarded
                ? <span>Piel <span className="text-primary font-medium">{profile.skinType}</span> · Tu rutina te espera</span>
                : 'Bienvenida de nuevo'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Cart icon */}
            <button onClick={() => navigate('/cart')} className="relative w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
            {/* Notification bell */}
            <button onClick={() => navigate('/notifications')} className="relative w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search — tap to open search page */}
        <button
          onClick={() => navigate('/search')}
          className="w-full relative flex items-center bg-white rounded-2xl px-4 py-3 shadow-card text-left active:scale-[0.99] transition-transform"
        >
          <svg className="text-muted mr-2.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-sm text-muted">Buscar productos, rutinas y más...</span>
          <div className="w-7 h-7 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
            </svg>
          </div>
        </button>
      </div>

      {/* Daily Routine card */}
      <div className="px-5 mb-6">
        <button
          onClick={() => navigate(`/routine/${dailyRoutine.id}`)}
          className="w-full relative overflow-hidden rounded-3xl p-5 text-left active:scale-95 transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #083D42 0%, #156868 60%, #2DC7B3 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-16 w-24 h-24 rounded-full bg-white/5" />

          <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">Tu rutina de hoy</p>
          <h3 className="font-display text-3xl font-light text-white mb-1">{dailyRoutine.name}</h3>
          <p className="text-white/60 text-sm mb-5">
            {dailyRoutine.stepCount} pasos · {dailyRoutine.duration} min
          </p>

          {/* Decorative product bottles */}
          <div className="absolute right-5 top-3 flex items-end gap-1.5">
            {[
              { w: 18, h: 62, rot: '-6deg', op: 0.55 },
              { w: 24, h: 82, rot: '0deg', op: 0.75 },
              { w: 18, h: 62, rot: '6deg', op: 0.55 },
            ].map((b, i) => (
              <div key={i} style={{
                width: b.w,
                height: b.h,
                background: 'linear-gradient(160deg,rgba(255,255,255,0.6),rgba(255,255,255,0.2))',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.35)',
                transform: `rotate(${b.rot})`,
                opacity: b.op,
              }} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Comenzar rutina</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Flash sale banner */}
      <div className="px-5 mb-6">
        <button
          onClick={() => navigate(`/product/${flashProduct.id}`)}
          className="w-full rounded-3xl overflow-hidden relative text-left active:scale-[0.99] transition-transform"
          style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1a3a4a 100%)' }}
        >
          <div className="p-4">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">⚡</span>
              <p className="text-white font-bold text-sm tracking-wide">OFERTA DEL DÍA</p>
              <div className="ml-auto flex items-center gap-1.5">
                {[h, m, sec].map((val, i) => (
                  <span key={i} className="flex items-center">
                    <span className="bg-white/20 text-white font-bold text-sm px-1.5 py-0.5 rounded-lg tabular-nums">{val}</span>
                    {i < 2 && <span className="text-white/60 text-sm mx-0.5">:</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Product row */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
                style={{ background: flashProduct.bgColor }}>
                <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">◆</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Solo hoy</p>
                <p className="text-white font-semibold text-sm line-clamp-1">{flashProduct.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-primary-500 font-bold text-lg">${flashProduct.price}</span>
                  <span className="text-white/50 text-sm line-through">${flashProduct.originalPrice}</span>
                  <span className="text-xs font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">-{flashProduct.discount}%</span>
                </div>
              </div>
              <div className="shrink-0 bg-primary-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
                Comprar →
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <div className="px-5 flex items-center justify-between mb-3">
          <h3 className="font-semibold text-dark text-[15px]">Categorías</h3>
          <button onClick={() => navigate('/discover')} className="text-primary text-sm font-medium">Ver todas</button>
        </div>
        <div className="flex gap-3 px-5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(`/discover?cat=${cat.id}`)}
              className="flex flex-col items-center gap-2 shrink-0 active:scale-90 transition-transform"
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center text-2xl">
                {cat.emoji}
              </div>
              <span className="text-[11px] text-muted font-medium text-center leading-tight w-16">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended for you */}
      <div className="mb-6">
        <div className="px-5 flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-dark text-[15px]">
              {profile?.isOnboarded ? 'Para tu piel ' + profile.skinType : 'Recomendado para ti'}
            </h3>
            {profile?.isOnboarded && (
              <p className="text-[11px] text-muted mt-0.5">
                Basado en tus objetivos: {profile.concerns.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
          <button onClick={() => navigate('/discover')} className="text-primary text-sm font-medium">Ver todas</button>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          {recommended.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* Banner — Kits */}
      <div className="px-5 mb-2">
        <div
          className="rounded-3xl p-5 overflow-hidden relative"
          style={{ background: 'linear-gradient(120deg, #E0CED8 0%, #C8DDE0 100%)' }}
        >
          <p className="text-xs text-dark/60 font-medium uppercase tracking-wider mb-1">Colección nueva</p>
          <h4 className="font-display text-xl font-medium text-dark mb-3">Kit Glow<br />Completo</h4>
          <button
            onClick={() => navigate('/discover')}
            className="text-xs font-semibold text-primary bg-white/80 rounded-xl px-4 py-2 active:scale-95 transition-transform"
          >
            Ver kits →
          </button>
          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/20" />
          <div className="absolute right-8 -bottom-2 w-16 h-16 rounded-full bg-white/15" />
        </div>
      </div>
    </div>
  );
}

