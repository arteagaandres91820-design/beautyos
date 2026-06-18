import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/mock';
import { ProductImage } from '../components/ProductImage';
import { useCart } from '../context/CartContext';

const FAKE_REVIEWS = [
  { id: '1', name: 'Ana G.', avatar: 'A', rating: 5, date: 'hace 3 días', verified: true,
    text: 'Increíble producto. Lo uso desde hace dos semanas y ya noto mi piel más luminosa. La textura es perfecta, se absorbe muy bien.' },
  { id: '2', name: 'María L.', avatar: 'M', rating: 5, date: 'hace 1 semana', verified: true,
    text: 'Compré el sérum convencida por las reseñas y no me arrepiento. Piel mixta y no se siente pesado para nada. ¡Lo volvería a pedir!' },
  { id: '3', name: 'Camila R.', avatar: 'C', rating: 4, date: 'hace 2 semanas', verified: false,
    text: 'Muy buen producto, cumple lo que promete. La única pega es el precio, pero la calidad lo justifica.' },
];

const RATING_DIST: Record<number, number> = { 5: 78, 4: 14, 3: 5, 2: 2, 1: 1 };

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#F59E0B' : '#E5E7EB'} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, itemCount } = useCart();
  const product = PRODUCTS.find(p => p.id === id);

  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(product?.isFavorite ?? false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'uso' | 'ing'>('desc');

  if (!product) {
    return (
      <div className="phone-shell flex items-center justify-center">
        <p className="text-muted">Producto no encontrado</p>
      </div>
    );
  }

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col">
      {/* Hero product image */}
      <div className="relative shrink-0">
        <ProductImage product={product} size="lg" className="w-full" style={{ minHeight: 300 } as React.CSSProperties} />

        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-12">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            {/* Cart button */}
            <button onClick={() => navigate('/cart')}
              className="relative w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-90 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
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
            <button onClick={() => setFav(v => !v)}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-90 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? '#ef4444' : 'none'} stroke={fav ? '#ef4444' : '#0D1B2A'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-90 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto bg-[#EFF4F1] rounded-t-3xl -mt-6 relative">
        <div className="px-5 pt-6 pb-4">
          {/* Category + badges */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-primary font-semibold uppercase tracking-wider">{product.categoryLabel}</span>
            {product.isNew && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">NUEVO</span>}
            {product.discount && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">-{product.discount}%</span>}
          </div>

          {/* Name */}
          <h1 className="font-display text-3xl font-light text-dark mb-2 leading-tight">{product.name}</h1>

          {/* Rating + size */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-sm font-semibold text-dark">{product.rating}</span>
              <span className="text-sm text-muted">({product.reviews} reseñas)</span>
            </div>
            <span className="text-muted">·</span>
            <span className="text-sm text-muted">{product.size}</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-bold text-primary">${product.price}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted line-through">${product.originalPrice}</span>
            )}
            {product.discount && (
              <span className="text-sm text-emerald-600 font-semibold">Ahorras ${product.originalPrice! - product.price}</span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1 mb-4 shadow-card">
            {(['desc', 'uso', 'ing'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === t ? 'bg-primary text-white shadow-sm' : 'text-muted'}`}>
                {t === 'desc' ? 'Descripción' : t === 'uso' ? 'Cómo usar' : 'Ingredientes'}
              </button>
            ))}
          </div>

          {activeTab === 'desc' && (
            <div className="space-y-4">
              <p className="text-sm text-dark/70 leading-relaxed">{product.description}</p>
              <div>
                <p className="text-xs font-semibold text-dark uppercase tracking-wider mb-2">Beneficios</p>
                <div className="flex flex-wrap gap-2">
                  {product.benefits.map(b => (
                    <span key={b} className="tag">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'uso' && (
            <p className="text-sm text-dark/70 leading-relaxed">{product.howToUse}</p>
          )}
          {activeTab === 'ing' && (
            <div>
              <p className="text-xs text-muted leading-relaxed">Aqua, Niacinamida 10%, Sodium Hyaluronate, Glycerin, Panthenol, Tocopherol, Allantoin, Centella Asiatica Extract, Phenoxyethanol, Ethylhexylglycerin.</p>
              <p className="text-[10px] text-muted/60 mt-2">* Lista completa de ingredientes INCI. Siempre consulta con un dermatólogo si tienes piel sensible.</p>
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark text-[15px]">Reseñas</h3>
            <button className="text-xs text-primary font-medium">Ver todas</button>
          </div>

          {/* Aggregate score */}
          <div className="flex gap-4 mb-5">
            <div className="flex flex-col items-center justify-center">
              <p className="font-display text-5xl font-medium text-dark leading-none">{product.rating}</p>
              <Stars rating={product.rating} size={13} />
              <p className="text-[10px] text-muted mt-1">{product.reviews} reseñas</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map(star => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-3">{star}</span>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${RATING_DIST[star]}%` }} />
                  </div>
                  <span className="text-[10px] text-muted w-6 text-right">{RATING_DIST[star]}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review cards */}
          <div className="space-y-3 mb-2">
            {FAKE_REVIEWS.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {r.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-dark">{r.name}</p>
                      {r.verified && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Verificada</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Stars rating={r.rating} size={10} />
                      <span className="text-[10px] text-muted">{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-dark/70 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upsell — "Completa tu rutina" */}
        <div className="pt-4 pb-2">
          <div className="px-5 flex items-center justify-between mb-3">
            <h3 className="font-semibold text-dark text-[15px]">Completa tu rutina</h3>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto pb-2 scrollbar-none">
            {PRODUCTS.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4).map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="shrink-0 w-36 card p-2.5 text-left active:scale-95 transition-transform"
              >
                <ProductImage product={p} size="sm" className="w-full h-28 rounded-xl mb-2" />
                <p className="text-xs font-semibold text-dark line-clamp-2 leading-tight mb-1">{p.name}</p>
                <p className="text-sm font-bold text-primary">${p.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity + Add to cart */}
        <div className="sticky bottom-0 bg-[#EFF4F1]/95 backdrop-blur px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Qty selector */}
            <div className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2 shadow-card">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-xl bg-primary-50 flex items-center justify-center active:scale-90 transition-transform">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2.5"><path d="M5 12h14" /></svg>
              </button>
              <span className="text-base font-bold text-dark w-4 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-7 h-7 rounded-xl bg-primary-50 flex items-center justify-center active:scale-90 transition-transform">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>

            {/* Add button */}
            <button onClick={handleAdd}
              className={`flex-1 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-200 active:scale-95 shadow-btn ${added ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
              {added ? '✓ Agregado al carrito' : `Agregar al carrito · $${product.price * qty}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

