import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, ChevronRight, HelpCircle, LogOut, Award, Sparkles, Loader2, MapPin, CalendarDays, CheckCircle2, XCircle, DollarSign, X, Trophy, RotateCcw, Star, MessageSquare } from 'lucide-react';
import { publicApi } from '../../lib/api';
import { cn, formatCOP, STATUS_LABELS } from '../../lib/utils';
import { useFavorites } from '../../hooks/useFavorites';
import { useToast } from '../../components/ui/Toast';

const LOYALTY_TIERS = [
  { label: 'Bronce',  minVisits: 0,  emoji: '🥉', from: 'from-orange-400', to: 'to-amber-500',   ring: 'border-orange-300' },
  { label: 'Plata',   minVisits: 5,  emoji: '🥈', from: 'from-slate-400',  to: 'to-slate-500',   ring: 'border-slate-300' },
  { label: 'Oro',     minVisits: 10, emoji: '🥇', from: 'from-amber-400',  to: 'to-yellow-500',  ring: 'border-amber-300' },
  { label: 'Platino', minVisits: 20, emoji: '💎', from: 'from-violet-500', to: 'to-purple-600',  ring: 'border-violet-300' },
];
function getClientTier(visits: number) {
  return [...LOYALTY_TIERS].reverse().find(t => visits >= t.minVisits) ?? LOYALTY_TIERS[0];
}
function getClientNextTier(visits: number) {
  return LOYALTY_TIERS.find(t => visits < t.minVisits);
}

export function ClientProfile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { count: favCount } = useFavorites();

  const clientToken = localStorage.getItem('beautyos_client_token');

  const { data: proposal, isLoading: loadingProposal } = useQuery({
    queryKey: ['client-proposal', clientToken],
    queryFn: () => publicApi.getProposal(clientToken!).then(r => r.data),
    enabled: !!clientToken,
    staleTime: 60_000,
  });

  const { data: biz } = useQuery<{
    name: string; city: string; phone?: string; whatsapp?: string;
    loyaltyPointValue?: number; loyaltyCopPerPoint?: number;
  }>({
    queryKey: ['public-business'],
    queryFn: () => publicApi.business().then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const { data: history } = useQuery<{
    points: number;
    activePackages: Array<{
      id: string; packageName: string; description?: string | null;
      sessionsTotal: number; sessionsUsed: number; sessionsLeft: number;
      expiresAt?: string | null;
    }>;
    appointments: Array<{
      id: string; date: string; startTime: string; status: string;
      shareToken?: string;
      services: Array<{ service: { id: string; name: string; price: number } }>;
      payment?: { amount: number; method: string };
    }>;
  }>({
    queryKey: ['client-history', clientToken],
    queryFn: () => publicApi.history(clientToken!).then(r => r.data),
    enabled: !!clientToken,
    staleTime: 60_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (token: string) => publicApi.cancelAppointment(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-history', clientToken] });
      toast('Cita cancelada', 'success');
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al cancelar', 'error'),
  });

  const [pendingRatings, setPendingRatings] = useState<Record<string, number>>({});
  const rateMutation = useMutation({
    mutationFn: ({ id, rating, reviewNote }: { id: string; rating: number; reviewNote?: string }) =>
      publicApi.rateAppointment(id, clientToken!, rating, reviewNote),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['client-history', clientToken] });
      setPendingRatings(prev => { const n = { ...prev }; delete n[variables.id]; return n; });
      toast('¡Gracias por tu calificación! 🌟', 'success');
    },
    onError: () => toast('Error al enviar calificación', 'error'),
  });

  const apptCount = history?.appointments?.length ?? (proposal ? 1 : 0);
  const completedVisits = history?.appointments?.filter(a => a.status === 'COMPLETED').length ?? 0;
  const tier = getClientTier(completedVisits);
  const nextTier = getClientNextTier(completedVisits);
  const tierProgressPct = nextTier
    ? Math.min(100, Math.round(
        ((completedVisits - (LOYALTY_TIERS.find(t => t.label === tier.label)?.minVisits ?? 0)) /
         (nextTier.minVisits - (LOYALTY_TIERS.find(t => t.label === tier.label)?.minVisits ?? 0))) * 100
      ))
    : 100;

  const clientName: string = proposal?.clientName ?? 'Invitada';
  const initial = clientName.charAt(0).toUpperCase();
  const hasPending = !!proposal && !proposal.approvedDesignId;

  const handleLogout = () => {
    localStorage.removeItem('beautyos_client_token');
    navigate('/cliente/bienvenida');
  };

  const STATS = [
    { label: 'Favoritos', value: String(favCount),            icon: Heart, color: 'text-client-500 bg-client-50' },
    { label: 'Propuesta', value: hasPending ? '1' : '0',      icon: Sparkles, color: hasPending ? 'text-amber-500 bg-amber-50' : 'text-gray-400 bg-gray-50' },
    { label: 'Citas',     value: String(apptCount),            icon: Clock, color: 'text-emerald-500 bg-emerald-50' },
  ];

  const MENU = [
    { label: 'Mis favoritos',      icon: Heart,      color: 'text-client-500',  hint: `${favCount} diseños`,  to: '/cliente/favoritos' },
    { label: 'Mis rutinas',        icon: Sparkles,   color: 'text-violet-500',  hint: '',                     to: '/cliente/rutinas' },
    { label: 'Agendar cita',       icon: CalendarDays, color: 'text-blue-500',  hint: '',                     to: '/cliente/agendar' },
    { label: 'Ayuda y soporte',    icon: HelpCircle, color: 'text-gray-500',    hint: biz?.whatsapp ? 'WhatsApp' : '', to: biz?.whatsapp ? null : null, waLink: biz?.whatsapp ? `https://wa.me/${biz.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Hola! Necesito ayuda con la plataforma BeautyOS.')}` : null },
  ];

  const isLoading = loadingProposal && !!clientToken;

  return (
    <div className="min-h-full bg-[#EFF4F1]">
      {/* Header */}
      <div className="bg-[#EFF4F1] px-5 pt-12 pb-6 border-b border-gray-50">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-client-500/60 mb-0.5">Mi espacio</p>
        <h1 className="font-serif text-[28px] font-bold text-client-900 tracking-tight leading-none mb-5">Perfil<span className="text-client-500">.</span></h1>

        {/* Avatar + info */}
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-client-400" /></div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#083D42] flex items-center justify-center shadow-[0_8px_32px_rgba(8,61,66,0.28)]">
                <span className="font-display font-bold text-3xl text-white">{initial}</span>
              </div>
              {hasPending && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                  <Award className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-client-900">{clientName}</h2>
              {proposal && (
                <p className="text-sm text-client-500 font-medium mt-0.5">{proposal.salonName}</p>
              )}
              {!clientToken && (
                <p className="text-xs text-gray-400 mt-1">Sin sesión activa</p>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-3 mt-5">
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-client-50 text-center">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5', color)}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="font-display font-bold text-gray-900 text-lg leading-none">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Loyalty tier badge */}
      {clientToken && (
        <div className="px-4 pt-5 pb-2">
          <div className={cn('rounded-3xl p-4 border relative overflow-hidden bg-gradient-to-br', tier.from, tier.to, tier.ring)}>
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 translate-x-8 -translate-y-8" />
            <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/10 -translate-x-4 translate-y-4" />
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-sm shrink-0">
                {tier.emoji}
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Tu nivel de fidelidad</p>
                <p className="font-display font-bold text-white text-lg leading-tight">{tier.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-white text-2xl leading-none">{completedVisits}</p>
                <p className="text-[10px] text-white/70">visitas</p>
              </div>
            </div>
            {nextTier ? (
              <div className="relative">
                <div className="flex justify-between text-[10px] text-white/80 mb-1.5">
                  <span>Hacia {nextTier.emoji} {nextTier.label}</span>
                  <span>{nextTier.minVisits - completedVisits} visitas más</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${tierProgressPct}%` }} />
                </div>
              </div>
            ) : (
              <div className="relative flex items-center gap-2">
                <Trophy className="w-4 h-4 text-white/90" />
                <p className="text-xs text-white/90 font-semibold">¡Eres nuestra clienta más especial!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loyalty points card */}
      {clientToken && (history?.points ?? 0) > 0 && (
        <div className="px-4 pt-3 pb-2">
          <div className="bg-white rounded-3xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tus puntos de lealtad</p>
                  <p className="font-display font-bold text-amber-700 text-lg leading-tight">
                    {history!.points} pts
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">equivalen a</p>
                <p className="text-sm font-bold text-emerald-600">
                  ${(history!.points * (biz?.loyaltyPointValue ?? 100)).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Ganas 1 punto por cada ${(biz?.loyaltyCopPerPoint ?? 1000).toLocaleString('es-CO')} COP. Canjéalos en tu próxima visita.
            </p>
          </div>
        </div>
      )}

      {/* Salon info */}
      {biz && (
        <div className="px-4 pt-3 pb-2">
          <div className="bg-white rounded-3xl p-4 border border-client-100 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 bg-[#083D42] rounded-2xl flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(8,61,66,0.25)]">
              <span className="text-white text-lg">💅</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Tu salón habitual</p>
              <p className="font-semibold text-gray-800 text-sm truncate">{biz.name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{biz.city}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </div>
        </div>
      )}

      {/* Active packages */}
      {(history?.activePackages ?? []).length > 0 && (
        <div className="px-4 pt-5 pb-2">
          <h2 className="font-display font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-400" /> Mis paquetes activos
          </h2>
          <div className="space-y-2">
            {history!.activePackages.map(pkg => {
              const pct = pkg.sessionsTotal > 0 ? Math.round((pkg.sessionsUsed / pkg.sessionsTotal) * 100) : 0;
              const daysLeft = pkg.expiresAt ? Math.ceil((new Date(pkg.expiresAt).getTime() - Date.now()) / 86400000) : null;
              return (
                <div key={pkg.id} className="bg-white rounded-2xl p-4 border border-violet-100 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{pkg.packageName}</p>
                      {pkg.description && (
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{pkg.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-display font-bold text-violet-600 text-lg leading-none">{pkg.sessionsLeft}</p>
                      <p className="text-[10px] text-gray-400">sesiones</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-violet-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400">{pkg.sessionsUsed}/{pkg.sessionsTotal} usadas</p>
                    {daysLeft !== null && (
                      <p className={cn('text-[10px] font-medium', daysLeft <= 7 ? 'text-red-500' : 'text-gray-400')}>
                        {daysLeft <= 0 ? 'Vence hoy' : daysLeft === 1 ? 'Vence mañana' : `Vence en ${daysLeft} días`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment history */}
      {history?.appointments && history.appointments.length > 0 && (
        <div className="px-4 pt-5 pb-2">
          <h2 className="font-display font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-client-400" /> Historial de citas
          </h2>
          <div className="space-y-2">
            {history.appointments.slice(0, 8).map(a => {
              const isCompleted = a.status === 'COMPLETED';
              const isCancelled = a.status === 'CANCELLED' || a.status === 'NO_SHOW';
              const isUpcoming = ['SCHEDULED', 'CONFIRMED'].includes(a.status);
              const d = new Date(a.date + 'T12:00:00');
              const dateStr = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={a.id} className="bg-white rounded-2xl p-3.5 border border-gray-50 shadow-sm flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                    isCompleted ? 'bg-emerald-100' : isCancelled ? 'bg-red-50' : 'bg-client-50')}>
                    {isCompleted
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : isCancelled
                        ? <XCircle className="w-4 h-4 text-red-400" />
                        : <Clock className="w-4 h-4 text-client-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {a.services.map(s => s.service.name).join(', ') || 'Cita'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{dateStr} · {a.startTime}</p>
                    {isUpcoming && a.shareToken && (
                      <button
                        onClick={() => {
                          if (confirm('¿Segura que deseas cancelar esta cita?')) {
                            cancelMutation.mutate(a.shareToken!);
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium mt-1.5 hover:text-red-600 transition-colors disabled:opacity-50">
                        {cancelMutation.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <X className="w-3 h-3" />}
                        Cancelar cita
                      </button>
                    )}
                    {isCompleted && a.services.length > 0 && (
                      <button
                        onClick={() => navigate(`/cliente/agendar?serviceId=${a.services[0].service.id ?? ''}`)}
                        className="flex items-center gap-0.5 text-[10px] text-client-500 font-medium mt-1.5 hover:text-client-700 transition-colors">
                        <RotateCcw className="w-3 h-3" /> Reservar de nuevo
                      </button>
                    )}
                    {/* Star rating for completed appointments */}
                    {isCompleted && clientToken && (
                      <div className="mt-2">
                        {(a as any).rating ? (
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className="w-3 h-3"
                                fill={s <= (a as any).rating ? '#f59e0b' : 'none'}
                                stroke={s <= (a as any).rating ? '#f59e0b' : '#d1d5db'} />
                            ))}
                            {(a as any).reviewNote && (
                              <MessageSquare className="w-3 h-3 text-gray-400 ml-0.5" />
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-[9px] text-gray-400 mb-1">¿Cómo fue tu experiencia?</p>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(s => (
                                <button key={s}
                                  onClick={() => {
                                    setPendingRatings(prev => ({ ...prev, [a.id]: s }));
                                    rateMutation.mutate({ id: a.id, rating: s });
                                  }}
                                  disabled={rateMutation.isPending && pendingRatings[a.id] !== undefined}
                                  className="active:scale-125 transition-transform">
                                  <Star className="w-4 h-4"
                                    fill={s <= (pendingRatings[a.id] ?? 0) ? '#f59e0b' : 'none'}
                                    stroke={s <= (pendingRatings[a.id] ?? 0) ? '#f59e0b' : '#d1d5db'} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {a.payment && (
                      <p className="text-xs font-bold text-client-600 flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3" />{formatCOP(a.payment.amount)}
                      </p>
                    )}
                    <p className={cn('text-[10px] mt-0.5',
                      isCompleted ? 'text-emerald-500' : isCancelled ? 'text-red-400' : 'text-client-400')}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="px-4 py-3 space-y-2">
        {MENU.map(({ label, icon: Icon, color, hint, to, waLink }: any) => (
          waLink ? (
            <a key={label} href={waLink} target="_blank" rel="noopener noreferrer"
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-50 active:bg-client-50 transition-colors text-left">
              <div className={cn('w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center', color)}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
              {hint && <span className="text-xs text-gray-400 mr-1">{hint}</span>}
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </a>
          ) : (
            <button key={label}
              onClick={() => to && navigate(to)}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-50 active:bg-client-50 transition-colors text-left">
              <div className={cn('w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center', color)}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
              {hint && <span className="text-xs text-gray-400 mr-1">{hint}</span>}
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )
        ))}

        {clientToken && (
          <button onClick={handleLogout}
            className="w-full bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100 active:bg-red-100 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="flex-1 text-sm font-medium text-red-600">Cerrar sesión</span>
          </button>
        )}
      </div>

      <p className="text-center text-[10px] text-gray-300 py-5">BeautyOS v1.0 · by SinergIA</p>
    </div>
  );
}
