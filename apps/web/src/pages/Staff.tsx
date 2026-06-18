import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users2, Plus, Crown, Scissors, Phone, Mail, Trash2,
  Loader2, X, CalendarDays, ShieldCheck, BarChart2, ChevronLeft, ChevronRight,
  CheckCircle2, DollarSign, Clock, History, Download,
} from 'lucide-react';
import { staffApi, commissionsApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { cn, getInitials, formatCOP } from '../lib/utils';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROFESSIONAL';
  phone?: string;
  avatar?: string;
  workDays: number[];
  weeklySchedule?: string;
  commissionPct: number;
  monthlyGoal: number;
  createdAt: string;
  _count: { appointments: number };
}

type DaySched = { open: string; close: string; closed: boolean };

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b'];
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5, 6];

function RoleBadge({ role }: { role: string }) {
  return role === 'ADMIN'
    ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Crown className="w-3 h-3" />Admin</span>
    : <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"><Scissors className="w-3 h-3" />Profesional</span>;
}

// â”€â”€â”€ Add / Edit modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StaffModal({
  member,
  onClose,
  onSave,
  saving,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onSave: (data: object) => void;
  saving: boolean;
}) {
  const isEdit = !!member;
  const [name, setName]       = useState(member?.name ?? '');
  const [email, setEmail]     = useState(member?.email ?? '');
  const [phone, setPhone]     = useState(member?.phone ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole]       = useState<'ADMIN' | 'PROFESSIONAL'>(member?.role ?? 'PROFESSIONAL');
  const [workDays, setWorkDays] = useState<number[]>(member?.workDays ?? DEFAULT_WORK_DAYS);
  const [commissionPct, setCommissionPct] = useState<number>(member?.commissionPct ?? 0);
  const [monthlyGoal, setMonthlyGoal]   = useState<string>(member?.monthlyGoal ? String(member.monthlyGoal) : '');
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DaySched>>(() => {
    try {
      if (member?.weeklySchedule) return JSON.parse(member.weeklySchedule);
    } catch { /* fall through */ }
    return Object.fromEntries([0,1,2,3,4,5,6].map(i => [i, { open: '09:00', close: '18:00', closed: !DEFAULT_WORK_DAYS.includes(i) }]));
  });
  const [showSchedule, setShowSchedule] = useState(false);

  const toggleDay = (d: number) =>
    setWorkDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b));

  const updateDaySched = (i: number, patch: Partial<DaySched>) =>
    setWeeklySchedule(prev => ({ ...prev, [i]: { ...prev[i], ...patch } }));

  const canSubmit = name.trim() && workDays.length > 0 && (isEdit || (email.trim() && password.length >= 6));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { name: name.trim(), role, phone, workDays, commissionPct, monthlyGoal: monthlyGoal ? Number(monthlyGoal) : 0, weeklySchedule: JSON.stringify(weeklySchedule) };
    if (!isEdit) { data.email = email.trim().toLowerCase(); data.password = password; }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="font-display font-semibold text-gray-900">
            {isEdit ? 'Editar miembro' : 'Agregar miembro'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nombre completo</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Valentina RÃ­os" required />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Correo electrÃ³nico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input pl-9" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">ContraseÃ±a inicial</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="MÃ­nimo 6 caracteres" minLength={6} required />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">TelÃ©fono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+57 300 000 0000" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {(['PROFESSIONAL', 'ADMIN'] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-2xl border-2 text-sm font-medium transition-all',
                    role === r
                      ? r === 'ADMIN'
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}>
                  {r === 'ADMIN' ? <Crown className="w-4 h-4" /> : <Scissors className="w-4 h-4" />}
                  {r === 'ADMIN' ? 'Admin' : 'Profesional'}
                </button>
              ))}
            </div>
            {role === 'ADMIN' && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Los admins tienen acceso total al sistema
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">DÃ­as laborales</label>
            <div className="flex gap-1.5 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6].map(d => (
                <button
                  key={d} type="button" onClick={() => toggleDay(d)}
                  className={cn(
                    'w-10 h-10 rounded-xl text-xs font-bold border-2 transition-all',
                    workDays.includes(d)
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}>
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
            {workDays.length === 0 && <p className="text-xs text-red-500 mt-1">Selecciona al menos un dÃ­a</p>}
          </div>

          {/* Per-day schedule */}
          <div>
            <button type="button" onClick={() => setShowSchedule(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full">
              <CalendarDays className="w-4 h-4 text-primary" />
              Horario por dÃ­a
              <span className="ml-auto text-xs text-gray-400">{showSchedule ? 'â–² ocultar' : 'â–¼ configurar'}</span>
            </button>
            {showSchedule && (
              <div className="mt-2 space-y-1.5 bg-surface rounded-xl p-3 border border-edge">
                {[0,1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-8 font-medium text-gray-600 shrink-0">{DAY_LABELS[i]}</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={!weeklySchedule[i]?.closed}
                        onChange={e => updateDaySched(i, { closed: !e.target.checked })}
                        className="accent-primary" />
                      <span className="text-gray-500">Trabaja</span>
                    </label>
                    {!weeklySchedule[i]?.closed && (
                      <>
                        <input type="time" value={weeklySchedule[i]?.open ?? '09:00'}
                          onChange={e => updateDaySched(i, { open: e.target.value })}
                          className="input py-1 text-xs flex-1 min-w-0" />
                        <span className="text-gray-300">â€“</span>
                        <input type="time" value={weeklySchedule[i]?.close ?? '18:00'}
                          onChange={e => updateDaySched(i, { close: e.target.value })}
                          className="input py-1 text-xs flex-1 min-w-0" />
                      </>
                    )}
                    {weeklySchedule[i]?.closed && <span className="text-gray-300 italic">No disponible</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              ComisiÃ³n <span className="text-gray-400 font-normal">(%  del pago recibido)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={60} step={1}
                value={commissionPct}
                onChange={e => setCommissionPct(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-12 text-right font-bold text-primary text-sm">{commissionPct}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Con {commissionPct}% â€” por cada $100.000 en citas, gana ${(100000 * commissionPct / 100).toLocaleString('es-CO')}.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Meta mensual <span className="text-gray-400 font-normal">(COP â€” opcional)</span>
            </label>
            <input
              type="number"
              className="input"
              placeholder="Ej: 2000000"
              min={0}
              value={monthlyGoal}
              onChange={e => setMonthlyGoal(e.target.value)}
            />
            {monthlyGoal && Number(monthlyGoal) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Meta: {formatCOP(Number(monthlyGoal))} en ingresos por mes.
              </p>
            )}
          </div>

          <button type="submit" disabled={!canSubmit || saving} className="btn-primary w-full mt-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : isEdit ? 'Guardar cambios' : 'Agregar miembro'}
          </button>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ Commissions Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface CommSummaryRow {
  userId: string; name: string; avatar?: string | null;
  commissionPct: number; monthlyGoal: number; appts: number; revenue: number;
  earned: number; paid: number; pending: number;
}

interface CommPayment {
  id: string; amount: number; notes?: string | null;
  periodFrom: string; periodTo: string; paidAt: string;
  user: { name: string; avatar?: string | null };
}

function PaymentModal({
  member, from, to, onClose, onSaved,
}: { member: CommSummaryRow; from: string; to: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(String(member.pending));
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const pay = useMutation({
    mutationFn: () => commissionsApi.recordPayment({ userId: member.userId, amount: Number(amount), notes: notes || undefined, periodFrom: from, periodTo: to }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commissions-summary'] });
      qc.invalidateQueries({ queryKey: ['commission-payments'] });
      toast(`Pago de ${formatCOP(Number(amount))} registrado para ${member.name}`, 'success');
      onSaved();
      onClose();
    },
    onError: () => toast('Error al registrar el pago', 'error'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display font-semibold text-gray-900">Registrar pago</h2>
            <p className="text-xs text-gray-400 mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded-xl">
              <p className="text-[10px] text-gray-400">Ganado</p>
              <p className="text-xs font-bold text-gray-800">{formatCOP(member.earned)}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <p className="text-[10px] text-emerald-600">Pagado</p>
              <p className="text-xs font-bold text-emerald-700">{formatCOP(member.paid)}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl">
              <p className="text-[10px] text-amber-600">Pendiente</p>
              <p className="text-xs font-bold text-amber-700">{formatCOP(member.pending)}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Monto a pagar (COP)</label>
            <input
              className="input"
              type="number" min={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notas (opcional)</label>
            <input className="input" placeholder="MÃ©todo de pago, referencia..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <button
            onClick={() => pay.mutate()}
            disabled={pay.isPending || !amount || Number(amount) <= 0}
            className="btn-primary w-full">
            {pay.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="w-4 h-4" /> Confirmar pago</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function exportCommissionsCSV(rows: CommSummaryRow[], monthLabel: string) {
  const headers = ['Nombre', 'Citas', 'ComisiÃ³n %', 'Ingresos generados', 'ComisiÃ³n ganada', 'Pagado', 'Pendiente', 'Meta mensual'];
  const lines = rows.map(r => [
    r.name,
    r.appts,
    `${r.commissionPct}%`,
    r.revenue,
    r.earned,
    r.paid,
    r.pending,
    r.monthlyGoal || '',
  ].map(v => `"${v}"`).join(','));
  const csv = [`"Comisiones â€” ${monthLabel}"`, '', headers.map(h => `"${h}"`).join(','), ...lines].join('\n');
  const blob = new Blob(['ï»¿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `comisiones_${monthLabel.replace(/\s/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function CommissionsTab() {
  const today = new Date();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [payTarget, setPayTarget] = useState<CommSummaryRow | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const from = new Date(year, month, 1).toISOString().slice(0, 10);
  const to   = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const { data: rows = [], isLoading } = useQuery<CommSummaryRow[]>({
    queryKey: ['commissions-summary', from, to],
    queryFn: () => commissionsApi.summary(from, to).then(r => r.data),
  });

  const { data: payments = [] } = useQuery<CommPayment[]>({
    queryKey: ['commission-payments'],
    queryFn: () => commissionsApi.payments().then(r => r.data),
    enabled: showHistory,
  });

  const deletePayment = useMutation({
    mutationFn: (id: string) => commissionsApi.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commission-payments'] });
      qc.invalidateQueries({ queryKey: ['commissions-summary'] });
      toast('Pago eliminado', 'success');
    },
    onError: () => toast('Error al eliminar', 'error'),
  });

  const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const navMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const totalEarned  = rows.reduce((a, r) => a + r.earned, 0);
  const totalPaid    = rows.reduce((a, r) => a + r.paid, 0);
  const totalPending = rows.reduce((a, r) => a + r.pending, 0);
  const monthLabel   = `${MONTH_LABELS[month]} ${year}`;

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <button onClick={() => navMonth(-1)} className="btn-ghost p-2"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-gray-700 capitalize">{monthLabel}</span>
        <div className="flex items-center gap-1">
          {rows.length > 0 && (
            <button onClick={() => exportCommissionsCSV(rows, monthLabel)}
              className="btn-ghost p-2" title="Exportar CSV">
              <Download className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => navMonth(1)} className="btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card text-center py-3">
          <p className="text-xs text-gray-400 mb-0.5">Ingresos perÃ­odo</p>
          <p className="font-display text-base font-bold text-gray-900">{formatCOP(totalRevenue)}</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-gray-400 mb-0.5">Total a pagar</p>
          <p className="font-display text-base font-bold text-primary">{formatCOP(totalEarned)}</p>
        </div>
        <div className="card text-center py-3 bg-emerald-50 border-emerald-100">
          <p className="text-xs text-emerald-600 mb-0.5">Pagado</p>
          <p className="font-display text-base font-bold text-emerald-700">{formatCOP(totalPaid)}</p>
        </div>
        <div className="card text-center py-3 bg-amber-50 border-amber-100">
          <p className="text-xs text-amber-600 mb-0.5">Pendiente</p>
          <p className="font-display text-base font-bold text-amber-700">{formatCOP(totalPending)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Sin citas completadas en este perÃ­odo</div>
      ) : (
        <div className="space-y-3">
          {rows.filter(r => r.appts > 0 || r.commissionPct > 0).map(r => (
            <div key={r.userId} className="card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#083D42] flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {r.avatar ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.appts} cita{r.appts !== 1 ? 's' : ''} Â· {r.commissionPct}% Â· {formatCOP(r.revenue)} en servicios</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{formatCOP(r.earned)}</p>
                  {r.paid > 0 && <p className="text-xs text-emerald-600">pagado {formatCOP(r.paid)}</p>}
                </div>
              </div>

              {/* Paid / pending bar */}
              {r.earned > 0 && (
                <div className="space-y-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.round((r.paid / r.earned) * 100)}%` }} />
                    <div className="h-full bg-amber-300 transition-all" style={{ width: `${Math.round((r.pending / r.earned) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span className="text-emerald-600">Pagado: {formatCOP(r.paid)}</span>
                    <span className="text-amber-600">Pendiente: {formatCOP(r.pending)}</span>
                  </div>
                </div>
              )}

              {/* Monthly goal progress */}
              {r.monthlyGoal > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 font-medium">Meta mensual</span>
                    <span className={cn('font-bold', r.revenue >= r.monthlyGoal ? 'text-emerald-600' : 'text-gray-600')}>
                      {Math.round((r.revenue / r.monthlyGoal) * 100)}%
                      {r.revenue >= r.monthlyGoal ? ' âœ“ Meta alcanzada' : ` Â· faltan ${formatCOP(r.monthlyGoal - r.revenue)}`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', r.revenue >= r.monthlyGoal ? 'bg-emerald-400' : 'bg-primary')}
                      style={{ width: `${Math.min(100, Math.round((r.revenue / r.monthlyGoal) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{formatCOP(r.revenue)}</span>
                    <span>{formatCOP(r.monthlyGoal)}</span>
                  </div>
                </div>
              )}

              {r.pending > 0 && (
                <button onClick={() => setPayTarget(r)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors">
                  <DollarSign className="w-4 h-4" /> Registrar pago ({formatCOP(r.pending)} pendiente)
                </button>
              )}
              {r.pending === 0 && r.earned > 0 && (
                <p className="text-center text-xs text-emerald-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ComisiÃ³n pagada al 100%
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment history toggle */}
      <button onClick={() => setShowHistory(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <History className="w-4 h-4" />
        {showHistory ? 'Ocultar historial' : 'Ver historial de pagos'}
      </button>

      {showHistory && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Historial de pagos</h4>
          {payments.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">Sin pagos registrados</p>
          ) : (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{p.user.name} â€” {formatCOP(p.amount)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.paidAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {p.notes ? ` Â· ${p.notes}` : ''}
                    </p>
                  </div>
                  <button onClick={() => { if (confirm('Â¿Eliminar este pago?')) deletePayment.mutate(p.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {payTarget && (
        <PaymentModal
          member={payTarget}
          from={from} to={to}
          onClose={() => setPayTarget(null)}
          onSaved={() => setPayTarget(null)}
        />
      )}
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Staff() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'team' | 'commissions'>('team');
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; member: StaffMember } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const { data: members = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ['staff'],
    queryFn: () => staffApi.list().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: object) =>
      modal?.mode === 'edit'
        ? staffApi.update(modal.member.id, data)
        : staffApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast(modal?.mode === 'edit' ? 'Miembro actualizado' : 'Miembro agregado', 'success');
      setModal(null);
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al guardar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast('Miembro eliminado', 'success');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al eliminar', 'error'),
  });

  const admins       = members.filter(m => m.role === 'ADMIN');
  const professionals = members.filter(m => m.role === 'PROFESSIONAL');

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Equipo</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} miembro{members.length !== 1 ? 's' : ''} en tu negocio</p>
        </div>
        {tab === 'team' && (
          <button onClick={() => setModal({ mode: 'add' })} className="btn-primary shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-edge gap-0">
        <button onClick={() => setTab('team')}
          className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            tab === 'team' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-gray-700')}>
          <Users2 className="w-4 h-4" /> Equipo
        </button>
        <button onClick={() => setTab('commissions')}
          className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            tab === 'commissions' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-gray-700')}>
          <BarChart2 className="w-4 h-4" /> Comisiones
        </button>
      </div>

      {tab === 'commissions' && <CommissionsTab />}

      {tab === 'team' && (isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {[
            { label: 'Administradores', list: admins },
            { label: 'Profesionales', list: professionals },
          ].map(({ label, list }) =>
            list.length === 0 ? null : (
              <div key={label}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{label}</p>
                <div className="space-y-3">
                  {list.map(m => {
                    const isMe = m.id === me?.id;
                    return (
                      <div key={m.id} className="card flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-[#083D42] flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {getInitials(m.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                            {isMe && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">TÃº</span>}
                            <RoleBadge role={m.role} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{m.email}</p>
                          {m.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{m.phone}</p>}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <CalendarDays className="w-3 h-3 text-gray-400 shrink-0" />
                            {[0,1,2,3,4,5,6].map(d => (
                              <span key={d} className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold',
                                (m.workDays ?? DEFAULT_WORK_DAYS).includes(d)
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-gray-100 text-gray-300')}>
                                {DAY_LABELS[d]}
                              </span>
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">Â· {m._count.appointments} citas</span>
                            {(m.commissionPct ?? 0) > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ml-1">
                                {m.commissionPct}% comisiÃ³n
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setModal({ mode: 'edit', member: m })}
                            className="text-xs font-medium text-primary hover:underline px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors">
                            Editar
                          </button>
                          {!isMe && (
                            <button onClick={() => setDeleteTarget(m)}
                              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {members.length === 0 && (
            <div className="card text-center py-16">
              <Users2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">AÃºn no hay miembros en el equipo</p>
              <button onClick={() => setModal({ mode: 'add' })} className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Agregar primero
              </button>
            </div>
          )}
        </>
      ))}

      {/* Add/Edit modal */}
      {modal !== null && (
        <StaffModal
          member={modal.mode === 'edit' ? modal.member : null}
          onClose={() => setModal(null)}
          onSave={data => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-gray-900 mb-2">Â¿Eliminar miembro?</h3>
            <p className="text-sm text-gray-500 mb-5">
              EliminarÃ¡s a <strong>{deleteTarget.name}</strong> del equipo. Esta acciÃ³n no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

