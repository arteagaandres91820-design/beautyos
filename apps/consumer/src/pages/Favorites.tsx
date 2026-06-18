import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/mock';
import { ProductCard } from '../components/ProductCard';

export function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(PRODUCTS.filter(p => p.isFavorite).map(p => p.id))
  );

  const favProducts = PRODUCTS.filter(p => favorites.has(p.id));

  const toggleFav = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="page-enter pb-4">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-light text-dark mb-1">Favoritos</h1>
        <p className="text-sm text-muted mb-6">
          {favProducts.length > 0
            ? `${favProducts.length} producto${favProducts.length !== 1 ? 's' : ''} guardado${favProducts.length !== 1 ? 's' : ''}`
            : 'Aún no tienes favoritos'}
        </p>

        {favProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🤍</div>
            <p className="font-display text-xl text-dark mb-2">Sin favoritos aún</p>
            <p className="text-sm text-muted mb-6 max-w-xs">Toca el corazón en cualquier producto para guardarlo aquí.</p>
            <button onClick={() => navigate('/discover')} className="text-sm font-semibold text-white bg-primary px-6 py-3 rounded-2xl shadow-btn active:scale-95 transition-transform">
              Explorar productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favProducts.map(p => (
              <ProductCard
                key={p.id}
                product={{ ...p, isFavorite: favorites.has(p.id) }}
                onFavoriteToggle={toggleFav}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
