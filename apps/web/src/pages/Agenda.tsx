import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, User, Loader2,
  Sparkles, Link2, Copy, CheckCircle2, X, Check, Phone, Mail, ExternalLink, Bell, CalendarPlus,
  DollarSign, CreditCard, Smartphone, Banknote, ArrowUpRight, Trash2, Search, Printer, AlertTriangle, Lock, Package2, Gift, Users, MessageSquare, RefreshCw,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { appointmentsApi, clientsApi, servicesApi, nailApi, staffApi, cashApi, timeBlocksApi, packagesApi, waitlistApi, promoCodesApi, giftCardsApi } from '../lib/api';
import { Appointment, BookingRequest, Client, Service, NailDesign, PaymentMethod, TimeBlock, AppointmentPhoto, WaitlistEntry } from '../types';
import { formatCOP, STATUS_LABELS, PAYMENT_LABELS, CATEGORY_LABELS, CATEGORY_EMOJI, cn, getLoyaltyTier } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:   'bg-blue-50 border-blue-200 text-blue-800',
  CONFIRMED:   'bg-emerald-50 border-emerald-200 text-emerald-800',
  IN_PROGRESS: 'bg-purple-50 border-purple-200 text-purple-800',
  COMPLETED:   'bg-gray-50 border-gray-200 text-gray-600',
  CANCELLED:   'bg-red-50 border-red-200 text-red-600 opacity-60',
  NO_SHOW:     'bg-orange-50 border-orange-200 text-orange-700 opacity-60',
};

const REQUEST_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-600 border-red-200',
  CONVERTED: 'bg-blue-50 text-blue-700 border-blue-200',
};

// ── Propose Designs Modal ─────────────────────────────────────────────
function ProposeDesignsModal({
  appointment, onClose,
}: { appointment: Appointment; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: designs = [], isLoading } = useQuery<NailDesign[]>({
    queryKey: ['nail-designs-picker'],
    queryFn: () => nailApi.list().then(r => r.data),
  });

  const filtered = designs.filter(d => catFilter === 'ALL' || d.category === catFilter);
  const categories = ['ALL', ...Array.from(new Set(designs.map(d => d.category)))];

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const proposeMutation = useMutation({
    mutationFn: () => appointmentsApi.propose(appointment.id, selectedIds),
    onSuccess: (res) => {
      setShareUrl(res.data.shareUrl);
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast('Propuesta guardada', 'success');
    },
    onError: () => toast('Error al guardar propuesta', 'error'),
  });

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (shareUrl) {
    return (
      <div className="p-6 space-y-5 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-gray-900 text-lg mb-1">¡Propuesta enviada!</h3>
          <p className="text-sm text-gray-500">{selectedIds.length} diseños propuestos para {appointment.client.name}</p>
        </div>
        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <p className="text-xs text-muted font-medium uppercase tracking-wide">Enlace para compartir</p>
          <div className="flex items-center gap-2 bg-white border border-edge rounded-xl px-3 py-2.5">
            <Link2 className="w-4 h-4 text-muted shrink-0" />
            <span className="text-sm text-ink truncate flex-1">{shareUrl}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink}
              className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'btn-primary')}>
              {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar enlace</>}
            </button>
            <a href={`https://wa.me/${appointment.client.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${appointment.client.name}! Tu estilista te propone diseños para tu próxima cita. Entra aquí para verlos y elegir tu favorito: ${shareUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost w-full justify-center">Cerrar</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[80vh]">
      <div className="p-5 border-b border-edge">
        <p className="text-sm text-muted">Selecciona 1–4 diseños para proponer a <strong>{appointment.client.name}</strong></p>
        {selectedIds.length > 0 && (
          <p className="text-xs text-primary font-semibold mt-1">{selectedIds.length}/4 diseños seleccionados</p>
        )}
      </div>

      {/* Category filter */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-edge">
        {categories.slice(0, 12).map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={cn('shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              catFilter === cat ? 'bg-primary text-white' : 'bg-surface text-muted border border-edge hover:border-primary/40')}>
            {cat === 'ALL' ? 'Todos' : `${CATEGORY_EMOJI[cat] ?? ''} ${CATEGORY_LABELS[cat] ?? cat}`}
          </button>
        ))}
      </div>

      {/* Design grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {filtered.map(d => {
              const isSelected = selectedIds.includes(d.id);
              const selIdx = selectedIds.indexOf(d.id);
              return (
                <button key={d.id} onClick={() => toggle(d.id)}
                  className={cn('relative rounded-2xl overflow-hidden aspect-square border-2 transition-all',
                    isSelected ? 'border-primary shadow-beauty' : 'border-transparent hover:border-primary/30')}>
                  <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${d.id}/200/200`; }} />
                  <div className={cn('absolute inset-0 transition-all', isSelected ? 'bg-primary/20' : 'bg-black/0 hover:bg-black/10')} />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow text-white text-xs font-bold">
                      {selIdx + 1}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-[10px] font-semibold truncate leading-tight">{d.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="p-4 border-t border-edge flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button
          onClick={() => proposeMutation.mutate()}
          disabled={selectedIds.length === 0 || proposeMutation.isPending}
          className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
            selectedIds.length > 0 ? 'btn-primary' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
          {proposeMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : <><Sparkles className="w-4 h-4" /> Proponer {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</>}
        </button>
      </div>
    </div>
  );
}

// ── Appointment detail panel ─────────────────────────────────────────
const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  CASH: Banknote, CARD: CreditCard, NEQUI: Smartphone, DAVIPLATA: Smartphone, TRANSFER: ArrowUpRight, GIFT_CARD: Gift,
};

const PHOTO_TYPE_LABELS: Record<string, string> = { BEFORE: 'Antes', AFTER: 'Después', OTHER: 'Otro' };
const PHOTO_TYPE_COLORS: Record<string, string> = { BEFORE: 'bg-orange-50 text-orange-700', AFTER: 'bg-emerald-50 text-emerald-700', OTHER: 'bg-gray-100 text-gray-600' };

function PhotosSection({ apptId }: { apptId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<'BEFORE' | 'AFTER' | 'OTHER'>('AFTER');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: photos = [] } = useQuery<AppointmentPhoto[]>({
    queryKey: ['appt-photos', apptId],
    queryFn: () => appointmentsApi.photos(apptId).then(r => r.data),
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await appointmentsApi.uploadPhoto(apptId, file, photoType);
      }
      qc.invalidateQueries({ queryKey: ['appt-photos', apptId] });
      toast('Foto(s) subida(s)', 'success');
    } catch {
      toast('Error al subir foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    await appointmentsApi.deletePhoto(apptId, photoId);
    qc.invalidateQueries({ queryKey: ['appt-photos', apptId] });
    toast('Foto eliminada', 'success');
  };

  return (
    <div className="border-t border-edge pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Fotos antes/después</p>
        <div className="flex items-center gap-1.5">
          {(['BEFORE', 'AFTER', 'OTHER'] as const).map(t => (
            <button key={t} onClick={() => setPhotoType(t)}
              className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors',
                photoType === t ? PHOTO_TYPE_COLORS[t] + ' border-current' : 'border-gray-200 text-gray-400 hover:text-gray-600')}>
              {PHOTO_TYPE_LABELS[t]}
            </button>
          ))}
          <button onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Subir
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleUpload(e.target.files)} />
        </div>
      </div>

      {photos.length === 0 ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
          <p className="text-xs text-gray-400">Arrastra fotos aquí o haz clic para subir</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
              <img
                src={p.url}
                alt={PHOTO_TYPE_LABELS[p.type]}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(p.url)}
              />
              <span className={cn('absolute top-1 left-1 text-[8px] font-bold px-1 py-0.5 rounded-full', PHOTO_TYPE_COLORS[p.type])}>
                {PHOTO_TYPE_LABELS[p.type]}
              </span>
              <button
                onClick={() => deletePhoto(p.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
            <Plus className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl shadow-xl" />
        </div>
      )}
    </div>
  );
}

function AppointmentDetail({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showPropose, setShowPropose] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [justPaid, setJustPaid] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [apptNotes, setApptNotes] = useState(appt.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [rsDate, setRsDate] = useState(appt.date.slice(0, 10));
  const [rsStart, setRsStart] = useState(appt.startTime);
  const [rsEnd, setRsEnd] = useState(appt.endTime);
  const [showTplPicker, setShowTplPicker] = useState(false);

  // Checklist — flatten all service checklist steps, track checked state in local Set
  const allSteps: { svcName: string; step: string; key: string }[] = appt.services.flatMap(s => {
    let steps: string[] = [];
    try { steps = JSON.parse(s.service.checklist ?? '[]'); } catch { steps = []; }
    return steps.map((step, i) => ({ svcName: s.service.name, step, key: `${s.service.id}-${i}` }));
  });
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const toggleStep = (key: string) => setCheckedSteps(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const waTemplates: { id: string; name: string; body: string }[] = (() => {
    try { return JSON.parse((user?.business as any)?.messageTemplates ?? '[]'); } catch { return []; }
  })();

  const fillTemplate = (body: string) => {
    const dateStr = format(parseISO(appt.date), "d 'de' MMMM", { locale: es });
    return body
      .replace(/\{\{nombre\}\}/gi, appt.client.name)
      .replace(/\{\{fecha\}\}/gi, dateStr)
      .replace(/\{\{hora\}\}/gi, appt.startTime);
  };

  const { data: clientData } = useQuery({
    queryKey: ['client', appt.client.id],
    queryFn: () => clientsApi.get(appt.client.id).then(r => r.data),
    enabled: !appt.payment,
  });
  const [tipAmount, setTipAmount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState<{ id: string; code: string; discount: number; description?: string | null } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardData, setGiftCardData] = useState<{ id: string; code: string; balance: number; recipientName: string | null } | null>(null);
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(appt.rating ?? 0);
  const [ratingNote, setRatingNote] = useState<string>(appt.reviewNote ?? '');
  const [ratingHover, setRatingHover] = useState(0);
  const loyaltyPointValue: number = (user?.business as any)?.loyaltyPointValue ?? 100;
  const loyaltyCopPerPoint: number = (user?.business as any)?.loyaltyCopPerPoint ?? 1000;
  const clientPoints: number = clientData?.points ?? 0;
  const maxRedeemable = Math.min(clientPoints, Math.floor(appt.totalPrice / loyaltyPointValue));
  const pointsDiscount = pointsToRedeem * loyaltyPointValue;
  const promoDiscount = promoData?.discount ?? 0;
  const discount = pointsDiscount + promoDiscount;
  const amountAfterDiscount = Math.max(0, appt.totalPrice - discount);
  const giftCardCoverage = (giftCardData && payMethod === 'GIFT_CARD')
    ? Math.min(giftCardData.balance, amountAfterDiscount)
    : 0;
  const remainingAfterGiftCard = amountAfterDiscount - giftCardCoverage;
  const pointsToEarn = Math.floor(amountAfterDiscount / loyaltyCopPerPoint);

  const rescheduleMutation = useMutation({
    mutationFn: () => appointmentsApi.update(appt.id, { date: rsDate, startTime: rsStart, endTime: rsEnd }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast('Cita reprogramada', 'success');
      setReschedule(false);
      onClose();
    },
    onError: () => toast('Error al reprogramar', 'error'),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => appointmentsApi.update(appt.id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast('Estado actualizado', 'success'); onClose(); },
  });

  const payMutation = useMutation({
    mutationFn: () => cashApi.register({
      appointmentId: appt.id,
      amount: amountAfterDiscount,
      method: payMethod,
      notes: payNotes,
      pointsRedeemed: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      tipAmount: tipAmount > 0 ? tipAmount : undefined,
    }),
    onSuccess: async () => {
      await appointmentsApi.update(appt.id, { status: 'COMPLETED' });
      if (promoData) { promoCodesApi.apply(promoData.id).catch(() => {}); }
      if (payMethod === 'GIFT_CARD' && giftCardData && giftCardCoverage > 0) {
        giftCardsApi.redeem(giftCardData.id, giftCardCoverage).catch(() => {});
      }
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['cash-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast('Pago registrado · cita completada', 'success');
      setJustPaid(true);
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al registrar pago', 'error'),
  });

  const ratingMutation = useMutation({
    mutationFn: () => appointmentsApi.setRating(appt.id, ratingValue, ratingNote || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast('Calificación guardada', 'success');
    },
    onError: () => toast('Error al guardar calificación', 'error'),
  });

  const proposedIds: string[] = (() => { try { return JSON.parse(appt.proposedDesigns || '[]'); } catch { return []; } })();
  const shareUrl = appt.shareToken ? `${window.location.origin}/cliente/aprobar/${appt.shareToken}` : null;

  return (
    <div className="p-6 space-y-5">
      {/* Client */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{appt.client.name}</p>
            {(() => {
              const t = getLoyaltyTier(appt.client.visitCount ?? 0);
              return (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', t.bg, t.color)}>
                  {t.label}
                </span>
              );
            })()}
          </div>
          <p className="text-sm text-muted">{appt.client.phone}</p>
        </div>
        {appt.client.isVip && <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold">VIP</span>}
        {appt.client.phone && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowTplPicker(v => !v)}
              title="Enviar mensaje por WhatsApp"
              className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 transition-colors">
              <Bell className="w-3.5 h-3.5 text-green-600" />
            </button>
            {showTplPicker && (
              <div className="absolute right-0 top-10 z-50 bg-white border border-edge rounded-2xl shadow-lg min-w-[220px] overflow-hidden">
                <p className="text-xs font-semibold text-gray-500 px-3 pt-2.5 pb-1">Enviar plantilla</p>
                {waTemplates.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 pb-2.5">Sin plantillas — configúralas en Ajustes</p>
                )}
                {waTemplates.map(t => (
                  <a key={t.id}
                    href={`https://wa.me/${appt.client.phone!.replace(/\D/g,'')}?text=${encodeURIComponent(fillTemplate(t.body))}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setShowTplPicker(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-surface transition-colors text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    {t.name}
                  </a>
                ))}
                {waTemplates.length > 0 && <div className="h-px bg-edge mx-3" />}
                <a href={`https://wa.me/${appt.client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(fillTemplate(`Hola {{nombre}}! Te recordamos tu cita el {{fecha}} a las {{hora}}. ¡Te esperamos! 💅`))}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowTplPicker(false)}
                  className="flex items-center gap-2 px-3 py-2 pb-2.5 hover:bg-surface transition-colors text-xs text-gray-500">
                  <Bell className="w-3 h-3" /> Recordatorio rápido
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date & price */}
      {reschedule ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-blue-700">Reprogramar cita</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3">
              <label className="text-xs text-blue-600 block mb-0.5">Fecha</label>
              <input type="date" className="input text-sm py-1.5" value={rsDate} onChange={e => setRsDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-blue-600 block mb-0.5">Inicio</label>
              <input type="time" className="input text-sm py-1.5" value={rsStart} onChange={e => setRsStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-blue-600 block mb-0.5">Fin</label>
              <input type="time" className="input text-sm py-1.5" value={rsEnd} onChange={e => setRsEnd(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-transparent block mb-0.5">·</label>
              <button onClick={() => rescheduleMutation.mutate()} disabled={rescheduleMutation.isPending}
                className="h-full flex items-center justify-center gap-1 bg-blue-600 text-white text-xs font-semibold rounded-xl px-2 py-1.5">
                {rescheduleMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <button onClick={() => setReschedule(false)} className="text-xs text-blue-500 hover:underline">Cancelar</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-surface rounded-xl relative group">
            <p className="text-xs text-muted mb-0.5">Fecha & hora</p>
            <p className="font-medium">{format(parseISO(appt.date), "d MMM", { locale: es })} · {appt.startTime}–{appt.endTime}</p>
            {!appt.payment && (
              <button onClick={() => setReschedule(true)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-500 font-semibold bg-blue-50 px-2 py-0.5 rounded-lg">
                Editar
              </button>
            )}
          </div>
          <div className="p-3 bg-surface rounded-xl">
            <p className="text-xs text-muted mb-0.5">Total</p>
            <p className="font-bold text-primary">{formatCOP(appt.totalPrice)}</p>
          </div>
        </div>
      )}

      {/* Services */}
      <div>
        <p className="text-xs text-muted mb-2">Servicios</p>
        <div className="space-y-1">
          {appt.services.map(s => (
            <div key={s.service.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{s.service.name}</span>
              <span className="text-muted">{formatCOP(s.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prep checklist */}
      {allSteps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs text-muted">Checklist de preparación</p>
            <span className="text-xs text-gray-400">({checkedSteps.size}/{allSteps.length})</span>
          </div>
          <div className="space-y-1.5">
            {allSteps.map(({ svcName, step, key }) => (
              <button key={key} onClick={() => toggleStep(key)}
                className={cn('w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all',
                  checkedSteps.has(key) ? 'bg-emerald-50 border-emerald-200' : 'bg-surface border-edge hover:border-primary/30')}>
                <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  checkedSteps.has(key) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300')}>
                  {checkedSteps.has(key) && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={cn('text-sm flex-1 min-w-0', checkedSteps.has(key) ? 'line-through text-gray-400' : 'text-gray-700')}>{step}</span>
                {appt.services.length > 1 && <span className="text-[10px] text-gray-300 shrink-0">{svcName}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <p className="text-xs text-muted mb-1.5">Notas internas</p>
        <div className="relative">
          <textarea
            className="input resize-none text-sm pr-16"
            rows={2}
            placeholder="Preferencias, alergias, observaciones..."
            value={apptNotes}
            onChange={e => setApptNotes(e.target.value)}
          />
          {apptNotes !== (appt.notes ?? '') && (
            <button
              onClick={async () => {
                setSavingNotes(true);
                try { await appointmentsApi.update(appt.id, { notes: apptNotes }); qc.invalidateQueries({ queryKey: ['appointments'] }); toast('Notas guardadas', 'success'); }
                finally { setSavingNotes(false); }
              }}
              disabled={savingNotes}
              className="absolute right-2 bottom-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Guardar'}
            </button>
          )}
        </div>
      </div>

      {/* ── Design proposal section ── */}
      <div className="border-t border-edge pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-gray-800">Propuesta de diseños</p>
          </div>
          {!appt.approvedDesignId && (
            <button onClick={() => setShowPropose(true)}
              className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> {proposedIds.length > 0 ? 'Cambiar' : 'Proponer'}
            </button>
          )}
        </div>

        {appt.approvedDesignId ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Diseño aprobado por cliente</p>
              <p className="text-xs text-emerald-600">ID: {appt.approvedDesignId.slice(0, 12)}…</p>
            </div>
          </div>
        ) : proposedIds.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted">{proposedIds.length} diseños propuestos · esperando respuesta del cliente</p>
            {shareUrl && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-surface border border-edge rounded-xl px-3 py-2">
                  <Link2 className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="text-xs text-muted truncate">{shareUrl}</span>
                </div>
                <button onClick={() => navigator.clipboard.writeText(shareUrl).then(() => toast('Enlace copiado', 'success'))}
                  className="p-2 bg-surface border border-edge rounded-xl hover:border-primary/40 transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted" />
                </button>
                <a href={`https://wa.me/${appt.client.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${appt.client.name}! Te compartimos tu propuesta de diseños: ${shareUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                </a>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2 bg-surface border border-edge rounded-xl hover:border-primary/40 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-muted" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted italic">Sin propuesta aún. Haz clic en "Proponer" para seleccionar diseños y compartirlos con el cliente.</p>
        )}
      </div>

      {/* Status */}
      <div>
        <p className="text-xs text-muted mb-2">Estado</p>
        <div className="flex flex-wrap gap-2">
          {['SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].map(s => (
            <button key={s} onClick={() => updateStatus.mutate(s)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all', appt.status === s ? STATUS_COLORS[s] + ' ring-2 ring-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── No-show recovery ── */}
      {appt.status === 'NO_SHOW' && appt.client.phone && (
        <div className="border-t border-edge pt-4">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-sm font-semibold text-orange-800">No asistió — enviar mensaje de recuperación</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${appt.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${appt.client.name.split(' ')[0]}! 💅 Notamos que no pudiste asistir a tu cita hoy. ¿Todo bien? Nos encantaría reagendarte cuando puedas. Escríbenos y con gusto encontramos un nuevo horario para ti.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-xl hover:bg-green-600 transition-colors">
                <Phone className="w-3.5 h-3.5" /> Mensaje WA
              </a>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const d = format(tomorrow, 'yyyy-MM-dd');
                  onClose();
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('beautyos:quickbook', { detail: { clientId: appt.client.id, date: d } }));
                  }, 200);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-xl hover:bg-primary/20 transition-colors">
                <CalendarDays className="w-3.5 h-3.5" /> Reagendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment section ── */}
      <div className="border-t border-edge pt-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-semibold text-gray-800">Pago</p>
        </div>

        {appt.payment ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">
                  {formatCOP(appt.payment.amount)}
                  {(appt.payment.tipAmount ?? 0) > 0 && (
                    <span className="ml-2 text-xs font-medium text-emerald-600">+ {formatCOP(appt.payment.tipAmount!)} propina</span>
                  )}
                </p>
                <p className="text-xs text-emerald-600">{PAYMENT_LABELS[appt.payment.method] ?? appt.payment.method}</p>
              </div>
              <button
                onClick={() => printReceipt(appt, { amount: appt.payment!.amount, method: appt.payment!.method as PaymentMethod, notes: '' }, user?.business?.name)}
                className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:text-emerald-900 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-100">
                <Printer className="w-3.5 h-3.5" /> Recibo
              </button>
            </div>
          </div>
        ) : justPaid ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">{formatCOP(amountAfterDiscount)}</p>
                <p className="text-xs text-emerald-600">{PAYMENT_LABELS[payMethod]}{pointsToRedeem > 0 ? ` · -${pointsToRedeem} pts` : ''}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => printReceipt(appt, { amount: amountAfterDiscount, method: payMethod, notes: payNotes }, user?.business?.name)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
                <Printer className="w-4 h-4" /> Imprimir recibo
              </button>
              <button onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Total a cobrar</p>
              <div className="text-right">
                {discount > 0 && (
                  <p className="text-xs text-gray-400 line-through leading-none mb-0.5">{formatCOP(appt.totalPrice)}</p>
                )}
                <p className="font-bold text-gray-900">{formatCOP(amountAfterDiscount)}</p>
                {promoDiscount > 0 && (
                  <p className="text-[10px] text-emerald-600">Promo −{formatCOP(promoDiscount)}</p>
                )}
              </div>
            </div>

            {/* Points redemption */}
            {clientPoints > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-amber-700">Puntos del cliente</p>
                  <span className="text-xs font-bold text-amber-700">
                    {clientPoints.toLocaleString()} pts · vale {formatCOP(clientPoints * 100)}
                  </span>
                </div>
                {maxRedeemable > 0 ? (
                  <>
                    <input type="range" min={0} max={maxRedeemable} step={1}
                      value={pointsToRedeem}
                      onChange={e => setPointsToRedeem(Number(e.target.value))}
                      className="w-full accent-amber-500" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600">
                        {pointsToRedeem > 0 ? `Canjear ${pointsToRedeem} pts → -${formatCOP(discount)}` : 'Desliza para canjear puntos'}
                      </span>
                      {pointsToRedeem > 0 && (
                        <button onClick={() => setPointsToRedeem(0)} className="text-amber-500 hover:text-amber-700 underline">Quitar</button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-amber-500 italic">Los puntos cubren más del total — se usará el máximo automáticamente.</p>
                )}
              </div>
            )}

            {/* Promo code */}
            <div className="space-y-1.5">
              {promoData ? (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-800">{promoData.code} — −{formatCOP(promoData.discount)}</p>
                    {promoData.description && <p className="text-[10px] text-emerald-600">{promoData.description}</p>}
                  </div>
                  <button onClick={() => { setPromoData(null); setPromoCode(''); setPromoError(''); }}
                    className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className="input text-sm uppercase py-1.5 flex-1"
                    placeholder="Código promocional"
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && promoCode.trim()) {
                        setPromoLoading(true);
                        try {
                          const res = await promoCodesApi.lookup(promoCode.trim(), appt.totalPrice);
                          setPromoData(res.data);
                          setPromoError('');
                        } catch (err: any) {
                          setPromoError(err.response?.data?.error ?? 'Código inválido');
                        } finally { setPromoLoading(false); }
                      }
                    }}
                  />
                  <button
                    disabled={!promoCode.trim() || promoLoading}
                    onClick={async () => {
                      setPromoLoading(true);
                      try {
                        const res = await promoCodesApi.lookup(promoCode.trim(), appt.totalPrice);
                        setPromoData(res.data);
                        setPromoError('');
                      } catch (err: any) {
                        setPromoError(err.response?.data?.error ?? 'Código inválido');
                      } finally { setPromoLoading(false); }
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40">
                    {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-500">{promoError}</p>}
            </div>

            {/* Gift card lookup — shown when GIFT_CARD method is selected */}
            {payMethod === 'GIFT_CARD' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-purple-700">Tarjeta regalo</p>
                {giftCardData ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-purple-800">{giftCardData.code}</p>
                        {giftCardData.recipientName && <p className="text-[10px] text-purple-600">{giftCardData.recipientName}</p>}
                      </div>
                      <p className="text-xs font-bold text-purple-800 shrink-0">Saldo: {formatCOP(giftCardData.balance)}</p>
                      <button
                        onClick={() => { setGiftCardData(null); setGiftCardCode(''); setGiftCardError(''); }}
                        className="p-1 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {giftCardCoverage < amountAfterDiscount ? (
                      <p className="text-[11px] text-orange-600">
                        Cubre {formatCOP(giftCardCoverage)} · resta {formatCOP(remainingAfterGiftCard)} por otro medio
                      </p>
                    ) : (
                      <p className="text-[11px] text-purple-600">Cubre el total ({formatCOP(giftCardCoverage)})</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        className="input text-sm uppercase py-1.5 flex-1"
                        placeholder="Código (ej. ABCD-EFGH-1234)"
                        value={giftCardCode}
                        onChange={e => { setGiftCardCode(e.target.value.toUpperCase()); setGiftCardError(''); }}
                        onKeyDown={async e => {
                          if (e.key !== 'Enter' || !giftCardCode.trim()) return;
                          setGiftCardLoading(true);
                          try {
                            const res = await giftCardsApi.lookup(giftCardCode.trim());
                            if (!res.data.isActive) { setGiftCardError('Tarjeta inactiva'); return; }
                            if (res.data.balance <= 0) { setGiftCardError('Sin saldo disponible'); return; }
                            setGiftCardData(res.data); setGiftCardError('');
                          } catch (err: any) {
                            setGiftCardError(err.response?.data?.error ?? 'Tarjeta no encontrada');
                          } finally { setGiftCardLoading(false); }
                        }}
                      />
                      <button
                        disabled={!giftCardCode.trim() || giftCardLoading}
                        onClick={async () => {
                          setGiftCardLoading(true);
                          try {
                            const res = await giftCardsApi.lookup(giftCardCode.trim());
                            if (!res.data.isActive) { setGiftCardError('Tarjeta inactiva'); return; }
                            if (res.data.balance <= 0) { setGiftCardError('Sin saldo disponible'); return; }
                            setGiftCardData(res.data); setGiftCardError('');
                          } catch (err: any) {
                            setGiftCardError(err.response?.data?.error ?? 'Tarjeta no encontrada');
                          } finally { setGiftCardLoading(false); }
                        }}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-200 transition-colors disabled:opacity-40">
                        {giftCardLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                      </button>
                    </div>
                    {giftCardError && <p className="text-xs text-red-500">{giftCardError}</p>}
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(['CASH','CARD','NEQUI','DAVIPLATA','TRANSFER','GIFT_CARD'] as PaymentMethod[]).map(m => {
                const Icon = METHOD_ICONS[m];
                return (
                  <button key={m} onClick={() => {
                    setPayMethod(m);
                    if (m !== 'GIFT_CARD') { setGiftCardData(null); setGiftCardCode(''); setGiftCardError(''); }
                  }}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all',
                      payMethod === m ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}>
                    <Icon className="w-4 h-4" />
                    {PAYMENT_LABELS[m]}
                  </button>
                );
              })}
            </div>
            {/* Tip */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Propina (opcional)</p>
                {tipAmount > 0 && <span className="text-xs font-semibold text-emerald-600">{formatCOP(tipAmount)}</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[0, 2000, 5000, 10000, 20000].map(t => (
                  <button key={t} onClick={() => setTipAmount(t)}
                    className={cn('px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                      tipAmount === t
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}>
                    {t === 0 ? 'Sin propina' : formatCOP(t)}
                  </button>
                ))}
                <input
                  type="number" min={0} step={1000}
                  placeholder="Otro"
                  value={tipAmount > 0 && ![2000,5000,10000,20000].includes(tipAmount) ? tipAmount : ''}
                  onChange={e => setTipAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="input text-xs w-24 py-1.5"
                />
              </div>
            </div>

            <input className="input text-sm" placeholder="Notas (opcional)"
              value={payNotes} onChange={e => setPayNotes(e.target.value)} />
            <button
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
              {payMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><CheckCircle2 className="w-4 h-4" /> Cobrar {formatCOP(amountAfterDiscount)}{tipAmount > 0 ? ` + ${formatCOP(tipAmount)} propina` : ''}</>}
            </button>
            {pointsToEarn > 0 && (
              <p className="text-[11px] text-center text-amber-600">
                +{pointsToEarn} puntos de fidelidad por este pago
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Satisfaction rating (shown when completed) ── */}
      {(appt.status === 'COMPLETED' || justPaid) && (
        <div className="border-t border-edge pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⭐</span>
            <p className="text-sm font-semibold text-gray-800">Calificación del servicio</p>
            {appt.rating && (
              <span className="ml-auto text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Guardada: {appt.rating}★
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setRatingHover(star)}
                onMouseLeave={() => setRatingHover(0)}
                onClick={() => setRatingValue(star)}
                className="transition-transform hover:scale-110 active:scale-95">
                <svg viewBox="0 0 24 24" className={cn('w-8 h-8 transition-colors',
                  star <= (ratingHover || ratingValue)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-100 text-gray-300'
                )}>
                  <path stroke="currentColor" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
            {ratingValue > 0 && (
              <span className="ml-1 text-sm text-amber-600 font-semibold">
                {['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'][ratingValue]}
              </span>
            )}
          </div>
          {ratingValue > 0 && (
            <div className="space-y-2">
              <input
                className="input text-sm py-1.5"
                placeholder="Nota opcional (ej: cliente muy satisfecha)"
                value={ratingNote}
                onChange={e => setRatingNote(e.target.value)}
              />
              <button
                onClick={() => ratingMutation.mutate()}
                disabled={ratingMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
                {ratingMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>{ratingValue === (appt.rating ?? 0) ? 'Actualizar' : 'Guardar'} calificación</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Photos section ── */}
      <PhotosSection apptId={appt.id} />

      {/* Recurrence info + cancel series */}
      {appt.recurrenceGroupId && (
        <div className="border-t border-edge pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-gray-600 font-medium">
                Cita recurrente ·{' '}
                {appt.recurrenceRule === 'WEEKLY' ? 'cada semana' :
                 appt.recurrenceRule === 'BIWEEKLY' ? 'cada 2 semanas' :
                 appt.recurrenceRule === 'MONTHLY' ? 'cada mes' : appt.recurrenceRule}
              </span>
            </div>
            {!appt.payment && (
              <button
                onClick={() => {
                  if (confirm('¿Cancelar esta cita y todas las futuras de la serie?')) {
                    appointmentsApi.cancelSeries(appt.id).then(() => {
                      qc.invalidateQueries({ queryKey: ['appointments'] });
                      toast('Serie cancelada', 'success');
                      onClose();
                    }).catch(() => toast('Error al cancelar serie', 'error'));
                  }
                }}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                Cancelar serie →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete appointment */}
      {!appt.payment && ['SCHEDULED', 'CONFIRMED'].includes(appt.status) && (
        <div className="border-t border-edge pt-4">
          <button
            onClick={() => {
              if (confirm(`¿Eliminar la cita de ${appt.client.name}? Esta acción no se puede deshacer.`)) {
                appointmentsApi.delete(appt.id).then(() => {
                  qc.invalidateQueries({ queryKey: ['appointments'] });
                  toast('Cita eliminada', 'success');
                  onClose();
                }).catch(() => toast('Error al eliminar', 'error'));
              }
            }}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar cita
          </button>
        </div>
      )}

      {/* Propose modal (inline in the detail panel via nested modal) */}
      <Modal open={showPropose} onClose={() => setShowPropose(false)} title="Proponer diseños" size="xl">
        <ProposeDesignsModal appointment={appt} onClose={() => setShowPropose(false)} />
      </Modal>
    </div>
  );
}

// ── Booking Requests Panel ────────────────────────────────────────────
type ConfirmedReq = { clientName: string; clientPhone: string; date: string; timeSlot: string; svcName?: string };

function BookingRequestsPanel({ onConverted }: { onConverted?: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [waTarget, setWaTarget] = useState<ConfirmedReq | null>(null);

  const { data: requests = [], isLoading } = useQuery<(BookingRequest & { service?: { name: string } })[]>({
    queryKey: ['booking-requests'],
    queryFn: () => appointmentsApi.bookingRequests().then(r => r.data),
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => appointmentsApi.updateBookingRequest(id, status),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['booking-requests'] });
      if (vars.status === 'ACCEPTED') {
        const r = requests.find(x => x.id === vars.id);
        if (r) setWaTarget({ clientName: r.clientName, clientPhone: r.clientPhone, date: r.date, timeSlot: r.timeSlot, svcName: r.service?.name });
      }
      toast('Solicitud actualizada', 'success');
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.convertBookingRequest(id),
    onSuccess: (_res, id) => {
      const r = requests.find(x => x.id === id);
      qc.invalidateQueries({ queryKey: ['booking-requests'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast('¡Cita creada exitosamente!', 'success');
      if (r) setWaTarget({ clientName: r.clientName, clientPhone: r.clientPhone, date: r.date, timeSlot: r.timeSlot, svcName: r.service?.name });
      onConverted?.();
    },
    onError: () => toast('Error al crear la cita', 'error'),
  });

  const pending = requests.filter(r => r.status === 'PENDING');
  const others = requests.filter(r => r.status !== 'PENDING');

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (requests.length === 0) return (
    <div className="text-center py-12">
      <Bell className="w-12 h-12 mx-auto text-gray-200 mb-3" />
      <p className="text-gray-400 text-sm">Sin solicitudes de cita</p>
      <p className="text-xs text-gray-300 mt-1">Las solicitudes del portal de clientes aparecerán aquí</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* WhatsApp confirmation banner */}
      {waTarget && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900 mb-0.5">¿Notificar a {waTarget.clientName}?</p>
            <p className="text-xs text-emerald-600 mb-2">Cita el {waTarget.date} a las {waTarget.timeSlot}</p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${waTarget.clientPhone.replace(/\D/g,'')}?text=${encodeURIComponent(`¡Hola ${waTarget.clientName}! 💅 Tu cita${waTarget.svcName ? ` de ${waTarget.svcName}` : ''} está confirmada para el ${waTarget.date} a las ${waTarget.timeSlot}. ¡Te esperamos!`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-green-600 transition-colors">
                <Phone className="w-3.5 h-3.5" /> Enviar por WhatsApp
              </a>
              <button onClick={() => setWaTarget(null)} className="text-xs text-emerald-600 hover:text-emerald-800 px-2">
                Omitir
              </button>
            </div>
          </div>
          <button onClick={() => setWaTarget(null)} className="text-emerald-400 hover:text-emerald-600 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" /> Pendientes ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="bg-white border border-edge rounded-2xl p-4 flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{r.clientName}</p>
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {r.clientPhone}
                        {r.clientEmail && <><span className="text-gray-200">·</span><Mail className="w-3 h-3" />{r.clientEmail}</>}
                      </p>
                    </div>
                    <span className="text-xs text-muted">{format(parseISO(r.createdAt), "d MMM HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs bg-surface border border-edge px-2 py-0.5 rounded-lg">
                      📅 {r.date} · {r.timeSlot}
                    </span>
                    {r.service && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-medium">{r.service.name}</span>}
                    {(() => {
                      const pkgMatch = r.notes?.match(/\[paquete:\s*([^\]]+)\]/);
                      const cleanNotes = r.notes?.replace(/\[paquete:[^\]]+\]\s*/,'').trim();
                      return <>
                        {pkgMatch && (
                          <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                            <Package2 className="w-3 h-3" /> {pkgMatch[1]}
                          </span>
                        )}
                        {cleanNotes && <span className="text-xs text-muted italic truncate max-w-[180px]">"{cleanNotes}"</span>}
                      </>;
                    })()}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateMutation.mutate({ id: r.id, status: 'ACCEPTED' })}
                      disabled={updateMutation.isPending}
                      className="flex-1 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Aceptar
                    </button>
                    <button onClick={() => convertMutation.mutate(r.id)}
                      disabled={convertMutation.isPending}
                      className="flex-1 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                      {convertMutation.isPending && convertMutation.variables === r.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CalendarPlus className="w-3.5 h-3.5" />} Crear cita
                    </button>
                    <button onClick={() => updateMutation.mutate({ id: r.id, status: 'REJECTED' })}
                      disabled={updateMutation.isPending}
                      className="py-1.5 px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Historial</h3>
          <div className="space-y-1.5">
            {others.slice(0, 10).map(r => (
              <div key={r.id} className="bg-white border border-edge rounded-xl px-4 py-2.5 flex items-center gap-3">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0', REQUEST_COLORS[r.status] ?? 'bg-gray-50 text-gray-500 border-gray-200')}>
                  {r.status === 'ACCEPTED' ? 'Aceptada' : r.status === 'REJECTED' ? 'Rechazada' : r.status === 'CONVERTED' ? '✓ Agendada' : r.status}
                </span>
                <p className="text-sm text-gray-700 font-medium flex-1 truncate">{r.clientName}</p>
                <span className="text-xs text-muted shrink-0">{r.date} · {r.timeSlot}</span>
                {r.status === 'ACCEPTED' && (
                  <button onClick={() => convertMutation.mutate(r.id)}
                    disabled={convertMutation.isPending}
                    className="shrink-0 flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50">
                    <CalendarPlus className="w-3 h-3" /> Crear cita
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Appointment item (calendar cell) ─────────────────────────────────

interface ApptPkg { id: string; name: string; price: number; duration: number; services: Array<{ service: { id: string; name: string; price: number; duration: number } }> }

function NewAppointmentForm({ onClose, initialClientId }: { onClose: () => void; initialClientId?: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ clientId: initialClientId ?? '', professionalId: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', serviceIds: [] as string[], notes: '', recurrence: 'NONE', occurrences: '8' });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const [serviceTab, setServiceTab] = useState<'services' | 'packages'>('services');
  const [selectedPackage, setSelectedPackage] = useState<ApptPkg | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ['clients'], queryFn: () => clientsApi.list().then(r => r.data) });
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ['services'], queryFn: () => servicesApi.list().then(r => r.data) });
  const { data: staff = [] } = useQuery<{ id: string; name: string; role: string; workDays?: number[] }[]>({ queryKey: ['staff'], queryFn: () => staffApi.list().then(r => r.data) });
  const { data: packages = [] } = useQuery<ApptPkg[]>({ queryKey: ['packages'], queryFn: () => packagesApi.list().then(r => r.data) });

  const selectedProf = staff.find(s => s.id === form.professionalId);
  const selectedDow  = form.date ? new Date(form.date + 'T12:00:00').getDay() : -1;
  const isDayOff = !!(selectedProf?.workDays && selectedDow >= 0 && !selectedProf.workDays.includes(selectedDow));
  const DAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Auto-compute endTime from startTime + selected services' total duration
  useEffect(() => {
    const total = selectedPackage
      ? selectedPackage.duration
      : services.filter(s => form.serviceIds.includes(s.id)).reduce((acc, s) => acc + s.duration, 0);
    if (!total) return;
    const [h, m] = form.startTime.split(':').map(Number);
    const endMin = h * 60 + m + total;
    const endH = Math.floor(endMin / 60) % 24;
    const endM = endMin % 60;
    set('endTime', `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
  }, [form.serviceIds, form.startTime, selectedPackage]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = useMutation({
    mutationFn: (data: object) => appointmentsApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      const count = (res.data as any).count;
      toast(count > 1 ? `${count} citas recurrentes creadas` : 'Cita creada exitosamente', 'success');
      onClose();
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al crear cita', 'error'),
  });

  const toggleService = (id: string) => {
    setSelectedPackage(null);
    set('serviceIds', form.serviceIds.includes(id) ? form.serviceIds.filter(x => x !== id) : [...form.serviceIds, id]);
  };

  const applyPackage = (pkg: ApptPkg) => {
    setSelectedPackage(pkg);
    set('serviceIds', pkg.services.map(s => s.service.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (selectedPackage) payload.packagePrice = selectedPackage.price;
    createMutation.mutate(payload);
  };

  const selectedClient = clients.find(c => c.id === form.clientId);
  const noShowWarning = (selectedClient?.noShowCount ?? 0) >= 2;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Cliente *</label>
          <select className="input" value={form.clientId} onChange={e => set('clientId', e.target.value)} required>
            <option value="">Seleccionar cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}{(c.noShowCount ?? 0) >= 2 ? ` ⚠ ${c.noShowCount} no-show${c.noShowCount !== 1 ? 's' : ''}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Profesional</label>
          <select className="input" value={form.professionalId} onChange={e => set('professionalId', e.target.value)}>
            <option value="">Yo (por defecto)</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      {noShowWarning && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              {selectedClient?.name} tiene {selectedClient!.noShowCount} no-show{selectedClient!.noShowCount !== 1 ? 's' : ''} registrado{selectedClient!.noShowCount !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">Considera solicitar confirmación previa antes de reservar.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Fecha *</label>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Inicio *</label>
          <input className="input" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Fin *</label>
          <input className="input" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} required />
        </div>
      </div>
      {isDayOff && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong>{selectedProf?.name}</strong> no tiene programado trabajar los{' '}
            {DAY_NAMES_ES[selectedDow]}. Puedes crear la cita de todos modos.
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium text-gray-700">Servicios / Paquetes</label>
          <div className="ml-auto flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button type="button" onClick={() => setServiceTab('services')}
              className={cn('px-2.5 py-1 transition-colors', serviceTab === 'services' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700')}>
              Servicios
            </button>
            <button type="button" onClick={() => setServiceTab('packages')}
              className={cn('px-2.5 py-1 transition-colors', serviceTab === 'packages' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700')}>
              Paquetes {packages.length > 0 && <span className="ml-0.5 opacity-70">({packages.length})</span>}
            </button>
          </div>
        </div>

        {serviceTab === 'services' ? (
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto scrollbar-hide">
            {services.map(s => (
              <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                className={cn('text-left p-2 rounded-xl border text-sm transition-all',
                  form.serviceIds.includes(s.id) && !selectedPackage
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                <p className="font-medium truncate">{s.name}</p>
                <p className="text-xs opacity-70">{formatCOP(s.price)} · {s.duration}min</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
            {packages.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No hay paquetes creados aún</p>
            ) : packages.map(pkg => {
              const selected = selectedPackage?.id === pkg.id;
              const sumOriginal = pkg.services.reduce((a, s) => a + s.service.price, 0);
              const discount = sumOriginal > 0 ? Math.round((1 - pkg.price / sumOriginal) * 100) : 0;
              return (
                <button key={pkg.id} type="button" onClick={() => applyPackage(pkg)}
                  className={cn('w-full text-left p-2.5 rounded-xl border text-sm transition-all',
                    selected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('font-medium', selected ? 'text-primary' : 'text-gray-800')}>{pkg.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {discount > 0 && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1 rounded">-{discount}%</span>}
                      <span className="text-xs font-bold text-primary">{formatCOP(pkg.price)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {pkg.services.map(s => s.service.name).join(' + ')}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {selectedPackage && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5">
            <Package2 className="w-3 h-3 shrink-0" />
            <span>Paquete: <strong>{selectedPackage.name}</strong> · {formatCOP(selectedPackage.price)}</span>
            <button type="button" onClick={() => { setSelectedPackage(null); set('serviceIds', []); }}
              className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones especiales..." />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Repetición</label>
        <div className="flex gap-2">
          <select className="input flex-1" value={form.recurrence} onChange={e => set('recurrence', e.target.value)}>
            <option value="NONE">Sin repetición</option>
            <option value="WEEKLY">Cada semana</option>
            <option value="BIWEEKLY">Cada 2 semanas</option>
            <option value="MONTHLY">Cada mes</option>
          </select>
          {form.recurrence !== 'NONE' && (
            <select className="input w-32" value={form.occurrences} onChange={e => set('occurrences', e.target.value)}>
              {[4, 6, 8, 10, 12, 16, 20, 26].map(n => (
                <option key={n} value={n}>{n} veces</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
          {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Crear cita'}
        </button>
      </div>
    </form>
  );
}

function printDaySchedule(date: Date, appointments: Appointment[], bizName?: string) {
  const dateStr = format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Agenda – ${dateStr}</title>
  <style>
    body{font-family:sans-serif;color:#1a1a1a;max-width:700px;margin:0 auto;padding:24px}
    h1{font-size:18px;font-weight:bold;margin-bottom:4px}
    p.sub{color:#666;font-size:13px;margin:0 0 20px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e5e7eb;padding:6px 8px}
    td{padding:8px;border-bottom:1px solid #f3f4f6;font-size:13px;vertical-align:top}
    tr:last-child td{border-bottom:none}
    .status{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600}
    .SCHEDULED{background:#dbeafe;color:#1d4ed8} .CONFIRMED{background:#d1fae5;color:#065f46}
    .IN_PROGRESS{background:#ede9fe;color:#5b21b6} .COMPLETED{background:#f3f4f6;color:#6b7280}
    @media print{body{padding:0}}
  </style></head><body>
  <h1>${bizName ? `${bizName} — ` : ''}Agenda del día</h1>
  <p class="sub">${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} · ${sorted.length} citas</p>
  ${sorted.length === 0 ? '<p style="color:#aaa;text-align:center;padding:40px 0">Sin citas para este día</p>' : `
  <table>
    <thead><tr><th>Hora</th><th>Cliente</th><th>Servicios</th><th>Total</th><th>Estado</th></tr></thead>
    <tbody>
    ${sorted.map(a => `
      <tr>
        <td style="font-weight:600;white-space:nowrap">${a.startTime}–${a.endTime}</td>
        <td>${a.client.name}${a.client.phone ? `<br><span style="color:#888;font-size:11px">${a.client.phone}</span>` : ''}</td>
        <td style="color:#555">${a.services.map(s => s.service.name).join(', ') || '—'}</td>
        <td style="font-weight:600">$${a.totalPrice.toLocaleString('es-CO')}</td>
        <td><span class="status ${a.status}">${STATUS_LABELS[a.status] ?? a.status}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>`}
  <p style="margin-top:24px;font-size:11px;color:#aaa;text-align:right">Impreso desde BeautyOS · ${new Date().toLocaleString('es-CO')}</p>
  </body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

function printReceipt(
  appt: Appointment,
  payment: { amount: number; method: PaymentMethod; notes: string },
  bizName?: string,
) {
  const dateStr = format(parseISO(appt.date), "d 'de' MMMM 'de' yyyy", { locale: es });
  const receiptId = appt.id.slice(-6).toUpperCase();
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo ${receiptId}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:sans-serif;color:#1a1a1a;max-width:320px;margin:0 auto;padding:24px 16px;font-size:13px}
    .center{text-align:center}
    .logo{font-size:20px;font-weight:800;color:#2DC7B3;margin-bottom:2px}
    .sub{color:#888;font-size:11px;margin-bottom:16px}
    .divider{border:none;border-top:1px dashed #d1d5db;margin:12px 0}
    .row{display:flex;justify-content:space-between;margin-bottom:6px}
    .label{color:#666}
    .services{margin:10px 0}
    .svc-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f3f4f6}
    .svc-row:last-child{border-bottom:none}
    .total-row{display:flex;justify-content:space-between;font-weight:700;font-size:15px;margin-top:10px;padding-top:8px;border-top:2px solid #1a1a1a}
    .badge{display:inline-block;background:#d1fae5;color:#065f46;font-size:11px;font-weight:600;padding:3px 10px;border-radius:9999px;margin-top:10px}
    .footer{margin-top:20px;font-size:10px;color:#aaa;text-align:center}
    @media print{body{padding:8px}}
  </style></head><body>
  <div class="center">
    <p class="logo">${bizName ?? 'BeautyOS'}</p>
    <p class="sub">Recibo de pago #${receiptId}</p>
  </div>
  <hr class="divider">
  <div class="row"><span class="label">Cliente</span><span>${appt.client.name}</span></div>
  <div class="row"><span class="label">Fecha</span><span>${dateStr}</span></div>
  <div class="row"><span class="label">Hora</span><span>${appt.startTime}–${appt.endTime}</span></div>
  <hr class="divider">
  <div class="services">
    ${appt.services.map(s => `<div class="svc-row"><span>${s.service.name}</span><span>$${s.service.price.toLocaleString('es-CO')}</span></div>`).join('')}
    ${appt.services.length === 0 ? '<p style="color:#aaa;font-size:12px">Sin servicios registrados</p>' : ''}
  </div>
  <div class="total-row"><span>Total</span><span>$${payment.amount.toLocaleString('es-CO')}</span></div>
  <div class="center">
    <span class="badge">✔ ${payment.method === 'CASH' ? 'Efectivo' : payment.method === 'CARD' ? 'Tarjeta' : payment.method === 'NEQUI' ? 'Nequi' : payment.method === 'DAVIPLATA' ? 'Daviplata' : 'Transferencia'}</span>
  </div>
  ${payment.notes ? `<p style="margin-top:10px;font-size:11px;color:#666">Nota: ${payment.notes}</p>` : ''}
  <p class="footer">Impreso desde BeautyOS · ${new Date().toLocaleString('es-CO')}</p>
  </body></html>`;
  const win = window.open('', '_blank', 'width=400,height=600');
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

// ── Time-grid calendar ────────────────────────────────────────────────
const HOUR_START = 8;
const HOUR_END   = 20;
const PX_PER_MIN = 1.1; // 66px per hour

function minsFromMidnight(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

const APPT_COLORS: Record<string, string> = {
  SCHEDULED:   'bg-blue-400 hover:bg-blue-500',
  CONFIRMED:   'bg-emerald-400 hover:bg-emerald-500',
  IN_PROGRESS: 'bg-violet-400 hover:bg-violet-500',
  COMPLETED:   'bg-gray-400 hover:bg-gray-500',
  CANCELLED:   'bg-red-300 hover:bg-red-400 opacity-60',
  NO_SHOW:     'bg-orange-300 hover:bg-orange-400 opacity-60',
};

interface StaffCol { id: string; name: string; avatar?: string | null }

function TimeGrid({
  appointments, days, staffMembers, timeBlocks, onSelect, onAddBlock, onDeleteBlock,
  waitlistCounts, onWaitlistClick, onStatusChange,
}: {
  appointments: Appointment[];
  days: Date[];
  staffMembers?: StaffCol[];
  timeBlocks?: TimeBlock[];
  onSelect: (a: Appointment) => void;
  onAddBlock?: (staffId: string, date: Date) => void;
  onDeleteBlock?: (id: string) => void;
  waitlistCounts?: Record<string, number>;
  onWaitlistClick?: (date: Date) => void;
  onStatusChange?: (id: string, status: string) => void;
}) {
  const isStaffMode = !!staffMembers?.length;
  const totalMins   = (HOUR_END - HOUR_START) * 60;
  const totalHeight = Math.round(totalMins * PX_PER_MIN);
  const hours       = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

  const getApptsByDay = (day: Date) =>
    appointments.filter(a => isSameDay(parseISO(a.date), day));

  const getApptsByStaff = (staffId: string) =>
    appointments.filter(a => a.professional?.id === staffId);

  const getBlocksByStaff = (staffId: string) =>
    (timeBlocks ?? []).filter(b => b.user.id === staffId);

  const getBlocksByDay = (day: Date) =>
    (timeBlocks ?? []).filter(b => isSameDay(parseISO(b.date), day));

  // Current-time indicator
  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const nowTop   = (nowMins - HOUR_START * 60) * PX_PER_MIN;
  const showNow  = nowMins >= HOUR_START * 60 && nowMins <= HOUR_END * 60;

  return (
    <div className="flex overflow-x-auto rounded-2xl border border-gray-100 bg-white select-none">
      {/* Time label gutter */}
      <div className="shrink-0 w-12 border-r border-gray-100">
        {/* Blank header row */}
        <div className="h-10 border-b border-gray-100" />
        <div className="relative" style={{ height: totalHeight }}>
          {hours.map(h => (
            <div key={h} className="absolute w-full flex items-center justify-end pr-2"
              style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN - 7 }}>
              <span className="text-[9px] text-gray-300 font-medium tabular-nums">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Columns — day / week / staff-column view */}
      {(() => {
        const todayForStaff = days.length > 0 && isSameDay(days[0], new Date());
        const cols = isStaffMode
          ? (staffMembers ?? []).map(s => ({
              key: s.id,
              isToday: todayForStaff,
              appts: getApptsByStaff(s.id),
              blocks: getBlocksByStaff(s.id),
              header: (
                <div className="flex flex-col items-center gap-0.5 py-1 relative group w-full px-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0">
                    {s.avatar
                      ? <img src={s.avatar} alt="" className="w-full h-full object-cover" />
                      : s.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <p className="text-[9px] font-semibold text-gray-700 truncate max-w-[72px] text-center leading-tight">
                    {s.name.split(' ')[0]}
                  </p>
                  {onAddBlock && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddBlock(s.id, days[0] ?? new Date()); }}
                      title="Bloquear horario"
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gray-100 hover:bg-amber-100 hover:text-amber-600 text-gray-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ),
            }))
          : days.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const wCount = waitlistCounts?.[dayKey] ?? 0;
              return {
                key: day.toISOString(),
                isToday: isSameDay(day, new Date()),
                appts: getApptsByDay(day),
                blocks: getBlocksByDay(day),
                header: (
                  <>
                    <p className={cn('text-[9px] font-bold uppercase tracking-widest', isSameDay(day, new Date()) ? 'text-white/70' : 'text-gray-400')}>
                      {format(day, 'EEE', { locale: es })}
                    </p>
                    <p className={cn('text-sm font-bold leading-none', isSameDay(day, new Date()) ? 'text-white' : 'text-gray-800')}>
                      {format(day, 'd')}
                    </p>
                    {wCount > 0 && onWaitlistClick && (
                      <button
                        onClick={e => { e.stopPropagation(); onWaitlistClick(day); }}
                        title={`${wCount} en lista de espera`}
                        className="mt-0.5 flex items-center gap-0.5 bg-amber-400 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none hover:bg-amber-500 transition-colors">
                        {wCount}
                      </button>
                    )}
                  </>
                ),
              };
            });

        return (
          <div className="flex flex-1 min-w-0">
            {cols.map(({ key, isToday, appts: colAppts, blocks: colBlocks, header }) => {
              type Lane = { appt: Appointment; lane: number; totalLanes: number };
              const lanes: Lane[] = [];
              for (const appt of colAppts) {
                const s = minsFromMidnight(appt.startTime);
                const e = minsFromMidnight(appt.endTime);
                const usedLanes = lanes
                  .filter(l => {
                    const ls = minsFromMidnight(l.appt.startTime);
                    const le = minsFromMidnight(l.appt.endTime);
                    return s < le && e > ls;
                  })
                  .map(l => l.lane);
                let lane = 0;
                while (usedLanes.includes(lane)) lane++;
                const totalLanes = lane + 1;
                lanes.filter(l => {
                  const ls = minsFromMidnight(l.appt.startTime);
                  const le = minsFromMidnight(l.appt.endTime);
                  return s < le && e > ls;
                }).forEach(l => { l.totalLanes = Math.max(l.totalLanes, totalLanes); });
                lanes.push({ appt, lane, totalLanes });
              }

              return (
                <div key={key} className={cn(
                  'flex flex-col border-r border-gray-100 last:border-r-0',
                  isStaffMode ? 'min-w-[80px] flex-1' : days.length > 1 ? 'min-w-[90px] flex-1' : 'flex-1',
                )}>
                  {/* Column header */}
                  <div className={cn(
                    'h-10 flex flex-col items-center justify-center border-b border-gray-100 sticky top-0 z-10',
                    isToday && !isStaffMode ? 'bg-primary' : 'bg-white',
                  )}>
                    {header}
                  </div>

                  {/* Time area */}
                  <div className="relative" style={{ height: totalHeight }}>
                    {hours.map(h => (
                      <div key={h}
                        className={cn('absolute left-0 right-0 border-t', h === HOUR_START ? 'border-transparent' : 'border-gray-100')}
                        style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }}
                      />
                    ))}

                    {hours.slice(0, -1).map(h => (
                      <div key={`${h}h`}
                        className="absolute left-0 right-0 border-t border-dashed border-gray-50"
                        style={{ top: ((h - HOUR_START) * 60 + 30) * PX_PER_MIN }}
                      />
                    ))}

                    {isToday && showNow && (
                      <div className="absolute left-0 right-0 z-20 flex items-center"
                        style={{ top: nowTop }}>
                        <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        <div className="flex-1 h-px bg-red-400" />
                      </div>
                    )}

                    {/* Time blocks (unavailable periods) */}
                    {colBlocks.map(block => {
                      const handleBlockClick = () => onDeleteBlock?.(block.id);
                      if (block.isFullDay) {
                        return (
                          <div key={block.id}
                            onClick={handleBlockClick}
                            title={`${block.reason ?? 'Bloqueado'} — clic para eliminar`}
                            className="absolute inset-0 bg-gray-100/90 z-[1] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-200/80 transition-colors"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,.03) 6px,rgba(0,0,0,.03) 12px)' }}>
                            <Lock className="w-4 h-4 text-gray-300" />
                            {block.reason && (
                              <p className="text-[8px] text-gray-400 text-center px-1 leading-tight">{block.reason}</p>
                            )}
                          </div>
                        );
                      }
                      const blockStart = minsFromMidnight(block.startTime);
                      const blockEnd   = minsFromMidnight(block.endTime);
                      const bTop    = Math.max(0, (blockStart - HOUR_START * 60) * PX_PER_MIN);
                      const bHeight = Math.max(8, (blockEnd - blockStart) * PX_PER_MIN);
                      return (
                        <div key={block.id}
                          onClick={handleBlockClick}
                          title={`${block.reason ?? 'Bloqueado'} — clic para eliminar`}
                          className="absolute left-0 right-0 bg-gray-200/70 z-[1] rounded cursor-pointer hover:bg-gray-300/70 transition-colors"
                          style={{ top: bTop, height: bHeight, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,.04) 4px,rgba(0,0,0,.04) 8px)' }}>
                          {bHeight > 16 && (
                            <p className="text-[8px] text-gray-400 px-1 py-0.5 leading-tight truncate">
                              {block.reason ?? 'Bloqueado'}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {lanes.map(({ appt, lane, totalLanes }) => {
                      const startMins = minsFromMidnight(appt.startTime);
                      const endMins   = minsFromMidnight(appt.endTime);
                      const top    = Math.max(0, (startMins - HOUR_START * 60) * PX_PER_MIN);
                      const height = Math.max(18, (endMins - startMins) * PX_PER_MIN - 2);
                      const widthPct  = 100 / totalLanes;
                      const leftPct   = lane * widthPct;
                      return (
                        <div key={appt.id}
                          onClick={() => onSelect(appt)}
                          title={`${appt.client.name} · ${appt.startTime}–${appt.endTime}`}
                          className={cn(
                            'absolute rounded-lg px-1.5 py-1 cursor-pointer transition-all overflow-hidden shadow-sm group/appt',
                            APPT_COLORS[appt.status] ?? 'bg-gray-300',
                          )}
                          style={{ top, height, left: `${leftPct + 1}%`, width: `${widthPct - 2}%` }}>
                          {appt.recurrenceGroupId && (
                            <RefreshCw className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-white/70" />
                          )}
                          <p className="text-[10px] font-bold text-white leading-tight truncate">
                            {appt.client.name}
                          </p>
                          {height > 28 && (
                            <p className="text-[9px] text-white/80 leading-tight truncate">
                              {appt.startTime}
                            </p>
                          )}
                          {height > 44 && appt.services[0] && (
                            <p className="text-[9px] text-white/70 leading-tight truncate">
                              {appt.services[0].service.name}
                            </p>
                          )}
                          {/* Quick-status overlay — visible on hover when actionable */}
                          {onStatusChange && height >= 36 && (appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED' || appt.status === 'IN_PROGRESS') && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/appt:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1 px-1"
                              onClick={e => e.stopPropagation()}>
                              {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') && (
                                <button
                                  onClick={e => { e.stopPropagation(); onStatusChange(appt.id, 'IN_PROGRESS'); }}
                                  title="Iniciar servicio"
                                  className="flex-1 text-[9px] font-bold bg-violet-500 hover:bg-violet-600 text-white rounded-md py-0.5 transition-colors truncate">
                                  ▶ Iniciar
                                </button>
                              )}
                              {appt.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={e => { e.stopPropagation(); onSelect(appt); }}
                                  title="Cobrar"
                                  className="flex-1 text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-0.5 transition-colors truncate">
                                  $ Cobrar
                                </button>
                              )}
                              {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') && (
                                <button
                                  onClick={e => { e.stopPropagation(); onStatusChange(appt.id, 'NO_SHOW'); }}
                                  title="No asistió"
                                  className="flex-1 text-[9px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-md py-0.5 transition-colors truncate">
                                  ✕ N/A
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ── Block Form ────────────────────────────────────────────────────────
function BlockForm({ staffId, staffName, date, onClose }: { staffId: string; staffName: string; date: Date; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: () => timeBlocksApi.create({
      staffId, date: format(date, 'yyyy-MM-dd'), reason: reason || undefined,
      isFullDay, startTime, endTime,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-blocks'] });
      toast('Horario bloqueado', 'success');
      onClose();
    },
  });

  return (
    <div className="space-y-4 pt-1">
      <p className="text-sm text-gray-500">
        Bloquear a <span className="font-semibold text-gray-800">{staffName}</span> el{' '}
        <span className="font-semibold text-gray-800">{format(date, "d 'de' MMMM yyyy", { locale: es })}</span>
      </p>

      <div>
        <label className="label">Motivo (opcional)</label>
        <input className="input" placeholder="Ej: Vacaciones, Capacitación, Cita personal…"
          value={reason} onChange={e => setReason(e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsFullDay(!isFullDay)}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
            isFullDay ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
          <Lock className="w-3.5 h-3.5" />
          Día completo
        </button>
        {!isFullDay && (
          <div className="flex items-center gap-2 flex-1">
            <input type="time" className="input flex-1" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <span className="text-gray-400 text-sm">–</span>
            <input type="time" className="input flex-1" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
        <button onClick={() => create.mutate()} disabled={create.isPending} className="btn-primary flex-1">
          {create.isPending ? 'Guardando…' : 'Bloquear horario'}
        </button>
      </div>
    </div>
  );
}

// ── Waitlist Panel ────────────────────────────────────────────────────
function WaitlistPanel({ date, onClose, onChanged }: { date: string; onClose: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: entries = [], isLoading, refetch } = useQuery<WaitlistEntry[]>({
    queryKey: ['waitlist', date],
    queryFn: () => waitlistApi.list({ date }).then(r => r.data),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => waitlistApi.patch(id, status),
    onSuccess: () => { refetch(); onChanged(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => waitlistApi.delete(id),
    onSuccess: () => { refetch(); onChanged(); toast('Eliminado', 'success'); },
  });

  const STATUS_LABEL: Record<string, string> = {
    WAITING: 'Esperando', NOTIFIED: 'Notificado', BOOKED: 'Agendado', CANCELLED: 'Cancelado',
  };
  const STATUS_COLOR: Record<string, string> = {
    WAITING: 'bg-amber-50 text-amber-700 border-amber-200',
    NOTIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
    BOOKED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Users className="w-10 h-10 mx-auto text-gray-200" />
        <p className="text-sm text-gray-400">Sin personas en lista de espera para este día</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {entries.map((e, idx) => (
        <div key={e.id} className="p-3 bg-surface rounded-2xl border border-edge space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                <p className="text-sm font-semibold text-gray-800 truncate">{e.clientName}</p>
              </div>
              <p className="text-xs text-muted mt-0.5">{e.clientPhone}{e.timeSlot ? ` · Prefiere ${e.timeSlot}` : ''}</p>
              {e.notes && <p className="text-xs text-gray-400 mt-0.5 italic">"{e.notes}"</p>}
            </div>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0', STATUS_COLOR[e.status])}>
              {STATUS_LABEL[e.status]}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* WhatsApp notify */}
            {e.clientPhone && (
              <a
                href={`https://wa.me/${e.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${e.clientName}! Se abrió un espacio en nuestra agenda para el día solicitado. Escríbenos para confirmar tu cita. 💅`)}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => patchMutation.mutate({ id: e.id, status: 'NOTIFIED' })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors">
                <MessageSquare className="w-3 h-3" /> Notificar
              </a>
            )}
            {e.status !== 'BOOKED' && (
              <button
                onClick={() => patchMutation.mutate({ id: e.id, status: 'BOOKED' })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                <Check className="w-3 h-3" /> Agendado
              </button>
            )}
            {e.status !== 'CANCELLED' && (
              <button
                onClick={() => patchMutation.mutate({ id: e.id, status: 'CANCELLED' })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
                <X className="w-3 h-3" /> Cancelar
              </button>
            )}
            <button
              onClick={() => deleteMutation.mutate(e.id)}
              className="ml-auto p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Reminders Panel ──────────────────────────────────────────────────
function RemindersPanel({ targetDate, bizName, templates }: { targetDate: string; bizName?: string; templates: { id: string; name: string; body: string }[] }) {
  const [remindedIds, setRemindedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`beautyos_reminded_${targetDate}`);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  const [selectedTpl, setSelectedTpl] = useState<string>('__default__');

  const { data: appts = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments-reminders', targetDate],
    queryFn: () => appointmentsApi.list({ date: targetDate }).then(r => r.data),
    staleTime: 60_000,
  });

  const pending = appts.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');

  const markReminded = (id: string) => {
    setRemindedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(`beautyos_reminded_${targetDate}`, JSON.stringify([...next]));
      return next;
    });
  };

  const buildMessage = (appt: Appointment, tplBody?: string) => {
    const firstName = appt.client.name.split(' ')[0];
    const d = new Date(targetDate + 'T12:00:00');
    const dateStr = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const serviceNames = appt.services.map(s => s.service.name).join(', ');
    const body = tplBody
      ? tplBody
          .replace(/\{\{nombre\}\}/g, firstName)
          .replace(/\{\{fecha\}\}/g, dateStr)
          .replace(/\{\{hora\}\}/g, appt.startTime)
          .replace(/\{\{negocio\}\}/g, bizName ?? 'el salón')
          .replace(/\{\{servicio\}\}/g, serviceNames)
      : `¡Hola ${firstName}! 👋 Te recordamos tu cita mañana *${dateStr}* a las *${appt.startTime}* en *${bizName ?? 'el salón'}*${serviceNames ? ` para *${serviceNames}*` : ''}. ¡Te esperamos! 💅`;
    return body;
  };

  const activeTpl = templates.find(t => t.id === selectedTpl);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (pending.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Bell className="w-10 h-10 mx-auto text-gray-200" />
        <p className="text-sm text-gray-400">Sin citas pendientes para recordar</p>
      </div>
    );
  }

  const remindedCount = pending.filter(a => remindedIds.has(a.id)).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{remindedCount} de {pending.length} recordatorio{pending.length !== 1 ? 's' : ''} enviado{remindedCount !== 1 ? 's' : ''}</p>
        {remindedCount === pending.length && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> ¡Todos enviados!
          </span>
        )}
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pending.length > 0 ? (remindedCount / pending.length) * 100 : 0}%` }} />
      </div>

      {/* Template selector */}
      {templates.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Plantilla de mensaje</label>
          <select
            className="input text-sm"
            value={selectedTpl}
            onChange={e => setSelectedTpl(e.target.value)}>
            <option value="__default__">Mensaje predeterminado</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Appointment cards */}
      <div className="space-y-2">
        {pending.map(appt => {
          const reminded = remindedIds.has(appt.id);
          const phone = appt.client.phone;
          const msg = buildMessage(appt, activeTpl?.body);
          const waLink = phone
            ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
            : null;
          return (
            <div key={appt.id} className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-colors',
              reminded ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100 hover:border-gray-200'
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{appt.client.name}</p>
                  {appt.status === 'CONFIRMED' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400">{appt.startTime} · {appt.services.map(s => s.service.name).join(', ') || 'Sin servicios'}</p>
                {phone && <p className="text-xs text-gray-400">{phone}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {reminded && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markReminded(appt.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                      reminded
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                    )}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    {reminded ? 'Enviado' : 'WA'}
                  </a>
                ) : (
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Sin número
                  </span>
                )}
                {!reminded && (
                  <button
                    onClick={() => markReminded(appt.id)}
                    title="Marcar como recordado"
                    className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Agenda Page ──────────────────────────────────────────────────
export function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day' | 'staff'>('week');
  const [tab, setTab] = useState<'calendar' | 'requests'>('calendar');
  const [quickBookClientId, setQuickBookClientId] = useState<string | undefined>();
  const [showNewAppt, setShowNewAppt] = useState(() => !!searchParams.get('book'));
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [search, setSearch] = useState('');
  const [blockTarget, setBlockTarget] = useState<{ staffId: string; date: Date } | null>(null);
  const [waitlistDay, setWaitlistDay] = useState<Date | null>(null);
  const [showReminders, setShowReminders] = useState(false);

  useEffect(() => {
    const clientId = searchParams.get('book');
    if (clientId) {
      setQuickBookClientId(clientId);
      setShowNewAppt(true);
      setSearchParams({}, { replace: true });
    }
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const queryDate = (view === 'day' || view === 'staff') ? format(currentDate, 'yyyy-MM-dd') : undefined;
  const queryWeek = view === 'week' ? format(weekStart, 'yyyy-MM-dd') : undefined;

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', view, queryDate ?? queryWeek],
    queryFn: () => appointmentsApi.list({ date: queryDate, week: queryWeek }).then(r => r.data),
  });

  const { data: requests = [] } = useQuery<BookingRequest[]>({
    queryKey: ['booking-requests'],
    queryFn: () => appointmentsApi.bookingRequests().then(r => r.data),
    refetchInterval: 30000,
  });
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const { data: staffMembers = [] } = useQuery<StaffCol[]>({
    queryKey: ['staff'],
    queryFn: () => staffApi.list().then(r => r.data),
  });

  const { data: timeBlocks = [] } = useQuery<TimeBlock[]>({
    queryKey: ['time-blocks', queryDate ?? queryWeek],
    queryFn: () => timeBlocksApi.list(
      view === 'week' ? { week: queryWeek } : { date: queryDate }
    ).then(r => r.data),
    enabled: tab === 'calendar',
  });

  const rangeFrom = format(weekStart, 'yyyy-MM-dd');
  const rangeTo   = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const { data: waitlistCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['waitlist-counts', rangeFrom],
    queryFn: () => waitlistApi.counts(rangeFrom, rangeTo).then(r => r.data),
    refetchInterval: 60000,
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => timeBlocksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      toast('Bloqueo eliminado', 'success');
    },
  });

  const quickStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.update(id, { status }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      const labels: Record<string, string> = { IN_PROGRESS: 'Servicio iniciado', NO_SHOW: 'Marcada como no asistió', COMPLETED: 'Cita completada' };
      toast(labels[vars.status] ?? 'Estado actualizado', 'success');
    },
    onError: () => toast('Error al actualizar estado', 'error'),
  });

  const { user } = useAuth();
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const bizTemplates: { id: string; name: string; body: string }[] = (() => {
    try { return JSON.parse((user?.business as any)?.messageTemplates ?? '[]'); } catch { return []; }
  })();

  const { data: tomorrowAppts = [] } = useQuery<Appointment[]>({
    queryKey: ['appointments-reminders', tomorrowStr],
    queryFn: () => appointmentsApi.list({ date: tomorrowStr }).then(r => r.data),
    staleTime: 5 * 60_000,
    enabled: showReminders,
  });
  const tomorrowPendingCount = tomorrowAppts.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;

  const navigate = (dir: number) => {
    if (view === 'day' || view === 'staff') setCurrentDate(d => addDays(d, dir));
    else setCurrentDate(d => addDays(d, dir * 7));
  };

  const filtered = search.trim()
    ? appointments.filter(a => a.client.name.toLowerCase().includes(search.toLowerCase()))
    : appointments;

  // Overdue: past appointments still in SCHEDULED/CONFIRMED that were never resolved
  const nowIso = new Date().toISOString();
  const overdueAppts = appointments.filter(a =>
    (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') &&
    !a.payment &&
    `${a.date.slice(0, 10)}T${a.endTime}` < nowIso.slice(0, 16)
  );

  return (
    <div className="p-4 sm:p-6 animate-fade-in flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-ghost px-3 text-sm">Hoy</button>
          <button onClick={() => navigate(1)} className="btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-gray-700 ml-1 capitalize">
            {view === 'week'
              ? `${format(weekStart, 'd MMM', { locale: es })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}`
              : view === 'staff'
                ? format(currentDate, "d 'de' MMMM · Estilistas", { locale: es })
                : format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Client search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="input pl-8 py-1.5 text-sm w-36 sm:w-48"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            <button onClick={() => setView('week')} className={cn('px-3 py-1.5 transition-colors', view === 'week' ? 'bg-primary text-white' : 'hover:bg-gray-50 text-gray-600')}>Semana</button>
            <button onClick={() => setView('day')} className={cn('px-3 py-1.5 transition-colors', view === 'day' ? 'bg-primary text-white' : 'hover:bg-gray-50 text-gray-600')}>Día</button>
            <button onClick={() => setView('staff')} className={cn('px-3 py-1.5 transition-colors', view === 'staff' ? 'bg-primary text-white' : 'hover:bg-gray-50 text-gray-600')}>Estilistas</button>
          </div>
          {view === 'day' && appointments.length > 0 && (
            <button
              onClick={() => printDaySchedule(currentDate, appointments)}
              className="btn-ghost p-2" title="Imprimir agenda del día">
              <Printer className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowReminders(true)}
            className="btn-ghost p-2 relative"
            title="Recordatorios para mañana">
            <Bell className="w-4 h-4" />
            {tomorrowPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {tomorrowPendingCount > 9 ? '9+' : tomorrowPendingCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowNewAppt(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nueva cita</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-edge gap-0">
        <button onClick={() => setTab('calendar')}
          className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            tab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-gray-700')}>
          Calendario
        </button>
        <button onClick={() => setTab('requests')}
          className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5',
            tab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-gray-700')}>
          Solicitudes de cita
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{pendingCount}</span>
          )}
        </button>
      </div>

      {/* Overdue banner */}
      {overdueAppts.length > 0 && tab === 'calendar' && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {overdueAppts.length} cita{overdueAppts.length !== 1 ? 's' : ''} pendiente{overdueAppts.length !== 1 ? 's' : ''} sin resolver
            </p>
            <p className="text-xs text-amber-600 truncate">
              {overdueAppts.slice(0, 3).map(a => a.client.name.split(' ')[0]).join(', ')}
              {overdueAppts.length > 3 ? ` y ${overdueAppts.length - 3} más` : ''}
            </p>
          </div>
          <button
            onClick={() => overdueAppts.forEach(a => quickStatus.mutate({ id: a.id, status: 'NO_SHOW' }))}
            className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-xl transition-colors shrink-0 whitespace-nowrap">
            Marcar N/A
          </button>
        </div>
      )}

      {tab === 'requests' ? (
        <BookingRequestsPanel onConverted={() => setTab('calendar')} />
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : search.trim() ? (
        /* Search results flat list */
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Sin resultados para "{search}"</div>
          ) : filtered.map(a => (
            <div key={a.id} onClick={() => setSelectedAppt(a)}
              className={cn('p-3 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3', STATUS_COLORS[a.status])}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{a.client.name}</p>
                <p className="text-xs opacity-70">{format(parseISO(a.date), "d MMM", { locale: es })} · {a.startTime}–{a.endTime}</p>
              </div>
              <span className="text-xs font-medium opacity-80">{STATUS_LABELS[a.status]}</span>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && !search.trim() ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">
            {view === 'week' ? 'Sin citas esta semana' : 'Sin citas para este día'}
          </p>
          <button onClick={() => setShowNewAppt(true)} className="btn-primary mt-4 mx-auto">Agregar cita</button>
        </div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          <TimeGrid
            appointments={filtered}
            days={view === 'week' ? weekDays : [currentDate]}
            staffMembers={view === 'staff' ? staffMembers : undefined}
            timeBlocks={timeBlocks}
            onSelect={setSelectedAppt}
            onAddBlock={view === 'staff' ? (sid, d) => setBlockTarget({ staffId: sid, date: d }) : undefined}
            onDeleteBlock={(id) => {
              if (window.confirm('¿Eliminar este bloqueo de horario?')) deleteBlock.mutate(id);
            }}
            waitlistCounts={waitlistCounts}
            onWaitlistClick={setWaitlistDay}
            onStatusChange={(id, status) => quickStatus.mutate({ id, status })}
          />
        </div>
      )}

      <Modal open={showNewAppt} onClose={() => { setShowNewAppt(false); setQuickBookClientId(undefined); }} title="Nueva cita" size="lg">
        <NewAppointmentForm onClose={() => { setShowNewAppt(false); setQuickBookClientId(undefined); }} initialClientId={quickBookClientId} />
      </Modal>

      <Modal open={!!selectedAppt} onClose={() => setSelectedAppt(null)} title="Detalle de cita" size="lg">
        {selectedAppt && <AppointmentDetail appt={selectedAppt} onClose={() => setSelectedAppt(null)} />}
      </Modal>

      <Modal open={!!blockTarget} onClose={() => setBlockTarget(null)} title="Bloquear horario" size="sm">
        {blockTarget && (
          <BlockForm
            staffId={blockTarget.staffId}
            staffName={staffMembers.find(s => s.id === blockTarget.staffId)?.name ?? ''}
            date={blockTarget.date}
            onClose={() => setBlockTarget(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!waitlistDay}
        onClose={() => setWaitlistDay(null)}
        title={waitlistDay ? `Lista de espera — ${format(waitlistDay, "d 'de' MMMM", { locale: es })}` : ''}
        size="sm">
        {waitlistDay && (
          <WaitlistPanel
            date={format(waitlistDay, 'yyyy-MM-dd')}
            onClose={() => setWaitlistDay(null)}
            onChanged={() => queryClient.invalidateQueries({ queryKey: ['waitlist-counts'] })}
          />
        )}
      </Modal>

      <Modal
        open={showReminders}
        onClose={() => setShowReminders(false)}
        title={`Recordatorios — ${format(addDays(new Date(), 1), "d 'de' MMMM", { locale: es })}`}
        size="sm">
        <RemindersPanel
          targetDate={tomorrowStr}
          bizName={user?.business?.name}
          templates={bizTemplates}
        />
      </Modal>
    </div>
  );
}
