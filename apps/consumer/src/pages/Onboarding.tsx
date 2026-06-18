import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';

const SKIN_TYPES = [
  { id: 'Normal', emoji: '🌿', desc: 'Equilibrada, sin brillos excesivos ni resequedad' },
  { id: 'Mixta', emoji: '☯️', desc: 'Zona T brillante, mejillas normales o secas' },
  { id: 'Grasa', emoji: '💧', desc: 'Brillos frecuentes y poros más visibles' },
  { id: 'Seca', emoji: '🍂', desc: 'Tensión y necesidad constante de hidratación' },
  { id: 'Sensible', emoji: '🌸', desc: 'Reacciona con facilidad, tendencia al enrojecimiento' },
];

const CONCERNS = [
  { id: 'Hidratación', emoji: '💧' },
  { id: 'Manchas', emoji: '✨' },
  { id: 'Acné', emoji: '🔬' },
  { id: 'Poros', emoji: '🔍' },
  { id: 'Envejecimiento', emoji: '⏳' },
  { id: 'Luminosidad', emoji: '🌟' },
  { id: 'Sensibilidad', emoji: '🌸' },
  { id: 'Ojeras', emoji: '👁️' },
];

const LEVELS = [
  { id: 'Principiante', emoji: '🌱', desc: 'Estoy comenzando mi journey de skincare' },
  { id: 'Intermedia', emoji: '⭐', desc: 'Tengo mi rutina básica y quiero mejorarla' },
  { id: 'Experta', emoji: '💎', desc: 'Conozco mis ingredientes y busco lo avanzado' },
];

const TOTAL = 4;

const SKIN_RECS: Record<string, { routine: string; tip: string }> = {
  Normal:    { routine: 'Glow Esencial', tip: 'Mantén el equilibrio con activos suaves como niacinamida.' },
  Mixta:     { routine: 'Glow Esencial', tip: 'Usa productos oil-free en la zona T y más hidratación en mejillas.' },
  Grasa:     { routine: 'Mini Rutina Exprés', tip: 'Prioriza limpieza profunda y activos como ácido salicílico.' },
  Seca:      { routine: 'Ritual Nocturno', tip: 'Tu piel ama el ácido hialurónico y los aceites nutritivos.' },
  Sensible:  { routine: 'Glow Esencial', tip: 'Elige fórmulas sin fragancia y con centella asiática.' },
};

export function Onboarding() {
  const navigate = useNavigate();
  const { setProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [skinType, setSkinType] = useState<string | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  const canNext =
    (step === 0 && skinType !== null) ||
    (step === 1 && concerns.length > 0) ||
    (step === 2 && level !== null) ||
    step === 3;

  const goNext = () => {
    if (step < TOTAL - 1) { setStep(s => s + 1); }
    else {
      setProfile({ skinType: skinType!, concerns, level: level!, isOnboarded: true });
      setEntering(true);
      setTimeout(() => navigate('/home'), 600);
    }
  };

  const toggleConcern = (id: string) =>
    setConcerns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const rec = skinType ? SKIN_RECS[skinType] : null;

  return (
    <div className={`phone-shell bg-[#EFF4F1] flex flex-col transition-all duration-500 ${entering ? 'opacity-0 scale-95' : 'opacity-100'}`}>
      {/* Top bar */}
      <div className="shrink-0 px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="w-8 h-8 -ml-1 flex items-center justify-center active:scale-90 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : <div className="w-8" />}

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted font-semibold tabular-nums">{step + 1}/{TOTAL}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">

        {/* ── STEP 0: Skin type ── */}
        {step === 0 && (
          <div className="page-enter">
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Paso 1</p>
            <h2 className="font-display text-3xl font-light text-dark mb-1 leading-tight">
              ¿Cuál es tu<br /><em>tipo de piel?</em>
            </h2>
            <p className="text-sm text-muted mb-6">Esto nos ayuda a recomendarte los mejores productos.</p>

            <div className="space-y-3">
              {SKIN_TYPES.map(sk => (
                <button
                  key={sk.id}
                  onClick={() => setSkinType(sk.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                    skinType === sk.id
                      ? 'border-primary bg-primary text-white shadow-btn'
                      : 'border-gray-100 bg-white shadow-card text-dark'
                  }`}
                >
                  <span className="text-2xl shrink-0">{sk.emoji}</span>
                  <div>
                    <p className={`font-semibold text-[15px] ${skinType === sk.id ? 'text-white' : 'text-dark'}`}>{sk.id}</p>
                    <p className={`text-xs mt-0.5 leading-snug ${skinType === sk.id ? 'text-white/75' : 'text-muted'}`}>{sk.desc}</p>
                  </div>
                  {skinType === sk.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Concerns ── */}
        {step === 1 && (
          <div className="page-enter">
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Paso 2</p>
            <h2 className="font-display text-3xl font-light text-dark mb-1 leading-tight">
              ¿Cuáles son tus<br /><em>objetivos?</em>
            </h2>
            <p className="text-sm text-muted mb-6">Selecciona todo lo que aplique a tu piel.</p>

            <div className="grid grid-cols-2 gap-3">
              {CONCERNS.map(c => {
                const active = concerns.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleConcern(c.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-150 active:scale-95 ${
                      active
                        ? 'border-primary bg-primary text-white shadow-btn'
                        : 'border-gray-100 bg-white shadow-card'
                    }`}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-dark'}`}>{c.id}</span>
                    {active && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {concerns.length > 0 && (
              <p className="text-center text-xs text-primary font-medium mt-4">
                {concerns.length} objetivo{concerns.length > 1 ? 's' : ''} seleccionado{concerns.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Level ── */}
        {step === 2 && (
          <div className="page-enter">
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Paso 3</p>
            <h2 className="font-display text-3xl font-light text-dark mb-1 leading-tight">
              ¿Cómo es tu<br /><em>rutina actual?</em>
            </h2>
            <p className="text-sm text-muted mb-6">Nos ayuda a calibrar nuestras recomendaciones.</p>

            <div className="space-y-3">
              {LEVELS.map(lv => (
                <button
                  key={lv.id}
                  onClick={() => setLevel(lv.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                    level === lv.id
                      ? 'border-primary bg-primary text-white shadow-btn'
                      : 'border-gray-100 bg-white shadow-card'
                  }`}
                >
                  <span className="text-3xl">{lv.emoji}</span>
                  <div>
                    <p className={`font-semibold text-base ${level === lv.id ? 'text-white' : 'text-dark'}`}>{lv.id}</p>
                    <p className={`text-xs mt-0.5 ${level === lv.id ? 'text-white/75' : 'text-muted'}`}>{lv.desc}</p>
                  </div>
                  {level === lv.id && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Your profile ── */}
        {step === 3 && (
          <div className="page-enter">
            {/* Header gradient card */}
            <div
              className="rounded-3xl p-6 mb-5 text-center overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div className="text-4xl mb-3">{SKIN_TYPES.find(s => s.id === skinType)?.emoji}</div>
                <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">Tu perfil de piel</p>
                <h2 className="font-display text-3xl font-light text-white mb-3">
                  Piel {skinType}
                </h2>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {concerns.slice(0, 4).map(c => (
                    <span key={c} className="text-[11px] font-medium text-white/90 bg-white/20 px-2.5 py-1 rounded-full">
                      {c}
                    </span>
                  ))}
                  {concerns.length > 4 && (
                    <span className="text-[11px] font-medium text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                      +{concerns.length - 4} más
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Level badge */}
            <div className="card p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">{LEVELS.find(l => l.id === level)?.emoji}</span>
              <div>
                <p className="text-xs text-muted font-medium">Nivel</p>
                <p className="text-sm font-semibold text-dark">{level}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs font-semibold text-primary bg-primary-50 px-3 py-1 rounded-full">Personalizado</span>
              </div>
            </div>

            {/* Routine recommendation */}
            {rec && (
              <div className="card p-4 mb-4">
                <p className="text-xs text-muted font-medium mb-2">Rutina recomendada para ti</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <span className="text-lg">✦</span>
                  </div>
                  <div>
                    <p className="font-semibold text-dark text-sm">{rec.routine}</p>
                    <p className="text-xs text-muted">Lista para comenzar hoy</p>
                  </div>
                </div>
                <div className="bg-primary-50 rounded-xl p-3">
                  <p className="text-xs text-primary font-medium leading-relaxed">
                    💡 {rec.tip}
                  </p>
                </div>
              </div>
            )}

            {/* Sparkle headline */}
            <div className="text-center py-2">
              <p className="font-display text-lg text-dark font-light">
                Tu experiencia personalizada<br />está lista <span className="text-primary">✦</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="shrink-0 px-5 pt-3 pb-8 space-y-3">
        <button
          onClick={goNext}
          disabled={!canNext}
          className={`w-full py-4 rounded-2xl font-semibold text-[15px] transition-all duration-300 active:scale-95 ${
            canNext
              ? 'text-white shadow-btn opacity-100'
              : 'text-white/50 bg-primary/30 cursor-not-allowed'
          }`}
          style={canNext ? { background: '#083D42' } : {}}
        >
          {step === 2 ? 'Ver mi perfil' : step === 3 ? 'Comenzar mi experiencia' : 'Siguiente'}
        </button>
        {step < 3 && (
          <button onClick={() => navigate('/home')} className="w-full py-2 text-sm text-muted font-medium active:opacity-60 transition-opacity">
            Omitir por ahora
          </button>
        )}
      </div>
    </div>
  );
}

