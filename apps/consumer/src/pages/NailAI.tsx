import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAIL_DESIGNS, NAIL_CATEGORIES, type NailCategory, type NailDesign } from '../data/nailDesigns';
import { fetchPublicNailDesigns } from '../lib/api';

// ── Swatch SVG (fallback when no real image) ───────────────────────────
function NailSwatch({ design, size = 'md' }: { design: NailDesign; size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 32 : 44;
  const h = size === 'sm' ? 42 : 58;
  const r = size === 'sm' ? 10 : 14;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        {design.gradient && (
          <linearGradient id={`g${design.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={design.colors[0]} />
            <stop offset="100%" stopColor={design.colors[1]} />
          </linearGradient>
        )}
      </defs>
      <rect
        x="2" y="2" width={w - 4} height={h - 4}
        rx={r}
        fill={design.gradient ? `url(#g${design.id})` : design.colors[0]}
        stroke="rgba(0,0,0,0.08)" strokeWidth="1"
      />
      {design.tipColor && (
        <rect x="2" y="2" width={w - 4} height={(h - 4) * 0.28} rx={r} fill={design.tipColor} opacity="0.9" />
      )}
      <rect x="6" y="6" width={(w - 12) * 0.35} height={(h - 12) * 0.45} rx={3} fill="white" opacity="0.2" />
    </svg>
  );
}

// ── Card preview: real photo or 5-swatch fallback ─────────────────────
function DesignPreview({ design, height = 'h-36' }: { design: NailDesign; height?: string }) {
  if (design.imageUrl) {
    return (
      <div className={`relative ${height} overflow-hidden`}>
        <img
          src={design.imageUrl}
          alt={design.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center ${height} gap-1`}
      style={{ background: `${design.colors[0]}22` }}
    >
      {[0.85, 0.92, 1, 0.95, 0.8].map((scale, i) => (
        <div key={i} style={{ transform: `scaleY(${scale})`, transformOrigin: 'bottom' }}>
          <NailSwatch design={design} size="md" />
        </div>
      ))}
    </div>
  );
}

// ── Design card ───────────────────────────────────────────────────────
function DesignCard({ design, onTryOn, onBook }: {
  design: NailDesign;
  onTryOn: () => void;
  onBook: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden active:scale-[0.98] transition-all duration-200">
      <div className="relative">
        <DesignPreview design={design} height="h-36" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {design.popular && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-white">★ Popular</span>
          )}
          {design.isNew && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">NUEVO</span>
          )}
        </div>

        {/* AR badge */}
        <div className="absolute top-2 right-2">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/90 text-primary border border-primary/20 flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2.5">
              <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
            </svg>
            AR
          </span>
        </div>

        {/* Price tag if available */}
        {design.price && (
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
              ${design.price.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 pt-2.5 pb-3.5">
        <p className="text-[11px] text-primary font-semibold uppercase tracking-wider mb-0.5">{design.category}</p>
        <p className="text-[14px] font-semibold text-dark mb-0.5 leading-tight">{design.name}</p>
        {design.description && (
          <p className="text-[11px] text-muted leading-snug mb-2.5 line-clamp-2">{design.description}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onTryOn}
            className="flex-1 py-2 rounded-2xl bg-primary text-white text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-btn"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            </svg>
            Probar
          </button>
          <button
            onClick={onBook}
            className="flex-1 py-2 rounded-2xl bg-primary-50 text-primary text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform border border-primary/20"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export function NailAI() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<NailCategory>('Todos');
  const [search, setSearch] = useState('');
  const [apiDesigns, setApiDesigns] = useState<NailDesign[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real designs from backend; fall back to mock on error
  useEffect(() => {
    fetchPublicNailDesigns({ limit: 60 })
      .then(d => setApiDesigns(d.length > 0 ? d : null))
      .catch(() => setApiDesigns(null))
      .finally(() => setLoading(false));
  }, []);

  // Salon designs (from API) + catalog (built-in) always shown together
  const salonDesigns = apiDesigns ?? [];
  const allDesigns = [...salonDesigns, ...NAIL_DESIGNS];

  const matchFilter = (d: NailDesign) => {
    const matchCat = activeCategory === 'Todos' || d.category === activeCategory;
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  };

  const filteredSalon = salonDesigns.filter(matchFilter);
  const filteredCatalog = NAIL_DESIGNS.filter(matchFilter);

  const popular = allDesigns.filter(d => d.popular).slice(0, 5);
  const heroDesign = salonDesigns[0] ?? popular[0] ?? allDesigns[0];
  const hasSalonDesigns = salonDesigns.length > 0;

  return (
    <div className="page-enter pb-6">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-display text-2xl font-light text-dark">NailAI</h1>
            <p className="text-sm text-muted font-light">
              {hasSalonDesigns
                ? `${salonDesigns.length} propios · ${NAIL_DESIGNS.length} catálogo`
                : 'Prueba diseños antes de reservar'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.7 2.8 1.7 3.7L5 21h14l-2.7-10.3C17.3 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5z" />
              <path d="M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="px-5 mb-5">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #083D42 0%, #156868 70%, #2DC7B3 100%)' }}
        >
          {/* Background preview image if available */}
          {heroDesign?.imageUrl && (
            <div className="absolute inset-0 opacity-20">
              <img src={heroDesign.imageUrl} className="w-full h-full object-cover" alt="" />
            </div>
          )}
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />

          {/* Decorative nail silhouettes if no real image */}
          {!heroDesign?.imageUrl && (
            <div className="absolute right-4 bottom-0 opacity-20">
              <svg width="80" height="90" viewBox="0 0 80 90">
                {[0, 1, 2, 3, 4].map(i => (
                  <rect key={i} x={8 + i * 14} y={i % 2 === 1 ? 20 : 30} width="10" height={40 + (i === 2 ? 10 : 0)} rx="5" fill="white" />
                ))}
              </svg>
            </div>
          )}

          <div className="relative z-10">
            <p className="text-white/70 text-xs font-medium tracking-wider uppercase mb-1">
              {hasSalonDesigns ? 'Catálogo del salón' : 'Prueba virtual'}
            </p>
            <h2 className="font-display text-2xl font-light text-white mb-2 leading-tight">
              Mira cómo te queda<br /><em>antes de la cita</em>
            </h2>
            <p className="text-white/60 text-xs mb-4 leading-relaxed">
              {hasSalonDesigns
                ? `${salonDesigns.length} diseños del salón + ${NAIL_DESIGNS.length} en catálogo. Prueba cualquiera en cámara.`
                : 'Activa tu cámara y aplica cualquier diseño sobre tus uñas en tiempo real.'}
            </p>
            <button
              onClick={() => heroDesign && navigate(`/nail-tryon/${heroDesign.id}`, { state: { design: heroDesign, allDesigns: allDesigns.slice(0, 10) } })}
              className="flex items-center gap-2 bg-white text-primary text-sm font-semibold px-4 py-2.5 rounded-2xl active:scale-95 transition-transform"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              </svg>
              Probar ahora ✦
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="flex items-center bg-white rounded-2xl px-4 py-2.5 shadow-card gap-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar diseño, color o estilo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-dark bg-transparent outline-none placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-5 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {NAIL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              activeCategory === cat
                ? 'bg-primary text-white shadow-btn'
                : 'bg-white text-muted shadow-card border border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Popular quick picks */}
      {activeCategory === 'Todos' && !search && popular.length > 0 && (
        <div className="mb-5">
          <div className="px-5 mb-3">
            <p className="text-[13px] font-semibold text-dark">★ Más populares</p>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-none pb-1">
            {popular.map(d => (
              <button
                key={d.id}
                onClick={() => navigate(`/nail-tryon/${d.id}`, { state: { design: d, allDesigns: allDesigns.slice(0, 10) } })}
                className="shrink-0 flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 rounded-2xl shadow-card overflow-hidden" style={{ background: `${d.colors[0]}33` }}>
                  {d.imageUrl
                    ? <img src={d.imageUrl} className="w-full h-full object-cover" alt={d.name} />
                    : <div className="w-full h-full flex items-center justify-center"><NailSwatch design={d} size="sm" /></div>
                  }
                </div>
                <span className="text-[10px] text-muted font-medium text-center w-14 leading-tight">{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Design grid — two sections */}
      <div className="px-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : filteredSalon.length === 0 && filteredCatalog.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💅</p>
            <p className="text-sm text-muted">No hay diseños para este filtro</p>
          </div>
        ) : (
          <>
            {/* — Salon uploads — */}
            {filteredSalon.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-dark flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    Diseños del salón
                  </p>
                  <span className="text-[11px] text-primary font-medium">{filteredSalon.length} diseños</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredSalon.map(design => (
                    <DesignCard
                      key={design.id}
                      design={design}
                      onTryOn={() => navigate(`/nail-tryon/${design.id}`, { state: { design, allDesigns: allDesigns.slice(0, 10) } })}
                      onBook={() => navigate(`/book?design=${design.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* — Built-in catalog — */}
            {filteredCatalog.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-dark flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted inline-block" />
                    Catálogo
                  </p>
                  <span className="text-[11px] text-muted font-medium">{filteredCatalog.length} diseños</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredCatalog.map(design => (
                    <DesignCard
                      key={design.id}
                      design={design}
                      onTryOn={() => navigate(`/nail-tryon/${design.id}`, { state: { design, allDesigns: allDesigns.slice(0, 10) } })}
                      onBook={() => navigate(`/book?design=${design.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
