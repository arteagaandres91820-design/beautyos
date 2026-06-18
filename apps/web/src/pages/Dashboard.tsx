import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users, CalendarDays, DollarSign, Crown, ArrowRight,
  Clock, Loader2, Sparkles, Bell, CheckCircle2, Cake, Phone, MessageCircle,
  TrendingUp, TrendingDown, UserCheck, AlertTriangle, Package, Receipt, Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi, clientsApi, appointmentsApi, expensesApi, inventoryApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { DashboardStats, Appointment } from '../types';
import { formatCOP, formatDate, getInitials, STATUS_LABELS, cn, getLoyaltyTier } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

function StatCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: number | null;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="font-display text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
          {trend != null && (
            <span className={cn('flex items-center gap-0.5 text-xs font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertCard({ count, label, sub, icon: Icon, color, to, dotColor }: {
  count: number; label: string; sub: string;
  icon: React.ElementType; color: string; to: string; dotColor: string;
}) {
  if (count === 0) return null;
  return (
    <Link to={to}
      className={cn('flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-beauty group', color)}>
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-xl bg-white/60 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn('absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow', dotColor)}>
          {count}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-70 mt-0.5">{sub}</p>
      </div>
      <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const statusClass: Record<string, string> = {
    SCHEDULED:   'bg-blue-100 text-blue-700',
    CONFIRMED:   'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-full bg-[#083D42] flex items-center justify-center text-white text-xs font-bold shrink-0">
        {getInitials(appt.client.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 truncate">{appt.client.name}</p>
          {appt.client.isVip && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {formatDate(appt.date)} Â· {appt.startTime}
        </p>
      </div>
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusClass[appt.status] ?? 'bg-gray-100 text-gray-600')}>
        {STATUS_LABELS[appt.status]}
      </span>
    </div>
  );
}

interface AtRiskClient {
  id: string; name: string; phone: string; isVip: boolean;
  lastVisit: string; daysSince: number;
}

const CAT_LABELS: Record<string, string> = {
  SUPPLIES: 'Insumos', RENT: 'Arriendo', UTILITIES: 'Servicios pÃºblicos',
  SALARY: 'NÃ³mina', EQUIPMENT: 'Equipos', MARKETING: 'Marketing', OTHER: 'Otro',
};

export function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [remindersSent, setRemindersSent] = useState(false);

  const reminderMutation = useMutation({
    mutationFn: (date: string) => appointmentsApi.sendReminders(date),
    onSuccess: (res) => {
      const { sent, skipped, total } = res.data;
      setRemindersSent(true);
      if (sent > 0) toast(`${sent} recordatorio${sent !== 1 ? 's' : ''} enviado${sent !== 1 ? 's' : ''} por email`, 'success');
      else if (total > 0) toast(`${total} cita${total !== 1 ? 's' : ''} sin email registrado`, 'info');
      else toast('No hay citas maÃ±ana para recordar', 'info');
    },
    onError: () => toast('Error al enviar recordatorios', 'error'),
  });

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: atRiskClients = [] } = useQuery<AtRiskClient[]>({
    queryKey: ['clients-at-risk'],
    queryFn: () => clientsApi.atRisk(30).then(r => r.data),
    staleTime: 10 * 60_000,
  });

  interface BirthdayClient { id: string; name: string; phone: string; photo?: string; isVip: boolean; visitCount: number; daysUntil: number; }
  const { data: birthdayClients = [] } = useQuery<BirthdayClient[]>({
    queryKey: ['clients-birthdays'],
    queryFn: () => clientsApi.birthdays(14).then(r => r.data),
    staleTime: 60 * 60_000,
  });

  const bdayTemplates: { id: string; name: string; body: string }[] = (() => {
    try { return JSON.parse((user?.business as any)?.messageTemplates ?? '[]'); } catch { return []; }
  })();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: tomorrowAppts = [] } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'day', tomorrowStr],
    queryFn: () => appointmentsApi.list({ date: tomorrowStr, status: 'SCHEDULED,CONFIRMED' }).then(r => r.data),
    staleTime: 5 * 60_000,
  });

const curMonth = new Date().getMonth() + 1;
  const curYear  = new Date().getFullYear();

  interface LowProduct { id: string; name: string; brand?: string; category: string; stock: number; minStock: number; unit: string; }
  const { data: lowStockProducts = [] } = useQuery<LowProduct[]>({
    queryKey: ['inventory-low-stock'],
    queryFn: () => inventoryApi.list({ lowStock: true }).then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const { data: monthExpenses = [] } = useQuery<Array<{ category: string; amount: number }>>({
    queryKey: ['expenses', curMonth, curYear],
    queryFn: () => expensesApi.list({ month: curMonth, year: curYear }).then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const expByCat = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach(e => { m[e.category] = (m[e.category] ?? 0) + e.amount; });
    return m;
  }, [monthExpenses]);

  const budgets = useMemo<Record<string, number>>(() => {
    try { return JSON.parse(user?.business?.expenseBudgets ?? '{}') ?? {}; }
    catch { return {}; }
  }, [user?.business?.expenseBudgets]);

  const overBudget = useMemo(
    () => Object.entries(budgets).filter(([cat, b]) => b > 0 && (expByCat[cat] ?? 0) > b)
      .map(([cat, budget]) => ({ cat, budget, actual: expByCat[cat] ?? 0 })),
    [budgets, expByCat],
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos dÃ­as' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const hasAlerts = (data?.pendingBookingRequests ?? 0) + (data?.pendingProposals ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* â”€â”€ Hero banner â”€â”€ */}
      <div className="relative bg-sidebar rounded-2xl p-5 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-primary text-[11px] font-bold uppercase tracking-widest mb-1 opacity-80">
              {user?.business?.name ?? 'BeautyOS'}
            </p>
            <h2 className="font-display text-2xl font-bold text-white leading-tight">
              {greeting}, {user?.name?.split(' ')[0]} ðŸ‘‹
            </h2>
            <p className="text-white/40 text-xs mt-1 capitalize">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {data && (
            <div className="text-right shrink-0">
              <p className="font-display text-xl font-bold text-primary leading-tight">
                {formatCOP(data.monthRevenue)}
              </p>
              <p className="text-white/30 text-[10px] mt-0.5">ingresos del mes</p>
            </div>
          )}
        </div>
        {data && (
          <div className="relative z-10 flex items-center gap-5 mt-4 pt-4 border-t border-white/[0.08]">
            <div>
              <p className="font-display text-xl font-bold text-white">{data.todayAppointments}</p>
              <p className="text-white/35 text-[11px]">citas hoy</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="font-display text-xl font-bold text-white">{data.activeClientsMonth}</p>
              <p className="text-white/35 text-[11px]">clientes activos</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="font-display text-xl font-bold text-white">{data.vipClients}</p>
              <p className="text-white/35 text-[11px]">VIP</p>
            </div>
            {(data.revenueGrowth != null) && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div className={cn('flex items-center gap-1 text-xs font-bold', data.revenueGrowth >= 0 ? 'text-primary' : 'text-red-400')}>
                  {data.revenueGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {Math.abs(data.revenueGrowth)}% vs mes ant.
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* â”€â”€ Alert banners â€” only visible when there's something to act on â”€â”€ */}
      {hasAlerts && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Requiere atenciÃ³n</p>
          <AlertCard
            count={data?.pendingBookingRequests ?? 0}
            label="Solicitudes de cita nuevas"
            sub="Clientes esperando confirmaciÃ³n"
            icon={Bell}
            color="bg-amber-50 border-amber-200 text-amber-800"
            dotColor="bg-amber-400"
            to="/agenda"
          />
          <AlertCard
            count={data?.pendingProposals ?? 0}
            label="Propuestas esperando respuesta"
            sub="DiseÃ±os enviados sin aprobar aÃºn"
            icon={Sparkles}
            color="bg-primary-50 border-primary-200 text-primary-800"
            dotColor="bg-primary"
            to="/agenda"
          />
        </div>
      )}


      {/* Overdue appointments alert */}
      {(data?.overdueCount ?? 0) > 0 && (
        <Link to="/agenda"
          className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm font-semibold text-amber-800 flex-1">
            {data!.overdueCount} cita{data!.overdueCount !== 1 ? 's' : ''} pendiente{data!.overdueCount !== 1 ? 's' : ''} sin resolver â€” ir a la agenda
          </p>
          <ArrowRight className="w-4 h-4 text-amber-500" />
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Citas hoy" value={data?.todayAppointments ?? 0}
          icon={CalendarDays} color="bg-primary-100 text-primary"
          sub="programadas"
        />
        <StatCard
          title="Ingresos hoy" value={formatCOP(data?.todayRevenue ?? 0)}
          icon={DollarSign} color="bg-emerald-100 text-emerald-600"
          sub="cobrados"
        />
        <StatCard
          title="Clientes activos" value={data?.activeClientsMonth ?? 0}
          icon={UserCheck} color="bg-primary-100 text-primary"
          sub={`de ${data?.totalClients ?? 0} totales Â· ${data?.vipClients ?? 0} VIP`}
        />
        <StatCard
          title="Ingresos del mes" value={formatCOP(data?.monthRevenue ?? 0)}
          icon={TrendingUp} color="bg-emerald-100 text-emerald-600"
          sub="vs. mes anterior"
          trend={data?.revenueGrowth}
        />
      </div>


      {/* Monthly revenue goal progress */}
      {(() => {
        const goal = (user?.business as any)?.monthlyRevenueGoal ?? 0;
        const curr = data?.monthRevenue ?? 0;
        if (goal <= 0) return null;
        const pct = Math.min(100, Math.round((curr / goal) * 100));
        const reached = curr >= goal;
        return (
          <div className={cn('p-4 rounded-2xl border', reached ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className={cn('w-4 h-4', reached ? 'text-emerald-500' : 'text-primary')} />
                <span className="text-sm font-semibold text-gray-800">Meta mensual</span>
              </div>
              <div className="text-right">
                <span className={cn('text-sm font-bold', reached ? 'text-emerald-600' : 'text-gray-900')}>{formatCOP(curr)}</span>
                <span className="text-xs text-gray-400 ml-1">/ {formatCOP(goal)}</span>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: reached ? '#10b981' : 'var(--primary)' }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className={cn('text-xs font-semibold', reached ? 'text-emerald-600' : 'text-primary')}>{pct}% alcanzado</span>
              <div className="flex items-center gap-3">
                {(data?.projectedRevenue ?? 0) > 0 && (
                  <span className="text-xs text-blue-500 font-medium">
                    +{formatCOP(data!.projectedRevenue)} proyectado
                  </span>
                )}
                {reached
                  ? <span className="text-xs font-bold text-emerald-600">Â¡Meta superada! ðŸŽ‰</span>
                  : <span className="text-xs text-gray-400">Faltan {formatCOP(goal - curr)}</span>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Over-budget expense alert */}
      {overBudget.length > 0 && (
        <div className="card border-red-200 bg-red-50/40">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-red-500" />
            <h3 className="font-display font-semibold text-gray-900 text-base">CategorÃ­as sobre presupuesto</h3>
            <span className="ml-auto text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{overBudget.length}</span>
            <Link to="/expenses" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver gastos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {overBudget.map(({ cat, budget, actual }) => {
              const pct = Math.round((actual / budget) * 100);
              return (
                <div key={cat} className="p-3 rounded-xl bg-white border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-sm font-semibold text-gray-800">{CAT_LABELS[cat] ?? cat}</span>
                    </div>
                    <div className="text-xs text-right">
                      <span className="font-bold text-red-600">{formatCOP(actual)}</span>
                      <span className="text-gray-400"> / {formatCOP(budget)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-red-100 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[11px] text-red-500 mt-0.5">Excedido {pct}% â€” {formatCOP(actual - budget)} sobre el lÃ­mite</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Birthday reminders */}
      {birthdayClients.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="w-4 h-4 text-rose-500" />
            <h3 className="font-display font-semibold text-gray-900 text-base">CumpleaÃ±os prÃ³ximos</h3>
            <span className="ml-auto text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{birthdayClients.length}</span>
          </div>
          <div className="space-y-2">
            {birthdayClients.map(c => {
              const isToday = c.daysUntil === 0;
              const dayLabel = isToday ? 'Â¡Hoy! ðŸŽ‚' : c.daysUntil === 1 ? 'MaÃ±ana' : `En ${c.daysUntil} dÃ­as`;
              const defaultMsg = `Â¡Feliz cumpleaÃ±os ${c.name.split(' ')[0]}! ðŸŽ‚ Te deseamos un dÃ­a especial. Â¿Te gustarÃ­a celebrarlo con un servicio especial en el salÃ³n?`;
              return (
                <div key={c.id} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all', isToday ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-100')}>
                  <div className={cn('w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0', isToday ? 'bg-rose-400' : 'bg-gray-300')}>
                    {c.photo ? <img src={c.photo} alt="" className="w-full h-full object-cover" /> : getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      {c.isVip && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                      {(() => {
                        const t = getLoyaltyTier(c.visitCount ?? 0);
                        return (
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', t.bg, t.color)}>
                            {t.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className={cn('text-xs font-medium', isToday ? 'text-rose-600' : 'text-gray-400')}>{dayLabel}</p>
                  </div>
                  {c.phone && (
                    <div className="relative group shrink-0">
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(defaultMsg)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-600 transition-colors">
                        <Phone className="w-3 h-3" /> WA
                      </a>
                      {bdayTemplates.length > 0 && (
                        <div className="absolute right-0 top-8 z-20 hidden group-hover:block bg-white border border-edge rounded-xl shadow-lg min-w-[180px] overflow-hidden">
                          <p className="text-[10px] font-semibold text-gray-400 px-3 pt-2 pb-1">Usar plantilla</p>
                          {bdayTemplates.map(t => (
                            <a key={t.id}
                              href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(t.body.replace(/\{\{nombre\}\}/gi, c.name.split(' ')[0]))}`}
                              target="_blank" rel="noopener noreferrer"
                              className="block px-3 py-2 text-xs text-gray-700 hover:bg-surface transition-colors">
                              {t.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Low-stock inventory alert */}
      {lowStockProducts.length > 0 && (
        <div className="card border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-orange-500" />
            <h3 className="font-display font-semibold text-gray-900 text-base">Stock bajo en inventario</h3>
            <span className="ml-auto text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{lowStockProducts.length}</span>
            <Link to="/inventory" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver inventario <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map(p => {
              const pct = p.minStock > 0 ? Math.min(100, Math.round((p.stock / p.minStock) * 100)) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.brand && <span className="text-[10px] text-gray-400">{p.brand}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-orange-600 font-medium">
                        {p.stock} {p.unit} (mÃ­n. {p.minStock})
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {lowStockProducts.length > 5 && (
              <Link to="/inventory" className="block text-center text-xs text-primary font-semibold py-1 hover:underline">
                +{lowStockProducts.length - 5} productos mÃ¡s con stock bajo
              </Link>
            )}
          </div>
        </div>
      )}

      {/* At-risk client retention */}
      {atRiskClients.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-semibold text-gray-900 text-base">Clientes en riesgo</h3>
            <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{atRiskClients.length}+</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Sin visita en mÃ¡s de 30 dÃ­as â€” envÃ­a un mensaje de reactivaciÃ³n</p>
          <div className="space-y-2">
            {atRiskClients.map(c => {
              const reMsg = encodeURIComponent(`Â¡Hola ${c.name.split(' ')[0]}! ðŸ’… Te extraÃ±amos en el salÃ³n. Â¿Te gustarÃ­a agendar una cita? Tenemos horarios disponibles para ti.`);
              const dayLabel = c.daysSince >= 90 ? `${c.daysSince} dÃ­as` : c.daysSince >= 60 ? '2+ meses' : '1+ mes';
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-xs font-bold shrink-0">
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      {c.isVip && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-amber-600 font-medium">Ãšltima visita: {dayLabel}</p>
                  </div>
                  {c.phone && (
                    <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}?text=${reMsg}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-600 transition-colors shrink-0">
                      <Phone className="w-3 h-3" /> WA
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expiring packages â€” clients with sessions left but package expiring soon */}
      {(data?.expiringPackages?.length ?? 0) > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-violet-500" />
            <h3 className="font-display font-semibold text-gray-900 text-base">Paquetes por vencer</h3>
            <span className="ml-auto text-xs font-bold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">{data!.expiringPackages.length}</span>
            <Link to="/clients" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver clientes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mb-3">Tienen sesiones disponibles pero el paquete vence en los prÃ³ximos 30 dÃ­as</p>
          <div className="space-y-2">
            {data!.expiringPackages.map(ep => {
              const daysLeft = ep.expiresAt ? Math.ceil((new Date(ep.expiresAt).getTime() - Date.now()) / 86400000) : null;
              const msg = encodeURIComponent(`Â¡Hola ${ep.clientName.split(' ')[0]}! ðŸ’… Tienes ${ep.sessionsLeft} sesiÃ³n${ep.sessionsLeft !== 1 ? 'es' : ''} disponible${ep.sessionsLeft !== 1 ? 's' : ''} de tu paquete "${ep.packageName}" que vence${daysLeft !== null ? ` en ${daysLeft} dÃ­a${daysLeft !== 1 ? 's' : ''}` : ''}. Â¡Te esperamos!`);
              return (
                <div key={ep.id} className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                  <div className="w-9 h-9 rounded-full bg-violet-200 flex items-center justify-center text-violet-800 text-xs font-bold shrink-0">
                    {getInitials(ep.clientName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ep.clientName}</p>
                    <p className="text-xs text-violet-600 font-medium">
                      {ep.sessionsLeft} sesiÃ³n{ep.sessionsLeft !== 1 ? 'es' : ''} Â· {ep.packageName}
                      {daysLeft !== null && <span className={cn('ml-1.5', daysLeft <= 7 ? 'text-red-500' : 'text-violet-400')}>Â· vence en {daysLeft}d</span>}
                    </p>
                  </div>
                  {ep.clientPhone && (
                    <a href={`https://wa.me/${ep.clientPhone.replace(/\D/g, '')}?text=${msg}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-600 transition-colors shrink-0">
                      <Phone className="w-3 h-3" /> WA
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tomorrow's reminders */}
      {tomorrowAppts.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-green-500" />
            <h3 className="font-display font-semibold text-gray-900 text-base">Recordatorios para maÃ±ana</h3>
            <span className="ml-auto text-xs font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{tomorrowAppts.length} citas</span>
            <button
              onClick={() => reminderMutation.mutate(tomorrowStr)}
              disabled={reminderMutation.isPending || remindersSent}
              title="Enviar recordatorio por email a clientes con email registrado"
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50">
              {reminderMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Mail className="w-3.5 h-3.5" />}
              {remindersSent ? 'Enviados' : 'Email'}
            </button>
          </div>
          <div className="space-y-2">
            {tomorrowAppts.map(appt => {
              const svcNames = appt.services?.map(s => s.service.name).join(', ') || 'Cita';
              const msg = `Hola ${appt.client.name}! Te recordamos tu cita maÃ±ana a las ${appt.startTime} (${svcNames}). Â¡Te esperamos! ðŸ’…`;
              return (
                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-800 text-xs font-bold shrink-0">
                    {getInitials(appt.client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900">{appt.client.name}</p>
                      {appt.client.isVip && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500">{appt.startTime} Â· {svcNames}</p>
                  </div>
                  {appt.client.phone && (
                    <a href={`https://wa.me/${appt.client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-600 transition-colors shrink-0">
                      <Phone className="w-3 h-3" /> WA
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gray-900">PrÃ³ximas citas</h3>
            <Link to="/agenda" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Ver agenda <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.upcomingAppointments?.length ? (
            data.upcomingAppointments.map((a) => <AppointmentCard key={a.id} appt={a} />)
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No hay citas prÃ³ximas</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-gray-900 px-1">Acceso rÃ¡pido</h3>
          {[
            { to: '/clients',  label: 'Nuevo cliente',   desc: 'Registrar cliente en el CRM',    icon: Users,        color: 'bg-violet-50 text-violet-600' },
            { to: '/agenda',   label: 'Nueva cita',      desc: 'Agendar en menos de 3 clics',    icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
            { to: '/cash',     label: 'Registrar cobro', desc: 'Efectivo, Nequi, tarjeta',       icon: DollarSign,   color: 'bg-emerald-50 text-emerald-600' },
            { to: '/nail-ai',  label: 'NailAI Studio',   desc: 'CatÃ¡logo + prueba virtual IA',   icon: Sparkles,     color: 'bg-primary-50 text-primary' },
          ].map(({ to, label, desc, icon: Icon, color }) => (
            <Link key={to} to={to}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-beauty transition-all group">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

