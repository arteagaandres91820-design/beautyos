import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Search, ChevronRight, Clock, Star, Heart, CheckCircle2, AlertCircle, SlidersHorizontal, CalendarPlus, Calendar, X, Loader2, Smartphone } from 'lucide-react';
import { nailApi, publicApi } from '../../lib/api';
import { NailDesign } from '../../types';
import { formatCOP } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useFavorites } from '../../hooks/useFavorites';

const FEATURE_CATEGORIES = [
  { key: 'FLORAL',     label: 'Florales',  color: 'bg-pink-100 text-pink-600',   emoji: '🌸' },
  { key: 'CHROME',     label: 'Chrome',    color: 'bg-slate-100 text-slate-600',  emoji: '🪞' },
  { key: 'GRADIENT',   label: 'Degradados',color: 'bg-violet-100 text-violet-600',emoji: '🌈' },
  { key: 'GLITTER',    label: 'Glitter',   color: 'bg-amber-100 text-amber-600',  emoji: '⭐' },
  { key: 'MINIMALIST', label: 'Minimal',   color: 'bg-gray-100 text-gray-600',    emoji: '〰️' },
  { key: 'FRENCH',     label: 'French',    color: 'bg-rose-100 text-rose-600',    emoji: '🤍' },
  { key: 'PASTEL',     label: 'Pasteles',  color: 'bg-sky-100 text-sky-600',      emoji: '🍬' },
  { key: 'GEOMETRIC',  label: 'Geométrico',color: 'bg-indigo-100 text-indigo-600',emoji: '🔷' },
];

const CATEGORY_LABELS = Object.fromEntries(FEATURE_CATEGORIES.map(c => [c.key, c.label]));

function DesignMiniCard({ design, onTryOn }: { design: NailDesign; onTryOn: () => void }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(design.id);
  return (
    <div className="w-40 shrink-0 bg-white rounded-2xl overflow-hidden shadow-client-card border border-client-50 active:scale-[0.97] transition-transform" onClick={onTryOn}>
      <div className="relative aspect-square overflow-hidden">
        <img src={design.imageUrl} alt={design.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/300/300`; }} />
        <button onClick={e => { e.stopPropagation(); toggle(design.id); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5" fill={fav ? '#2DC7B3' : 'none'} stroke={fav ? '#2DC7B3' : '#9CA3AF'} />
        </button>
        {design.saveCount > 80 && (
          <div className="absolute top-2 left-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5" fill="white" /> Top
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-800 truncate">{design.name}</p>
        <p className="text-xs text-client-600 font-bold mt-0.5">{formatCOP(design.price)}</p>
      </div>
    </div>
  );
}

function PhoneIdentifyModal({ onIdentified }: { onIdentified: (token: string) => void }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const identifyMutation = useMutation({
    mutationFn: (p: string) => publicApi.identify(p).then(r => r.data),
    onSuccess: (data) => {
      localStorage.setItem('beautyos_client_token', data.shareToken);
      onIdentified(data.shareToken);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'No encontramos citas con ese número');
    },
  });

  const handleGuest = () => {
    localStorage.setItem('beautyos_guest_mode', '1');
    onIdentified('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="w-14 h-14 bg-[#083D42] rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Smartphone className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display font-bold text-gray-900 text-xl text-center mb-1">Identifícate</h2>
        <p className="text-sm text-gray-400 text-center mb-6 leading-snug">
          Ingresa tu número para ver tus citas y propuestas de diseño
        </p>

        <div className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError(''); }}
            placeholder="Ej: 3001234567"
            className={cn(
              'w-full border rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all',
              error ? 'border-red-300 focus:ring-red-200' : 'border-client-200 focus:ring-client-300'
            )}
            onKeyDown={e => { if (e.key === 'Enter' && phone.trim()) identifyMutation.mutate(phone.trim()); }}
          />
          {error && <p className="text-xs text-red-500 px-1">{error}</p>}

          <button
            onClick={() => identifyMutation.mutate(phone.trim())}
            disabled={!phone.trim() || identifyMutation.isPending}
            className="w-full bg-[#083D42] text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(8,61,66,0.28)]">
            {identifyMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</>
              : 'Ver mis citas'}
          </button>

          <button onClick={handleGuest} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
            Explorar sin cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const biz = searchParams.get('biz');
    if (biz) localStorage.setItem('beautyos_biz_slug', biz);
  }, []);
  const [clientToken, setClientToken] = useState<string | null>(
    () => localStorage.getItem('beautyos_client_token')
  );
  const [showIdentify, setShowIdentify] = useState(
    () => !localStorage.getItem('beautyos_client_token') && !localStorage.getItem('beautyos_guest_mode')
  );

  // Auto-identify clients who just booked via their stored phone
  useEffect(() => {
    if (clientToken) return;
    const bookingPhone = localStorage.getItem('beautyos_booking_phone');
    if (!bookingPhone) return;
    publicApi.identify(bookingPhone).then(r => {
      localStorage.setItem('beautyos_client_token', r.data.shareToken);
      localStorage.removeItem('beautyos_booking_phone');
      setClientToken(r.data.shareToken);
      setShowIdentify(false);
    }).catch(() => {
      localStorage.removeItem('beautyos_booking_phone');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: proposal } = useQuery({
    queryKey: ['client-pending-proposal', clientToken],
    queryFn: () => publicApi.getProposal(clientToken!).then(r => r.data),
    enabled: !!clientToken,
    retry: false,
    staleTime: 30000,
  });

  const hasPendingProposal = !!proposal && !proposal.approvedDesignId;
  const clientName = proposal?.clientName?.split(' ')[0] ?? null;

  const appointmentDateStr = proposal
    ? new Date(proposal.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' }) + ' · ' + proposal.startTime
    : '';

  const qc = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null); // shareToken

  const { data: history } = useQuery<{
    appointments: Array<{ id: string; date: string; startTime: string; status: string; shareToken: string; services: Array<{ service: { name: string } }> }>;
    bookingRequests: Array<{ id: string; date: string; timeSlot: string; status: string; createdAt: string; notes?: string }>;
  }>({
    queryKey: ['client-home-history', clientToken],
    queryFn: () => publicApi.history(clientToken!).then(r => r.data),
    enabled: !!clientToken,
    staleTime: 60_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (token: string) => publicApi.cancelAppointment(token),
    onSuccess: () => {
      setCancelTarget(null);
      qc.invalidateQueries({ queryKey: ['client-home-history', clientToken] });
    },
  });

  // Upcoming appointments from history (exclude if we already show proposal)
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = history?.appointments.filter(a =>
    (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && a.date >= today
  ).sort((a, b) => a.date.localeCompare(b.date)) ?? [];
  const nextAppt = !proposal && upcoming[0] ? upcoming[0] : null;

  const { data: trending = [] } = useQuery<NailDesign[]>({
    queryKey: ['client-trending'],
    queryFn: () => nailApi.trending().then(r => r.data),
  });

  const { data: newDesigns = [] } = useQuery<NailDesign[]>({
    queryKey: ['client-new'],
    queryFn: () => nailApi.listPublic({ limit: 10 }).then(r => r.data),
  });

  const { data: bizInfo } = useQuery<{ name: string; city: string }>({
    queryKey: ['client-biz-info'],
    queryFn: () => publicApi.business().then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const handleIdentified = (token: string) => {
    if (token) setClientToken(token);
    setShowIdentify(false);
  };

  return (
    <div className="bg-[#EFF4F1] min-h-full">
      {showIdentify && <PhoneIdentifyModal onIdentified={handleIdentified} />}

      {/* ══════════════════════════════════════
          HEADER — fondo sage, estilo App Store
          ══════════════════════════════════════ */}
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[12px] font-medium text-client-700/50 mb-1">
              {clientName ? 'Bienvenida de nuevo' : (bizInfo?.name ?? 'BeautyOS')}
            </p>
            <h1 className="font-serif leading-none tracking-tight">
              {clientName ? (
                <span className="text-[32px] font-bold text-client-ink">
                  Hola, {clientName.split(' ')[0]}
                  <span className="text-client-500 ml-1.5">✦</span>
                </span>
              ) : (
                <span className="text-[32px] font-bold text-client-ink">
                  Descubre<span className="text-client-500">.</span>
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={() => hasPendingProposal ? navigate(`/cliente/aprobar/${clientToken}`) : undefined}
            className="relative w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-white/80 shrink-0">
            <Bell className="w-5 h-5 text-client-700" strokeWidth={1.7} />
            {hasPendingProposal && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-client-500 rounded-full border border-white animate-pulse-teal" />
            )}
          </button>
        </div>

        {/* Search — píldora blanca con ícono filtro */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-client-400" strokeWidth={1.8} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => navigate('/cliente/descubrir')}
              className="w-full bg-white border-0 rounded-2xl pl-9 pr-4 py-3 text-sm text-client-ink placeholder:text-client-400/60 focus:outline-none focus:ring-2 focus:ring-client-300 shadow-sm"
              placeholder="Buscar diseños, estilos..."
            />
          </div>
          <button onClick={() => navigate('/cliente/descubrir')}
            className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-client-600" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENIDO
          ══════════════════════════════════════ */}
      <div className="space-y-7 pb-8">

        {/* ── Propuesta pendiente (urgente) ── */}
        {hasPendingProposal && (
          <div className="px-5">
            <button
              onClick={() => navigate(`/cliente/aprobar/${clientToken}`)}
              className="w-full bg-[#083D42] rounded-3xl p-5 text-left shadow-[0_12px_40px_rgba(8,61,66,0.28)] relative overflow-hidden active:scale-[0.98] transition-transform">
              <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-xs font-medium tracking-wide">Propuesta pendiente</span>
                </div>
                <p className="font-serif text-[22px] font-bold text-white leading-snug mb-3">
                  {proposal!.salonName}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-xs">{proposal!.designs.length} diseños · {appointmentDateStr}</span>
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ══ TARJETA FEATURED — estilo referencia ══
            Fondo mint claro, texto izquierda, imagen derecha flotando */}
        {trending[0] && !hasPendingProposal && (
          <div className="px-5">
            <button
              onClick={() => navigate(`/cliente/descubrir?tryOn=${trending[0].id}`)}
              className="w-full bg-client-mint rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left shadow-sm overflow-hidden relative">
              {/* Decoración círculo fondo */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-client-500/10 rounded-full pointer-events-none" />

              {/* Texto izquierda */}
              <div className="flex-1 min-w-0 z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-client-700/60 mb-2">
                  Tu diseño de hoy
                </p>
                <h3 className="font-serif text-[22px] font-bold text-client-ink leading-tight mb-1.5">
                  {trending[0].name}
                </h3>
                <p className="text-[12px] text-client-700/50 mb-4">
                  {trending[0].duration} min &nbsp;·&nbsp;
                  {CATEGORY_LABELS[trending[0].category as keyof typeof CATEGORY_LABELS] ?? trending[0].category}
                </p>
                <div className="w-10 h-10 rounded-full bg-client-ink flex items-center justify-center shadow-md">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Imagen derecha flotando */}
              <div className="w-[115px] h-[130px] shrink-0 rounded-2xl overflow-hidden shadow-client z-10">
                <img
                  src={trending[0].imageUrl}
                  alt={trending[0].name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${trending[0].id}/230/260`; }}
                />
              </div>
            </button>
          </div>
        )}

        {/* ══ CATEGORÍAS — fila horizontal, tarjetas sage ══ */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-[18px] font-bold text-client-ink">Categorías</h2>
            <button onClick={() => navigate('/cliente/descubrir')}
              className="text-client-500 text-xs font-semibold flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-hide">
            {FEATURE_CATEGORIES.map(c => (
              <button key={c.key}
                onClick={() => navigate(`/cliente/descubrir?cat=${c.key}`)}
                className="shrink-0 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className="w-[68px] h-[68px] rounded-2xl bg-white shadow-sm flex items-center justify-center text-[26px]">
                  {c.emoji}
                </div>
                <span className="text-[11px] font-medium text-client-ink/60 text-center w-[72px] truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══ RECOMENDADO PARA TI — scroll horizontal ══ */}
        <div>
          <div className="px-5 flex items-center justify-between mb-3">
            <h2 className="font-serif text-[18px] font-bold text-client-ink">Recomendado para ti</h2>
            <button onClick={() => navigate('/cliente/descubrir')}
              className="text-client-500 text-xs font-semibold flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pl-5 pr-5 pb-1 scrollbar-hide">
            {(newDesigns.length ? newDesigns : Array(5).fill(null)).map((d, i) =>
              d ? (
                <DesignMiniCard key={d.id} design={d} onTryOn={() => navigate(`/cliente/descubrir?tryOn=${d.id}`)} />
              ) : (
                <div key={i} className="w-40 shrink-0 bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="aspect-square bg-client-mint/40 animate-pulse" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3 bg-client-mint/40 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-client-mint/40 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ══ TENDENCIAS 2026 — grid 2 col ══ */}
        <div className="px-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-serif text-[18px] font-bold text-client-ink">Tendencias</h2>
            <span className="bg-white text-client-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">🔥 2026</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {trending.slice(0, 4).map((d, i) => (
              <button key={d.id}
                onClick={() => navigate(`/cliente/descubrir?tryOn=${d.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.97] transition-transform text-left">
                <div className="relative overflow-hidden">
                  <img src={d.imageUrl} alt={d.name}
                    className={cn('w-full object-cover', i === 0 ? 'h-44' : 'h-32')}
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${d.id}/300/${i===0?400:260}`; }} />
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/90 backdrop-blur-sm text-client-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      #{i + 1}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-client-ink truncate">{d.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-client-500 font-bold">{formatCOP(d.price)}</p>
                    <span className="text-[10px] text-client-ink/30 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{d.duration}m
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ══ AGENDAR CTA ══ */}
        <div className="px-5">
          <button onClick={() => navigate('/cliente/agendar')}
            className="w-full flex items-center gap-4 bg-white rounded-3xl p-4 shadow-sm active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 bg-client-ink rounded-2xl flex items-center justify-center shrink-0">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-serif font-bold text-client-ink text-[15px]">Agendar nueva cita</p>
              <p className="text-xs text-client-ink/40 mt-0.5">Elige servicio, fecha y hora en minutos</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-client-sage flex items-center justify-center shrink-0">
              <ChevronRight className="w-4 h-4 text-client-600" />
            </div>
          </button>
        </div>

        {/* ── Cita próxima (desde proposal) ── */}
        {proposal && (
          <div className="px-5">
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-client-mint rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-client-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-client-ink/40 font-medium mb-0.5">Tu próxima cita</p>
                  <p className="font-semibold text-client-ink text-sm">{appointmentDateStr}</p>
                  <p className="text-xs text-client-ink/40 mt-0.5">{proposal.salonName}</p>
                </div>
                {hasPendingProposal && (
                  <button onClick={() => navigate(`/cliente/aprobar/${clientToken}`)}
                    className="text-xs font-bold text-client-600 bg-client-mint px-3 py-1.5 rounded-xl whitespace-nowrap">
                    Ver diseños
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Cita próxima (historial) ── */}
        {nextAppt && (() => {
          const d = new Date(nextAppt.date + 'T12:00:00');
          const dateStr = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
          const svcNames = nextAppt.services.map(s => s.service.name).join(', ') || 'Cita';
          const isCancelling = cancelTarget === nextAppt.shareToken;
          return (
            <div className="px-5">
              <div className="bg-white rounded-3xl p-4 shadow-sm">
                {isCancelling ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm font-semibold text-client-ink">¿Cancelar esta cita?</p>
                    <p className="text-xs text-client-ink/40">{svcNames} · {dateStr}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setCancelTarget(null)}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                        Volver
                      </button>
                      <button onClick={() => cancelMutation.mutate(nextAppt.shareToken)}
                        disabled={cancelMutation.isPending}
                        className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-1">
                        {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sí, cancelar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-client-ink/40 font-medium">Tu próxima cita</p>
                      <p className="font-semibold text-client-ink text-sm capitalize">{svcNames}</p>
                      <p className="text-xs text-client-ink/40 mt-0.5">{dateStr} · {nextAppt.startTime}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Confirmada</span>
                      <button onClick={() => setCancelTarget(nextAppt.shareToken)}
                        className="text-[10px] text-red-400 flex items-center gap-0.5 font-medium">
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Solicitudes recientes ── */}
        {(() => {
          const recent = history?.bookingRequests?.filter(r => r.status !== 'CONVERTED') ?? [];
          if (!recent.length) return null;
          const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
            PENDING:  { label: 'En espera',      dot: 'bg-amber-400',   badge: 'text-amber-600 bg-amber-100' },
            ACCEPTED: { label: 'Confirmada',     dot: 'bg-emerald-400', badge: 'text-emerald-700 bg-emerald-100' },
            REJECTED: { label: 'No disponible',  dot: 'bg-red-300',     badge: 'text-red-500 bg-red-50' },
          };
          return (
            <div className="px-5">
              <div className="bg-white rounded-3xl p-4 shadow-sm">
                <p className="text-[11px] font-bold text-[#083D42]/40 mb-3 uppercase tracking-widest">Solicitudes recientes</p>
                <div className="space-y-2">
                  {recent.slice(0, 3).map(r => {
                    const c = STATUS_CONFIG[r.status] ?? STATUS_CONFIG['PENDING'];
                    const d = new Date(r.date + 'T12:00:00');
                    const dateStr = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
                    return (
                      <div key={r.id} className="flex items-center gap-3 bg-[#EFF4F1] rounded-xl p-3">
                        <div className={cn('w-2 h-2 rounded-full shrink-0', c.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-client-ink">{dateStr} · {r.timeSlot}</p>
                          {r.notes && <p className="text-[10px] text-client-ink/40 truncate">{r.notes}</p>}
                        </div>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', c.badge)}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
