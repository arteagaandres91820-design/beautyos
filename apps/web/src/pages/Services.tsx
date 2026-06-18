import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Scissors, Edit2, Trash2, Clock, DollarSign, Loader2, RotateCcw, EyeOff, ImagePlus, X as XIcon, Package, Link2, ListChecks, TrendingUp } from 'lucide-react';
import { servicesApi, inventoryApi } from '../lib/api';
import { Service, ServiceCategory } from '../types';
import { formatCOP, CATEGORY_LABELS, cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  HAIR: '💇', NAILS: '💅', FACE: '✨', BARBERSHOP: '✂️', SPA: '🌸', OTHER: '🌟',
};

const CATEGORIES: ServiceCategory[] = ['HAIR', 'NAILS', 'FACE', 'BARBERSHOP', 'SPA', 'OTHER'];

function ServiceForm({ service, onSave, onClose }: {
  service?: Service; onSave: (d: object) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: service?.name ?? '',
    category: service?.category ?? 'NAILS',
    price: service?.price?.toString() ?? '',
    duration: service?.duration?.toString() ?? '',
    description: service?.description ?? '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Nombre del servicio *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ej: Manicure en Gel" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Categoría *</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)} required>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Precio COP *</label>
          <input className="input" type="number" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="55000" min="0" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Duración (min) *</label>
          <input className="input" type="number" value={form.duration} onChange={e => set('duration', e.target.value)} required placeholder="60" min="5" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción corta del servicio" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center">{service ? 'Guardar cambios' : 'Crear servicio'}</button>
      </div>
    </form>
  );
}

function ServiceImageUpload({ service }: { service: Service }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => servicesApi.uploadImage(service.id, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast('Imagen actualizada', 'success'); },
    onError: () => toast('Error al subir imagen', 'error'),
  });

  const removeImage = () => {
    servicesApi.update(service.id, { image: null })
      .then(() => { qc.invalidateQueries({ queryKey: ['services'] }); toast('Imagen eliminada', 'success'); })
      .catch(() => toast('Error', 'error'));
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group">
      {service.image ? (
        <>
          <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button onClick={() => fileRef.current?.click()}
              className="p-2 bg-white rounded-xl shadow text-gray-700 hover:bg-gray-50 transition-colors">
              <ImagePlus className="w-4 h-4" />
            </button>
            <button onClick={removeImage}
              className="p-2 bg-white rounded-xl shadow text-red-500 hover:bg-red-50 transition-colors">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-300 hover:text-primary hover:bg-primary/5 transition-all">
          {uploadMutation.isPending
            ? <Loader2 className="w-6 h-6 animate-spin text-primary" />
            : <><ImagePlus className="w-6 h-6" /><span className="text-xs font-medium">Añadir foto</span></>
          }
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f); e.target.value = ''; }} />
    </div>
  );
}

// ─── Product Linker Modal ──────────────────────────────────────────────────
function ProductLinkerModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: allProducts = [] } = useQuery<{ id: string; name: string; unit: string; stock: number; category: string }[]>({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list().then(r => r.data),
  });

  const { data: linked = [], isLoading: loadingLinked } = useQuery<{ productId: string; quantity: number; product: { id: string; name: string; unit: string } }[]>({
    queryKey: ['service-products', service.id],
    queryFn: () => servicesApi.getProducts(service.id).then(r => r.data),
  });

  const [links, setLinks] = useState<{ productId: string; quantity: number }[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (!loadingLinked && !initialized && linked.length >= 0) {
    setLinks(linked.map(l => ({ productId: l.productId, quantity: l.quantity })));
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => servicesApi.setProducts(service.id, links),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-products', service.id] });
      toast('Productos vinculados guardados', 'success');
      onClose();
    },
    onError: () => toast('Error al guardar', 'error'),
  });

  const addProduct = (productId: string) => {
    if (!links.find(l => l.productId === productId)) {
      setLinks(prev => [...prev, { productId, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => setLinks(prev => prev.filter(l => l.productId !== productId));
  const setQty = (productId: string, q: number) =>
    setLinks(prev => prev.map(l => l.productId === productId ? { ...l, quantity: Math.max(0.1, q) } : l));

  const available = allProducts.filter(p => !links.find(l => l.productId === p.id));

  return (
    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
      <p className="text-sm text-gray-500">
        Al completar una cita con <strong>{service.name}</strong>, el stock de estos productos se descuenta automáticamente.
      </p>

      {/* Linked products */}
      {loadingLinked ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {links.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin productos vinculados aún</p>
          ) : (
            links.map(link => {
              const prod = allProducts.find(p => p.id === link.productId);
              return (
                <div key={link.productId} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-edge">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{prod?.name ?? link.productId}</span>
                  <input type="number" min={0.1} step={0.5}
                    className="input py-1 text-xs w-20 text-center"
                    value={link.quantity}
                    onChange={e => setQty(link.productId, Number(e.target.value))} />
                  <span className="text-xs text-gray-400 shrink-0">{prod?.unit ?? 'un'}</span>
                  <button onClick={() => removeProduct(link.productId)}
                    className="p-1 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors shrink-0">
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add product dropdown */}
      {available.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Agregar producto</label>
          <select className="input text-sm" onChange={e => { if (e.target.value) addProduct(e.target.value); e.target.value = ''; }} defaultValue="">
            <option value="">Seleccionar del inventario…</option>
            {available.map(p => (
              <option key={p.id} value={p.id}>{p.name} (stock: {p.stock} {p.unit})</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="btn-primary flex-1 justify-center">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

function ChecklistModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [steps, setSteps] = useState<string[]>(() => {
    try { return JSON.parse(service.checklist ?? '[]'); } catch { return []; }
  });
  const [newStep, setNewStep] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => servicesApi.setChecklist(service.id, steps),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast('Checklist guardado', 'success'); onClose(); },
    onError: () => toast('Error al guardar', 'error'),
  });

  const addStep = () => {
    const s = newStep.trim();
    if (!s) return;
    setSteps(prev => [...prev, s]);
    setNewStep('');
  };

  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));

  const moveStep = (i: number, dir: -1 | 1) => {
    const next = [...steps];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  return (
    <div className="space-y-4 p-1">
      <p className="text-sm text-gray-500">Pasos de preparación para <strong>{service.name}</strong>. Se muestran en la cita como lista de verificación.</p>

      <div className="space-y-2">
        {steps.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin pasos aún</p>}
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 p-2.5 bg-surface rounded-xl border border-edge">
            <span className="text-xs text-gray-400 font-mono w-5 text-center shrink-0">{i + 1}</span>
            <span className="flex-1 text-sm text-gray-700">{step}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20">↑</button>
              <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20">↓</button>
              <button onClick={() => removeStep(i)} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><XIcon className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="Nuevo paso (ej: Sanitizar herramientas)"
          value={newStep}
          onChange={e => setNewStep(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStep()}
        />
        <button onClick={addStep} disabled={!newStep.trim()} className="btn-primary px-3">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary flex-1 justify-center">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export function Services() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [productLinkerService, setProductLinkerService] = useState<Service | null>(null);
  const [checklistService, setChecklistService] = useState<Service | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['services', activeCategory],
    queryFn: () => servicesApi.list(activeCategory === 'ALL' ? undefined : activeCategory, true).then(r => r.data),
  });

  const { data: statsData = [] } = useQuery<{ serviceId: string; count: number; revenue: number }[]>({
    queryKey: ['services-stats'],
    queryFn: () => servicesApi.stats().then(r => r.data),
  });
  const statsMap = new Map(statsData.map(s => [s.serviceId, s]));
  const maxCount = statsData.length > 0 ? Math.max(...statsData.map(s => s.count)) : 0;

  const activeServices = services.filter(s => s.isActive);
  const inactiveServices = services.filter(s => !s.isActive);

  const createMutation = useMutation({
    mutationFn: (d: object) => servicesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setShowForm(false); toast('Servicio creado', 'success'); },
    onError: () => toast('Error al crear servicio', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => servicesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setEditService(null); toast('Servicio actualizado', 'success'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast('Servicio desactivado', 'success'); },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => servicesApi.update(id, { isActive: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast('Servicio reactivado', 'success'); },
  });

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const filtered = activeServices.filter(s => s.category === cat);
    if (filtered.length) acc[cat] = filtered;
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">{activeServices.length} servicios activos</p>
          {inactiveServices.length > 0 && (
            <button onClick={() => setShowInactive(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-0.5 transition-colors">
              <EyeOff className="w-3 h-3" />
              {showInactive ? 'Ocultar inactivos' : `${inactiveServices.length} inactivos`}
            </button>
          )}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nuevo servicio</button>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
        <button onClick={() => setActiveCategory('ALL')}
          className={cn('px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
            activeCategory === 'ALL' ? 'bg-primary text-white shadow-beauty' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300')}>
          Todos
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={cn('px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              activeCategory === c ? 'bg-primary text-white shadow-beauty' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300')}>
            {CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : activeServices.length === 0 ? (
        <div className="text-center py-16">
          <Scissors className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">Sin servicios en esta categoría</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">Crear servicio</button>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeCategory === 'ALL'
            ? Object.entries(byCategory)
            : [[activeCategory, activeServices.filter(s => s.category === activeCategory)]] as [string, Service[]][]
          ).map(([cat, svs]) => (
            <div key={cat}>
              <h3 className="font-display font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <span>{CATEGORY_ICONS[cat as ServiceCategory]}</span>
                {CATEGORY_LABELS[cat]}
                <span className="text-xs text-gray-400 font-normal">({svs.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {svs.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-beauty transition-all group overflow-hidden">
                    {/* Image slot */}
                    <ServiceImageUpload service={s} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                          {s.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => setProductLinkerService(s)} title="Vincular productos"
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary"><Link2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setChecklistService(s)} title="Checklist de preparación"
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 relative">
                            <ListChecks className="w-3.5 h-3.5" />
                            {(() => { try { return JSON.parse(s.checklist ?? '[]').length > 0; } catch { return false; } })() && (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                            )}
                          </button>
                          <button onClick={() => setEditService(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm('¿Desactivar este servicio?')) deleteMutation.mutate(s.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1 text-sm font-semibold text-primary"><DollarSign className="w-3.5 h-3.5" />{formatCOP(s.price)}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{s.duration} min</span>
                      </div>
                      {(() => {
                        const stat = statsMap.get(s.id);
                        if (!stat || stat.count === 0) return null;
                        const revenuePerHour = Math.round(stat.revenue / (stat.count * s.duration / 60));
                        const isHot = maxCount > 2 && stat.count >= maxCount * 0.6;
                        return (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            {isHot && <span className="mr-0.5">🔥</span>}
                            <span className="font-medium text-gray-600">{stat.count}</span>
                            <span>{stat.count === 1 ? 'cita' : 'citas'}</span>
                            <span className="flex items-center gap-0.5 ml-auto text-emerald-600 font-medium">
                              <TrendingUp className="w-3 h-3" />
                              {formatCOP(revenuePerHour)}/h
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Inactive services ── */}
          {showInactive && inactiveServices.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-gray-400 text-sm mb-3 flex items-center gap-2">
                <EyeOff className="w-4 h-4" /> Servicios inactivos
                <span className="text-xs font-normal">({inactiveServices.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {inactiveServices.map(s => (
                  <div key={s.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 opacity-60 group hover:opacity-100 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-500 truncate line-through">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_ICONS[s.category]} {CATEGORY_LABELS[s.category]}</p>
                      </div>
                      <button onClick={() => restoreMutation.mutate(s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all shrink-0"
                        title="Reactivar">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-400"><DollarSign className="w-3.5 h-3.5" />{formatCOP(s.price)}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{s.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo servicio">
        <ServiceForm onSave={d => createMutation.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal open={!!editService} onClose={() => setEditService(null)} title="Editar servicio">
        {editService && <ServiceForm service={editService} onSave={d => updateMutation.mutate({ id: editService.id, data: d })} onClose={() => setEditService(null)} />}
      </Modal>
      <Modal open={!!productLinkerService} onClose={() => setProductLinkerService(null)} title="Vincular productos al servicio">
        {productLinkerService && <ProductLinkerModal service={productLinkerService} onClose={() => setProductLinkerService(null)} />}
      </Modal>
      <Modal open={!!checklistService} onClose={() => setChecklistService(null)} title="Checklist de preparación" size="sm">
        {checklistService && <ChecklistModal service={checklistService} onClose={() => setChecklistService(null)} />}
      </Modal>
    </div>
  );
}
