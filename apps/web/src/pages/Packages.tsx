import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package2, Edit2, Trash2, Clock, DollarSign, Loader2, Check, X, Tag } from 'lucide-react';
import { packagesApi, servicesApi } from '../lib/api';
import { Service } from '../types';
import { formatCOP, CATEGORY_LABELS, cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

interface ServicePackage {
  id: string; name: string; description?: string | null;
  price: number; duration: number; image?: string | null; isActive: boolean;
  services: Array<{ service: Pick<Service, 'id' | 'name' | 'category' | 'price' | 'duration'> }>;
}

function PackageForm({ pkg, onSave, onClose }: {
  pkg?: ServicePackage; onSave: (d: object) => void; onClose: () => void;
}) {
  const [name, setName] = useState(pkg?.name ?? '');
  const [description, setDescription] = useState(pkg?.description ?? '');
  const [price, setPrice] = useState(pkg?.price?.toString() ?? '');
  const [duration, setDuration] = useState(pkg?.duration?.toString() ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(pkg?.services.map(s => s.service.id) ?? []);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services-all'],
    queryFn: () => servicesApi.list(undefined, false).then(r => r.data),
  });

  const toggle = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const sumPrice = services.filter(s => selectedIds.includes(s.id)).reduce((a, s) => a + s.price, 0);
  const sumDuration = services.filter(s => selectedIds.includes(s.id)).reduce((a, s) => a + s.duration, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || selectedIds.length === 0) return;
    onSave({ name, description, price: Number(price), duration: Number(duration) || sumDuration, serviceIds: selectedIds });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="label">Nombre del paquete *</label>
        <input className="input" placeholder="Ej: Manicure + Pedicure completa" value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div>
        <label className="label">Descripción (opcional)</label>
        <textarea className="input resize-none" rows={2} placeholder="Qué incluye, condiciones, duración estimada..."
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Servicios incluidos *</label>
          {selectedIds.length > 0 && (
            <p className="text-xs text-muted">
              Precio individual: {formatCOP(sumPrice)} · {sumDuration} min
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {services.map(s => {
            const selected = selectedIds.includes(s.id);
            return (
              <button type="button" key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-xl border text-left text-sm transition-all',
                  selected ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300',
                )}>
                <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  selected ? 'border-primary bg-primary' : 'border-gray-300')}>
                  {selected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted">{formatCOP(s.price)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Precio del paquete *</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" type="number" min="0" step="1000"
              placeholder={sumPrice > 0 ? String(sumPrice) : '0'}
              value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          {sumPrice > 0 && price && Number(price) < sumPrice && (
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Ahorro: {formatCOP(sumPrice - Number(price))} ({Math.round((1 - Number(price)/sumPrice)*100)}%)
            </p>
          )}
        </div>
        <div>
          <label className="label">Duración (min)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" type="number" min="0" step="5"
              placeholder={sumDuration > 0 ? String(sumDuration) : '60'}
              value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
        <button type="submit" disabled={selectedIds.length === 0 || !price} className="btn-primary flex-1">
          {pkg ? 'Guardar cambios' : 'Crear paquete'}
        </button>
      </div>
    </form>
  );
}

function PackageCard({ pkg, onEdit, onDelete }: {
  pkg: ServicePackage; onEdit: () => void; onDelete: () => void;
}) {
  const sumOriginal = pkg.services.reduce((a, s) => a + s.service.price, 0);
  const discount = sumOriginal > 0 ? Math.round((1 - pkg.price / sumOriginal) * 100) : 0;

  return (
    <div className={cn('card p-4 group', !pkg.isActive && 'opacity-60')}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-gray-900 truncate">{pkg.name}</p>
            {discount > 0 && (
              <span className="shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
          {pkg.description && <p className="text-xs text-muted truncate">{pkg.description}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Services list */}
      <div className="flex flex-wrap gap-1 mb-3">
        {pkg.services.map(s => (
          <span key={s.service.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {s.service.name}
          </span>
        ))}
      </div>

      {/* Price & duration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs text-muted">{pkg.duration} min</span>
        </div>
        <div className="text-right">
          {sumOriginal > pkg.price && (
            <p className="text-[10px] text-gray-400 line-through leading-none">{formatCOP(sumOriginal)}</p>
          )}
          <p className="text-base font-bold text-primary">{formatCOP(pkg.price)}</p>
        </div>
      </div>
    </div>
  );
}

export function Packages() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg] = useState<ServicePackage | undefined>();
  const [showInactive, setShowInactive] = useState(false);

  const { data: packages = [], isLoading } = useQuery<ServicePackage[]>({
    queryKey: ['packages', showInactive],
    queryFn: () => packagesApi.list(showInactive).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => packagesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast('Paquete creado', 'success'); setShowForm(false); },
    onError: (e: any) => toast(e.response?.data?.error ?? 'Error al crear', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => packagesApi.update(editPkg!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast('Paquete actualizado', 'success'); setEditPkg(undefined); },
    onError: (e: any) => toast(e.response?.data?.error ?? 'Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => packagesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast('Paquete eliminado', 'success'); },
  });

  const handleDelete = (pkg: ServicePackage) => {
    if (confirm(`¿Eliminar el paquete "${pkg.name}"?`)) deleteMutation.mutate(pkg.id);
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Paquetes</h1>
          <p className="text-sm text-muted">Combos de servicios a precio especial</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(v => !v)}
            className={cn('btn-ghost text-sm gap-1.5', showInactive && 'text-primary')}>
            {showInactive ? <X className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
            {showInactive ? 'Ocultar inactivos' : 'Ver inactivos'}
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo paquete
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <Package2 className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">Aún no tienes paquetes de servicios</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
            Crear primer paquete
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg}
              onEdit={() => setEditPkg(pkg)}
              onDelete={() => handleDelete(pkg)}
            />
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo paquete" size="lg">
        <PackageForm
          onSave={data => createMutation.mutate(data)}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editPkg} onClose={() => setEditPkg(undefined)} title="Editar paquete" size="lg">
        {editPkg && (
          <PackageForm
            pkg={editPkg}
            onSave={data => updateMutation.mutate(data)}
            onClose={() => setEditPkg(undefined)}
          />
        )}
      </Modal>
    </div>
  );
}
