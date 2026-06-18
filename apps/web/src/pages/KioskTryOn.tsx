import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, Heart, Search, X,
  Clock, Phone, MessageCircle, Star, Loader2,
} from 'lucide-react';
import { nailApi, publicApi } from '../lib/api';
import { NailDesign, NailDesignCategory } from '../types';
import { formatCOP, CATEGORY_LABELS, CATEGORY_EMOJI, cn } from '../lib/utils';
import { TryOnFlow } from './NailAI';
import { ToastProvider } from '../components/ui/Toast';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_CATS: NailDesignCategory[] = [
  'TRENDS_2026','FRENCH','GEL','ACRYLIC','MINIMALIST','ELEGANT',
  'GRADIENT','FLORAL','CHROME','GLITTER','PASTEL','GEOMETRIC',
  'ARTISTIC','WEDDING','SUMMER','VALENTINES','BIRTHDAY','CHRISTMAS','HALLOWEEN','CORPORATE',
];

// â”€â”€â”€ Full-screen Try-On Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KioskTryOnOverlay({ design, onClose }: { design: NailDesign; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#083D42] px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">{design.name}</h2>
            <p className="text-white/80 text-sm">{CATEGORY_EMOJI[design.category]} {CATEGORY_LABELS[design.category]}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ToastProvider>
          <TryOnFlow design={design} onClose={onClose} />
        </ToastProvider>
      </div>
    </div>
  );
}

// â”€â”€â”€ Design Card (kiosk variant â€” big touch targets) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KioskDesignCard({
  design, onTryOn, isFavorited, onFavorite,
}: {
  design: NailDesign; onTryOn: () => void;
  isFavorited: boolean; onFavorite: () => void;
}) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-beauty hover:border-primary-200 transition-all active:scale-95 cursor-pointer">
      <div className="relative aspect-square overflow-hidden" onClick={onTryOn}>
        <img src={design.imageUrl} alt={design.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/400/400`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
          <button className="w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-beauty">
            <Sparkles className="w-4 h-4" /> Â¡Probar ahora!
          </button>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onFavorite(); }}
          className={cn('absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all',
            isFavorited ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-red-500')}>
          <Heart className="w-4 h-4" fill={isFavorited ? 'white' : 'none'} />
        </button>
        {design.saveCount > 80 && (
          <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
            <Star className="w-2.5 h-2.5" fill="white" /> Popular
          </div>
        )}
      </div>
      <div className="p-3" onClick={onTryOn}>
        <p className="font-semibold text-sm text-gray-900 truncate">{design.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-bold text-sm">{formatCOP(design.price)}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{design.duration} min</span>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Kiosk Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function KioskTryOn() {
  const [searchParams] = useSearchParams();
  const [activeCat, setActiveCat] = useState<NailDesignCategory | 'ALL'>('ALL');

  useEffect(() => {
    const biz = searchParams.get('biz');
    if (biz) localStorage.setItem('beautyos_biz_slug', biz);
  }, []);
  const [search, setSearch] = useState('');
  const [tryOnDesign, setTryOnDesign] = useState<NailDesign | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavs, setShowFavs] = useState(false);

  const { data: biz } = useQuery<{ name: string; city: string; phone?: string; whatsapp?: string }>({
    queryKey: ['public-business'],
    queryFn: () => publicApi.business().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: designs = [], isLoading } = useQuery<NailDesign[]>({
    queryKey: ['kiosk-designs', activeCat, search],
    queryFn: () => nailApi.listPublic({
      category: activeCat !== 'ALL' ? activeCat : undefined,
      search: search || undefined,
    }).then(r => r.data),
  });

  const toggleFav = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const displayed = showFavs ? designs.filter(d => favorites.has(d.id)) : designs;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* â”€â”€ Header â”€â”€ */}
      <header className="bg-[#083D42] text-white px-4 pt-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold leading-tight">NailAI Studio</h1>
                <p className="text-white/70 text-xs">Prueba tu diseÃ±o virtual</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowFavs(f => !f); }}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  showFavs ? 'bg-white text-primary' : 'bg-white/20 text-white')}>
                <Heart className="w-4 h-4" fill={showFavs ? 'currentColor' : 'none'} />
                {favorites.size > 0 && <span className="font-bold">{favorites.size}</span>}
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
            <button onClick={() => setActiveCat('ALL')}
              className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
                activeCat === 'ALL' ? 'bg-white text-primary shadow' : 'bg-white/20 text-white')}>
              Todos
            </button>
            {ALL_CATS.map(c => (
              <button key={c} onClick={() => setActiveCat(c)}
                className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
                  activeCat === c ? 'bg-white text-primary shadow' : 'bg-white/20 text-white')}>
                {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* â”€â”€ Search bar â”€â”€ */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              placeholder="Buscar diseÃ±os... ej: rosas, french, glitter"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      <main className="flex-1 px-4 py-5 max-w-5xl mx-auto w-full">
        {showFavs && favorites.size === 0 && (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">AÃºn no tienes favoritos</p>
            <p className="text-sm text-gray-300 mt-1">Toca â¤ï¸ en los diseÃ±os que te gusten</p>
            <button onClick={() => setShowFavs(false)} className="mt-4 text-primary text-sm font-medium hover:underline">Ver todos los diseÃ±os</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary" />
              </div>
              <p className="text-gray-400 text-sm">Cargando diseÃ±os...</p>
            </div>
          </div>
        ) : displayed.length === 0 && !showFavs ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">Sin diseÃ±os para esta bÃºsqueda</p>
            <button onClick={() => { setSearch(''); setActiveCat('ALL'); }} className="mt-3 text-primary text-sm font-medium hover:underline">Ver todos</button>
          </div>
        ) : (
          <>
            {!showFavs && (
              <p className="text-xs text-gray-400 mb-3">
                {activeCat !== 'ALL' ? `${CATEGORY_EMOJI[activeCat]} ${CATEGORY_LABELS[activeCat]} Â· ` : ''}{displayed.length} diseÃ±os disponibles
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayed.map(d => (
                <KioskDesignCard
                  key={d.id} design={d}
                  onTryOn={() => setTryOnDesign(d)}
                  isFavorited={favorites.has(d.id)}
                  onFavorite={() => toggleFav(d.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* â”€â”€ CTA Footer â”€â”€ */}
      <footer className="bg-white border-t border-gray-100 px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#083D42] rounded-2xl p-4 text-center text-white">
            <p className="font-display text-lg font-bold mb-1">Â¿Te gustÃ³ algÃºn diseÃ±o?</p>
            <p className="text-white/80 text-sm mb-3">Reserva tu cita ahora y hazlo realidad</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {biz?.whatsapp && (
                <a href={`https://wa.me/${biz.whatsapp.replace(/\D/g, '')}?text=Hola!%20Vi%20los%20diseÃ±os%20y%20quiero%20reservar%20una%20cita%20ðŸ’…`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg">
                  <MessageCircle className="w-4 h-4" fill="white" /> WhatsApp
                </a>
              )}
              {biz?.phone && (
                <a href={`tel:${biz.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm hover:shadow-md">
                  <Phone className="w-4 h-4" /> Llamar
                </a>
              )}
              {!biz?.whatsapp && !biz?.phone && (
                <a href="/cliente/agendar"
                  className="flex items-center gap-2 bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm hover:shadow-md">
                  Agendar cita
                </a>
              )}
            </div>
            {biz && <p className="text-white/60 text-xs mt-3">{biz.name} Â· {biz.city}</p>}
          </div>
        </div>
      </footer>

      {/* â”€â”€ Try-On Overlay â”€â”€ */}
      {tryOnDesign && (
        <KioskTryOnOverlay design={tryOnDesign} onClose={() => setTryOnDesign(null)} />
      )}
    </div>
  );
}

