import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, Heart, Sparkles, Clock, Star, ChevronLeft, Loader2, ChevronRight } from 'lucide-react';
import { nailApi } from '../../lib/api';
import { NailDesign, NailDesignCategory } from '../../types';
import { formatCOP, CATEGORY_LABELS, CATEGORY_EMOJI, cn } from '../../lib/utils';
import { TryOnFlow } from '../NailAI';
import { ToastProvider } from '../../components/ui/Toast';
import { useFavorites } from '../../hooks/useFavorites';

const CATS: NailDesignCategory[] = [
  'TRENDS_2026','FLORAL','CHROME','GRADIENT','GLITTER',
  'FRENCH','GEL','ACRYLIC','MINIMALIST','ELEGANT',
  'PASTEL','GEOMETRIC','ARTISTIC','WEDDING',
  'SUMMER','VALENTINES','BIRTHDAY','CHRISTMAS','HALLOWEEN','CORPORATE',
];

function ProductSheet({ design, onClose }: { design: NailDesign; onClose: () => void }) {
  const [mode, setMode] = useState<'detail' | 'tryon'>('detail');
  const { isFav, toggle: toggleFav } = useFavorites();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[430px] bg-white rounded-t-[32px] shadow-2xl animate-slide-up overflow-hidden"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {mode === 'detail' ? (
          <div className="overflow-y-auto" style={{ maxHeight: '88vh' }}>
            {/* Hero image */}
            <div className="relative mx-4 rounded-3xl overflow-hidden aspect-square">
              <img src={design.imageUrl} alt={design.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/500/500`; }} />
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => toggleFav(design.id)}
                  className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow">
                  <Heart className="w-4 h-4" fill={isFav(design.id) ? '#2DC7B3' : 'none'} stroke={isFav(design.id) ? '#2DC7B3' : '#9CA3AF'} />
                </button>
              </div>
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur-sm text-client-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {CATEGORY_EMOJI[design.category]} {CATEGORY_LABELS[design.category]}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="px-5 pt-4 pb-3">
              <p className="text-xs text-client-400 font-medium uppercase tracking-widest mb-1">
                {CATEGORY_LABELS[design.category]}
              </p>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">{design.name}</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-gray-700">4.8</span>
                  <span className="text-xs text-gray-400">({design.saveCount})</span>
                </div>
                <span className="text-gray-200">·</span>
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">{design.duration} min</span>
              </div>
              {design.description && (
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{design.description}</p>
              )}
              {/* Tags */}
              {design.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {design.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="px-3 py-1 bg-client-50 text-client-600 text-xs font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="px-5 pb-8 flex gap-3 items-center">
              <div className="flex-1">
                <p className="text-2xl font-display font-bold text-gray-900">{formatCOP(design.price)}</p>
                <p className="text-xs text-gray-400">Precio del servicio</p>
              </div>
              <button
                onClick={() => setMode('tryon')}
                className="flex items-center gap-2 bg-[#083D42] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(8,61,66,0.28)] active:scale-[0.98] transition-transform">
                <Sparkles className="w-4 h-4" />
                Probar en mis manos
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="px-4 pb-2 flex items-center gap-2">
              <button onClick={() => setMode('detail')} className="p-2 rounded-xl hover:bg-client-50">
                <ChevronLeft className="w-5 h-5 text-client-500" />
              </button>
              <h3 className="font-display font-semibold text-gray-800">Prueba virtual</h3>
            </div>
            <ToastProvider>
              <TryOnFlow design={design} onClose={onClose} />
            </ToastProvider>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientDiscover() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState<NailDesignCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NailDesign | null>(null);
  const { favs, toggle: toggleFav, isFav } = useFavorites();

  useEffect(() => {
    const cat = searchParams.get('cat') as NailDesignCategory;
    if (cat) setActiveCat(cat);
  }, [searchParams]);

  const { data: designs = [], isLoading } = useQuery<NailDesign[]>({
    queryKey: ['client-discover', activeCat, search],
    queryFn: () => nailApi.listPublic({
      category: activeCat !== 'ALL' ? activeCat : undefined,
      search: search || undefined,
    }).then(r => r.data),
  });

  return (
    <div className="bg-[#EFF4F1] min-h-full">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-[#EFF4F1] sticky top-0 z-30 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-client-500/60 mb-0.5">Explorar</p>
            <h1 className="font-serif text-[28px] font-bold text-client-900 leading-tight tracking-tight">Catálogo<span className="text-client-500">.</span></h1>
          </div>
          <div className="w-10 h-10 bg-[#F0F5F4] rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-client-600" strokeWidth={1.8} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-client-300" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-client-100 rounded-2xl pl-9 pr-9 py-2.5 text-sm text-gray-700 placeholder:text-client-300 focus:outline-none focus:ring-2 focus:ring-client-400 shadow-sm"
            placeholder="Buscar diseños, estilos, colores..."
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-client-300" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button onClick={() => setActiveCat('ALL')}
            className={cn('px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all',
              activeCat === 'ALL'
                ? 'bg-[#083D42] text-white shadow-[0_4px_16px_rgba(8,61,66,0.25)]'
                : 'bg-white text-[#083D42]/60 border border-gray-200')}>
            Todos
          </button>
          {CATS.map(c => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={cn('px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all',
                activeCat === c
                  ? 'bg-[#083D42] text-white shadow-[0_4px_16px_rgba(8,61,66,0.25)]'
                  : 'bg-white text-[#083D42]/60 border border-gray-200')}>
              {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 bg-[#EFF4F1]">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-client-400" />
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{designs.length} diseños</p>
            <div className="grid grid-cols-2 gap-3">
              {designs.map(d => (
                <button key={d.id} onClick={() => setSelected(d)}
                  className="bg-white rounded-2xl overflow-hidden shadow-client-card border border-client-50/60 text-left active:scale-[0.97] transition-transform">
                  <div className="relative aspect-square overflow-hidden">
                    <img src={d.imageUrl} alt={d.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${d.id}/300/300`; }} />
                    <button onClick={e => { e.stopPropagation(); toggleFav(d.id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <Heart className="w-3.5 h-3.5" fill={isFav(d.id) ? '#2DC7B3' : 'none'} stroke={isFav(d.id) ? '#2DC7B3' : '#9CA3AF'} />
                    </button>
                    {d.saveCount > 80 && (
                      <div className="absolute top-2 left-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        ⭐ Top
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-800 truncate">{d.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-client-600 font-bold">{formatCOP(d.price)}</p>
                      <span className="text-[10px] text-gray-400">{d.duration}min</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selected && <ProductSheet design={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
