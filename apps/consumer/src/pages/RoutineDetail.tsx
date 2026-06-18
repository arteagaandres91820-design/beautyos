import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTINES, PRODUCTS } from '../data/mock';
import { ProductImage } from '../components/ProductImage';

export function RoutineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routine = ROUTINES.find(r => r.id === id);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (!routine) {
    return (
      <div className="phone-shell flex items-center justify-center">
        <p className="text-muted">Rutina no encontrada</p>
      </div>
    );
  }

  const toggleStep = (step: number) => {
    if (!started) return;
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step); else next.add(step);
      return next;
    });
  };

  const progress = started ? (completedSteps.size / routine.steps.length) * 100 : 0;

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col">
      {/* Header */}
      <div className="relative shrink-0 pt-12 pb-6 px-5"
        style={{ background: `linear-gradient(180deg, ${routine.bgColor}60 0%, #EFF4F100 100%)` }}>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-btn">
            <span className="text-white font-display text-xl">✦</span>
          </div>
          <p className="text-xs text-muted font-medium uppercase tracking-widest mb-1">Rutina</p>
          <h1 className="font-display text-3xl font-light text-dark mb-1">{routine.name}</h1>
          <p className="text-muted text-sm">{routine.stepCount} pasos · {routine.duration} min</p>
          <p className="text-dark/60 text-sm mt-3 leading-relaxed max-w-xs">{routine.description}</p>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white shadow-card text-primary border border-primary/20">
            {routine.level}
          </span>
          {routine.tags.map(t => (
            <span key={t} className="text-xs font-medium px-3 py-1 rounded-full bg-white shadow-card text-muted">{t}</span>
          ))}
        </div>
      </div>

      {/* Progress bar (when started) */}
      {started && (
        <div className="px-5 py-3 bg-white shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>Progreso</span>
            <span className="font-semibold text-primary">{completedSteps.size}/{routine.steps.length}</span>
          </div>
          <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {routine.steps.map(step => {
          const product = PRODUCTS.find(p => p.id === step.productId);
          const isCompleted = completedSteps.has(step.step);
          const isActive = activeStep === step.step;

          return (
            <button
              key={step.step}
              onClick={() => {
                setActiveStep(isActive ? null : step.step);
                if (started) toggleStep(step.step);
              }}
              className={`w-full card p-4 flex items-center gap-3 text-left transition-all duration-200 active:scale-98 ${isCompleted ? 'opacity-60' : ''} ${isActive ? 'ring-2 ring-primary/30' : ''}`}
            >
              {/* Step number */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all ${
                isCompleted ? 'bg-emerald-500 text-white' : 'bg-primary-50 text-primary border border-primary-200'
              }`}>
                {isCompleted
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : step.step
                }
              </div>

              {/* Product mini image */}
              {product && (
                <div className="w-12 h-14 rounded-xl overflow-hidden shrink-0">
                  <ProductImage product={product} size="sm" className="w-full h-full" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted font-medium uppercase tracking-wider">{step.action}</p>
                <p className="text-sm font-semibold text-dark truncate">{step.productName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {step.morning && <span className="text-[10px] text-muted">☀️ {step.duration} min</span>}
                  {step.night && <span className="text-[10px] text-muted">🌙 {step.duration} min</span>}
                </div>
              </div>

              {/* Arrow */}
              <button
                onClick={e => { e.stopPropagation(); if (product) navigate(`/product/${product.id}`); }}
                className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0 active:scale-90"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="shrink-0 px-5 py-4 bg-[#EFF4F1] border-t border-gray-100">
        {!started ? (
          <button onClick={() => setStarted(true)} className="btn-primary">
            Comenzar rutina
          </button>
        ) : completedSteps.size === routine.steps.length ? (
          <button
            onClick={() => { setStarted(false); setCompletedSteps(new Set()); }}
            className="btn-primary" style={{ background: '#10B981' }}>
            ✓ ¡Rutina completada! Reiniciar
          </button>
        ) : (
          <button onClick={() => navigate(-1)} className="btn-primary" style={{ background: '#6B7280' }}>
            Terminar más tarde
          </button>
        )}
      </div>
    </div>
  );
}

