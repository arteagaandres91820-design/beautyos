import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Megaphone, Users, Crown, AlertTriangle, Cake, Send,
  MessageCircle, Phone, Search, CheckCircle2, ChevronDown, ChevronUp, Edit2, UserX, FileText,
  Mail, Loader2, X,
} from 'lucide-react';
import { clientsApi } from '../lib/api';
import { Client, MessageTemplate } from '../types';
import { getInitials, formatCOP, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

// â”€â”€â”€ Segment definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Segment {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  filter: (clients: Client[], extra: { atRisk: AtRiskClient[] }) => Client[];
  defaultMessage: (bizName: string) => string;
}

interface AtRiskClient {
  id: string; name: string; phone: string; isVip: boolean; daysSince: number;
}

function getBirthdaysThisMonth(clients: Client[]) {
  const now = new Date();
  const mm = now.getMonth() + 1;
  return clients.filter(c => {
    if (!c.birthday) return false;
    const [, bm] = c.birthday.slice(0, 10).split('-').map(Number);
    return bm === mm;
  });
}

const SEGMENTS: Segment[] = [
  {
    id: 'all',
    label: 'Todos los clientes',
    description: 'Mensaje general a toda tu base de clientes',
    icon: Users,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    filter: (clients) => clients,
    defaultMessage: (biz) =>
      `Â¡Hola! ðŸ’… Tenemos novedades en ${biz} que te van a encantar. Â¡EscrÃ­benos para agendar tu prÃ³xima cita!`,
  },
  {
    id: 'vip',
    label: 'Clientes VIP',
    description: 'Tus clientas mÃ¡s frecuentes y leales',
    icon: Crown,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    filter: (clients) => clients.filter(c => c.isVip),
    defaultMessage: (biz) =>
      `Â¡Hola! ðŸ‘‘ Como clienta VIP de ${biz} tienes acceso prioritario a nuestras fechas mÃ¡s solicitadas. Â¡Reserva tu lugar ahora!`,
  },
  {
    id: 'at-risk',
    label: 'Clientes en riesgo',
    description: 'Sin visita en mÃ¡s de 30 dÃ­as â€” reactÃ­valas',
    icon: AlertTriangle,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    filter: (clients, { atRisk }) => clients.filter(c => atRisk.some(r => r.id === c.id)),
    defaultMessage: (biz) =>
      `Â¡Hola! ðŸ’†â€â™€ï¸ Â¡Te extraÃ±amos en ${biz}! Â¿QuÃ© tal si te damos una cita especial esta semana? EscrÃ­benos y coordinamos.`,
  },
  {
    id: 'birthday',
    label: 'CumpleaÃ±eras del mes',
    description: 'Clientes con cumpleaÃ±os este mes',
    icon: Cake,
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    filter: (clients) => getBirthdaysThisMonth(clients),
    defaultMessage: (biz) =>
      `Â¡Feliz cumpleaÃ±os! ðŸŽ‚ðŸŽ‰ En ${biz} queremos celebrar contigo. Â¡EscrÃ­benos y te tenemos una sorpresa especial!`,
  },
  {
    id: 'new',
    label: 'Clientes nuevas',
    description: 'Con menos de 3 visitas â€” fidelÃ­zalas',
    icon: Send,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    filter: (clients) => clients.filter(c => (c.visitCount ?? 0) > 0 && (c.visitCount ?? 0) < 3),
    defaultMessage: (biz) =>
      `Â¡Hola! ðŸŒ¸ Gracias por visitarnos en ${biz}. Para tu prÃ³xima cita tenemos algo especial para ti. Â¡AgÃ©ndala pronto!`,
  },
  {
    id: 'no-show',
    label: 'No-shows',
    description: 'Con 2+ citas no cumplidas â€” recupÃ©ralas',
    icon: UserX,
    color: 'bg-red-50 border-red-200 text-red-700',
    filter: (clients) => clients.filter(c => (c.noShowCount ?? 0) >= 2),
    defaultMessage: (biz) =>
      `Â¡Hola! ðŸ‘‹ En ${biz} queremos ayudarte a encontrar el horario perfecto. Â¿Coordinamos tu prÃ³xima visita? EscrÃ­benos y te la reservamos sin compromiso.`,
  },
];

// â”€â”€â”€ Campaign message editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MessageEditor({ message, onChange, templates }: {
  message: string; onChange: (m: string) => void; templates: MessageTemplate[];
}) {
  const [open, setOpen] = useState(false);
  const [showTpls, setShowTpls] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
        <span className="flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> Editar mensaje</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-4 space-y-3">
          {templates.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTpls(o => !o)}
                className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
                <FileText className="w-3.5 h-3.5" /> Usar plantilla guardada
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showTpls && 'rotate-180')} />
              </button>
              {showTpls && (
                <div className="absolute top-7 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[240px] overflow-hidden">
                  <p className="text-[10px] font-semibold text-gray-400 px-3 pt-2 pb-1 uppercase tracking-wider">Mis plantillas</p>
                  {templates.map(t => (
                    <button key={t.id}
                      onClick={() => { onChange(t.body); setShowTpls(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-surface transition-colors border-t border-gray-50 first:border-0">
                      <p className="font-medium text-xs text-gray-800">{t.name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{t.body.slice(0, 60)}â€¦</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <textarea
            value={message}
            onChange={e => onChange(e.target.value)}
            rows={4}
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-gray-400">{message.length} caracteres Â· Usa {'{nombre}'} para personalizar con el nombre del cliente</p>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Client row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ClientRow({ client, message, sent, onMarkSent }: {
  client: Client; message: string; sent: boolean; onMarkSent: () => void;
}) {
  const waLink = client.phone
    ? `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message.replace('{nombre}', client.name.split(' ')[0]))}`
    : null;

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl transition-colors',
      sent ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-gray-100 hover:border-gray-200')}>
      <div className="w-9 h-9 rounded-full bg-[#083D42] flex items-center justify-center text-white text-xs font-bold shrink-0">
        {getInitials(client.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
          {client.isVip && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
        </div>
        <p className="text-xs text-gray-400">{client.phone || 'Sin telÃ©fono'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {sent && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onMarkSent}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              sent
                ? 'bg-gray-100 text-gray-400'
                : 'bg-green-500 text-white hover:bg-green-600'
            )}>
            <MessageCircle className="w-3.5 h-3.5" />
            {sent ? 'Enviado' : 'WA'}
          </a>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-300">
            <Phone className="w-3 h-3" /> Sin nÃºmero
          </span>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Email campaign modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmailCampaignModal({
  recipients,
  templates,
  onClose,
}: {
  recipients: Client[];
  templates: MessageTemplate[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const withEmail = recipients.filter(c => c.email).length;
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [showTpls, setShowTpls] = useState(false);
  const [result, setResult]   = useState<{ sent: number; skipped: number } | null>(null);

  const mutation = useMutation({
    mutationFn: () => clientsApi.bulkEmail({
      clientIds: recipients.map(c => c.id),
      subject: subject.trim(),
      body: body.trim(),
    }),
    onSuccess: (res) => {
      const { sent, skipped } = res.data;
      setResult({ sent, skipped });
      if (sent > 0) toast(`${sent} email${sent !== 1 ? 's' : ''} enviado${sent !== 1 ? 's' : ''}`, 'success');
      else toast('NingÃºn cliente en este segmento tiene email registrado', 'info');
    },
    onError: () => toast('Error al enviar emails', 'error'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Mail className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-gray-900">CampaÃ±a por email</p>
            <p className="text-xs text-gray-400">{withEmail} destinatario{withEmail !== 1 ? 's' : ''} con email</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {result ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-display font-bold text-gray-900 text-lg">Â¡CampaÃ±a enviada!</p>
            <div className="flex justify-center gap-8 text-center">
              <div>
                <p className="font-display font-bold text-2xl text-emerald-600">{result.sent}</p>
                <p className="text-xs text-gray-400">enviados</p>
              </div>
              <div>
                <p className="font-display font-bold text-2xl text-gray-400">{result.skipped}</p>
                <p className="text-xs text-gray-400">sin email</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-primary text-sm px-8">Cerrar</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {withEmail === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">NingÃºn cliente en este segmento tiene email registrado</p>
                <p className="text-xs mt-1">Agrega emails en el mÃ³dulo de Clientes</p>
              </div>
            ) : (
              <>
                {/* Template picker */}
                {templates.length > 0 && (
                  <div className="relative">
                    <button onClick={() => setShowTpls(o => !o)}
                      className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
                      <FileText className="w-3.5 h-3.5" /> Usar plantilla guardada
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showTpls && 'rotate-180')} />
                    </button>
                    {showTpls && (
                      <div className="absolute top-6 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[260px] overflow-hidden">
                        {templates.map(t => (
                          <button key={t.id} onClick={() => { setBody(t.body); setShowTpls(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface transition-colors border-b border-gray-50 last:border-0">
                            <p className="font-medium text-xs text-gray-800">{t.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{t.body.slice(0, 60)}â€¦</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Asunto</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Ej: Â¡Oferta especial para ti! ðŸ’…"
                    className="input text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Mensaje</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={5}
                    placeholder="Hola {nombre}, tenemos algo especial para ti..."
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-gray-400 mt-1">Usa {'{nombre}'} para personalizar con el nombre del cliente</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={onClose} className="flex-1 btn-secondary text-sm">Cancelar</button>
                  <button
                    onClick={() => mutation.mutate()}
                    disabled={!subject.trim() || !body.trim() || mutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm disabled:opacity-50">
                    {mutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : <><Mail className="w-4 h-4" /> Enviar a {withEmail} contactos</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Campaigns() {
  const { user } = useAuth();
  const [activeSegment, setActiveSegment] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);

  const templates: MessageTemplate[] = useMemo(() => {
    try { return JSON.parse((user?.business as any)?.messageTemplates ?? '[]'); } catch { return []; }
  }, [user?.business]);

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ['clients', ''],
    queryFn: () => clientsApi.list().then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const { data: atRiskRaw = [] } = useQuery<AtRiskClient[]>({
    queryKey: ['clients-at-risk'],
    queryFn: () => clientsApi.atRisk(30).then(r => r.data),
    staleTime: 10 * 60_000,
  });

  const bizName = (allClients[0] as any)?.business?.name ?? 'el salÃ³n';

  const segment = SEGMENTS.find(s => s.id === activeSegment) ?? SEGMENTS[0];

  const recipients = useMemo(() => {
    const base = segment.filter(allClients, { atRisk: atRiskRaw });
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q));
  }, [segment, allClients, atRiskRaw, search]);

  // Sync default message when segment changes
  const handleSegmentChange = (id: string) => {
    setActiveSegment(id);
    setSentIds(new Set());
    const seg = SEGMENTS.find(s => s.id === id);
    if (seg) setMessage(seg.defaultMessage(bizName));
  };

  // Init message on first render
  useMemo(() => {
    if (!message) setMessage(segment.defaultMessage(bizName));
  }, [bizName]);

  const sentCount = [...sentIds].filter(id => recipients.some(c => c.id === id)).length;
  const withPhone = recipients.filter(c => c.phone).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> CampaÃ±as
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            EnvÃ­a mensajes personalizados a segmentos de tus clientas por WhatsApp o email
          </p>
        </div>
        <button
          onClick={() => setShowEmailModal(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0">
          <Mail className="w-4 h-4" /> Email
        </button>
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SEGMENTS.map(seg => {
          const Icon = seg.icon;
          const count = seg.filter(allClients, { atRisk: atRiskRaw }).length;
          const isActive = activeSegment === seg.id;
          return (
            <button key={seg.id}
              onClick={() => handleSegmentChange(seg.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all',
                isActive
                  ? `${seg.color} border-current shadow-sm scale-[1.02]`
                  : 'bg-white border-gray-100 hover:border-gray-200 text-gray-600'
              )}>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-bold leading-tight">{seg.label}</span>
              <span className={cn('text-lg font-display font-bold', isActive ? '' : 'text-gray-900')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Campaign workspace */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display font-semibold text-gray-900">{segment.label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{segment.description}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
            <span className="font-bold text-gray-900">{recipients.length}</span> destinatarias
            {sentCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />{sentCount} enviados
              </span>
            )}
          </div>
        </div>

        {/* Message editor */}
        <MessageEditor message={message} onChange={setMessage} templates={templates} />

        {/* Message preview */}
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-xs font-semibold text-green-700 mb-2">Vista previa del mensaje</p>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-green-100 text-sm text-gray-700 whitespace-pre-wrap">
            {message || <span className="text-gray-300">Escribe un mensaje...</span>}
          </div>
        </div>

        {/* Send all hint */}
        {withPhone > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2.5">
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Haz clic en <strong>WA</strong> en cada fila para abrir WhatsApp con el mensaje pre-cargado. Los marcados como enviados quedan en verde.</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar destinatarias..."
            className="w-full bg-surface border border-edge rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Recipients list */}
        {recipients.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay clientes en este segmento</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {recipients.map(c => (
              <ClientRow
                key={c.id}
                client={c}
                message={message}
                sent={sentIds.has(c.id)}
                onMarkSent={() => setSentIds(prev => new Set([...prev, c.id]))}
              />
            ))}
          </div>
        )}

        {/* Progress footer */}
        {recipients.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Progreso de envÃ­o</span>
              <span className="font-semibold">{sentCount} / {withPhone} con nÃºmero</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: withPhone > 0 ? `${(sentCount / withPhone) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="font-display text-2xl font-bold text-gray-900">{allClients.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Clientes totales</p>
        </div>
        <div className="card text-center">
          <p className="font-display text-2xl font-bold text-amber-600">
            {allClients.filter(c => c.isVip).length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Clientes VIP</p>
        </div>
        <div className="card text-center">
          <p className="font-display text-2xl font-bold text-orange-500">{atRiskRaw.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">En riesgo</p>
        </div>
        <div className="card text-center">
          <p className="font-display text-2xl font-bold text-red-500">
            {allClients.filter(c => (c.noShowCount ?? 0) >= 2).length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">No-shows frecuentes</p>
        </div>
      </div>

      {showEmailModal && (
        <EmailCampaignModal
          recipients={recipients}
          templates={templates}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}

