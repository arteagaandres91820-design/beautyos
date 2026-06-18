import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Edit2, X, Loader2, DollarSign, TrendingDown,
  ChevronLeft, ChevronRight, Check, Receipt, AlertTriangle,
} from 'lucide-react';
import { expensesApi } from '../lib/api';
import { formatCOP, cn } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'SUPPLIES',   label: 'Insumos',            color: 'bg-orange-100 text-orange-700', dot: '#f97316' },
  { value: 'RENT',       label: 'Arriendo',            color: 'bg-violet-100 text-violet-700', dot: '#8b5cf6' },
  { value: 'UTILITIES',  label: 'Servicios públicos',  color: 'bg-blue-100 text-blue-700',     dot: '#3b82f6' },
  { value: 'SALARY',     label: 'Nómina',              color: 'bg-red-100 text-red-700',       dot: '#ef4444' },
  { value: 'EQUIPMENT',  label: 'Equipos',             color: 'bg-gray-100 text-gray-700',     dot: '#6b7280' },
  { value: 'MARKETING',  label: 'Marketing',           color: 'bg-pink-100 text-pink-700',     dot: '#ec4899' },
  { value: 'OTHER',      label: 'Otro',                color: 'bg-slate-100 text-slate-600',   dot: '#94a3b8' },
];

const getCat = (value: string) => CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];

// ─── Expense Form ──────────────────────────────────────────────────────────
function ExpenseForm({
  expense,
  onClose,
  onSave,
  saving,
}: {
  expense?: Expense;
  onClose: () => void;
  onSave: (data: { amount: number; category: string; description: string; date: string }) => void;
  saving: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount]       = useState(expense ? String(expense.amount) : '');
  const [category, setCategory]   = useState(expense?.category ?? 'SUPPLIES');
  const [description, setDesc]    = useState(expense?.description ?? '');
  const [date, setDate]           = useState(expense?.date.slice(0, 10) ?? today);

  const canSubmit = amount && Number(amount) > 0 && description.trim();

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (canSubmit) onSave({ amount: Number(amount), category, description: description.trim(), date }); }}
      className="p-6 space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Descripción *</label>
          <input className="input" value={description} onChange={e => setDesc(e.target.value)}
            placeholder="Ej: Pinturas acrílicas, Arriendo marzo…" required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Monto (COP) *</label>
          <input className="input" type="number" min={1} step={100} value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="150000" required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Fecha</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-2">Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                  category === c.value ? c.color + ' border-current' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.dot }} />
                {c.label}
                {category === c.value && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" disabled={!canSubmit || saving}
          className="btn-primary flex-1 justify-center">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : expense ? 'Guardar cambios' : 'Registrar gasto'}
        </button>
      </div>
    </form>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function Expenses() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]  = useState<Expense | null>(null);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', month, year],
    queryFn: () => expensesApi.list({ month, year }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof expensesApi.create>[0]) => expensesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast('Gasto registrado', 'success');
      setShowForm(false);
    },
    onError: () => toast('Error al registrar gasto', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => expensesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast('Gasto actualizado', 'success');
      setEditing(null);
    },
    onError: () => toast('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast('Gasto eliminado', 'success');
    },
    onError: () => toast('Error al eliminar', 'error'),
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const budgets = useMemo<Record<string, number>>(() => {
    try { return JSON.parse(user?.business?.expenseBudgets ?? '{}') ?? {}; }
    catch { return {}; }
  }, [user?.business?.expenseBudgets]);

  const budgetedCategories = useMemo(
    () => CATEGORIES.filter(c => (budgets[c.value] ?? 0) > 0),
    [budgets],
  );

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Group expenses by day
  const byDay = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    expenses.forEach(e => {
      const day = e.date.slice(0, 10);
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro mensual de egresos del negocio</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo gasto
        </button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface border border-edge transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted" />
        </button>
        <p className="flex-1 text-center font-semibold text-gray-800 capitalize">{monthLabel}</p>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface border border-edge transition-colors">
          <ChevronRight className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* Summary cards */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total del mes</p>
              <p className="font-display text-xl font-bold text-gray-900">{formatCOP(total)}</p>
              <p className="text-xs text-gray-400">{expenses.length} registro{expenses.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="card">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Por categoría</p>
            <div className="space-y-1.5">
              {byCategory.slice(0, 4).map(([cat, amt]) => {
                const c = getCat(cat);
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.dot }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{c.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{formatCOP(amt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Budget progress bars */}
      {budgetedCategories.length > 0 && (
        <div className="card space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Presupuesto mensual</p>
          {budgetedCategories.map(cat => {
            const actual = byCategory.find(([k]) => k === cat.value)?.[1] ?? 0;
            const budget = budgets[cat.value];
            const pct = Math.min((actual / budget) * 100, 100);
            const over = actual > budget;
            return (
              <div key={cat.value}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.dot }} />
                    <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                    {over && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <div className="text-xs text-right">
                    <span className={cn('font-semibold', over ? 'text-red-600' : 'text-gray-800')}>
                      {formatCOP(actual)}
                    </span>
                    <span className="text-gray-400"> / {formatCOP(budget)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', over ? 'bg-red-500' : 'bg-primary')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && (
                  <p className="text-[11px] text-red-500 mt-0.5">
                    Excedido en {formatCOP(actual - budget)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stacked category bar */}
      {total > 0 && (
        <div className="h-2.5 rounded-full overflow-hidden flex gap-px">
          {byCategory.map(([cat, amt]) => (
            <div key={cat} title={`${getCat(cat).label}: ${formatCOP(amt)}`}
              style={{ width: `${(amt / total) * 100}%`, backgroundColor: getCat(cat).dot }} />
          ))}
        </div>
      )}

      {/* Expense list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : expenses.length === 0 ? (
        <div className="card text-center py-16">
          <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sin gastos en {monthLabel}</p>
          <p className="text-sm text-gray-400 mt-1">Registra los egresos del negocio para llevar el control de rentabilidad</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar primer gasto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {byDay.map(([day, items]) => {
            const dayTotal = items.reduce((s, e) => s + e.amount, 0);
            const d = new Date(day + 'T12:00:00');
            const dayLabel = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider capitalize">{dayLabel}</p>
                  <p className="text-xs font-semibold text-gray-500">{formatCOP(dayTotal)}</p>
                </div>
                <div className="space-y-2">
                  {items.map(e => {
                    const cat = getCat(e.category);
                    return (
                      <div key={e.id} className="card flex items-center gap-3 py-3 px-4">
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', cat.color)}>
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', cat.color)}>
                            {cat.label}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm shrink-0">{formatCOP(e.amount)}</p>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setEditing(e)}
                            className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-gray-700 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('¿Eliminar este gasto?')) deleteMutation.mutate(e.id); }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Registrar gasto">
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onSave={data => createMutation.mutate(data)}
          saving={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar gasto">
        {editing && (
          <ExpenseForm
            expense={editing}
            onClose={() => setEditing(null)}
            onSave={data => updateMutation.mutate({ id: editing.id, data })}
            saving={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
