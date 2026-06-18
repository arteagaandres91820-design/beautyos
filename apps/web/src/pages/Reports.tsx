import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, CalendarDays, Loader2, Users, Scissors, Crown, Download, UserCheck, TrendingDown, Minus, Package2, AlertTriangle, CreditCard, Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { reportsApi } from '../lib/api';
import { formatCOP, cn } from '../lib/utils';

function exportReportCSV(data: Overview, days: number) {
  const lines: string[][] = [];
  lines.push([`Reporte últimos ${days} días`]);
  lines.push([]);
  lines.push(['Ingresos totales', String(data.periodRevenue)]);
  lines.push(['Gastos totales', String(data.periodExpenses ?? 0)]);
  lines.push(['Ganancia neta', String(data.periodProfit ?? 0)]);
  lines.push(['Citas totales', String(data.periodAppointments)]);
  lines.push(['Ticket promedio', String(data.avgTicket ?? 0)]);
  lines.push(['Tasa de no-show', `${data.noShowRate ?? 0}%`]);
  lines.push([]);
  lines.push(['Ingresos por día']);
  lines.push(['Fecha', 'Monto']);
  data.revenueByDay.forEach(d => lines.push([d.day, String(d.amount)]));
  lines.push([]);
  lines.push(['Servicios más solicitados']);
  lines.push(['Servicio', 'Veces', 'Ingresos']);
  data.topServices.forEach(s => lines.push([s.name, String(s.count), String(s.revenue)]));
  lines.push([]);
  lines.push(['Clientes top']);
  lines.push(['Cliente', 'Visitas', 'Total gastado']);
  data.topClients.forEach(c => lines.push([c.name, String(c.visits), String(c.spent)]));
  if (data.staffPerformance?.length) {
    lines.push([]);
    lines.push(['Rendimiento del equipo']);
    lines.push(['Nombre', 'Citas completadas', 'Ingresos generados', 'Comisión %', 'Comisión a pagar']);
    data.staffPerformance.forEach(s => lines.push([s.name, String(s.appts), String(s.revenue), `${s.commissionPct}%`, String(s.commission)]));
  }

  const csv = lines.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `reporte_${days}dias.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface Overview {
  days: number;
  periodRevenue: number;
  periodAppointments: number;
  periodExpenses: number;
  periodProfit: number;
  avgTicket: number;
  noShowRate: number;
  revenueByDay: { day: string; amount: number }[];
  expensesByDay: { day: string; amount: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  topClients: { name: string; visits: number; spent: number }[];
  byStatus: { status: string; count: number }[];
  staffPerformance: { name: string; appts: number; revenue: number; commissionPct: number; commission: number; avgRating?: number | null }[];
  heatmap: { dow: number; hour: number; count: number }[];
  expensesByCategory: { category: string; amount: number }[];
  packageSales: { name: string; count: number; revenue: number }[];
  paymentMethods: { method: string; count: number; amount: number }[];
}

const PERIOD_OPTIONS = [
  { label: '7 días',  days: 7 },
  { label: '30 días', days: 30 },
  { label: '3 meses', days: 90 },
  { label: '1 año',   days: 365 },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', CARD: 'Tarjeta', NEQUI: 'Nequi', DAVIPLATA: 'Daviplata', TRANSFER: 'Transferencia', GIFT_CARD: 'Gift Card',
};
const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: '#10b981', CARD: '#3b82f6', NEQUI: '#8b5cf6', DAVIPLATA: '#f59e0b', TRANSFER: '#6b7280', GIFT_CARD: '#ec4899',
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  SUPPLIES: 'Insumos',
  RENT: 'Arriendo',
  UTILITIES: 'Servicios públicos',
  SALARY: 'Nómina',
  EQUIPMENT: 'Equipos',
  MARKETING: 'Marketing',
  OTHER: 'Otro',
};

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  SUPPLIES: '#f97316',
  RENT: '#8b5cf6',
  UTILITIES: '#3b82f6',
  SALARY: '#ef4444',
  EQUIPMENT: '#6b7280',
  MARKETING: '#ec4899',
  OTHER: '#9ca3af',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED:   'Programada',
  CONFIRMED:   'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED:   'Completada',
  CANCELLED:   'Cancelada',
  NO_SHOW:     'No asistió',
};
const STATUS_COLORS: Record<string, string> = {
  COMPLETED:   'bg-emerald-500',
  SCHEDULED:   'bg-blue-400',
  CONFIRMED:   'bg-primary',
  IN_PROGRESS: 'bg-violet-500',
  CANCELLED:   'bg-red-400',
  NO_SHOW:     'bg-gray-300',
};

// ─── SVG Revenue + Expense dual-area chart ──────────────────────────────────
function RevenueExpenseChart({
  revenueData, expenseData, days,
}: { revenueData: { day: string; amount: number }[]; expenseData: { day: string; amount: number }[]; days: number }) {
  const W = 600, H = 160, PAD = 8;

  const filled = useMemo(() => {
    const revMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};
    revenueData.forEach(d => { revMap[d.day] = d.amount; });
    expenseData.forEach(d => { expMap[d.day] = d.amount; });
    const out: { day: string; rev: number; exp: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key, rev: revMap[key] ?? 0, exp: expMap[key] ?? 0 });
    }
    return out;
  }, [revenueData, expenseData, days]);

  const max = Math.max(...filled.map(d => Math.max(d.rev, d.exp)), 1);
  const labelEvery = days <= 7 ? 1 : days <= 30 ? 5 : days <= 90 ? 14 : 30;
  const n = filled.length;
  const xOf = (i: number) => PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2);
  const yOf = (v: number) => H - PAD - (v / max) * (H - PAD * 2) + PAD;

  const buildPath = (vals: number[]) => {
    if (vals.every(v => v === 0)) return '';
    return vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
  };

  const buildArea = (vals: number[]) => {
    if (vals.every(v => v === 0)) return '';
    const points = vals.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
    return `M${xOf(0)},${(H - PAD + PAD).toFixed(1)} ${points.replace(/(\d+\.\d+),(\d+\.\d+)/g, 'L$1,$2').replace(/^L/, '')} L${xOf(n-1)},${(H - PAD + PAD).toFixed(1)} Z`;
  };

  const revPath  = buildPath(filled.map(d => d.rev));
  const expPath  = buildPath(filled.map(d => d.exp));
  const revArea  = buildArea(filled.map(d => d.rev));
  const expArea  = buildArea(filled.map(d => d.exp));
  const hasExpenses = filled.some(d => d.exp > 0);

  const shortDay = (day: string) => {
    const d = new Date(day + 'T12:00:00');
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary inline-block rounded-full" /> Ingresos</span>
        {hasExpenses && <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block rounded-full" /> Gastos</span>}
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full min-w-[300px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DC7B3" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2DC7B3" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={PAD} x2={W - PAD} y1={H - H * f + PAD} y2={H - H * f + PAD}
              stroke="#f3f4f6" strokeWidth="1" />
          ))}
          {/* Revenue area + line */}
          {revArea && <path d={revArea} fill="url(#revGrad)" />}
          {revPath && <path d={revPath} fill="none" stroke="#2DC7B3" strokeWidth="1.5" strokeLinejoin="round" />}
          {/* Expense area + line */}
          {hasExpenses && expArea && <path d={expArea} fill="url(#expGrad)" />}
          {hasExpenses && expPath && <path d={expPath} fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 2" />}
          {/* X-axis labels */}
          {filled.map((d, i) => i % labelEvery === 0 && (
            <text key={d.day} x={xOf(i)} y={H + PAD + 16}
              textAnchor="middle" fontSize="8" fill="#9ca3af">
              {shortDay(d.day)}
            </text>
          ))}
          {/* Dots for 7-day view */}
          {days <= 7 && filled.map((d, i) => (
            <g key={d.day}>
              {d.rev > 0 && <circle cx={xOf(i)} cy={yOf(d.rev)} r="3" fill="#2DC7B3" />}
              {hasExpenses && d.exp > 0 && <circle cx={xOf(i)} cy={yOf(d.exp)} r="3" fill="#f87171" />}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Heatmap ───────────────────────────────────────────────────────────────
const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

function Heatmap({ data }: { data: { dow: number; hour: number; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const lookup = useMemo(() => {
    const m: Record<string, number> = {};
    data.forEach(d => { m[`${d.dow}-${d.hour}`] = d.count; });
    return m;
  }, [data]);

  const isEmpty = data.length === 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-gray-900 text-base">Horas pico de la semana</h2>
        <span className="text-xs text-gray-400">citas completadas</span>
      </div>
      {isEmpty ? (
        <div className="py-8 text-center text-gray-300">
          <p className="text-sm">Sin datos suficientes aún</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[340px]">
            {/* Column headers — days */}
            <div className="flex gap-1 mb-1 ml-10">
              {DOW_LABELS.map(d => (
                <div key={d} className="flex-1 text-center text-[10px] font-semibold text-gray-400">{d}</div>
              ))}
            </div>
            {/* Rows — hours */}
            {HOURS.map(h => (
              <div key={h} className="flex gap-1 items-center mb-1">
                <span className="w-9 text-[10px] text-gray-400 text-right pr-1.5 shrink-0">{h}:00</span>
                {[0, 1, 2, 3, 4, 5, 6].map(dow => {
                  const count = lookup[`${dow}-${h}`] ?? 0;
                  const intensity = count / maxCount;
                  return (
                    <div key={dow} title={count > 0 ? `${DOW_LABELS[dow]} ${h}:00 — ${count} cita${count !== 1 ? 's' : ''}` : undefined}
                      className="flex-1 h-6 rounded-md transition-colors"
                      style={{
                        backgroundColor: count === 0
                          ? '#f3f4f6'
                          : `rgba(45, 199, 179, ${0.15 + intensity * 0.85})`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px] text-gray-400">Menos</span>
              {[0.1, 0.3, 0.55, 0.8, 1].map(f => (
                <div key={f} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(45, 199, 179, ${0.15 + f * 0.85})` }} />
              ))}
              <span className="text-[10px] text-gray-400">Más</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Expenses by category ─────────────────────────────────────────────────
function ExpensesBreakdown({ data }: { data: { category: string; amount: number }[] }) {
  const total = data.reduce((s, e) => s + e.amount, 0);
  if (!total) return null;
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-4 h-4 text-red-500" />
        <h2 className="font-display font-semibold text-gray-900 text-base">Gastos por categoría</h2>
        <span className="ml-auto text-sm font-bold text-red-500">{formatCOP(total)}</span>
      </div>
      {/* Stacked proportional bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-5">
        {data.map(e => (
          <div key={e.category}
            title={`${EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}: ${formatCOP(e.amount)}`}
            style={{
              width: `${(e.amount / total) * 100}%`,
              backgroundColor: EXPENSE_CATEGORY_COLORS[e.category] ?? '#9ca3af',
            }}
          />
        ))}
      </div>
      {/* Legend rows */}
      <div className="space-y-2.5">
        {data.map(e => {
          const pct = Math.round((e.amount / total) * 100);
          return (
            <div key={e.category} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[e.category] ?? '#9ca3af' }} />
              <span className="text-xs text-gray-600 flex-1 truncate">
                {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
              </span>
              <span className="text-xs font-semibold text-gray-800 shrink-0">{formatCOP(e.amount)}</span>
              <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mini stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-display text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Reviews section ───────────────────────────────────────────────────────
interface ReviewItem {
  id: string; date: string; clientName: string; staffName: string;
  services: string[]; rating: number; reviewNote: string | null;
}
interface ReviewsData {
  avgRating: number | null; total: number;
  dist: { star: number; count: number }[];
  reviews: ReviewItem[];
}

function ReviewsSection() {
  const { data, isLoading } = useQuery<ReviewsData>({
    queryKey: ['reports-reviews'],
    queryFn: () => reportsApi.reviews(30).then(r => r.data),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return (
    <div className="card flex justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!data || data.total === 0) return (
    <div className="card text-center py-8">
      <Star className="w-8 h-8 mx-auto text-gray-200 mb-2" />
      <p className="text-sm text-gray-400">Aún no hay reseñas de clientes</p>
      <p className="text-xs text-gray-300 mt-1">Las calificaciones de citas completadas aparecerán aquí</p>
    </div>
  );

  const maxDist = Math.max(...data.dist.map(d => d.count), 1);

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <ThumbsUp className="w-4 h-4 text-amber-500" />
        <h2 className="font-display font-semibold text-gray-900 text-base">Reseñas de clientes</h2>
        <span className="ml-auto text-xs text-gray-400">{data.total} calificaciones</span>
      </div>

      {/* Summary: avg rating + distribution */}
      <div className="flex gap-6 items-center bg-amber-50 rounded-2xl p-4 border border-amber-100">
        <div className="text-center shrink-0">
          <p className="font-display font-bold text-amber-600 text-4xl leading-none">{data.avgRating ?? '—'}</p>
          <div className="flex gap-0.5 mt-1.5 justify-center">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className="w-3.5 h-3.5"
                fill={s <= Math.round(data.avgRating ?? 0) ? '#f59e0b' : 'none'}
                stroke={s <= Math.round(data.avgRating ?? 0) ? '#f59e0b' : '#d1d5db'} />
            ))}
          </div>
          <p className="text-[10px] text-amber-500/80 mt-1 font-medium">Promedio general</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map(star => {
            const d = data.dist.find(x => x.star === star);
            const cnt = d?.count ?? 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-600 w-4 shrink-0">{star}★</span>
                <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${(cnt / maxDist) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 w-4 text-right shrink-0">{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent reviews feed */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Últimas reseñas</p>
        {data.reviews.map(r => {
          const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
          return (
            <div key={r.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 truncate">{r.clientName}</span>
                    <span className="text-[10px] text-gray-400">· {r.staffName} · {dateStr}</span>
                  </div>
                  {r.services.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{r.services.join(', ')}</p>
                  )}
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-3.5 h-3.5"
                      fill={s <= r.rating ? '#f59e0b' : 'none'}
                      stroke={s <= r.rating ? '#f59e0b' : '#d1d5db'} />
                  ))}
                </div>
              </div>
              {r.reviewNote && (
                <div className="flex gap-2 mt-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 italic leading-relaxed">"{r.reviewNote}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function Reports() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery<Overview>({
    queryKey: ['reports-overview', days],
    queryFn: () => reportsApi.overview(days).then(r => r.data),
  });

  const totalApptsByStatus = data?.byStatus.reduce((s, b) => s + b.count, 0) || 1;
  const maxServiceCount    = Math.max(...(data?.topServices.map(s => s.count) ?? [1]), 1);
  const maxClientSpent     = Math.max(...(data?.topClients.map(c => c.spent) ?? [1]), 1);

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análisis del rendimiento de tu negocio</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV export */}
          {data && (
            <button onClick={() => exportReportCSV(data, days)}
              className="btn-ghost flex items-center gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          )}
          {/* Period selector */}
          <div className="flex gap-1.5 bg-surface rounded-xl p-1 border border-edge">
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.days} onClick={() => setDays(opt.days)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  days === opt.days ? 'bg-white shadow text-gray-900 border border-edge' : 'text-gray-400 hover:text-gray-600'
                )}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              label="Ingresos del período"
              value={formatCOP(data.periodRevenue)}
              sub={`últimos ${data.days} días`}
              icon={DollarSign}
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              label="Ganancia neta"
              value={formatCOP(data.periodProfit ?? data.periodRevenue)}
              sub="ingresos − gastos"
              icon={(data.periodProfit ?? 0) >= 0 ? TrendingUp : TrendingDown}
              color={(data.periodProfit ?? 0) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}
            />
            <StatCard
              label="Citas del período"
              value={String(data.periodAppointments)}
              sub={`últimos ${data.days} días`}
              icon={CalendarDays}
              color="bg-blue-100 text-blue-600"
            />
          </div>

          {/* Secondary KPIs row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Ticket promedio"
              value={data.avgTicket ? formatCOP(data.avgTicket) : '—'}
              sub="por cita completada"
              icon={TrendingUp}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              label="Gastos del período"
              value={formatCOP(data.periodExpenses ?? 0)}
              sub="gastos registrados"
              icon={Minus}
              color="bg-red-100 text-red-500"
            />
            <StatCard
              label="Tasa de no-show"
              value={`${data.noShowRate ?? 0}%`}
              sub="de citas no asistidas"
              icon={AlertTriangle}
              color={data.noShowRate > 15 ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'}
            />
          </div>

          {/* Revenue chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-gray-900 text-base">Ingresos por día</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span className="text-xs text-gray-400">Ingreso</span>
              </div>
            </div>
            {data.revenueByDay.length === 0 ? (
              <div className="py-10 text-center text-gray-300">
                <TrendingUp className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Sin cobros en este período</p>
              </div>
            ) : (
              <RevenueExpenseChart revenueData={data.revenueByDay} expenseData={data.expensesByDay ?? []} days={days} />
            )}
          </div>

          {/* Heatmap */}
          {data.heatmap && <Heatmap data={data.heatmap} />}

          {/* Expenses by category */}
          {data.expensesByCategory?.length > 0 && (
            <ExpensesBreakdown data={data.expensesByCategory} />
          )}

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Top services */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-gray-900 text-base">Servicios más solicitados</h2>
              </div>
              {data.topServices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin datos aún</p>
              ) : (
                <div className="space-y-3">
                  {data.topServices.map((s, i) => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{s.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-primary">{s.count}×</span>
                          <span className="text-xs text-gray-400 ml-1.5">{formatCOP(s.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(s.count / maxServiceCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top clients */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-amber-500" />
                <h2 className="font-display font-semibold text-gray-900 text-base">Clientes top</h2>
              </div>
              {data.topClients.filter(c => c.spent > 0).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin datos aún</p>
              ) : (
                <div className="space-y-3">
                  {data.topClients.filter(c => c.spent > 0).map((c, i) => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {i === 0 && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {i > 0 && <span className="text-xs font-bold text-gray-400 w-3.5">{i + 1}</span>}
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{c.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-amber-600">{formatCOP(c.spent)}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{c.visits} visitas</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${(c.spent / maxClientSpent) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Staff performance + commissions */}
          {(data.staffPerformance?.length ?? 0) > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-violet-500" />
                <h2 className="font-display font-semibold text-gray-900 text-base">Rendimiento del equipo</h2>
              </div>
              <div className="space-y-3 mb-5">
                {data.staffPerformance.map((s, i) => {
                  const maxRev = Math.max(...data.staffPerformance.map(x => x.revenue), 1);
                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{s.name}</span>
                          {i === 0 && s.revenue > 0 && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          {s.avgRating != null && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              ⭐ {s.avgRating}
                            </span>
                          )}
                          <div>
                            <span className="text-xs font-bold text-violet-600">{formatCOP(s.revenue)}</span>
                            <span className="text-xs text-gray-400 ml-1.5">{s.appts} citas</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400 rounded-full transition-all duration-500"
                          style={{ width: `${(s.revenue / maxRev) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Commissions table — only if at least one person has commissionPct > 0 */}
              {data.staffPerformance.some(s => s.commissionPct > 0) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Liquidación de comisiones</p>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="text-xs w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Profesional', 'Ingresos', 'Calificación', 'Comisión %', 'A pagar'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.staffPerformance.filter(s => s.commissionPct > 0).map(s => (
                          <tr key={s.name} className="border-b border-gray-50 last:border-0">
                            <td className="px-3 py-2.5 font-medium text-gray-800">{s.name}</td>
                            <td className="px-3 py-2.5 text-gray-600">{formatCOP(s.revenue)}</td>
                            <td className="px-3 py-2.5">
                              {s.avgRating != null
                                ? <span className="text-amber-600 font-semibold">⭐ {s.avgRating}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-violet-600">{s.commissionPct}%</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-emerald-600">{formatCOP(s.commission)}</span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Total comisiones</td>
                          <td className="px-3 py-2 font-bold text-emerald-700">
                            {formatCOP(data.staffPerformance.reduce((acc, s) => acc + s.commission, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Package sales + Payment methods */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Package sales */}
            {(data.packageSales?.length ?? 0) > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Package2 className="w-4 h-4 text-violet-500" />
                  <h2 className="font-display font-semibold text-gray-900 text-base">Paquetes más vendidos</h2>
                </div>
                <div className="space-y-3">
                  {data.packageSales.map((p, i) => {
                    const maxCount = Math.max(...data.packageSales.map(x => x.count), 1);
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                            <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{p.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-violet-600">{p.count}×</span>
                            <span className="text-xs text-gray-400 ml-1.5">{formatCOP(p.revenue)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full transition-all duration-500"
                            style={{ width: `${(p.count / maxCount) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment method breakdown */}
            {(data.paymentMethods?.length ?? 0) > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <h2 className="font-display font-semibold text-gray-900 text-base">Métodos de pago</h2>
                </div>
                {/* Stacked bar */}
                <div className="h-3 rounded-full overflow-hidden flex mb-4">
                  {(() => {
                    const total = data.paymentMethods.reduce((s, m) => s + m.amount, 0);
                    return data.paymentMethods.map(m => (
                      <div key={m.method}
                        title={`${PAYMENT_METHOD_LABELS[m.method] ?? m.method}: ${formatCOP(m.amount)}`}
                        style={{ width: `${(m.amount / total) * 100}%`, backgroundColor: PAYMENT_METHOD_COLORS[m.method] ?? '#9ca3af' }}
                      />
                    ));
                  })()}
                </div>
                <div className="space-y-2.5">
                  {(() => {
                    const total = data.paymentMethods.reduce((s, m) => s + m.amount, 0);
                    return data.paymentMethods.map(m => (
                      <div key={m.method} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PAYMENT_METHOD_COLORS[m.method] ?? '#9ca3af' }} />
                        <span className="text-xs text-gray-600 flex-1">{PAYMENT_METHOD_LABELS[m.method] ?? m.method}</span>
                        <span className="text-xs font-semibold text-gray-800">{formatCOP(m.amount)}</span>
                        <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round((m.amount / total) * 100)}%</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Appointment status breakdown */}
          <div className="card">
            <h2 className="font-display font-semibold text-gray-900 text-base mb-4">Estado de citas (histórico)</h2>
            <div className="space-y-2.5">
              {data.byStatus
                .sort((a, b) => b.count - a.count)
                .map(b => (
                  <div key={b.status} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 shrink-0">{STATUS_LABELS[b.status] ?? b.status}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', STATUS_COLORS[b.status] ?? 'bg-gray-400')}
                        style={{ width: `${(b.count / totalApptsByStatus) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-6 text-right shrink-0">{b.count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Reviews feed */}
          <ReviewsSection />
        </>
      ) : null}
    </div>
  );
}
