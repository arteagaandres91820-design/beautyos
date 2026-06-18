import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../data/mock';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export function Discover() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') ?? 'all';
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [sort, setSort] = useState<'popular' | 'price_asc' | 'price_desc' | 'rating'>('popular');

  const filtered = PRODUCTS
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return b.reviews - a.reviews;
    });

  return (
    <div className="page-enter pb-4">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-light text-dark">Descubrir</h1>
          <button onClick={() => navigate('/cart')} className="relative w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-primary text-white shadow-btn' : 'bg-white text-muted shadow-card'}`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-primary text-white shadow-btn' : 'bg-white text-muted shadow-card'}`}
            >
              <span>{cat.emoji}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{filtered.length} productos</span>
          <div className="flex gap-1.5 ml-auto">
            {([['popular', 'Popular'], ['rating', '⭐ Rating'], ['price_asc', '$ Menor'], ['price_desc', '$ Mayor']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setSort(v)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${sort === v ? 'bg-primary text-white' : 'bg-white text-muted shadow-sm'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-3 px-5">
        {filtered.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
