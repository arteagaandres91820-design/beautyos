import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/mock';
import type { Product } from '../types';

const TYPES = [
  { id: 'morning' as const, label: 'Mañana', emoji: '🌅', desc: 'Empieza el día con energía', color: '#FEF3C7', steps: 5 },
  { id: 'night'   as const, label: 'Noche',  emoji: '🌙', desc: 'Regenera mientras descansas', color: '#EDE9FE', steps: 4 },
  { id: 'weekly'  as const, label: 'Semanal', emoji: '📅', desc: 'Tratamiento especial semanal', color: '#D0EEEA', steps: 4 },
];

type RoutineType = 'morning' | 'night' | 'weekly';

const STEPS_BY_TYPE: Record<RoutineType, string[]> = {
  morning: ['clean', 'tone', 'treat', 'moisturize', 'protect'],
  night:   ['clean', 'tone', 'treat', 'moisturize'],
  weekly:  ['clean', 'exfoliate', 'mask', 'moisturize'],
};

interface StepMeta { label: string; emoji: string; desc: string; productIds: string[]; }

const STEP_META: Record<string, StepMeta> = {
  clean:      { label: 'Limpieza',       emoji: '💧', desc: 'Primera capa: elimina impurezas',    productIds: ['2'] },
  tone:       { label: 'Tónico',         emoji: '🌿', desc: 'Equilibra el pH y prepara la piel', productIds: ['3'] },
  treat:      { label: 'Tratamiento',    emoji: '⚗️', desc: 'Activos para tu objetivo principal', productIds: ['1', '7'] },
  moisturize: { label: 'Hidratación',    emoji: '✨', desc: 'Nutre, sella y repara la barrera',   productIds: ['4', '6'] },
  protect:    { label: 'Protección',     emoji: '☀️', desc: 'Escudo diario contra el daño UV',    productIds: ['5'] },
  exfoliate:  { label: 'Exfoliación',    emoji: '✦',  desc: 'Renueva la textura de la piel',     productIds: ['8'] },
  mask:       { label: 'Mascarilla',     emoji: '🫧', desc: 'Tratamiento intensivo semanal',       productIds: ['7'] },
};

export function RoutineBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [routineType, setRoutineType] = useState<RoutineType | null>(null);
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  const [routineName, setRoutineName] = useState('');
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSteps = routineType ? STEPS_BY_TYPE[routineType] : [];
  const isProductStep = step >= 1 && step <= activeSteps.length;
  const isNameStep    = routineType !== null && step === activeSteps.length + 1;
  const isDone        = routineType !== null && step === activeSteps.length + 2;

  const currentStepKey  = isProductStep ? activeSteps[step - 1] : null;
  const currentStepMeta = currentStepKey ? STEP_META[currentStepKey] : null;
  const stepProducts = currentStepMeta
    ? (currentStepMeta.productIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean) as Product[])
    : [];

  const progress = step === 0 ? 0 : Math.min(100, (step / (activeSteps.length + 1)) * 100);
  const pickedCount = Object.values(picks).filter(Boolean).length;

  useEffect(() => {
    if (isNameStep) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isNameStep]);

  const advance = () => {
    setAnimKey(k => k + 1);
    setStep(s => s + 1);
  };

  const pickProduct = (id: string) => {
    if (!currentStepKey) return;
    setPicks(p => ({ ...p, [currentStepKey]: id }));
    setTimeout(advance, 160);
  };

  const skipStep = () => {
    if (!currentStepKey) return;
    setPicks(p => ({ ...p, [currentStepKey]: null }));
    advance();
  };

  const goBack = () => {
    if (step === 0) { navigate(-1); return; }
    setAnimKey(k => k + 1);
    setStep(s => s - 1);
  };

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col">

      {/* Header */}
      {!isDone && (
        <div className="shrink-0 px-5 pt-12 pb-3 bg-[#EFF4F1]">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="font-display text-xl font-light text-dark flex-1">Crear rutina</h1>
            {step > 0 && (
              <span className="text-xs text-muted font-medium tabular-nums">
                {step}/{activeSteps.length + 1}
              </span>
            )}
          </div>
          {step > 0 && (
            <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">

        {/* ── STEP 0: choose type ── */}
        {step === 0 && (
          <div key="type" className="page-enter">
            <div className="pt-4 pb-7">
              <h2 className="font-display text-2xl font-light text-dark mb-1">¿Qué tipo de rutina?</h2>
              <p className="text-sm text-muted">Elige cuándo usarás esta rutina.</p>
            </div>
            <div className="space-y-3">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setRoutineType(t.id); advance(); }}
                  className="w-full card p-5 flex items-center gap-4 text-left active:scale-[0.99] transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ background: t.color }}>
                    {t.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-dark">{t.label}</p>
                    <p className="text-sm text-muted">{t.desc}</p>
                    <p className="text-xs text-primary mt-1 font-medium">{t.steps} pasos</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted text-center mt-6 leading-relaxed">
              Puedes crear tantas rutinas como quieras y editarlas cuando desees.
            </p>
          </div>
        )}

        {/* ── STEPS 1..N: product picker ── */}
        {isProductStep && currentStepMeta && (
          <div key={`prod-${animKey}`} className="page-enter">
            {/* Step pills */}
            <div className="flex gap-1.5 pt-3 pb-6 overflow-x-auto scrollbar-none">
              {activeSteps.map((sk, i) => (
                <div
                  key={sk}
                  className={`flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                    i < step - 1 ? 'bg-primary text-white' :
                    i === step - 1 ? 'bg-white border-2 border-primary text-primary' :
                    'bg-white/80 text-muted border border-gray-100'
                  }`}
                >
                  {i < step - 1 ? <span>✓</span> : <span>{STEP_META[sk].emoji}</span>}
                  <span>{STEP_META[sk].label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
              Paso {step} de {activeSteps.length}
            </p>
            <h2 className="font-display text-2xl font-light text-dark mb-1">{currentStepMeta.label}</h2>
            <p className="text-sm text-muted mb-5">{currentStepMeta.desc}</p>

            <div className="space-y-3 mb-4">
              {stepProducts.map(product => {
                const isSelected = picks[currentStepKey!] === product.id;
                return (
                  <button
                    key={product.id}
                    onClick={() => pickProduct(product.id)}
                    className={`w-full rounded-2xl p-4 flex gap-4 items-center text-left active:scale-[0.99] transition-all bg-white shadow-card ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center"
                      style={{ background: product.bgColor }}
                    >
                      <span className="text-2xl opacity-40">◆</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark text-sm leading-tight">{product.name}</p>
                      <p className="text-[11px] text-muted mt-0.5">{product.brand} · {product.size}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-base font-bold text-primary">${product.price}</span>
                        <div className="flex gap-1 flex-wrap">
                          {product.benefits.slice(0, 2).map(b => (
                            <span key={b} className="text-[9px] px-2 py-0.5 rounded-full bg-primary-50 text-primary font-medium">{b}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-primary border-primary' : 'border-gray-200'
                    }`}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={skipStep}
              className="w-full py-3.5 rounded-2xl text-sm text-muted font-medium bg-white/70 border border-gray-100 active:scale-95 transition-all"
            >
              Saltar este paso →
            </button>
          </div>
        )}

        {/* ── NAME step ── */}
        {isNameStep && (
          <div key={`name-${animKey}`} className="page-enter pt-4">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-light text-dark mb-1">Dale un nombre</h2>
              <p className="text-sm text-muted">¿Cómo llamarás a tu nueva rutina?</p>
            </div>

            <div className="mb-6">
              <input
                ref={inputRef}
                type="text"
                value={routineName}
                onChange={e => setRoutineName(e.target.value)}
                placeholder="Mi rutina perfecta..."
                maxLength={30}
                className="w-full bg-white rounded-2xl px-4 py-4 text-dark font-semibold text-lg shadow-card border border-transparent focus:border-primary/30 focus:outline-none transition-all"
              />
              <p className="text-xs text-muted mt-2 text-right">{routineName.length}/30</p>
            </div>

            {/* Summary */}
            <div className="card p-4 mb-6">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                Resumen · {pickedCount} productos elegidos
              </p>
              <div className="space-y-2.5">
                {activeSteps.map(sk => {
                  const pid = picks[sk];
                  const product = pid ? PRODUCTS.find(p => p.id === pid) : null;
                  return (
                    <div key={sk} className="flex items-center gap-3">
                      <span className="text-base w-5 text-center">{STEP_META[sk].emoji}</span>
                      <span className="text-xs text-muted w-[72px] shrink-0">{STEP_META[sk].label}</span>
                      {product ? (
                        <>
                          <div
                            className="w-5 h-5 rounded-md shrink-0"
                            style={{ background: product.bgColor }}
                          />
                          <span className="text-xs font-medium text-dark flex-1 truncate">{product.name}</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-300 flex-1 italic">Omitido</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={advance}
              disabled={!routineName.trim()}
              className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white shadow-btn active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
              style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
            >
              Crear rutina ✦
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {isDone && (
          <div key="done" className="page-enter flex flex-col items-center pt-14 pb-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
            >
              <span className="text-4xl text-white">✦</span>
            </div>

            <h1 className="font-display text-3xl font-light text-dark text-center mb-1">
              ¡Lista!
            </h1>
            <p className="text-sm text-muted text-center mb-7">
              Tu rutina{' '}
              <span className="text-primary font-semibold">"{routineName}"</span>{' '}
              está lista para usarse.
            </p>

            {/* Routine card preview */}
            <div className="w-full card p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-white text-lg">✦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark truncate">{routineName}</p>
                  <p className="text-xs text-muted">
                    {TYPES.find(t => t.id === routineType)?.emoji}{' '}
                    Rutina de {TYPES.find(t => t.id === routineType)?.label.toLowerCase()} · {pickedCount} productos
                  </p>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full shrink-0">
                  Nueva ✦
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {activeSteps.map(sk => {
                  const pid = picks[sk];
                  const product = pid ? PRODUCTS.find(p => p.id === pid) : null;
                  return product ? (
                    <span key={sk} className="text-[9px] px-2 py-0.5 rounded-full bg-primary-50 text-primary font-medium">
                      {STEP_META[sk].emoji} {product.benefits[0]}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Points earned */}
            <div className="w-full flex items-center gap-3 bg-primary text-white rounded-2xl px-4 py-3 mb-6">
              <span className="text-xl">✦</span>
              <div>
                <p className="text-xs text-white/70">Puntos ganados</p>
                <p className="font-bold">+50 puntos</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-white/60">Por crear tu rutina</p>
                <p className="text-sm font-bold">1.297 pts</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/routines')}
              className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white shadow-btn active:scale-95 transition-all mb-3"
              style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
            >
              Ver mis rutinas
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-primary bg-white border border-primary/20 shadow-card active:scale-95 transition-all"
            >
              Ir al inicio
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

