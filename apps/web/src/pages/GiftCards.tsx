import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gift, Plus, Copy, Check, Loader2, X, Search,
  Wallet, BadgeCheck, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { giftCardsApi } from '../lib/api';
import { formatCOP, cn } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  recipientName: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  usedAt: string | null;
}

// ─── Code display with copy button ─────────────────────────────────────────
function CodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 border border-edge">
      <span className="font-mono text-sm font-bold tracking-widest text-gray-800 flex-1">{code}</span>
      <button onClick={copy}
        className={cn('flex items-center gap-1 text-xs font-semibold transition-all shrink-0',
          copied ? 'text-emerald-600' : 'text-gray-400 hover:text-primary')}>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Create form ────────────────────────────────────────────────────────────
function CreateForm({
  onClose, onSave, saving,
}: { onClose: () => void; onSave: (d: { amount: number; recipientName?: string; notes?: string }) => void; saving: boolean }) {
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  const PRESETS = [50000, 100000, 150000, 200000];
  const canSubmit = amount && Number(amount) >= 10000;

  return (
    <form onSubmit={e => { e.preventDefault(); if (canSubmit) onSave({ amount: Number(amount), recipientName: recipientName.trim() || undefined, notes: notes.trim() || undefined }); }}
      className="p-6 space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Valor (COP) *</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {PRESETS.map(p => (
            <button key={p} type="button" onClick={() => setAmount(String(p))}
              className={cn('py-2 rounded-xl text-xs font-bold border-2 transition-all',
                amount === String(p) ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary/40')}>
              {formatCOP(p)}
            </button>
          ))}
        </div>
        <input className="input" type="number" min={10000} step={5000} value={amount}
          onChange={e => setAmount(e.target.value)} placeholder="Otro valor…" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Nombre del destinatario</label>
        <input className="input" value={recipientName} onChange={e => setRecipient(e.target.value)}
          placeholder="Ej: Laura Martínez (opcional)" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Nota interna</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Ej: regalo de cumpleaños (opcional)" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" disabled={!canSubmit || saving} className="btn-primary flex-1 justify-center">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4" /> Crear tarjeta</>}
        </button>
      </div>
    </form>
  );
}

// ─── Redeem panel ───────────────────────────────────────────────────────────
function RedeemPanel({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [found, setFound] = useState<GiftCard | null>(null);
  const [looking, setLooking] = useState(false);

  const lookup = async () => {
    if (!code.trim()) return;
    setLooking(true);
    setFound(null);
    try {
      const res = await giftCardsApi.lookup(code.trim().toUpperCase());
      setFound(res.data);
    } catch {
      toast('Código no encontrado', 'error');
    } finally {
      setLooking(false);
    }
  };

  const redeemMutation = useMutation({
    mutationFn: () => giftCardsApi.redeem(found!.id, Number(amount)),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['gift-cards'] });
      toast(`Canjeado ${formatCOP(res.data.redeemed)} · Saldo restante: ${formatCOP(res.data.remaining)}`, 'success');
      onClose();
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Error al canjear', 'error'),
  });

  const maxRedeem = found ? found.balance : 0;
  const canRedeem = found && found.isActive && found.balance > 0 && Number(amount) > 0 && Number(amount) <= maxRedeem;

  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">Ingresa el código de la tarjeta de regalo para verificar el saldo y canjear.</p>

      {/* Code lookup */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Código de tarjeta</label>
        <div className="flex gap-2">
          <input className="input flex-1 font-mono tracking-widest uppercase" value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookup(); } }}
          />
          <button onClick={lookup} disabled={looking || !code.trim()}
            className="btn-primary shrink-0">
            {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Found card info */}
      {found && (
        <div className={cn('p-4 rounded-2xl border-2 space-y-3',
          found.isActive && found.balance > 0
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50')}>
          <div className="flex items-center gap-2">
            {found.isActive && found.balance > 0
              ? <BadgeCheck className="w-5 h-5 text-emerald-600" />
              : <XCircle className="w-5 h-5 text-red-500" />}
            <span className="font-semibold text-sm">
              {found.isActive && found.balance > 0 ? 'Tarjeta válida' : found.balance === 0 ? 'Sin saldo' : 'Tarjeta inactiva'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Valor original</p>
              <p className="font-bold text-gray-800">{formatCOP(found.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo disponible</p>
              <p className={cn('font-bold', found.balance > 0 ? 'text-emerald-700' : 'text-red-500')}>{formatCOP(found.balance)}</p>
            </div>
            {found.recipientName && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Destinatario</p>
                <p className="font-medium text-gray-800">{found.recipientName}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amount to redeem */}
      {found && found.isActive && found.balance > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Monto a canjear (COP)</label>
          <input className="input" type="number" min={1} max={maxRedeem} step={1000}
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder={`Máx. ${formatCOP(maxRedeem)}`} />
          <p className="text-xs text-gray-400 mt-1">Ingresa el monto que el cliente va a usar en esta visita</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button onClick={() => redeemMutation.mutate()}
          disabled={!canRedeem || redeemMutation.isPending}
          className="btn-primary flex-1 justify-center">
          {redeemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Canjear'}
        </button>
      </div>
    </div>
  );
}

// ─── Gift card card ─────────────────────────────────────────────────────────
function GiftCardItem({ card, onDeactivate }: { card: GiftCard; onDeactivate: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const usedPct = card.amount > 0 ? Math.round(((card.amount - card.balance) / card.amount) * 100) : 0;

  return (
    <div className={cn('card transition-all', !card.isActive && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          card.isActive && card.balance > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400')}>
          <Gift className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {card.recipientName && (
              <p className="text-sm font-semibold text-gray-900 truncate">{card.recipientName}</p>
            )}
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
              card.isActive && card.balance > 0
                ? 'bg-emerald-100 text-emerald-700'
                : card.balance === 0
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-red-100 text-red-600')}>
              {card.isActive && card.balance > 0 ? 'Activa' : card.balance === 0 ? 'Agotada' : 'Inactiva'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Saldo: <strong className="text-gray-700">{formatCOP(card.balance)}</strong>
            <span className="mx-1">de</span>
            {formatCOP(card.amount)}
          </p>
          {/* Usage bar */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${usedPct}%` }} />
          </div>
        </div>
        <button onClick={() => setOpen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-surface text-muted shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <CodeDisplay code={card.code} />
          {card.notes && <p className="text-xs text-gray-500 italic">{card.notes}</p>}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Creada: {new Date(card.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            {card.usedAt && <><span>·</span><span>Último uso: {new Date(card.usedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span></>}
          </div>
          {card.isActive && (
            <button onClick={() => { if (confirm('¿Desactivar esta tarjeta?')) onDeactivate(card.id); }}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> Desactivar tarjeta
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function GiftCards() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');

  const { data: cards = [], isLoading } = useQuery<GiftCard[]>({
    queryKey: ['gift-cards', showInactive],
    queryFn: () => giftCardsApi.list(showInactive).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof giftCardsApi.create>[0]) => giftCardsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gift-cards'] });
      toast('Tarjeta de regalo creada', 'success');
      setShowCreate(false);
    },
    onError: () => toast('Error al crear tarjeta', 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => giftCardsApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gift-cards'] });
      toast('Tarjeta desactivada', 'success');
    },
    onError: () => toast('Error al desactivar', 'error'),
  });

  const filtered = cards.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.code.toLowerCase().includes(q) || (c.recipientName ?? '').toLowerCase().includes(q);
  });

  const totalActive = cards.filter(c => c.isActive && c.balance > 0);
  const totalBalance = totalActive.reduce((s, c) => s + c.balance, 0);
  const totalFaceValue = cards.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Tarjetas de regalo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Crea, vende y canjea gift cards para tu salón</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRedeem(true)} className="btn-ghost flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Canjear
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva tarjeta
          </button>
        </div>
      </div>

      {/* Summary */}
      {cards.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-4">
            <p className="font-display text-xl font-bold text-gray-900">{totalActive.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Activas</p>
          </div>
          <div className="card text-center py-4">
            <p className="font-display text-lg font-bold text-primary">{formatCOP(totalBalance)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Saldo disponible</p>
          </div>
          <div className="card text-center py-4">
            <p className="font-display text-lg font-bold text-gray-900">{formatCOP(totalFaceValue)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Emitido total</p>
          </div>
        </div>
      )}

      {/* Search + filter */}
      {cards.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Buscar por código o destinatario…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowInactive(v => !v)}
            className={cn('btn-ghost text-xs shrink-0', showInactive && 'text-primary')}>
            {showInactive ? 'Ocultar inactivas' : 'Ver todas'}
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Gift className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {cards.length === 0 ? 'Sin tarjetas de regalo aún' : 'Sin resultados'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {cards.length === 0
              ? 'Crea tarjetas de regalo para que tus clientes las regalen a sus amigos y familiares'
              : 'Intenta con otro código o nombre'}
          </p>
          {cards.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 mx-auto flex items-center gap-2">
              <Plus className="w-4 h-4" /> Crear primera tarjeta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <GiftCardItem key={c.id} card={c} onDeactivate={id => deactivateMutation.mutate(id)} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva tarjeta de regalo">
        <CreateForm
          onClose={() => setShowCreate(false)}
          onSave={data => createMutation.mutate(data)}
          saving={createMutation.isPending}
        />
      </Modal>

      {/* Redeem modal */}
      <Modal open={showRedeem} onClose={() => setShowRedeem(false)} title="Canjear tarjeta de regalo">
        <RedeemPanel onClose={() => setShowRedeem(false)} />
      </Modal>
    </div>
  );
}
