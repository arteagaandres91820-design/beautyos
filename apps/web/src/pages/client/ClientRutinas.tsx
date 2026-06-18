import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Circle, RefreshCw, Star, Droplets, Sun, Moon, Zap, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Tip {
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
}

const TIPS: Tip[] = [
  { icon: Droplets, color: 'bg-blue-100 text-blue-600',   title: 'Hidratación diaria',      body: 'Aplica aceite de cutículas o crema de manos cada noche antes de dormir. Mantiene tus uñas flexibles y evita quiebres.' },
  { icon: Sun,      color: 'bg-amber-100 text-amber-600', title: 'Protección UV',            body: 'El sol degrada el esmalte y reseca las cutículas. Usa guantes al exponerte al sol por períodos prolongados.' },
  { icon: Zap,      color: 'bg-violet-100 text-violet-600',title: 'Uñas sin estrés',         body: 'Evita usar las uñas como herramientas (abrir latas, rascar). Usa las yemas de los dedos en su lugar.' },
  { icon: RefreshCw,color: 'bg-primary/10 text-primary',  title: 'Retoque a tiempo',         body: 'La mayoría de los diseños en gel o acrílico duran 3–4 semanas. Agenda tu retoque antes de que se levante para proteger la uña natural.' },
  { icon: Moon,     color: 'bg-indigo-100 text-indigo-600',title: 'Limpieza nocturna',        body: 'Antes de dormir, limpia el área de las cutículas con un algodón con aceite de bebé. Elimina residuos del día.' },
  { icon: Star,     color: 'bg-rose-100 text-rose-600',   title: 'Dieta y biotina',          body: 'Las uñas se fortalecen desde adentro. Incluye alimentos ricos en biotina: huevos, aguacate, nueces y espinaca.' },
];

const WEEKLY: { day: string; task: string }[] = [
  { day: 'Lun', task: 'Aceite de cutículas + crema de manos' },
  { day: 'Mar', task: 'Revisar si hay levantamiento o quiebre' },
  { day: 'Mié', task: 'Hidratación extra (mascarilla de manos)' },
  { day: 'Jue', task: 'Aceite de cutículas + crema de manos' },
  { day: 'Vie', task: 'Exfoliación suave de manos' },
  { day: 'Sáb', task: 'Relajación: baño de manos tibio con sales' },
  { day: 'Dom', task: 'Descanso y revisión general' },
];

const TODAY_IDX = new Date().getDay(); // 0=Sun … 6=Sat
const WEEK_IDX  = TODAY_IDX === 0 ? 6 : TODAY_IDX - 1; // map to Mon=0

function getISOWeekKey() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const week = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
  return `beautyos_rutinas_${year}_W${week}`;
}

export function ClientRutinas() {
  const storageKey = getISOWeekKey();

  const [checked, setChecked] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return new Set<number>(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set<number>();
  });

  const toggle = (i: number) => setChecked(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(n)));
    return n;
  });

  // Clean up old week keys
  useEffect(() => {
    Object.keys(localStorage).filter(k => k.startsWith('beautyos_rutinas_') && k !== storageKey).forEach(k => localStorage.removeItem(k));
  }, [storageKey]);

  const progress = WEEKLY.length > 0 ? Math.round((checked.size / WEEKLY.length) * 100) : 0;

  return (
    <div className="bg-[#EFF4F1] min-h-full pb-6">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 bg-[#EFF4F1] border-b border-gray-50">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-client-500/60 mb-0.5">Cuidado</p>
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-[28px] font-bold text-client-900 tracking-tight leading-none">
            Rutinas<span className="text-client-500">.</span>
          </h1>
          <div className="w-10 h-10 rounded-2xl bg-[#F0F5F4] flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-client-600" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 bg-[#EFF4F1]">

        {/* ── Weekly checklist ─────────────────────────── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-client-100">
          <div className="px-5 py-4 border-b border-client-50 flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-gray-900 text-sm">Rutina de esta semana</h2>
              <p className="text-xs text-gray-400 mt-0.5">{checked.size} de {WEEKLY.length} completadas</p>
            </div>
            {/* Progress ring */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#E0F7F5" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none"
                  stroke="#2DC7B3" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-client-600">{progress}%</span>
            </div>
          </div>

          <div className="divide-y divide-client-50">
            {WEEKLY.map((w, i) => {
              const isToday = i === WEEK_IDX;
              const done    = checked.has(i);
              return (
                <button key={i} onClick={() => toggle(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors',
                    done ? 'bg-client-50/60' : isToday ? 'bg-amber-50/60' : 'hover:bg-gray-50/50'
                  )}>
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-client-500 shrink-0" />
                    : <Circle className={cn('w-5 h-5 shrink-0', isToday ? 'text-amber-400' : 'text-gray-300')} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold', isToday ? 'text-amber-500' : 'text-gray-400')}>
                        {w.day}{isToday && ' · Hoy'}
                      </span>
                    </div>
                    <p className={cn('text-sm font-medium mt-0.5', done ? 'line-through text-gray-400' : 'text-gray-800')}>
                      {w.task}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Care tips ────────────────────────────────── */}
        <div>
          <h2 className="font-display font-semibold text-gray-900 text-sm mb-3">Consejos de cuidado</h2>
          <div className="grid grid-cols-1 gap-3">
            {TIPS.map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-4 flex gap-4 border border-client-50 shadow-sm">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA — book next appointment ──────────────── */}
        <a href="/cliente/agendar"
          className="flex items-center justify-between bg-[#083D42] text-white rounded-3xl p-5 shadow-[0_8px_32px_rgba(8,61,66,0.28)] active:scale-[0.98] transition-transform">
          <div>
            <p className="font-display font-bold text-base">¿Lista para tu próxima cita?</p>
            <p className="text-xs text-white/80 mt-0.5">Agenda en segundos, sin llamadas</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/80" />
        </a>
      </div>
    </div>
  );
}
