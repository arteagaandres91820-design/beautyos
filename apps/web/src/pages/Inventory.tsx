import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Plus, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
  Loader2, X, Search, ChevronDown, ChevronUp, Edit2, Trash2, Printer, Download,
} from 'lucide-react';
import { inventoryApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { cn, formatCOP } from '../lib/utils';
import { Modal } from '../components/ui/Modal';

// ─── Types ─────────────────────────────────────────────────────────────────
interface StockMovement {
  id: string; type: 'IN' | 'OUT' | 'ADJUST'; quantity: number;
  notes?: string; createdAt: string;
}
interface Product {
  id: string; name: string; brand?: string; category: string;
  unit: string; stock: number; minStock: number; costPrice: number;
  notes?: string; isActive: boolean; isLow: boolean;
  movements: StockMovement[];
}

// ─── Constants ─────────────────────────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; color: string }> = {
  NAIL_POLISH: { label: 'Esmaltes',      color: 'bg-pink-100 text-pink-700' },
  ACRYLIC:     { label: 'Acrílico',      color: 'bg-purple-100 text-purple-700' },
  GEL:         { label: 'Gel',           color: 'bg-violet-100 text-violet-700' },
  HAIR_COLOR:  { label: 'Tintura',       color: 'bg-amber-100 text-amber-700' },
  TOOLS:       { label: 'Herramientas',  color: 'bg-blue-100 text-blue-700' },
  SKINCARE:    { label: 'Skincare',      color: 'bg-emerald-100 text-emerald-700' },
  OTHER:       { label: 'Otro',          color: 'bg-gray-100 text-gray-600' },
};
const UNITS = ['un', 'ml', 'g', 'kg', 'L', 'caja', 'sobre', 'par'];

// ─── Product Form ──────────────────────────────────────────────────────────
function ProductForm({
  product, onSave, onClose, saving,
}: {
  product?: Product; onSave: (data: object) => void; onClose: () => void; saving: boolean;
}) {
  const [name, setName]           = useState(product?.name ?? '');
  const [brand, setBrand]         = useState(product?.brand ?? '');
  const [category, setCategory]   = useState(product?.category ?? 'OTHER');
  const [unit, setUnit]           = useState(product?.unit ?? 'un');
  const [stock, setStock]         = useState(product?.stock ?? 0);
  const [minStock, setMinStock]   = useState(product?.minStock ?? 0);
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? 0);
  const [notes, setNotes]         = useState(product?.notes ?? '');
  const isEdit = !!product;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ name, brand, category, unit, stock, minStock, costPrice, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Nombre del producto</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ej: Esmalte Rojo Carmín" required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Marca</label>
          <input className="input" value={brand} onChange={e => setBrand(e.target.value)} placeholder="OPI, CND…" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Categoría</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Unidad</label>
          <select className="input" value={unit} onChange={e => setUnit(e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {!isEdit && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Stock inicial</label>
            <input className="input" type="number" min={0} step={0.1}
              value={stock} onChange={e => setStock(Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Alerta stock mínimo</label>
          <input className="input" type="number" min={0} step={0.1}
            value={minStock} onChange={e => setMinStock(Number(e.target.value))}
            placeholder="0 = sin alerta" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Precio de costo</label>
          <input className="input" type="number" min={0} step={100}
            value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
          <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Proveedor, referencia…" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={!name.trim() || saving} className="btn-primary flex-1">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : isEdit ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

// ─── Movement Modal ─────────────────────────────────────────────────────────
function MovementModal({
  product, onClose, onSave, saving,
}: {
  product: Product; onClose: () => void;
  onSave: (data: { type: 'IN' | 'OUT' | 'ADJUST'; quantity: number; notes?: string }) => void;
  saving: boolean;
}) {
  const [type, setType]       = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [quantity, setQty]    = useState(1);
  const [notes, setNotes]     = useState('');

  const preview = type === 'IN'
    ? product.stock + quantity
    : type === 'OUT'
    ? Math.max(0, product.stock - quantity)
    : quantity;

  return (
    <div className="p-6 space-y-4">
      <div>
        <p className="text-xs text-gray-400 mb-1">Stock actual</p>
        <p className="text-2xl font-display font-bold text-gray-900">{product.stock} <span className="text-sm text-gray-400">{product.unit}</span></p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([
          { t: 'IN'     as const, label: 'Entrada',  color: 'emerald', icon: TrendingUp },
          { t: 'OUT'    as const, label: 'Consumo',   color: 'red',     icon: TrendingDown },
          { t: 'ADJUST' as const, label: 'Ajuste',   color: 'blue',    icon: RefreshCw },
        ] as const).map(({ t, label, color, icon: Icon }) => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-semibold transition-all',
              type === t
                ? color === 'emerald' ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : color === 'red'   ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            )}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {type === 'ADJUST' ? 'Nueva cantidad total' : 'Cantidad'}
        </label>
        <input className="input" type="number" min={0.1} step={0.1}
          value={quantity} onChange={e => setQty(Number(e.target.value))} />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder={type === 'IN' ? 'Proveedor, factura…' : type === 'OUT' ? 'Servicio, cliente…' : 'Motivo del ajuste'} />
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
        <span className="text-sm text-gray-500">Nuevo stock estimado</span>
        <span className={cn('font-bold text-lg', preview <= product.minStock && product.minStock > 0 ? 'text-red-500' : 'text-gray-900')}>
          {preview} {product.unit}
        </span>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        <button onClick={() => onSave({ type, quantity, notes: notes || undefined })}
          disabled={quantity <= 0 || saving} className="btn-primary flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
        </button>
      </div>
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────
function ProductCard({
  product, onMove, onEdit, onDelete,
}: {
  product: Product;
  onMove: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[product.category] ?? CATEGORIES.OTHER;
  const pct = product.minStock > 0
    ? Math.min(100, Math.round((product.stock / product.minStock) * 100))
    : null;

  return (
    <div className={cn('card transition-all', product.isLow && 'border-red-200 bg-red-50/30')}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
          <Package className="w-5 h-5 text-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                {product.isLow && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                    <AlertTriangle className="w-2.5 h-2.5" /> Stock bajo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cat.color)}>{cat.label}</span>
                {product.brand && <span className="text-[10px] text-gray-400">{product.brand}</span>}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={cn('text-lg font-display font-bold leading-tight', product.isLow ? 'text-red-600' : 'text-gray-900')}>
                {product.stock}
              </p>
              <p className="text-[10px] text-gray-400">{product.unit}</p>
            </div>
          </div>

          {pct !== null && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', pct <= 100 ? 'bg-red-400' : 'bg-emerald-400')}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Mínimo: {product.minStock} {product.unit}
                {product.costPrice > 0 && ` · Costo: ${formatCOP(product.costPrice)}`}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <button onClick={() => onMove(product)}
              className="text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-colors">
              Movimiento
            </button>
            <button onClick={() => onEdit(product)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(product)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {product.movements.length > 0 && (
              <button onClick={() => setExpanded(p => !p)}
                className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                Historial {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {expanded && product.movements.length > 0 && (
            <div className="mt-2 border-t border-gray-100 pt-2 space-y-1.5">
              {product.movements.map(mv => (
                <div key={mv.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {mv.type === 'IN'     && <TrendingUp   className="w-3 h-3 text-emerald-500" />}
                    {mv.type === 'OUT'    && <TrendingDown  className="w-3 h-3 text-red-500" />}
                    {mv.type === 'ADJUST' && <RefreshCw    className="w-3 h-3 text-blue-500" />}
                    <span className="text-gray-500">{mv.notes || (mv.type === 'IN' ? 'Entrada' : mv.type === 'OUT' ? 'Consumo' : 'Ajuste')}</span>
                  </div>
                  <span className={cn('font-bold', mv.type === 'IN' ? 'text-emerald-600' : mv.type === 'OUT' ? 'text-red-500' : 'text-blue-600')}>
                    {mv.type === 'IN' ? '+' : mv.type === 'OUT' ? '-' : '='}{mv.quantity} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reorder helpers ───────────────────────────────────────────────────────
function printReorderSheet(lowProducts: Product[], bizName?: string) {
  const dateStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const rows = lowProducts.map(p => {
    const toOrder = Math.max(0, p.minStock - p.stock);
    const subtotal = toOrder * p.costPrice;
    const cat = CATEGORIES[p.category]?.label ?? p.category;
    return `<tr>
      <td>${p.name}${p.notes ? `<br/><span style="font-size:10px;color:#9ca3af">${p.notes}</span>` : ''}</td>
      <td style="color:#6b7280">${p.brand || '—'}</td>
      <td style="color:#6b7280">${cat}</td>
      <td style="text-align:right;color:#ef4444;font-weight:600">${p.stock} ${p.unit}</td>
      <td style="text-align:right;color:#6b7280">${p.minStock} ${p.unit}</td>
      <td style="text-align:right;font-weight:700;color:#0d1b2a">${toOrder} ${p.unit}</td>
      <td style="text-align:right;color:#6b7280">${p.costPrice > 0 ? `$${p.costPrice.toLocaleString('es-CO')}` : '—'}</td>
      <td style="text-align:right;font-weight:600;color:#2dc7b3">${subtotal > 0 ? `$${subtotal.toLocaleString('es-CO')}` : '—'}</td>
    </tr>`;
  }).join('');
  const grandTotal = lowProducts.reduce((s, p) => s + Math.max(0, p.minStock - p.stock) * p.costPrice, 0);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista de reabastecimiento</title>
  <style>
    body{font-family:sans-serif;color:#1a1a1a;max-width:900px;margin:0 auto;padding:24px;font-size:13px}
    h1{font-size:20px;font-weight:800;margin:0 0 2px;color:#0d1b2a}
    .sub{color:#9ca3af;font-size:12px;margin:0 0 20px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{text-align:left;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:6px 8px;border-bottom:2px solid #e5e7eb}
    td{padding:8px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
    tr:last-child td{border-bottom:none}
    .total-row td{font-weight:800;font-size:14px;border-top:2px solid #0d1b2a;background:#f9fafb}
    .footer{margin-top:24px;font-size:10px;color:#9ca3af;text-align:right}
    .badge{display:inline-block;padding:2px 6px;border-radius:999px;font-size:10px;font-weight:700;background:#fef2f2;color:#ef4444}
    @media print{body{padding:8px}}
  </style></head><body>
  <h1>${bizName ?? 'BeautyOS'} — Lista de reabastecimiento</h1>
  <p class="sub">${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} · ${lowProducts.length} producto${lowProducts.length !== 1 ? 's' : ''} bajo mínimo</p>
  <table>
    <thead><tr>
      <th>Producto</th><th>Marca</th><th>Categoría</th>
      <th style="text-align:right">Stock actual</th><th style="text-align:right">Mínimo</th>
      <th style="text-align:right">A pedir</th><th style="text-align:right">P. costo</th><th style="text-align:right">Subtotal est.</th>
    </tr></thead>
    <tbody>
      ${rows}
      ${grandTotal > 0 ? `<tr class="total-row"><td colspan="7">TOTAL ESTIMADO</td><td style="text-align:right;color:#2dc7b3">$${grandTotal.toLocaleString('es-CO')}</td></tr>` : ''}
    </tbody>
  </table>
  <p style="margin-top:28px;color:#9ca3af;font-size:11px">Proveedor / Notas de pedido:</p>
  <div style="border:1px dashed #e5e7eb;border-radius:8px;padding:16px;min-height:60px;margin-top:4px"></div>
  <p class="footer">Generado desde BeautyOS · ${new Date().toLocaleString('es-CO')}</p>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

function exportReorderCSV(lowProducts: Product[]) {
  const headers = ['Producto', 'Marca', 'Categoría', 'Stock actual', 'Mínimo', 'A pedir', 'Unidad', 'P. costo', 'Subtotal estimado'];
  const rows = lowProducts.map(p => {
    const toOrder = Math.max(0, p.minStock - p.stock);
    return [p.name, p.brand ?? '', CATEGORIES[p.category]?.label ?? p.category, p.stock, p.minStock, toOrder, p.unit, p.costPrice, toOrder * p.costPrice]
      .map(v => `"${v}"`).join(',');
  });
  const csv = ['﻿' + headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reabastecimiento_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(a.href);
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function Inventory() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState<string | null>(null);
  const [lowOnly, setLowOnly]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [moveProduct, setMoveProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['inventory', catFilter, lowOnly],
    queryFn: () => inventoryApi.list({ category: catFilter ?? undefined, lowStock: lowOnly }).then(r => r.data),
  });

  const filtered = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const lowCount = products.filter(p => p.isLow).length;

  const createMutation = useMutation({
    mutationFn: (data: object) => inventoryApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setShowForm(false); toast('Producto agregado', 'success'); },
    onError: () => toast('Error al crear producto', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => inventoryApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setEditProduct(null); toast('Producto actualizado', 'success'); },
    onError: () => toast('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setDeleteTarget(null); toast('Producto eliminado', 'success'); },
    onError: () => toast('Error al eliminar', 'error'),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { type: 'IN' | 'OUT' | 'ADJUST'; quantity: number; notes?: string } }) =>
      inventoryApi.movement(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setMoveProduct(null); toast('Movimiento registrado', 'success'); },
    onError: () => toast('Error al registrar movimiento', 'error'),
  });

  const totalValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} producto{products.length !== 1 ? 's' : ''}
            {totalValue > 0 && ` · Valor en stock: ${formatCOP(totalValue)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lowCount > 0 && (
            <>
              <button onClick={() => exportReorderCSV(products.filter(p => p.isLow))}
                className="btn-ghost flex items-center gap-1.5 text-sm shrink-0">
                <Download className="w-4 h-4" /> CSV
              </button>
              <button onClick={() => printReorderSheet(products.filter(p => p.isLow), undefined)}
                className="btn-ghost flex items-center gap-1.5 text-sm shrink-0">
                <Printer className="w-4 h-4" /> Pedido
              </button>
            </>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {/* Low stock banner */}
      {lowCount > 0 && (
        <button onClick={() => setLowOnly(p => !p)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all',
            lowOnly ? 'border-red-400 bg-red-50' : 'border-red-200 bg-red-50/50 hover:border-red-300'
          )}>
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-700 text-sm">
              {lowCount} producto{lowCount !== 1 ? 's' : ''} con stock bajo
            </p>
            <p className="text-xs text-red-400">
              {lowOnly ? 'Mostrando solo · Clic para ver todos' : 'Clic para filtrar · usa "Pedido" para imprimir lista'}
            </p>
          </div>
        </button>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 text-sm py-2" placeholder="Buscar producto…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCatFilter(null)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
              !catFilter ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}>
            Todos
          </button>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button key={k} onClick={() => setCatFilter(catFilter === k ? null : k)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                catFilter === k ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{products.length === 0 ? 'Sin productos en inventario' : 'Sin resultados'}</p>
          {products.length === 0 && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Agregar primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p}
              onMove={setMoveProduct}
              onEdit={setEditProduct}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo producto">
        <ProductForm onSave={data => createMutation.mutate(data)} onClose={() => setShowForm(false)} saving={createMutation.isPending} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Editar producto">
        {editProduct && (
          <ProductForm
            product={editProduct}
            onSave={data => updateMutation.mutate({ id: editProduct.id, data })}
            onClose={() => setEditProduct(null)}
            saving={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Movement modal */}
      <Modal open={!!moveProduct} onClose={() => setMoveProduct(null)} title={moveProduct ? `Movimiento · ${moveProduct.name}` : ''}>
        {moveProduct && (
          <MovementModal
            product={moveProduct}
            onClose={() => setMoveProduct(null)}
            onSave={data => moveMutation.mutate({ id: moveProduct.id, data })}
            saving={moveMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-gray-900 mb-2">¿Eliminar producto?</h3>
            <p className="text-sm text-gray-500 mb-5">Se eliminará <strong>{deleteTarget.name}</strong> del inventario.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
