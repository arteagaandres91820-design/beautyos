import { useQuery } from '@tanstack/react-query';
import { Heart, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nailApi } from '../../lib/api';
import { NailDesign } from '../../types';
import { formatCOP, CATEGORY_EMOJI, CATEGORY_LABELS } from '../../lib/utils';
import { useFavorites } from '../../hooks/useFavorites';

export function ClientFavorites() {
  const navigate = useNavigate();
  const { favs, toggle } = useFavorites();

  // Fetch all public designs then filter by stored favorites
  const { data: allDesigns = [], isLoading } = useQuery<NailDesign[]>({
    queryKey: ['client-discover-all'],
    queryFn: () => nailApi.listPublic({ limit: 200 }).then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const displayed = allDesigns.filter(d => favs.has(d.id));

  return (
    <div className="min-h-full bg-[#EFF4F1]">
      <div className="bg-[#EFF4F1] px-5 pt-12 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-client-500/60 mb-0.5">Guardados</p>
        <h1 className="font-serif text-[28px] font-bold text-client-900 tracking-tight leading-none">Favoritos<span className="text-client-500">.</span></h1>
        <p className="text-sm text-client-400 mt-1.5">
          {displayed.length > 0 ? `${displayed.length} diseño${displayed.length !== 1 ? 's' : ''} guardado${displayed.length !== 1 ? 's' : ''}` : 'Diseños que te encantaron'}
        </p>
      </div>

      <div className="px-4 py-5 bg-[#EFF4F1]">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-client-400" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-client-100 rounded-3xl flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-client-300" />
            </div>
            <p className="font-semibold text-gray-500">Aún no tienes favoritos</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Toca ❤️ en los diseños que más te gusten</p>
            <button onClick={() => navigate('/cliente/descubrir')}
              className="bg-[#083D42] text-white font-semibold px-6 py-3 rounded-2xl shadow-[0_8px_24px_rgba(8,61,66,0.25)] text-sm">
              Explorar diseños
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayed.map(d => (
              <div key={d.id} className="bg-white rounded-2xl overflow-hidden shadow-client-card border border-client-50 active:scale-[0.97] transition-transform">
                <div className="relative aspect-square overflow-hidden">
                  <img src={d.imageUrl} alt={d.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${d.id}/300/300`; }} />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-client-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {CATEGORY_EMOJI[d.category]} {CATEGORY_LABELS[d.category]}
                  </div>
                  <button onClick={() => toggle(d.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-client-900 truncate">{d.name}</p>
                  <p className="text-xs text-client-600 font-bold mt-0.5">{formatCOP(d.price)}</p>
                  <button
                    onClick={() => navigate(`/cliente/descubrir?tryOn=${d.id}`)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-[#083D42] text-white text-[11px] font-bold rounded-xl active:scale-95 transition-transform shadow-[0_4px_16px_rgba(8,61,66,0.25)]">
                    <Sparkles className="w-3 h-3" /> Probar IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
