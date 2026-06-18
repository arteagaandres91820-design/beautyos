import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTINES } from '../data/mock';

const LEVEL_COLOR: Record<string, string> = {
  Básica: '#2DC7B3',
  Intermedia: '#8B5CF6',
  Avanzada: '#EF4444',
};

// Last 7 days completion map: true=completed, false=missed
const WEEK_DATA = [true, true, false, true, true, true, false];
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function Routines() {
  const navigate = useNavigate();
  const [streakExpanded, setStreakExpanded] = useState(false);

  return (
    <div className="page-enter pb-4">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-light text-dark mb-1">Mis Rutinas</h1>
        <p className="text-sm text-muted mb-5">Elige tu rutina y cuida tu piel cada día.</p>

        {/* Streak tracker */}
        <button
          onClick={() => setStreakExpanded(v => !v)}
          className="w-full card p-4 mb-4 text-left active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
              🔥
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-2xl font-medium text-dark">5</p>
                <p className="text-sm font-semibold text-dark">días seguidos</p>
                <span className="ml-auto text-[10px] text-primary font-semibold bg-primary-50 px-2 py-0.5 rounded-full">
                  ¡Racha activa!
                </span>
              </div>
              <p className="text-xs text-muted">Próxima recompensa en 2 días más</p>
            </div>
          </div>

          {/* Weekly calendar */}
          <div className={`overflow-hidden transition-all duration-300 ${streakExpanded ? 'max-h-20 mt-3' : 'max-h-0'}`}>
            <div className="flex gap-2 justify-around pt-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted font-medium">{d}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    i === 6 ? 'border-2 border-primary bg-white' :
                    WEEK_DATA[i] ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}>
                    {WEEK_DATA[i] ? (i === 6 ? '·' : '✓') : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 h-1.5 bg-primary-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '71%' }} />
            </div>
            <p className="text-[10px] text-muted mt-1 text-center">5/7 esta semana · Objetivo: 7 días</p>
          </div>
        </button>

        {/* My routine card */}
        <div className="card p-5 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white text-lg">✦</span>
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Rutina activa</p>
              <p className="font-semibold text-dark text-sm">Glow Esencial</p>
            </div>
            <button onClick={() => navigate('/routine/1')}
              className="ml-auto text-xs text-primary font-semibold bg-primary-50 px-3 py-1.5 rounded-xl">
              Continuar →
            </button>
          </div>
          <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-muted mt-1">3 de 5 pasos completados hoy</p>
        </div>

        {/* All routines */}
        <h2 className="font-semibold text-dark text-[15px] mb-3">Todas las rutinas</h2>
        <div className="space-y-3">
          {ROUTINES.map(routine => (
            <button
              key={routine.id}
              onClick={() => navigate(`/routine/${routine.id}`)}
              className="w-full card p-4 flex items-center gap-4 text-left active:scale-98 transition-all"
            >
              {/* Color indicator */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: routine.bgColor + '60' }}>
                <span className="text-2xl">✦</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-dark text-[15px] truncate">{routine.name}</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: LEVEL_COLOR[routine.level] }}>
                    {routine.level}
                  </span>
                </div>
                <p className="text-xs text-muted mb-2 line-clamp-1">{routine.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-dark/60 font-medium">{routine.stepCount} pasos</span>
                  <span className="text-xs text-dark/60">·</span>
                  <span className="text-xs text-dark/60">{routine.duration} min</span>
                  <div className="flex gap-1 ml-auto">
                    {routine.tags.map(t => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-primary-50 text-primary font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        {/* Build custom routine banner */}
        <div className="mt-6 rounded-2xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #EFF4F1, #D0EEEA)' }}>
          <p className="text-2xl mb-2">🧪</p>
          <p className="font-semibold text-dark text-sm mb-1">Crea tu rutina personalizada</p>
          <p className="text-xs text-muted mb-3">Cuéntanos sobre tu piel y armamos la rutina perfecta para ti.</p>
          <button
            onClick={() => navigate('/routine-builder')}
            className="text-xs font-semibold text-white bg-primary px-5 py-2.5 rounded-xl shadow-btn active:scale-95 transition-transform"
          >
            Crear mi rutina ✦
          </button>
        </div>
      </div>
    </div>
  );
}

