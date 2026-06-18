import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, CreditCard, Smartphone, Banknote, ArrowUpRight, Plus, Loader2, Calendar, TrendingUp, Download, Printer, Minus, ShoppingBag, Trash2, Gift, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cashApi, appointmentsApi, expensesApi, clientsApi } from '../lib/api';
import { Appointment, PaymentMethod } from '../types';
import { formatCOP, PAYMENT_LABELS, cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

function printCashClose(data: any, date: string, bizName?: string) {
  const d = new Date(date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const payments: any[] = data?.payments ?? [];
  const byMethod: any[] = data?.byMethod ?? [];

  const methodRows = byMethod.map((m: any) =>
    `<tr><td>${PAYMENT_LABELS[m.method as PaymentMethod] ?? m.method}</td><td style="text-align:right">${m._count} cobro${m._count !== 1 ? 's' : ''}</td><td style="text-align:right;font-weight:600">$${(m._sum?.amount ?? 0).toLocaleString('es-CO')}</td></tr>`
  ).join('');

  const txRows = payments.map((p: any) =>
    `<tr>
      <td>${p.appointment?.client?.name ?? '—'}</td>
      <td style="color:#666;font-size:11px">${p.appointment?.services?.map((s: any) => s.service?.name).join(', ') || '—'}</td>
      <td style="text-align:right">${PAYMENT_LABELS[p.method as PaymentMethod] ?? p.method}</td>
      <td style="text-align:right;font-weight:600">$${p.amount.toLocaleString('es-CO')}</td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cierre del día – ${date}</title>
  <style>
    body{font-family:sans-serif;color:#1a1a1a;max-width:720px;margin:0 auto;padding:24px;font-size:13px}
    h1{font-size:20px;font-weight:800;margin:0 0 2px}
    .sub{color:#666;font-size:12px;margin:0 0 20px}
    .section{margin-bottom:20px}
    .section h2{font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;font-size:11px;color:#888;text-transform:uppercase;padding:5px 8px;border-bottom:2px solid #e5e7eb}
    td{padding:7px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
    tr:last-child td{border-bottom:none}
    .total-row{font-size:15px;font-weight:800;border-top:2px solid #1a1a1a !important;background:#f9fafb}
    .footer{margin-top:24px;font-size:10px;color:#aaa;text-align:right}
    @media print{body{padding:8px}}
  </style></head><body>
  <h1>${bizName ?? 'BeautyOS'}</h1>
  <p class="sub">Cierre del día · ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</p>
  ${byMethod.length > 0 ? `
  <div class="section">
    <h2>Resumen por método de pago</h2>
    <table>
      <thead><tr><th>Método</th><th style="text-align:right">Transacciones</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>
        ${methodRows}
        <tr class="total-row"><td colspan="2" style="font-weight:800">TOTAL</td><td style="text-align:right;font-weight:800">$${(data?.total ?? 0).toLocaleString('es-CO')}</td></tr>
      </tbody>
    </table>
  </div>` : '<p style="color:#aaa;text-align:center;padding:24px 0">Sin cobros registrados para este día</p>'}
  ${payments.length > 0 ? `
  <div class="section">
    <h2>Detalle de transacciones</h2>
    <table>
      <thead><tr><th>Cliente</th><th>Servicios</th><th style="text-align:right">Método</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${txRows}</tbody>
    </table>
  </div>` : ''}
  <p class="footer">Impreso desde BeautyOS · ${new Date().toLocaleString('es-CO')}</p>
  </body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  CASH: Banknote, CARD: CreditCard, NEQUI: Smartphone, DAVIPLATA: Smartphone, TRANSFER: ArrowUpRight, GIFT_CARD: Gift,
};
const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: 'bg-emerald-100 text-emerald-700',
  CARD: 'bg-blue-100 text-blue-700',
  NEQUI: 'bg-violet-100 text-violet-700',
  DAVIPLATA: 'bg-rose-100 text-rose-700',
  TRANSFER: 'bg-amber-100 text-amber-700',
  GIFT_CARD: 'bg-pink-100 text-pink-700',
};

const EXPENSE_CATEGORIES = [
  { value: 'SUPPLIES',   label: 'Insumos / Productos' },
  { value: 'RENT',       label: 'Arriendo' },
  { value: 'UTILITIES',  label: 'Servicios públicos' },
  { value: 'SALARY',     label: 'Nómina / Comisiones' },
  { value: 'EQUIPMENT',  label: 'Equipos / Herramientas' },
  { value: 'MARKETING',  label: 'Publicidad' },
  { value: 'OTHER',      label: 'Otros' },
];

function AddExpenseForm({ date, onClose }: { date: string; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('SUPPLIES');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: (d: object) => expensesApi.create(d as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-expenses', date] });
      toast('Gasto registrado', 'success');
      onClose();
    },
    onError: () => toast('Error al registrar gasto', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    createMutation.mutate({ amount: Number(amount), category, description, date });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Monto del gasto *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
          <input className="input pl-6" type="number" min="0" step="1000" value={amount} onChange={e => setAmount(e.target.value)} placeholder="25000" required />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Categoría *</label>
        <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
          {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Descripción *</label>
        <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Gel UV marca X, 3 frascos" required />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar gasto'}
        </button>
      </div>
    </form>
  );
}

function RegisterPaymentForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const loyaltyPointValue = (user?.business as any)?.loyaltyPointValue ?? 100;
  const loyaltyCopPerPoint = (user?.business as any)?.loyaltyCopPerPoint ?? 1000;
  const [appointmentId, setAppointmentId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [tipStr, setTipStr] = useState('');
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [pointsStr, setPointsStr] = useState('');

  const { data: pendingAppts = [] } = useQuery<Appointment[]>({
    queryKey: ['appointments-pending'],
    queryFn: () => appointmentsApi.list({ status: 'SCHEDULED,CONFIRMED,IN_PROGRESS' }).then(r => r.data),
  });

  const selectedAppt = pendingAppts.filter(a => !a.payment).find(a => a.id === appointmentId);

  const { data: clientData } = useQuery({
    queryKey: ['client', selectedAppt?.client.id],
    queryFn: () => clientsApi.get(selectedAppt!.client.id).then(r => r.data),
    enabled: !!selectedAppt,
  });

  const baseAmount = customAmount ? Math.max(0, Number(customAmount) || 0) : (selectedAppt?.totalPrice ?? 0);
  const tipAmount  = Math.max(0, Number(tipStr) || 0);
  const clientPoints = clientData?.points ?? 0;
  const pointsToRedeem = Math.min(Math.max(0, Number(pointsStr) || 0), clientPoints);
  const pointsDiscount = redeemOpen ? pointsToRedeem * loyaltyPointValue : 0;
  const finalAmount = Math.max(0, baseAmount - pointsDiscount);
  const pointsWillEarn = Math.floor(finalAmount / loyaltyCopPerPoint);

  const registerMutation = useMutation({
    mutationFn: (d: Parameters<typeof cashApi.register>[0]) => cashApi.register(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cash-summary'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['client', selectedAppt?.client.id] });
      const earned: number = (res.data as any)?.pointsEarned ?? 0;
      const redeemed: number = (res.data as any)?.pointsRedeemed ?? 0;
      let msg = 'Pago registrado exitosamente';
      if (earned > 0 || redeemed > 0) msg += ` · ${earned > 0 ? `+${earned} puntos ganados` : ''}${redeemed > 0 ? ` · ${redeemed} puntos canjeados` : ''}`;
      toast(msg.trim(), 'success');
      onClose();
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al registrar pago', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId || finalAmount < 0) return;
    registerMutation.mutate({
      appointmentId,
      amount: finalAmount,
      method,
      notes: notes || undefined,
      tipAmount: tipAmount || undefined,
      pointsRedeemed: (redeemOpen && pointsToRedeem > 0) ? pointsToRedeem : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Appointment selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Cita a cobrar *</label>
        <select className="input" value={appointmentId}
          onChange={e => { setAppointmentId(e.target.value); setCustomAmount(''); setPointsStr(''); setRedeemOpen(false); }} required>
          <option value="">Seleccionar cita pendiente</option>
          {pendingAppts.map(a => (
            <option key={a.id} value={a.id}>{a.client.name} — {a.startTime} — {formatCOP(a.totalPrice)}</option>
          ))}
        </select>
        {pendingAppts.length === 0 && <p className="text-xs text-amber-600 mt-1">No hay citas pendientes de cobro</p>}
      </div>

      {selectedAppt && (
        <>
          <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 space-y-1">
            <p className="text-xs text-gray-500">{selectedAppt.services.map(s => s.service.name).join(', ') || 'Sin servicios'}</p>
            {clientPoints > 0 && (
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <Star className="w-3 h-3" /> {clientPoints.toLocaleString('es-CO')} puntos disponibles
              </p>
            )}
          </div>

          {/* Base amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Monto del servicio <span className="text-xs text-gray-400 font-normal">(base: {formatCOP(selectedAppt.totalPrice)})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
              <input className="input pl-6" type="number" min="0" step="1000"
                placeholder={String(selectedAppt.totalPrice)} value={customAmount}
                onChange={e => setCustomAmount(e.target.value)} />
            </div>
          </div>

          {/* Tip */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Propina <span className="text-xs text-gray-400 font-normal">(opcional, no afecta el cobro)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
              <input className="input pl-6" type="number" min="0" step="1000"
                placeholder="0" value={tipStr} onChange={e => setTipStr(e.target.value)} />
            </div>
          </div>

          {/* Points redemption */}
          {clientPoints > 0 && (
            <div>
              <button type="button"
                onClick={() => { setRedeemOpen(o => !o); setPointsStr(''); }}
                className="flex items-center gap-2 text-sm font-medium text-primary">
                <Star className="w-4 h-4" />
                {redeemOpen ? 'Cancelar canje de puntos' : 'Canjear puntos de fidelidad'}
                {redeemOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {redeemOpen && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700 block mb-1">Puntos a canjear (máx. {clientPoints})</label>
                      <input className="input text-sm" type="number" min="0" max={clientPoints} step="1"
                        placeholder="0" value={pointsStr} onChange={e => setPointsStr(e.target.value)} />
                    </div>
                    <div className="text-right mt-5">
                      <p className="text-xs text-gray-500">Descuento</p>
                      <p className="font-bold text-amber-700">{formatCOP(pointsDiscount)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600">1 punto = {formatCOP(loyaltyPointValue)} de descuento</p>
                </div>
              )}
            </div>
          )}

          {/* Amount summary */}
          {(redeemOpen && pointsDiscount > 0) || tipAmount > 0 ? (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal servicio</span>
                <span className="font-medium">{formatCOP(baseAmount)}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600">Descuento puntos ({pointsToRedeem} pts)</span>
                  <span className="font-medium text-amber-600">−{formatCOP(pointsDiscount)}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Propina</span>
                  <span className="font-medium text-emerald-600">+{formatCOP(tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-1.5 mt-1">
                <span>Total a cobrar</span>
                <span className="text-primary">{formatCOP(finalAmount)}</span>
              </div>
              <p className="text-[11px] text-gray-400">Ganará +{pointsWillEarn} punto{pointsWillEarn !== 1 ? 's' : ''} con este pago</p>
            </div>
          ) : null}
        </>
      )}

      {/* Payment method */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Método de pago *</label>
        <div className="grid grid-cols-3 gap-2">
          {(['CASH', 'CARD', 'NEQUI', 'DAVIPLATA', 'TRANSFER', 'GIFT_CARD'] as PaymentMethod[]).map(m => {
            const Icon = METHOD_ICONS[m];
            return (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={cn('p-3 rounded-xl border text-sm font-medium flex flex-col items-center gap-1.5 transition-all',
                  method === m ? 'border-primary bg-primary-50 text-primary ring-2 ring-primary/20' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                <Icon className="w-5 h-5" />
                {PAYMENT_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observación del pago..." />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" disabled={registerMutation.isPending || !appointmentId} className="btn-primary flex-1 justify-center">
          {registerMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
            : `Cobrar ${selectedAppt ? formatCOP(finalAmount) : ''}`}
        </button>
      </div>
    </form>
  );
}

function exportCSV(payments: any[], date: string) {
  const header = ['Fecha', 'Cliente', 'Servicios', 'Método', 'Monto'];
  const rows = payments.map(p => [
    date,
    p.appointment?.client?.name ?? '—',
    p.appointment?.services?.map((s: any) => s.service?.name).join(' / ') ?? '—',
    PAYMENT_LABELS[p.method as PaymentMethod] ?? p.method,
    String(p.amount),
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `caja_${date}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export function Cash() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showRegister, setShowRegister] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cash-summary', selectedDate],
    queryFn: () => cashApi.summary(selectedDate).then(r => r.data),
  });

  const { data: monthly } = useQuery({
    queryKey: ['cash-monthly'],
    queryFn: () => cashApi.monthly().then(r => r.data),
  });

  const { data: expenses = [] } = useQuery<{ id: string; amount: number; category: string; description: string; date: string }[]>({
    queryKey: ['daily-expenses', selectedDate],
    queryFn: () => expensesApi.list({ date: selectedDate }).then(r => r.data),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['daily-expenses', selectedDate] }); toast('Gasto eliminado', 'success'); },
  });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const dayRevenue = data?.total ?? 0;
  const totalTips = data?.totalTips ?? 0;
  const profit = dayRevenue - totalExpenses;

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input w-auto" />
        </div>
        <div className="flex gap-2">
          {data?.payments?.length > 0 && (
            <>
              <button onClick={() => exportCSV(data.payments, selectedDate)}
                className="btn-ghost flex items-center gap-1.5">
                <Download className="w-4 h-4" /> CSV
              </button>
              <button onClick={() => printCashClose(data, selectedDate, user?.business?.name)}
                className="btn-ghost flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Cierre
              </button>
            </>
          )}
          <button onClick={() => setShowAddExpense(true)} className="btn-ghost"><Minus className="w-4 h-4" /> Gasto</button>
          <button onClick={() => setShowRegister(true)} className="btn-primary"><Plus className="w-4 h-4" /> Registrar cobro</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Ingresos del día</p>
          <p className="font-display text-2xl font-bold text-primary">{formatCOP(dayRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{data?.count ?? 0} cobros</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Gastos del día</p>
          <p className="font-display text-2xl font-bold text-red-500">{formatCOP(totalExpenses)}</p>
          <p className="text-xs text-gray-400 mt-1">{expenses.length} registro{expenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={cn('card text-center', profit >= 0 ? '' : 'border-red-100')}>
          <p className="text-xs text-gray-400 mb-1">Ganancia neta</p>
          <p className={cn('font-display text-2xl font-bold', profit >= 0 ? 'text-emerald-600' : 'text-red-500')}>{formatCOP(profit)}</p>
          <p className="text-xs text-gray-400 mt-1">ingresos − gastos</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Mes actual</p>
          <p className="font-display text-2xl font-bold text-emerald-600">{formatCOP(monthly?.total ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" />{monthly?.count ?? 0} transacciones</p>
        </div>
        {totalTips > 0 && (
          <div className="card text-center border-emerald-100">
            <p className="text-xs text-gray-400 mb-1">Propinas del día</p>
            <p className="font-display text-2xl font-bold text-emerald-500">{formatCOP(totalTips)}</p>
            <p className="text-xs text-gray-400 mt-1">no incluidas en ingresos</p>
          </div>
        )}
        <div className={cn('card col-span-2', totalTips > 0 ? 'lg:col-span-1' : 'lg:col-span-1')}>
          <p className="text-xs text-gray-400 mb-3">Por método</p>
          <div className="space-y-2">
            {data?.byMethod?.map((m: { method: PaymentMethod; _sum: { amount: number }; _count: number }) => {
              const Icon = METHOD_ICONS[m.method];
              return (
                <div key={m.method} className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', METHOD_COLORS[m.method])}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-gray-600 flex-1">{PAYMENT_LABELS[m.method]}</span>
                  <span className="text-sm font-semibold">{formatCOP(m._sum.amount ?? 0)}</span>
                </div>
              );
            })}
            {(!data?.byMethod?.length) && <p className="text-xs text-gray-400 text-center py-2">Sin cobros para esta fecha</p>}
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="card">
        <h3 className="font-display font-semibold text-gray-900 mb-4">Transacciones del día</h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : data?.payments?.length === 0 ? (
          <div className="text-center py-10">
            <DollarSign className="w-10 h-10 mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">Sin cobros registrados para este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.payments?.map((p: any) => {
              const Icon = METHOD_ICONS[p.method as PaymentMethod];
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', METHOD_COLORS[p.method as PaymentMethod])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.appointment?.client?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400 truncate">{p.appointment?.services?.map((s: any) => s.service?.name).join(', ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCOP(p.amount)}
                      {(p.tipAmount ?? 0) > 0 && (
                        <span className="ml-1.5 text-xs font-medium text-emerald-500">+{formatCOP(p.tipAmount)}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{PAYMENT_LABELS[p.method as PaymentMethod]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expenses list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-red-400" />
            <h3 className="font-display font-semibold text-gray-900">Gastos del día</h3>
          </div>
          <button onClick={() => setShowAddExpense(true)} className="btn-ghost text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-8 h-8 mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">Sin gastos para este día</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map(e => {
              const catLabel = EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label ?? e.category;
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <Minus className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                    <p className="text-xs text-gray-400">{catLabel}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold text-red-500">−{formatCOP(e.amount)}</p>
                    <button onClick={() => deleteExpenseMutation.mutate(e.id)}
                      disabled={deleteExpenseMutation.isPending}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Total gastos</span>
              <span className="font-bold text-red-500">{formatCOP(totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>

      <Modal open={showRegister} onClose={() => setShowRegister(false)} title="Registrar cobro" size="lg">
        <RegisterPaymentForm onClose={() => setShowRegister(false)} />
      </Modal>
      <Modal open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Registrar gasto" size="md">
        <AddExpenseForm date={selectedDate} onClose={() => setShowAddExpense(false)} />
      </Modal>
    </div>
  );
}
