import { useState, FormEvent, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Phone, MapPin, Link2, Copy, Check, User as UserIcon, Loader2, Lock, Eye, EyeOff, Camera, Clock, QrCode, Code2, Download, MessageSquare, Plus, Trash2, Pencil, Tag, ToggleLeft, ToggleRight, Receipt, TrendingDown, Star } from 'lucide-react';
import QRCode from 'qrcode';
import type { MessageTemplate, PromoCode } from '../types';
import { authApi, promoCodesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { useToast } from '../components/ui/Toast';
import { cn, formatCOP } from '../lib/utils';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4">
      <h2 className="font-display font-semibold text-gray-900 text-base">{title}</h2>
      {children}
    </div>
  );
}

export function Settings() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [userName, setUserName] = useState(user?.name ?? '');
  const [bizName, setBizName] = useState(user?.business?.name ?? '');
  const [bizSlug, setBizSlug] = useState(user?.business?.slug ?? '');
  const [bizCity, setBizCity] = useState(user?.business?.city ?? '');
  const [bizWa, setBizWa] = useState(user?.business?.whatsapp ?? '');
  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState(String((user?.business as any)?.monthlyRevenueGoal ?? 0));
  const [loyaltyCopPerPoint, setLoyaltyCopPerPoint] = useState(String((user?.business as any)?.loyaltyCopPerPoint ?? 1000));
  const [loyaltyPointValue, setLoyaltyPointValue] = useState(String((user?.business as any)?.loyaltyPointValue ?? 100));

  const EXPENSE_CATEGORIES = ['SUPPLIES', 'RENT', 'UTILITIES', 'SALARY', 'EQUIPMENT', 'MARKETING', 'OTHER'] as const;
  const EXPENSE_LABELS: Record<string, string> = { SUPPLIES: 'Insumos', RENT: 'Arriendo', UTILITIES: 'Servicios públicos', SALARY: 'Nómina', EQUIPMENT: 'Equipos', MARKETING: 'Marketing', OTHER: 'Otros' };

  const [expenseBudgets, setExpenseBudgets] = useState<Record<string, string>>(() => {
    try {
      const raw = JSON.parse((user?.business as any)?.expenseBudgets ?? '{}');
      return Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c, raw[c] ? String(raw[c]) : '']));
    } catch { return Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c, ''])); }
  });

  const budgetMutation = useMutation({
    mutationFn: () => {
      const obj: Record<string, number> = {};
      Object.entries(expenseBudgets).forEach(([k, v]) => { if (v && Number(v) > 0) obj[k] = Number(v); });
      return authApi.updateBusiness({ expenseBudgets: JSON.stringify(obj) });
    },
    onSuccess: (res) => {
      if (user) setUser({ ...user, business: { ...user.business, expenseBudgets: res.data.expenseBudgets } });
      toast('Presupuestos guardados', 'success');
    },
    onError: () => toast('Error al guardar presupuestos', 'error'),
  });

  const loyaltyMutation = useMutation({
    mutationFn: () => authApi.updateBusiness({
      loyaltyCopPerPoint: Math.max(1, Number(loyaltyCopPerPoint) || 1000),
      loyaltyPointValue: Math.max(1, Number(loyaltyPointValue) || 100),
    }),
    onSuccess: (res) => {
      if (user) setUser({ ...user, business: { ...user.business, loyaltyCopPerPoint: res.data.loyaltyCopPerPoint, loyaltyPointValue: res.data.loyaltyPointValue } });
      toast('Programa de puntos actualizado', 'success');
    },
    onError: () => toast('Error al guardar configuración', 'error'),
  });
  const [openTime, setOpenTime] = useState((user?.business as any)?.openTime ?? '09:00');
  const [closeTime, setCloseTime] = useState((user?.business as any)?.closeTime ?? '18:00');
  const [slotDuration, setSlotDuration] = useState(String((user?.business as any)?.slotDuration ?? 30));
  const [closedDays, setClosedDays] = useState<number[]>(() => {
    try { return JSON.parse((user?.business as any)?.closedDays ?? '[0]'); } catch { return [0]; }
  });

  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    try { return JSON.parse((user?.business as any)?.messageTemplates ?? '[]'); } catch { return []; }
  });
  const [editingTpl, setEditingTpl] = useState<MessageTemplate | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplBody, setTplBody] = useState('');
  const [showTplForm, setShowTplForm] = useState(false);

  type DaySched = { open: string; close: string; closed: boolean };
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DaySched>>(() => {
    try {
      const raw = (user?.business as any)?.weeklySchedule ?? '';
      if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    const fallbackOpen = (user?.business as any)?.openTime ?? '09:00';
    const fallbackClose = (user?.business as any)?.closeTime ?? '18:00';
    let closedArr: number[] = [0];
    try { closedArr = JSON.parse((user?.business as any)?.closedDays ?? '[0]'); } catch { /**/ }
    return Object.fromEntries([0,1,2,3,4,5,6].map(i => [i, { open: fallbackOpen, close: fallbackClose, closed: closedArr.includes(i) }]));
  });
  const updateDay = (i: number, patch: Partial<DaySched>) =>
    setWeeklySchedule(prev => ({ ...prev, [i]: { ...prev[i], ...patch } }));
  const [copiedBooking, setCopiedBooking] = useState(false);
  const [copiedKiosk, setCopiedKiosk] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const slug = user?.business?.slug;
  const clientPortalUrl = slug
    ? `${window.location.origin}/cliente?biz=${slug}`
    : `${window.location.origin}/cliente`;
  const bookingUrl = slug
    ? `${window.location.origin}/cliente/agendar?biz=${slug}`
    : `${window.location.origin}/cliente/agendar`;
  const kioskUrl = slug
    ? `${window.location.origin}/try-on?biz=${slug}`
    : `${window.location.origin}/try-on`;

  const meMutation = useMutation({
    mutationFn: () => authApi.updateMe({ name: userName.trim() }),
    onSuccess: (res) => {
      setUser(res.data as User);
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast('Nombre actualizado', 'success');
    },
    onError: () => toast('Error al actualizar', 'error'),
  });

  const bizMutation = useMutation({
    mutationFn: () => {
      const derivedClosedDays = Object.entries(weeklySchedule).filter(([, v]) => v.closed).map(([k]) => Number(k));
      return authApi.updateBusiness({ name: bizName.trim(), slug: bizSlug.trim(), city: bizCity.trim(), whatsapp: bizWa.trim(), openTime, closeTime, slotDuration: Number(slotDuration), closedDays: JSON.stringify(derivedClosedDays), weeklySchedule: JSON.stringify(weeklySchedule), monthlyRevenueGoal: Math.max(0, Number(monthlyRevenueGoal) || 0) });
    },
    onSuccess: (res) => {
      if (user) setUser({ ...user, business: { ...user.business, ...res.data } });
      if (res.data.slug) localStorage.setItem('beautyos_biz_slug', res.data.slug);
      toast('Negocio actualizado', 'success');
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al actualizar', 'error'),
  });

  const tplMutation = useMutation({
    mutationFn: (tpls: MessageTemplate[]) => authApi.updateBusiness({ messageTemplates: JSON.stringify(tpls) }),
    onSuccess: (_, tpls) => {
      if (user) setUser({ ...user, business: { ...user.business, messageTemplates: JSON.stringify(tpls) } });
      toast('Plantillas guardadas', 'success');
    },
    onError: () => toast('Error al guardar plantillas', 'error'),
  });

  const saveTpl = () => {
    if (!tplName.trim() || !tplBody.trim()) return;
    let updated: MessageTemplate[];
    if (editingTpl) {
      updated = templates.map(t => t.id === editingTpl.id ? { ...t, name: tplName.trim(), body: tplBody.trim() } : t);
    } else {
      updated = [...templates, { id: crypto.randomUUID(), name: tplName.trim(), body: tplBody.trim() }];
    }
    setTemplates(updated);
    tplMutation.mutate(updated);
    setShowTplForm(false);
    setEditingTpl(null);
    setTplName(''); setTplBody('');
  };

  const deleteTpl = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    tplMutation.mutate(updated);
  };

  const startEditTpl = (t: MessageTemplate) => {
    setEditingTpl(t);
    setTplName(t.name);
    setTplBody(t.body);
    setShowTplForm(true);
  };

  const avatarMutation = useMutation({
    mutationFn: (formData: FormData) => authApi.uploadAvatar(formData),
    onSuccess: (res) => {
      setUser(res.data as User);
      toast('Foto de perfil actualizada', 'success');
    },
    onError: () => toast('Error al subir la foto', 'error'),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    avatarMutation.mutate(fd);
  };

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      toast('Contraseña actualizada', 'success');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al cambiar contraseña', 'error'),
  });

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast('Las contraseñas no coinciden', 'error'); return; }
    if (newPw.length < 6) { toast('La nueva contraseña debe tener al menos 6 caracteres', 'error'); return; }
    passwordMutation.mutate();
  };

  const embedCode = `<iframe src="${bookingUrl}&embed=1" width="100%" height="700" frameborder="0" style="border-radius:16px;border:1px solid #e5e7eb;" title="Reservas ${user?.business?.name ?? 'BeautyOS'}"></iframe>`;

  useEffect(() => {
    if (!bookingUrl) return;
    QRCode.toDataURL(bookingUrl, { width: 220, margin: 1, color: { dark: '#0D1B2A', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [bookingUrl]);

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-reservas-${slug ?? 'salon'}.png`;
    a.click();
  };

  const copy = (text: string, which: 'booking' | 'kiosk' | 'embed') => {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'booking') { setCopiedBooking(true); setTimeout(() => setCopiedBooking(false), 2000); }
      else if (which === 'kiosk') { setCopiedKiosk(true); setTimeout(() => setCopiedKiosk(false), 2000); }
      else { setCopiedEmbed(true); setTimeout(() => setCopiedEmbed(false), 2000); }
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configura tu perfil y la información de tu negocio</p>
      </div>

      {/* ── Admin profile ── */}
      <Section title="Mi perfil">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-1">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center border border-edge">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <UserIcon className="w-7 h-7 text-primary" />
              }
            </div>
            <button type="button" onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors">
              {avatarMutation.isPending
                ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                : <Camera className="w-3 h-3 text-white" />
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role === 'ADMIN' ? 'Administrador' : 'Profesional'}</p>
            <button type="button" onClick={() => avatarInputRef.current?.click()}
              className="text-xs text-primary hover:underline mt-0.5">
              Cambiar foto
            </button>
          </div>
        </div>
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); meMutation.mutate(); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" value={userName} onChange={e => setUserName(e.target.value)} required placeholder="Tu nombre" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Correo electrónico</label>
            <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.email ?? ''} disabled />
            <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar</p>
          </div>
          <button type="submit" disabled={meMutation.isPending || userName.trim() === user?.name} className="btn-primary">
            {meMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar nombre'}
          </button>
        </form>
      </Section>

      {/* ── Business info ── */}
      <Section title="Información del negocio">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); bizMutation.mutate(); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nombre del salón</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Ej: Nail Studio Valentina" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">URL del negocio</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 bg-white">
              <span className="pl-3 pr-1 text-sm text-gray-400 whitespace-nowrap select-none">beautyos.co/</span>
              <input
                className="flex-1 py-2 pr-3 text-sm text-gray-800 outline-none bg-transparent"
                value={bizSlug}
                onChange={e => setBizSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-'))}
                placeholder="mi-salon"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y guiones</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" value={bizCity} onChange={e => setBizCity(e.target.value)} placeholder="Ej: Medellín" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">WhatsApp del salón</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" value={bizWa} onChange={e => setBizWa(e.target.value)}
                placeholder="+57 300 123 4567" type="tel" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Se usa en el enlace de WhatsApp del portal de clientes</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Meta de ingresos mensual (COP)</label>
            <input
              type="number"
              min="0"
              step="100000"
              className="input"
              value={monthlyRevenueGoal}
              onChange={e => setMonthlyRevenueGoal(e.target.value)}
              placeholder="Ej: 5000000"
            />
            <p className="text-xs text-gray-400 mt-1">Se mostrará como barra de progreso en el Dashboard</p>
          </div>
          <button type="submit" disabled={bizMutation.isPending} className="btn-primary">
            {bizMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar negocio'}
          </button>
        </form>
      </Section>

      {/* ── Business hours ── */}
      <Section title="Horario de atención">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Apertura</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="time" className="input pl-9" value={openTime} onChange={e => setOpenTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Cierre</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="time" className="input pl-9" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Duración de turnos</label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map(min => (
                <button key={min} type="button"
                  onClick={() => setSlotDuration(String(min))}
                  className={cn('py-2 rounded-xl text-sm font-semibold border transition-all',
                    slotDuration === String(min)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-edge text-gray-600 hover:border-primary/40')}>
                  {min}min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Horario por día</label>
            <div className="space-y-1.5">
              {(['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'] as const).map((dayName, i) => {
                const day = weeklySchedule[i] ?? { open: openTime, close: closeTime, closed: false };
                return (
                  <div key={i} className={cn('flex items-center gap-2 p-2.5 rounded-xl border transition-all',
                    day.closed ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100')}>
                    <button type="button"
                      onClick={() => updateDay(i, { closed: !day.closed })}
                      className={cn('w-9 text-[11px] font-bold py-1.5 rounded-lg border transition-all shrink-0',
                        day.closed ? 'bg-red-100 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                      {dayName}
                    </button>
                    {day.closed ? (
                      <span className="text-xs text-red-400 flex-1 font-medium">Cerrado</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input type="time" className="input text-xs py-1.5 flex-1 min-w-0" value={day.open}
                          onChange={e => updateDay(i, { open: e.target.value })} />
                        <span className="text-gray-300 text-xs shrink-0">–</span>
                        <input type="time" className="input text-xs py-1.5 flex-1 min-w-0" value={day.close}
                          onChange={e => updateDay(i, { close: e.target.value })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Toca el nombre del día para abrirlo/cerrarlo</p>
          </div>

          <button type="button" onClick={() => bizMutation.mutate()} disabled={bizMutation.isPending} className="btn-primary">
            {bizMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar horario'}
          </button>
        </div>
      </Section>

      {/* ── Security ── */}
      <Section title="Seguridad">
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          {[
            { label: 'Contraseña actual', value: currentPw, onChange: setCurrentPw, autoComplete: 'current-password' },
            { label: 'Nueva contraseña', value: newPw, onChange: setNewPw, autoComplete: 'new-password' },
            { label: 'Confirmar nueva contraseña', value: confirmPw, onChange: setConfirmPw, autoComplete: 'new-password' },
          ].map(({ label, value, onChange, autoComplete }) => (
            <div key={label}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  value={value} onChange={e => onChange(e.target.value)}
                  autoComplete={autoComplete} required placeholder="••••••"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={passwordMutation.isPending || !currentPw || !newPw || !confirmPw} className="btn-primary">
            {passwordMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Cambiando...</> : 'Cambiar contraseña'}
          </button>
        </form>
      </Section>

      {/* ── Public links ── */}
      <Section title="Enlaces públicos">
        <p className="text-sm text-gray-500">Comparte estos enlaces con tus clientes o úsalos en tu bio de redes sociales.</p>

        {[
          { label: 'Portal del cliente', url: clientPortalUrl, desc: 'Inicio con diseños, reservas y perfil — comparte por WhatsApp / bio', copied: copiedBooking, which: 'booking' as const, highlight: true },
          { label: 'Link directo de reservas', url: bookingUrl, desc: 'Va directamente al flujo de agendar cita', copied: copiedKiosk, which: 'kiosk' as const, highlight: false },
          { label: 'Kiosco IA Try-On', url: kioskUrl, desc: 'Pantalla de prueba virtual para tu salón (tablet)', copied: copiedEmbed, which: 'embed' as const, highlight: false },
        ].map(({ label, url, desc, copied, which, highlight }) => (
          <div key={which} className={cn('p-4 rounded-2xl border space-y-2', highlight ? 'bg-primary/5 border-primary/20' : 'bg-surface border-edge')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  {label}
                  {highlight && <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">Principal</span>}
                </p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              {highlight && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`¡Hola! Agenda tu cita y explora nuestros diseños de uñas aquí 💅 ${url}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.103 1.523 5.824L0 24l6.385-1.513A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.007-1.372l-.359-.214-3.724.881.922-3.619-.234-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white border border-edge rounded-xl px-3 py-2 min-w-0">
                <Link2 className="w-3.5 h-3.5 text-muted shrink-0" />
                <span className="text-xs text-muted truncate">{url}</span>
              </div>
              <button onClick={() => copy(url, which)}
                className={cn('shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                  copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-edge text-gray-600 hover:border-primary/40')}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </button>
            </div>
          </div>
        ))}

        {/* QR Code */}
        {qrDataUrl && (
          <div className="p-4 bg-surface rounded-2xl border border-edge space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-primary" />
                Código QR — Portal de reservas
              </p>
              <p className="text-xs text-gray-400">Imprime o comparte para que clientes agenden desde su teléfono</p>
            </div>
            <div className="flex items-center gap-4">
              <img src={qrDataUrl} alt="QR reservas" className="w-24 h-24 rounded-xl border border-edge" />
              <div className="flex flex-col gap-2">
                <button onClick={downloadQr}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border bg-white border-edge text-gray-600 hover:border-primary/40 transition-all">
                  <Download className="w-3.5 h-3.5" />
                  Descargar PNG
                </button>
                <p className="text-xs text-gray-400 max-w-[160px]">220×220 px, fondo blanco</p>
              </div>
            </div>
          </div>
        )}

        {/* Embed iframe */}
        <div className="p-4 bg-surface rounded-2xl border border-edge space-y-2">
          <div>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-primary" />
              Incrustar en tu sitio web
            </p>
            <p className="text-xs text-gray-400">Pega este código HTML en tu página para mostrar el portal de reservas</p>
          </div>
          <div className="relative">
            <pre className="text-[11px] text-gray-600 bg-gray-50 border border-edge rounded-xl p-3 pr-20 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {embedCode}
            </pre>
            <button onClick={() => copy(embedCode, 'embed')}
              className={cn('absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                copiedEmbed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-edge text-gray-600 hover:border-primary/40')}>
              {copiedEmbed ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
          </div>
        </div>
      </Section>

      {/* ── Message templates ── */}
      <Section title="Plantillas de WhatsApp">
        <p className="text-sm text-gray-500">
          Crea mensajes reutilizables para recordatorios y confirmaciones. Usa{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-primary">{'{{nombre}}'}</code>,{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-primary">{'{{fecha}}'}</code>,{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-primary">{'{{hora}}'}</code> como variables.
        </p>

        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="p-3 bg-surface rounded-2xl border border-edge space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEditTpl(t)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteTpl(t.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 whitespace-pre-line pl-5">{t.body}</p>
            </div>
          ))}

          {templates.length === 0 && !showTplForm && (
            <p className="text-sm text-gray-400 text-center py-4">Ninguna plantilla todavía</p>
          )}
        </div>

        {showTplForm ? (
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
            <p className="text-sm font-semibold text-gray-800">{editingTpl ? 'Editar plantilla' : 'Nueva plantilla'}</p>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Nombre de la plantilla</label>
              <input className="input text-sm" placeholder="Ej: Recordatorio 24h" value={tplName} onChange={e => setTplName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Mensaje</label>
              <textarea
                className="input text-sm resize-none"
                rows={4}
                placeholder={'Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}. ¡Te esperamos! 💅'}
                value={tplBody}
                onChange={e => setTplBody(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveTpl} disabled={!tplName.trim() || !tplBody.trim() || tplMutation.isPending}
                className="btn-primary text-sm py-2">
                {tplMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
              </button>
              <button onClick={() => { setShowTplForm(false); setEditingTpl(null); setTplName(''); setTplBody(''); }}
                className="btn-ghost text-sm py-2">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowTplForm(true)}
            className="flex items-center gap-2 w-full justify-center py-2.5 rounded-2xl border border-dashed border-edge text-sm text-gray-500 hover:border-primary/40 hover:text-primary transition-all">
            <Plus className="w-4 h-4" />
            Nueva plantilla
          </button>
        )}
      </Section>

      {/* ── Expense budgets ── */}
      <Section title="Presupuesto mensual de gastos">
        <p className="text-xs text-gray-400 -mt-2">Define cuánto quieres gastar por categoría cada mes. Deja en blanco las categorías sin límite.</p>
        <div className="space-y-3">
          {EXPENSE_CATEGORIES.map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <label className="text-sm text-gray-700 w-40 shrink-0">{EXPENSE_LABELS[cat]}</label>
              <div className="relative flex-1">
                <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="50000"
                  className="input pl-8 text-sm"
                  placeholder="Sin límite"
                  value={expenseBudgets[cat] ?? ''}
                  onChange={e => setExpenseBudgets(b => ({ ...b, [cat]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => budgetMutation.mutate()}
          disabled={budgetMutation.isPending}
          className="btn-primary">
          {budgetMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar presupuestos'}
        </button>
      </Section>

      {/* ── Loyalty program ── */}
      <Section title="Programa de fidelización">
        <p className="text-xs text-gray-400 -mt-2">
          Configura cómo se ganan y canjean puntos. Los cambios aplican a los próximos pagos.
        </p>
        <div className="space-y-4">
          <div className="p-3 bg-primary/5 border border-primary/15 rounded-2xl flex items-start gap-3">
            <Star className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>Con los valores actuales: por cada <strong>${Number(loyaltyCopPerPoint).toLocaleString('es-CO')}</strong> COP pagados, el cliente gana <strong>1 punto</strong>.</p>
              <p>Al canjear, cada punto vale <strong>${Number(loyaltyPointValue).toLocaleString('es-CO')}</strong> COP de descuento.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">COP por punto ganado</label>
              <input
                type="number"
                min="1"
                step="100"
                className="input"
                value={loyaltyCopPerPoint}
                onChange={e => setLoyaltyCopPerPoint(e.target.value)}
                placeholder="1000"
              />
              <p className="text-[11px] text-gray-400 mt-1">Cada N COP pagados = 1 punto</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Valor de cada punto</label>
              <input
                type="number"
                min="1"
                step="50"
                className="input"
                value={loyaltyPointValue}
                onChange={e => setLoyaltyPointValue(e.target.value)}
                placeholder="100"
              />
              <p className="text-[11px] text-gray-400 mt-1">1 punto = N COP de descuento</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => loyaltyMutation.mutate()}
          disabled={loyaltyMutation.isPending}
          className="btn-primary">
          {loyaltyMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar programa de puntos'}
        </button>
      </Section>

      {/* ── Promo codes ── */}
      <PromoCodesSection />
    </div>
  );
}

// ─── Promo Codes Section ───────────────────────────────────────────────────────
function PromoCodesSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: promos = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ['promo-codes'],
    queryFn: () => promoCodesApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => promoCodesApi.create({
      code,
      description: description || undefined,
      type,
      value: Number(value),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo-codes'] });
      setShowForm(false);
      setCode(''); setDescription(''); setValue(''); setMaxUses(''); setExpiresAt('');
      toast('Código creado', 'success');
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al crear código', 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      promoCodesApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-codes'] }),
    onError: () => toast('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promoCodesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promo-codes'] }); toast('Código eliminado', 'success'); },
    onError: () => toast('Error al eliminar', 'error'),
  });

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold text-gray-900 text-base flex-1">Códigos promocionales</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nuevo código
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Crear código de descuento</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Código *</label>
              <input className="input text-sm uppercase" placeholder="Ej: VERANO20" value={code}
                onChange={e => setCode(e.target.value.toUpperCase())} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Descripción (opcional)</label>
              <input className="input text-sm" placeholder="Ej: Descuento de verano 20%" value={description}
                onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tipo</label>
              <div className="flex gap-2">
                {(['PERCENT', 'FIXED'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={cn('flex-1 py-2 rounded-xl border text-xs font-semibold transition-all',
                      type === t ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600')}>
                    {t === 'PERCENT' ? '% Porcentaje' : '$ Monto fijo'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                {type === 'PERCENT' ? 'Descuento (%)' : 'Descuento ($)'}
              </label>
              <input className="input text-sm" type="number" min={1} max={type === 'PERCENT' ? 100 : undefined}
                placeholder={type === 'PERCENT' ? '20' : '10000'} value={value}
                onChange={e => setValue(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Usos máximos (vacío = ilimitado)</label>
              <input className="input text-sm" type="number" min={1} placeholder="∞" value={maxUses}
                onChange={e => setMaxUses(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Expira el</label>
              <input className="input text-sm" type="date" value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()}
              disabled={!code.trim() || !value || createMutation.isPending}
              className="btn-primary text-sm py-2 flex items-center gap-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear código'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm py-2">Cancelar</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : promos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Sin códigos promocionales todavía</p>
      ) : (
        <div className="space-y-2">
          {promos.map(p => {
            const expired = p.expiresAt ? new Date(p.expiresAt) < new Date() : false;
            const exhausted = p.maxUses != null && p.usedCount >= p.maxUses;
            const statusColor = !p.isActive || expired || exhausted ? 'text-gray-400' : 'text-emerald-600';
            return (
              <div key={p.id} className={cn('p-3 rounded-2xl border flex items-start gap-3 transition-all',
                p.isActive && !expired && !exhausted ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-70')}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg tracking-widest">
                      {p.code}
                    </code>
                    <span className={cn('text-xs font-semibold', statusColor)}>
                      {p.type === 'PERCENT' ? `${p.value}%` : formatCOP(p.value)} descuento
                    </span>
                    {(expired || exhausted) && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                        {expired ? 'Expirado' : 'Agotado'}
                      </span>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    <span>Usado: {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''} veces</span>
                    {p.expiresAt && <span>Expira: {new Date(p.expiresAt).toLocaleDateString('es-CO')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                    disabled={toggleMutation.isPending}
                    title={p.isActive ? 'Desactivar' : 'Activar'}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                    {p.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { if (confirm(`¿Eliminar el código ${p.code}?`)) deleteMutation.mutate(p.id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
