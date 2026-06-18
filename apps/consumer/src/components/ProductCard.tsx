import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { ProductImage } from './ProductImage';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill={i <= Math.round(rating) ? '#F59E0B' : '#E5E7EB'}>
          <path d="M5 1l1.12 2.27 2.51.36-1.82 1.77.43 2.5L5 6.77l-2.24 1.13.43-2.5L1.37 3.63l2.51-.36z" />
        </svg>
      ))}
    </div>
  );
}

export function ProductCard({ product, onFavoriteToggle }: {
  product: Product;
  onFavoriteToggle?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [fav, setFav] = useState(product.isFavorite ?? false);

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFav(v => !v);
    onFavoriteToggle?.(product.id);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="card cursor-pointer active:scale-95 transition-all duration-200"
    >
      {/* Image area */}
      <div className="relative">
        <ProductImage product={product} size="md" className="w-full rounded-t-3xl" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary text-white tracking-wide">NUEVO</span>
          )}
          {product.discount && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">-{product.discount}%</span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={toggleFav}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? '#ef4444' : 'none'} stroke={fav ? '#ef4444' : '#9CA3AF'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-0.5">{product.categoryLabel}</p>
        <p className="text-[13px] font-semibold text-dark leading-tight mb-1 line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={product.rating} />
          <span className="text-[10px] text-muted">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-primary">${product.price}</span>
          {product.originalPrice && (
            <span className="text-[11px] text-muted line-through">${product.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}
