import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Crown, Phone, Mail, Calendar, Trash2, Edit2, X, Loader2, Users, Clock, CheckCircle2, XCircle, Scissors, MessageCircle, DollarSign, Star, Radio, Send, Download, Camera, CalendarPlus, Upload, Image, RefreshCw, MessageSquare, Bell, PhoneCall, ArrowRight as ArrowRightIcon, StickyNote, Layers, ChevronDown, Minus, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { clientsApi, clientPackagesApi, packagesApi } from '../lib/api';
import { Client, ClientNote, ClientPackage, ServicePackage } from '../types';
import { getInitials, formatDate, cn, STATUS_LABELS, formatCOP, LOYALTY_TIERS, getLoyaltyTier, getNextTier } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const PRESET_TAGS = ['Frecuente', 'Referida', 'AlÃ©rgica', 'Sensible', 'Puntual', 'Recomienda', 'Estudiante', 'Mayor'];

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const addTag = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input text-sm py-1.5 flex-1"
          placeholder="Nueva etiqueta..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
        />
        {input.trim() && (
          <button type="button" onClick={() => addTag(input)} className="btn-primary py-1.5 px-3 text-sm">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESET_TAGS.filter(t => !tags.includes(t)).map(t => (
          <button type="button" key={t} onClick={() => addTag(t)}
            className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary transition-all">
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientForm({ client, allClients = [], onSave, onClose }: {
  client?: Client; allClients?: Client[]; onSave: (data: Partial<Client> & { referredById?: string | null }) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    birthday: client?.birthday ? client.birthday.slice(0, 10) : '',
    notes: client?.notes ?? '',
    tags: client?.tags ?? [] as string[],
    referredById: client?.referredById ?? '',
  });

  const set = (k: string, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  const otherClients = allClients.filter(c => c.id !== client?.id);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, referredById: form.referredById || null }); }} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Nombre completo *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Ej: SofÃ­a HernÃ¡ndez" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">TelÃ©fono *</label>
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} required placeholder="+57 310 000 0000" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Correo electrÃ³nico</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@ejemplo.com" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">CumpleaÃ±os</label>
          <input className="input" type="date" value={form.birthday} onChange={(e) => set('birthday', e.target.value)} />
        </div>
        {otherClients.length > 0 && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Referida por</label>
            <select className="input text-sm" value={form.referredById} onChange={e => set('referredById', e.target.value)}>
              <option value="">Sin referido</option>
              {otherClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Preferencias, alergias, etc." />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-2">Etiquetas</label>
          <TagEditor tags={form.tags} onChange={t => set('tags', t)} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center">{client ? 'Guardar cambios' : 'Crear cliente'}</button>
      </div>
    </form>
  );
}

const APPT_STATUS_ICON: Record<string, React.ElementType> = {
  COMPLETED: CheckCircle2, CANCELLED: XCircle, NO_SHOW: XCircle,
};
const APPT_STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'text-emerald-500', CANCELLED: 'text-red-400', NO_SHOW: 'text-red-400',
  SCHEDULED: 'text-blue-400', CONFIRMED: 'text-primary', IN_PROGRESS: 'text-violet-500',
};


function CsvImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<{ name: string; phone: string; email?: string; birthday?: string; notes?: string; tags?: string }[]>([]);
  const [parseError, setParseError] = useState('');
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const parseCSV = (text: string) => {
    setParseError('');
    setResult(null);
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) { setParseError('El archivo debe tener encabezado y al menos una fila'); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const nameIdx = headers.findIndex(h => h.includes('nombre') || h === 'name');
    const phoneIdx = headers.findIndex(h => h.includes('telÃ©fono') || h.includes('telefono') || h.includes('tel') || h === 'phone');
    if (nameIdx < 0 || phoneIdx < 0) {
      setParseError('El CSV debe tener columnas "nombre" y "telÃ©fono" (o "name" y "phone")');
      return;
    }
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo'));
    const bdayIdx = headers.findIndex(h => h.includes('cumpleaÃ±os') || h.includes('birthday') || h.includes('nacimiento'));
    const notesIdx = headers.findIndex(h => h.includes('notas') || h === 'notes');
    const tagsIdx = headers.findIndex(h => h.includes('etiquetas') || h === 'tags');

    const parsed = lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        name: cols[nameIdx] ?? '',
        phone: cols[phoneIdx] ?? '',
        email: emailIdx >= 0 ? cols[emailIdx] : undefined,
        birthday: bdayIdx >= 0 ? cols[bdayIdx] : undefined,
        notes: notesIdx >= 0 ? cols[notesIdx] : undefined,
        tags: tagsIdx >= 0 ? cols[tagsIdx] : undefined,
      };
    }).filter(r => r.name.trim() && r.phone.trim());
    if (parsed.length === 0) { setParseError('No se encontraron filas vÃ¡lidas'); return; }
    setRows(parsed);
  };

  const importMutation = useMutation({
    mutationFn: () => clientsApi.importClients(rows),
    onSuccess: (res) => {
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast(`Importados: ${res.data.created} clientes`, 'success');
      onImported();
    },
    onError: (e: any) => toast(e.response?.data?.error ?? 'Error al importar', 'error'),
  });

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-lg">Importar clientes desde CSV</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Instructions */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Formato esperado del CSV:</p>
            <p>Columnas requeridas: <code className="bg-blue-100 px-1 rounded">nombre</code>, <code className="bg-blue-100 px-1 rounded">telÃ©fono</code></p>
            <p>Columnas opcionales: <code className="bg-blue-100 px-1 rounded">email</code>, <code className="bg-blue-100 px-1 rounded">cumpleaÃ±os</code>, <code className="bg-blue-100 px-1 rounded">notas</code>, <code className="bg-blue-100 px-1 rounded">etiquetas</code></p>
            <p className="text-blue-500">Se omiten clientes con telÃ©fono ya registrado. MÃ¡ximo 500 por importaciÃ³n.</p>
          </div>

          {/* File picker */}
          <div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => parseCSV(String(ev.target?.result ?? ''));
                reader.readAsText(file, 'UTF-8');
                e.target.value = '';
              }}
            />
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-primary/40 hover:bg-primary/2 transition-colors text-sm text-gray-500 hover:text-primary">
              <Upload className="w-5 h-5" />
              {rows.length > 0 ? `${rows.length} filas cargadas â€” clic para cambiar` : 'Seleccionar archivo CSV'}
            </button>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Vista previa ({rows.length} filas)</p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100">
                <table className="text-xs w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['Nombre', 'TelÃ©fono', 'Email', 'Etiquetas'].map(h => (
                        <th key={h} className="text-left px-2.5 py-2 text-gray-400 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-2.5 py-1.5 font-medium text-gray-800 max-w-[120px] truncate">{r.name}</td>
                        <td className="px-2.5 py-1.5 text-gray-500">{r.phone}</td>
                        <td className="px-2.5 py-1.5 text-gray-400 max-w-[100px] truncate">{r.email || 'â€”'}</td>
                        <td className="px-2.5 py-1.5 text-gray-400 max-w-[80px] truncate">{r.tags || 'â€”'}</td>
                      </tr>
                    ))}
                    {rows.length > 20 && (
                      <tr><td colSpan={4} className="px-2.5 py-2 text-center text-gray-400">â€¦ y {rows.length - 20} mÃ¡s</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-emerald-800">{result.created} cliente{result.created !== 1 ? 's' : ''} importado{result.created !== 1 ? 's' : ''}</p>
              {result.skipped > 0 && <p className="text-sm text-emerald-600">{result.skipped} omitido{result.skipped !== 1 ? 's' : ''} (duplicados o invÃ¡lidos)</p>}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              onClick={() => importMutation.mutate()}
              disabled={rows.length === 0 || importMutation.isPending}
              className="btn-primary flex-1 justify-center">
              {importMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
                : <><FileSpreadsheet className="w-4 h-4" /> Importar {rows.length} cliente{rows.length !== 1 ? 's' : ''}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SellPackageModal({ clientId, onClose, onSold }: { clientId: string; onClose: () => void; onSold: () => void }) {
  const { toast } = useToast();
  const [selectedPkg, setSelectedPkg] = useState('');
  const [sessionsTotal, setSessionsTotal] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  const { data: packages = [], isLoading } = useQuery<ServicePackage[]>({
    queryKey: ['packages-active'],
    queryFn: () => packagesApi.list().then(r => r.data.filter((p: ServicePackage) => p.isActive)),
    staleTime: 60000,
  });

  const sellMutation = useMutation({
    mutationFn: () => clientPackagesApi.sell(clientId, {
      packageId: selectedPkg,
      sessionsTotal: Number(sessionsTotal),
      notes: notes || undefined,
      expiresAt: expiresAt || undefined,
    }),
    onSuccess: () => { toast('Paquete vendido', 'success'); onSold(); },
    onError: (e: any) => toast(e.response?.data?.error ?? 'Error', 'error'),
  });

  const pkg = packages.find((p: ServicePackage) => p.id === selectedPkg);

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-display font-bold text-lg">Vender paquete</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Paquete *</label>
            {isLoading ? <div className="input flex items-center text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2" />Cargando...</div> : (
              <select className="input text-sm" value={selectedPkg} onChange={e => {
                setSelectedPkg(e.target.value);
                const p = packages.find((x: ServicePackage) => x.id === e.target.value);
                if (p && !sessionsTotal) setSessionsTotal(String(p.services?.length || 1));
              }}>
                <option value="">Seleccionar paquete</option>
                {packages.map((p: ServicePackage) => (
                  <option key={p.id} value={p.id}>{p.name} â€” {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.price)}</option>
                ))}
              </select>
            )}
            {pkg && pkg.services && pkg.services.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">Servicios: {pkg.services.map((s: any) => s.service?.name).filter(Boolean).join(', ')}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">NÃºmero de sesiones *</label>
            <input type="number" min="1" max="100" className="input text-sm" placeholder="Ej: 10"
              value={sessionsTotal} onChange={e => setSessionsTotal(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Fecha de vencimiento</label>
            <input type="date" className="input text-sm" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
            <textarea className="input resize-none text-sm" rows={2} placeholder="Observaciones opcionales..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button
              onClick={() => sellMutation.mutate()}
              disabled={!selectedPkg || !sessionsTotal || Number(sessionsTotal) < 1 || sellMutation.isPending}
              className="btn-primary flex-1 justify-center">
              {sellMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Layers className="w-4 h-4" /> Vender paquete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetail({ client, onVip, vipPending, onEdit }: {
  client: Client; onVip: () => void; vipPending: boolean; onEdit: () => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [historyTab, setHistoryTab] = useState<'history' | 'gallery'>('history');
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string | null } | null>(null);
  const [noteBody, setNoteBody] = useState('');
  const [noteType, setNoteType] = useState<ClientNote['type']>('NOTE');
  const [notesOpen, setNotesOpen] = useState(false);
  const [pkgsOpen, setPkgsOpen] = useState(false);
  const [sellPkgModal, setSellPkgModal] = useState(false);

  const { data: full, isLoading } = useQuery({
    queryKey: ['client-detail', client.id],
    queryFn: () => clientsApi.get(client.id).then(r => r.data),
    staleTime: 30000,
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => clientsApi.uploadPhoto(client.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-detail', client.id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast('Foto actualizada', 'success');
    },
    onError: () => toast('Error al subir foto', 'error'),
  });

  const pointsMutation = useMutation({
    mutationFn: (delta: number) => clientsApi.adjustPoints(client.id, delta),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-detail', client.id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast('Puntos actualizados', 'success');
    },
    onError: () => toast('Error al actualizar puntos', 'error'),
  });

  const { data: crmNotes = [], refetch: refetchNotes } = useQuery<ClientNote[]>({
    queryKey: ['client-notes', client.id],
    queryFn: () => clientsApi.notes(client.id).then(r => r.data),
    enabled: notesOpen,
    staleTime: 30000,
  });

  const addNoteMutation = useMutation({
    mutationFn: () => clientsApi.addNote(client.id, noteBody, noteType),
    onSuccess: () => {
      refetchNotes();
      setNoteBody('');
      toast('Nota guardada', 'success');
    },
    onError: () => toast('Error al guardar nota', 'error'),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => clientsApi.deleteNote(client.id, noteId),
    onSuccess: () => refetchNotes(),
    onError: () => toast('Error al eliminar nota', 'error'),
  });

  const { data: clientPkgs = [], refetch: refetchPkgs } = useQuery<ClientPackage[]>({
    queryKey: ['client-packages', client.id],
    queryFn: () => clientPackagesApi.list(client.id).then(r => r.data),
    enabled: pkgsOpen,
    staleTime: 30000,
  });

  const useSessionMutation = useMutation({
    mutationFn: (pkgId: string) => clientPackagesApi.useSession(client.id, pkgId),
    onSuccess: () => { refetchPkgs(); toast('SesiÃ³n registrada', 'success'); },
    onError: (e: any) => toast(e.response?.data?.error ?? 'Error', 'error'),
  });

  const undoSessionMutation = useMutation({
    mutationFn: (pkgId: string) => clientPackagesApi.undoSession(client.id, pkgId),
    onSuccess: () => { refetchPkgs(); toast('SesiÃ³n deshecha', 'success'); },
    onError: (e: any) => toast(e.response?.data?.error ?? 'Error', 'error'),
  });

  const removePkgMutation = useMutation({
    mutationFn: (pkgId: string) => clientPackagesApi.remove(client.id, pkgId),
    onSuccess: () => { refetchPkgs(); toast('Paquete cancelado', 'success'); },
    onError: () => toast('Error al cancelar paquete', 'error'),
  });

  const photo = (full as any)?.photo ?? client.photo;

  const appointments = (full as any)?.appointments ?? [];
  const totalSpent = appointments.reduce((sum: number, a: any) => sum + (a.payment?.amount ?? 0), 0);
  const completedVisits = appointments.filter((a: any) => a.status === 'COMPLETED').length;
  const noShowVisits = appointments.filter((a: any) => a.status === 'NO_SHOW').length;

  const tier = getLoyaltyTier(completedVisits);
  const nextTier = getNextTier(completedVisits);
  const progressPct = nextTier
    ? Math.round(((completedVisits - (LOYALTY_TIERS.find(t => t.label === tier.label)?.minVisits ?? 0)) /
        (nextTier.minVisits - (LOYALTY_TIERS.find(t => t.label === tier.label)?.minVisits ?? 0))) * 100)
    : 100;

  const waMsg = encodeURIComponent(`Â¡Hola ${client.name.split(' ')[0]}! Te escribimos de parte del salÃ³n. ðŸ’…`);

  return (
    <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0 group cursor-pointer" onClick={() => photoRef.current?.click()}>
          {photo
            ? <img src={photo} alt={client.name} className="w-16 h-16 rounded-2xl object-cover" />
            : <div className="w-16 h-16 rounded-2xl bg-[#083D42] flex items-center justify-center text-white text-xl font-bold">{getInitials(client.name)}</div>
          }
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-2xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            {photoMutation.isPending
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Camera className="w-5 h-5 text-white" />}
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) photoMutation.mutate(f); e.target.value = ''; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-xl">{client.name}</h3>
            {client.isVip && <span className="badge-vip"><Crown className="w-3 h-3" />VIP</span>}
          </div>
          <p className="text-sm text-gray-500">{client.visitCount} visitas Â· registrado {formatDate(client.createdAt)}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
          <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xs font-bold text-emerald-700">{formatCOP(totalSpent)}</p>
          <p className="text-[10px] text-emerald-500">Total gastado</p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
          <CheckCircle2 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-xs font-bold text-blue-700">{completedVisits}</p>
          <p className="text-[10px] text-blue-500">Completadas</p>
        </div>
        <div className={cn('p-3 border rounded-xl text-center', tier.bg)}>
          <Star className={cn('w-4 h-4 mx-auto mb-1', tier.color)} />
          <p className={cn('text-xs font-bold', tier.color)}>{tier.label}</p>
          <p className={cn('text-[10px]', tier.color)}>Nivel</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400 mx-auto mb-1" />
          <p className="text-xs font-bold text-amber-700">{(full as any)?.points ?? client.points ?? 0}</p>
          <p className="text-[10px] text-amber-500">Puntos</p>
        </div>
        {noShowVisits > 0 && (
          <div className="col-span-2 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-700">{noShowVisits} no-show{noShowVisits !== 1 ? 's' : ''} registrado{noShowVisits !== 1 ? 's' : ''}</p>
              <p className="text-[10px] text-orange-500">Historial de citas no asistidas</p>
            </div>
          </div>
        )}
      </div>

      {/* Loyalty progress */}
      {nextTier && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-gray-600">Progreso hacia {nextTier.label}</span>
            <span className="text-gray-400">{completedVisits} / {nextTier.minVisits} visitas</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083D42] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{nextTier.minVisits - completedVisits} visitas mÃ¡s para alcanzar {nextTier.label}</p>
        </div>
      )}

      {/* Points management */}
      {(() => {
        const pts = (full as any)?.points ?? client.points ?? 0;
        return (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="text-sm font-semibold text-amber-800">Puntos de lealtad</span>
              </div>
              <span className="font-display text-xl font-bold text-amber-700">{pts} pts</span>
            </div>
            <p className="text-[11px] text-amber-600">Se ganan automÃ¡ticamente: 1 punto por cada $1.000 COP pagados.</p>
            <div className="flex gap-2">
              <button onClick={() => pointsMutation.mutate(50)} disabled={pointsMutation.isPending}
                className="flex-1 text-xs py-2 bg-amber-100 text-amber-700 rounded-xl font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50">
                +50 pts
              </button>
              <button onClick={() => pointsMutation.mutate(100)} disabled={pointsMutation.isPending}
                className="flex-1 text-xs py-2 bg-amber-100 text-amber-700 rounded-xl font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50">
                +100 pts
              </button>
              <button onClick={() => { const n = Number(prompt('Â¿CuÃ¡ntos puntos canjear?')); if (n > 0) pointsMutation.mutate(-n); }}
                disabled={pointsMutation.isPending || pts === 0}
                className="flex-1 text-xs py-2 bg-white border border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Canjear
              </button>
            </div>
          </div>
        );
      })()}

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-primary" />{client.phone}</div>
        {client.email && <div className="flex items-center gap-2 text-gray-600 col-span-2 sm:col-span-1"><Mail className="w-4 h-4 text-primary" />{client.email}</div>}
        {client.birthday && <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-primary" />{formatDate(client.birthday)}</div>}
      </div>
      {client.notes && <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">{client.notes}</div>}

      {/* Referrals */}
      {((full as any)?.referredBy || ((full as any)?.referrals?.length ?? 0) > 0) && (
        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
          {(full as any)?.referredBy && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Referida por <strong className="text-gray-800">{(full as any).referredBy.name}</strong>
            </p>
          )}
          {((full as any)?.referrals?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">
                Ha referido {(full as any).referrals.length} cliente{(full as any).referrals.length !== 1 ? 's' : ''}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(full as any).referrals.map((r: any) => (
                  <span key={r.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{r.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {client.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {client.tags.map(t => (
            <span key={t} className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {client.phone && (
          <a href={`https://wa.me/${client.phone.replace(/\D/g,'')}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary flex-1 justify-center gap-1.5 text-green-700 border-green-200 hover:bg-green-50">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        )}
        <button onClick={onVip} disabled={vipPending}
          className={cn('btn-secondary flex-1 justify-center', client.isVip ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : '')}>
          <Crown className="w-4 h-4" />
          {client.isVip ? 'Quitar VIP' : 'Marcar VIP'}
        </button>
        <button onClick={onEdit} className="btn-secondary flex-1 justify-center">
          <Edit2 className="w-4 h-4" /> Editar
        </button>
        <button onClick={() => navigate(`/agenda?book=${client.id}`)}
          className="btn-secondary flex-1 justify-center text-primary border-primary/20 hover:bg-primary/5">
          <CalendarPlus className="w-4 h-4" /> Agendar
        </button>
      </div>

      {/* CRM Activity Notes */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <button
          onClick={() => setNotesOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-gray-700">Actividad CRM</span>
            {crmNotes.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{crmNotes.length}</span>
            )}
          </div>
          <ArrowRightIcon className={cn('w-4 h-4 text-gray-400 transition-transform', notesOpen && 'rotate-90')} />
        </button>

        {notesOpen && (
          <div className="p-4 space-y-3">
            {/* Add note form */}
            <div className="space-y-2">
              {/* Type selector */}
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { type: 'NOTE', icon: StickyNote, label: 'Nota' },
                  { type: 'CALL', icon: PhoneCall, label: 'Llamada' },
                  { type: 'MESSAGE', icon: MessageSquare, label: 'Mensaje' },
                  { type: 'FOLLOWUP', icon: ArrowRightIcon, label: 'Seguimiento' },
                  { type: 'ALERT', icon: Bell, label: 'Alerta' },
                ] as const).map(({ type, icon: Icon, label }) => (
                  <button key={type} type="button" onClick={() => setNoteType(type as ClientNote['type'])}
                    className={cn('flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                      noteType === type
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-primary/40')}>
                    <Icon className="w-3 h-3" />{label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  className="input resize-none text-sm flex-1"
                  rows={2}
                  placeholder="Escribe una nota, observaciÃ³n o seguimiento..."
                  value={noteBody}
                  onChange={e => setNoteBody(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey && noteBody.trim()) addNoteMutation.mutate(); }}
                />
                <button
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!noteBody.trim() || addNoteMutation.isPending}
                  className="btn-primary px-3 py-2 self-end shrink-0">
                  {addNoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Notes timeline */}
            {crmNotes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-3">Sin notas aÃºn</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {crmNotes.map(note => {
                  const NOTE_ICONS: Record<string, React.ElementType> = {
                    NOTE: StickyNote, CALL: PhoneCall, MESSAGE: MessageSquare,
                    FOLLOWUP: ArrowRightIcon, ALERT: Bell,
                  };
                  const NOTE_COLORS: Record<string, string> = {
                    NOTE: 'bg-gray-100 text-gray-500',
                    CALL: 'bg-emerald-100 text-emerald-600',
                    MESSAGE: 'bg-blue-100 text-blue-600',
                    FOLLOWUP: 'bg-violet-100 text-violet-600',
                    ALERT: 'bg-red-100 text-red-600',
                  };
                  const NoteIcon = NOTE_ICONS[note.type] ?? StickyNote;
                  return (
                    <div key={note.id} className="flex items-start gap-2.5 group">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', NOTE_COLORS[note.type])}>
                        <NoteIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-sm text-gray-800 leading-snug">{note.body}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-gray-400">
                            {note.author?.name ?? 'Sistema'} Â· {new Date(note.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <button
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Packages */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <button
          onClick={() => setPkgsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-semibold text-gray-700">Paquetes de sesiones</span>
            {clientPkgs.length > 0 && (
              <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">{clientPkgs.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setPkgsOpen(true); setSellPkgModal(true); }}
              className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-0.5 px-2 py-0.5 rounded-lg hover:bg-violet-50 transition-colors">
              <Plus className="w-3 h-3" /> Vender
            </button>
            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', pkgsOpen && 'rotate-180')} />
          </div>
        </button>

        {pkgsOpen && (
          <div className="p-4 space-y-3">
            {clientPkgs.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400">
                <Layers className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                Sin paquetes activos
              </div>
            ) : (
              clientPkgs.map(cp => {
                const remaining = cp.sessionsTotal - cp.sessionsUsed;
                const pct = Math.round((cp.sessionsUsed / cp.sessionsTotal) * 100);
                const isExpired = cp.expiresAt && new Date(cp.expiresAt) < new Date();
                const svcNames = cp.package.services?.map((s: any) => s.service?.name).filter(Boolean).join(', ');
                return (
                  <div key={cp.id} className={cn('p-3 rounded-xl border', isExpired ? 'border-red-200 bg-red-50' : remaining === 0 ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-violet-100 bg-violet-50')}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{cp.package.name}</p>
                        {svcNames && <p className="text-[11px] text-gray-500 truncate">{svcNames}</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Comprado {new Date(cp.purchasedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {cp.expiresAt && ` Â· Vence ${new Date(cp.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('text-lg font-display font-bold leading-none', remaining === 0 ? 'text-gray-400' : isExpired ? 'text-red-500' : 'text-violet-600')}>
                          {remaining}
                        </p>
                        <p className="text-[10px] text-gray-400">de {cp.sessionsTotal}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden border border-violet-100 mb-2">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: isExpired ? '#ef4444' : remaining === 0 ? '#9ca3af' : '#7c3aed' }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => useSessionMutation.mutate(cp.id)}
                        disabled={remaining === 0 || !!isExpired || useSessionMutation.isPending}
                        className="flex-1 text-[11px] font-semibold py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Usar sesiÃ³n
                      </button>
                      {cp.sessionsUsed > 0 && (
                        <button
                          onClick={() => undoSessionMutation.mutate(cp.id)}
                          disabled={undoSessionMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Deshacer sesiÃ³n">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm('Â¿Cancelar este paquete?')) removePkgMutation.mutate(cp.id); }}
                        disabled={removePkgMutation.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancelar paquete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sell Package Modal */}
      {sellPkgModal && (
        <SellPackageModal
          clientId={client.id}
          onClose={() => setSellPkgModal(false)}
          onSold={() => { setSellPkgModal(false); refetchPkgs(); }}
        />
      )}

      {/* History / Gallery tabs */}
      <div>
        {/* Tab switcher */}
        {(() => {
          const allPhotos = appointments.flatMap((a: any) =>
            (a.photos ?? []).map((p: any) => ({ ...p, apptDate: a.date, apptServices: a.services?.map((s: any) => s.service?.name).filter(Boolean).join(', ') }))
          );
          return (
            <>
              <div className="flex gap-1 mb-3 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setHistoryTab('history')}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    historyTab === 'history' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
                  <Clock className="w-3.5 h-3.5" /> Historial
                  {appointments.length > 0 && <span className="bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 text-[10px] leading-none">{appointments.length}</span>}
                </button>
                <button
                  onClick={() => setHistoryTab('gallery')}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    historyTab === 'gallery' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
                  <Image className="w-3.5 h-3.5" /> GalerÃ­a
                  {allPhotos.length > 0 && <span className="bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 text-[10px] leading-none">{allPhotos.length}</span>}
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : historyTab === 'history' ? (
                appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Sin citas registradas</div>
                ) : (
                  <div className="space-y-2">
                    {appointments.map((a: any) => {
                      const Icon = APPT_STATUS_ICON[a.status] ?? Clock;
                      const color = APPT_STATUS_COLOR[a.status] ?? 'text-gray-400';
                      const svcNames = a.services?.map((s: any) => s.service?.name).filter(Boolean).join(', ');
                      const photoCount = (a.photos ?? []).length;
                      const afterPhoto = (a.photos ?? []).find((p: any) => p.type === 'AFTER') ?? (a.photos ?? [])[0];
                      return (
                        <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          {afterPhoto ? (
                            <img src={afterPhoto.url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setLightbox({ url: afterPhoto.url, caption: afterPhoto.caption })} />
                          ) : (
                            <Icon className={cn('w-4 h-4 mt-1 shrink-0', color)} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800">
                                {formatDate(a.date)} Â· {a.startTime}
                                {a.recurrenceGroupId && <RefreshCw className="inline w-3 h-3 text-primary ml-1 opacity-60" />}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                {photoCount > 0 && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
                                    <Camera className="w-3 h-3" />{photoCount}
                                  </span>
                                )}
                                {a.payment && <span className="text-xs font-bold text-emerald-600">{formatCOP(a.payment.amount)}</span>}
                              </div>
                            </div>
                            {svcNames && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                <Scissors className="w-3 h-3 shrink-0" />{svcNames}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-0.5">
                              <p className={cn('text-xs font-medium', color)}>{STATUS_LABELS[a.status] ?? a.status}</p>
                              {a.rating && (
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={cn('w-3 h-3', s <= a.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                allPhotos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Sin fotos registradas</div>
                ) : (
                  <div className="columns-3 gap-2 space-y-2">
                    {allPhotos.map((p: any) => (
                      <div key={p.id} className="break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden"
                        onClick={() => setLightbox({ url: p.url, caption: p.caption ?? p.apptServices })}>
                        <img src={p.url} alt={p.caption ?? ''} className="w-full rounded-xl object-cover group-hover:brightness-90 transition-all" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
                          <p className="text-[9px] text-white/90 leading-tight truncate">{p.apptServices}</p>
                          <p className="text-[9px] text-white/60">{formatDate(p.apptDate)}</p>
                        </div>
                        <span className={cn(
                          'absolute top-1 right-1 text-[8px] font-bold px-1 py-0.5 rounded uppercase leading-none',
                          p.type === 'BEFORE' ? 'bg-orange-500/80 text-white' : p.type === 'AFTER' ? 'bg-emerald-500/80 text-white' : 'bg-gray-500/70 text-white'
                        )}>{p.type === 'BEFORE' ? 'Antes' : p.type === 'AFTER' ? 'DespuÃ©s' : 'Foto'}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          );
        })()}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption ?? ''} className="w-full rounded-2xl object-contain max-h-[80vh]" />
            {lightbox.caption && <p className="text-white/60 text-center text-sm mt-2">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ WhatsApp Broadcast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BroadcastModal({ clients, onClose }: { clients: Client[]; onClose: () => void }) {
  const [segment, setSegment] = useState<'all' | 'vip' | 'tag'>('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [message, setMessage] = useState('Â¡Hola! Te escribimos del salÃ³n con una novedad especial para ti. ðŸ’…');
  const [sent, setSent] = useState<Set<string>>(new Set());

  const allTags = [...new Set(clients.flatMap(c => c.tags ?? []))].sort();

  const targets = useMemo(() => {
    let list = clients.filter(c => c.phone);
    if (segment === 'vip') list = list.filter(c => c.isVip);
    if (segment === 'tag') list = list.filter(c => c.tags?.includes(selectedTag));
    return list;
  }, [clients, segment, selectedTag]);

  const markSent = (id: string) => setSent(prev => new Set([...prev, id]));

  return (
    <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
      <div>
        <p className="text-sm text-gray-500 mb-1">Elige el segmento de clientes a contactar y personaliza el mensaje.</p>
      </div>

      {/* Segment selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Segmento</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all' as const, label: `Todos con telÃ©fono (${clients.filter(c => c.phone).length})` },
            { key: 'vip' as const, label: `Solo VIP (${clients.filter(c => c.isVip && c.phone).length})` },
            { key: 'tag' as const, label: 'Por etiqueta' },
          ].map(opt => (
            <button key={opt.key} onClick={() => setSegment(opt.key)}
              className={cn('px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                segment === opt.key ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40')}>
              {opt.label}
            </button>
          ))}
        </div>
        {segment === 'tag' && (
          <select className="input mt-2 text-sm" value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
            <option value="">Seleccionar etiqueta</option>
            {allTags.map(t => <option key={t} value={t}>{t} ({clients.filter(c => c.tags?.includes(t) && c.phone).length})</option>)}
          </select>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Mensaje</label>
        <textarea
          className="input resize-none text-sm"
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Escribe el mensaje que enviarÃ¡s..."
        />
        <p className="text-xs text-gray-400 mt-1">Cada enlace incluirÃ¡ "Hola [Nombre]!" al inicio</p>
      </div>

      {/* Target list */}
      {targets.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No hay clientes con telÃ©fono en este segmento
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{targets.length} destinatarios</p>
            <p className="text-xs text-gray-400">{sent.size} enviados</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {targets.map(c => {
              const isSent = sent.has(c.id);
              const personalMsg = encodeURIComponent(`Â¡Hola ${c.name.split(' ')[0]}! ${message}`);
              return (
                <div key={c.id} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all',
                  isSent ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100')}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                    isSent ? 'bg-emerald-400' : 'bg-[#083D42]')}>
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      {c.name}
                      {c.isVip && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                    </p>
                    <p className="text-xs text-gray-400">{c.phone}</p>
                  </div>
                  {isSent ? (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                    </span>
                  ) : (
                    <a
                      href={`https://wa.me/${c.phone!.replace(/\D/g,'')}?text=${personalMsg}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => setTimeout(() => markSent(c.id), 500)}
                      className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-600 transition-colors shrink-0">
                      <Send className="w-3 h-3" /> Enviar
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cerrar</button>
      </div>
    </div>
  );
}

// â”€â”€â”€ CSV Import â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ImportRow = { name: string; phone: string; email?: string; birthday?: string; notes?: string };

function parseCSV(text: string): ImportRow[] | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const splitRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = splitRow(lines[0]).map(h => h.toLowerCase().normalize('NFD').replace(/[Ì€-Í¯]/g, '').replace(/[^a-z0-9]/g, ''));
  const findIdx = (...names: string[]) => names.reduce((f, n) => f >= 0 ? f : headers.findIndex(h => h.includes(n)), -1);

  const nIdx = findIdx('nombre', 'name', 'cliente');
  const pIdx = findIdx('telefono', 'celular', 'phone', 'movil');
  const eIdx = findIdx('email', 'correo');
  const bIdx = findIdx('cumple', 'birthday', 'nacimiento');
  const noIdx = findIdx('nota', 'observ', 'comment');

  if (nIdx < 0 || pIdx < 0) return null;

  return lines.slice(1)
    .map(l => splitRow(l))
    .filter(r => r[nIdx] && r[pIdx])
    .map(r => ({
      name: r[nIdx],
      phone: r[pIdx],
      email: eIdx >= 0 && r[eIdx] ? r[eIdx] : undefined,
      birthday: bIdx >= 0 && r[bIdx] ? r[bIdx] : undefined,
      notes: noIdx >= 0 && r[noIdx] ? r[noIdx] : undefined,
    }));
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: (count: number) => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseCSV(e.target?.result as string ?? '');
      if (!parsed) {
        setError('No se pudo leer el CSV. AsegÃºrate de tener columnas "Nombre" y "TelÃ©fono".');
        return;
      }
      if (parsed.length === 0) { setError('El archivo no contiene clientes vÃ¡lidos.'); return; }
      setRows(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const downloadTemplate = () => {
    const csv = 'Nombre,TelÃ©fono,Email,CumpleaÃ±os,Notas\nMarÃ­a GarcÃ­a,+57 310 123 4567,maria@ejemplo.com,1990-03-15,AlÃ©rgica a acrÃ­lico\n';
    const blob = new Blob(['ï»¿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'plantilla_clientes.csv';
    a.click();
  };

  const doImport = async () => {
    setImporting(true);
    let count = 0;
    for (const row of rows) {
      try { await clientsApi.create(row); count++; } catch { /* skip duplicates/errors */ }
      setImported(count);
    }
    setImporting(false);
    setDone(true);
    onDone(count);
  };

  if (done) return (
    <div className="p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <p className="font-display font-bold text-gray-900 text-lg">{imported} cliente{imported !== 1 ? 's' : ''} importado{imported !== 1 ? 's' : ''}</p>
        <p className="text-sm text-gray-400 mt-1">Los duplicados o errores fueron omitidos</p>
      </div>
      <button onClick={onClose} className="btn-primary w-full justify-center">Listo</button>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {rows.length === 0 ? (
        <>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Arrastra tu CSV aquÃ­ o haz clic</p>
            <p className="text-xs text-gray-400 mt-1">Necesita columnas: <strong>Nombre</strong> y <strong>TelÃ©fono</strong></p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}
          <button onClick={downloadTemplate} className="btn-ghost w-full justify-center gap-1.5 text-sm">
            <Download className="w-4 h-4" /> Descargar plantilla de ejemplo
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">{rows.length} clientes detectados</p>
            <button onClick={() => setRows([])} className="text-xs text-gray-400 hover:text-gray-600 underline">Cambiar archivo</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nombre', 'TelÃ©fono', 'Email', 'Notas'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 text-gray-800 font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-gray-600">{r.phone}</td>
                    <td className="px-3 py-2 text-gray-400">{r.email ?? 'â€”'}</td>
                    <td className="px-3 py-2 text-gray-400 truncate max-w-[120px]">{r.notes ?? 'â€”'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 6 && (
              <p className="text-center text-xs text-gray-400 py-2">â€¦ y {rows.length - 6} mÃ¡s</p>
            )}
          </div>
          {importing ? (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Importandoâ€¦</span>
                <span className="font-semibold">{imported} / {rows.length}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${rows.length > 0 ? (imported / rows.length) * 100 : 0}%` }} />
              </div>
            </div>
          ) : (
            <button onClick={doImport} className="btn-primary w-full justify-center gap-2">
              <Upload className="w-4 h-4" /> Importar {rows.length} clientes
            </button>
          )}
        </>
      )}
    </div>
  );
}

type SortKey = 'name' | 'visits' | 'points' | 'recent';

export function Clients() {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [vipOnly, setVipOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('name');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: allClients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.list(search).then((r) => r.data),
  });

  const allTags = [...new Set(allClients.flatMap(c => c.tags ?? []))].sort();
  const clients = useMemo(() => {
    let list = tagFilter ? allClients.filter(c => c.tags?.includes(tagFilter)) : allClients;
    if (vipOnly) list = list.filter(c => c.isVip);
    return [...list].sort((a, b) => {
      if (sort === 'visits') return (b.visitCount ?? 0) - (a.visitCount ?? 0);
      if (sort === 'points') return (b.points ?? 0) - (a.points ?? 0);
      if (sort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.name.localeCompare(b.name, 'es');
    });
  }, [allClients, tagFilter, vipOnly, sort]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Client>) => clientsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setShowForm(false); toast('Cliente creado exitosamente', 'success'); },
    onError: () => toast('Error al crear cliente', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => clientsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setEditClient(null); toast('Cliente actualizado', 'success'); },
    onError: () => toast('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setSelectedClient(null); toast('Cliente eliminado', 'success'); },
    onError: () => toast('No se puede eliminar (tiene citas asociadas)', 'error'),
  });

  const vipMutation = useMutation({
    mutationFn: ({ id, isVip }: { id: string; isVip: boolean }) => clientsApi.update(id, { isVip }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClient(res.data);
      toast(res.data.isVip ? 'Cliente marcado como VIP' : 'Rango VIP removido', 'success');
    },
    onError: () => toast('Error al actualizar', 'error'),
  });

  const exportCSV = async () => {
    const { data } = await clientsApi.exportData();
    const headers = ['Nombre', 'TelÃ©fono', 'Email', 'CumpleaÃ±os', 'Etiquetas', 'VIP', 'Visitas', 'Puntos', 'No-shows', 'Total gastado COP', 'Registro'];
    const rows = (data as any[]).map(c => [
      c.name,
      c.phone ?? '',
      c.email ?? '',
      c.birthday ? String(c.birthday).slice(0, 10) : '',
      (c.tags ?? []).join(' | '),
      c.isVip ? 'SÃ­' : 'No',
      c.visitCount ?? 0,
      c.points ?? 0,
      c.noShowCount ?? 0,
      c.totalSpent ?? 0,
      c.createdAt ? String(c.createdAt).slice(0, 10) : '',
    ].map(v => `"${v}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['ï»¿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 py-2"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button onClick={exportCSV} disabled={!allClients.length} className="btn-secondary flex items-center gap-1.5" title="Exportar CSV">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button onClick={() => setShowBroadcast(true)} className="btn-secondary flex items-center gap-1.5 text-green-700 border-green-200 hover:bg-green-50">
          <Radio className="w-4 h-4" /> Broadcast
        </button>
        <button onClick={() => setShowImport(true)} className="btn-ghost" title="Importar CSV">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Importar</span>
        </button>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {/* Stats + sort */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex gap-3 text-sm text-gray-500 flex-1">
          <span>{clients.length} clientes</span>
          <span>Â·</span>
          <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-500" /> {allClients.filter(c => c.isVip).length} VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:border-primary/40">
            <option value="name">Aâ€“Z</option>
            <option value="visits">MÃ¡s visitas</option>
            <option value="points">MÃ¡s puntos</option>
            <option value="recent">MÃ¡s recientes</option>
          </select>
        </div>
      </div>

      {/* Tag + VIP filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
        <button
          onClick={() => { setTagFilter(null); setVipOnly(false); }}
          className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            !tagFilter && !vipOnly ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary/40')}>
          Todos
        </button>
        <button
          onClick={() => { setVipOnly(v => !v); setTagFilter(null); }}
          className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1',
            vipOnly ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-amber-600 border-amber-200 hover:border-amber-300')}>
          <Crown className="w-3 h-3" /> VIP
        </button>
        {allTags.map(t => (
          <button key={t}
            onClick={() => { setTagFilter(tagFilter === t ? null : t); setVipOnly(false); }}
            className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all',
              tagFilter === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary/40')}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">{search ? 'Sin resultados para tu bÃºsqueda' : 'Sin clientes aÃºn'}</p>
          {!search && <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">Agregar primer cliente</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {clients.map((c) => (
            <div key={c.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-beauty transition-all cursor-pointer group"
              onClick={() => setSelectedClient(c)}>
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#083D42] flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(c.name)}
                    </div>
                  )}
                  {c.isVip && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                    {(c.noShowCount ?? 0) >= 2 && (
                      <span title={`${c.noShowCount} no-shows registrados`}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                        âš  {c.noShowCount} NS
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{c.phone}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(c.visitCount ?? 0) > 0 && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Scissors className="w-2.5 h-2.5" /> {c.visitCount} visita{c.visitCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {(c.points ?? 0) > 0 && (
                      <span className="text-[10px] text-primary flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5" /> {c.points} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {c.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t}</span>
                  ))}
                  {c.tags.length > 3 && <span className="text-[10px] text-gray-400">+{c.tags.length - 3}</span>}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{c.visitCount} visitas</span>
                  {(() => {
                    const t = getLoyaltyTier(c.visitCount ?? 0);
                    return (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', t.bg, t.color)}>
                        {t.label}
                      </span>
                    );
                  })()}
                  {(c.points ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />{c.points}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditClient(c); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Â¿Eliminar este cliente?')) deleteMutation.mutate(c.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo cliente">
        <ClientForm allClients={allClients} onSave={(d) => createMutation.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Editar cliente">
        {editClient && (
          <ClientForm client={editClient} allClients={allClients} onSave={(d) => updateMutation.mutate({ id: editClient.id, data: d })} onClose={() => setEditClient(null)} />
        )}
      </Modal>

      {/* Detail modal */}
      <Modal open={!!selectedClient && !editClient} onClose={() => setSelectedClient(null)} title={selectedClient?.name}>
        {selectedClient && <ClientDetail
          client={selectedClient}
          onVip={() => vipMutation.mutate({ id: selectedClient.id, isVip: !selectedClient.isVip })}
          vipPending={vipMutation.isPending}
          onEdit={() => { setSelectedClient(null); setEditClient(selectedClient); }}
        />}
      </Modal>

      {/* Broadcast modal */}
      <Modal open={showBroadcast} onClose={() => setShowBroadcast(false)} title="Broadcast WhatsApp" size="lg">
        <BroadcastModal clients={allClients} onClose={() => setShowBroadcast(false)} />
      </Modal>

      {/* Import CSV modal */}
      {showImport && (
        <CsvImportModal
          onClose={() => setShowImport(false)}
          onImported={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

