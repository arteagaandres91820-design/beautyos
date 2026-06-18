import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS, ROUTINES } from '../data/mock';
import { ProductImage } from '../components/ProductImage';

const RECENT_KEY = 'beauty_recent_searches';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

function saveRecent(query: string) {
  const prev = getRecent().filter(s => s !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...prev].slice(0, 6)));
}

const POPULAR = ['Sérum', 'Vitamina C', 'Ácido hialurónico', 'SPF 50', 'Limpiador', 'Niacinamida'];

export function Search() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(getRecent);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const productResults = q.length > 1
    ? PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.benefits.some(b => b.toLowerCase().includes(q))
      )
    : [];

  const routineResults = q.length > 1
    ? ROUTINES.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.steps.some(s => s.productName.toLowerCase().includes(q))
      )
    : [];

  const hasResults = productResults.length > 0 || routineResults.length > 0;
  const showEmpty = q.length > 1 && !hasResults;

  const handleSelect = (term: string) => {
    setQuery(term);
  };

  const handleProductClick = (id: string) => {
    if (query.trim()) saveRecent(query.trim());
    setRecent(getRecent());
    navigate(`/product/${id}`);
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col">
      {/* Search header */}
      <div className="shrink-0 px-4 pt-12 pb-3 bg-[#EFF4F1]">
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && query.trim()) {
                  saveRecent(query.trim());
                  setRecent(getRecent());
                }
              }}
              placeholder="Buscar productos, rutinas..."
              className="w-full bg-white rounded-2xl pl-10 pr-9 py-3 text-sm text-dark placeholder:text-muted shadow-card border-0 outline-none focus:ring-2 focus:ring-primary/20"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center active:scale-90 transition-transform"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <button onClick={() => navigate(-1)} className="text-sm font-medium text-primary shrink-0 active:opacity-60 transition-opacity">
            Cancelar
          </button>
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {/* Empty query: show recents + popular */}
        {!q && (
          <div className="px-5 pt-2 pb-6">
            {/* Recent searches */}
            {recent.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-dark">Búsquedas recientes</p>
                  <button onClick={clearRecent} className="text-xs text-muted active:opacity-60">Limpiar</button>
                </div>
                <div className="space-y-1">
                  {recent.map(r => (
                    <button
                      key={r}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 py-2.5 text-left active:bg-gray-50 rounded-xl transition-colors px-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
                      </svg>
                      <span className="text-sm text-dark/80">{r}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular searches */}
            <div>
              <p className="text-[13px] font-semibold text-dark mb-3">Tendencias</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map(term => (
                  <button
                    key={term}
                    onClick={() => handleSelect(term)}
                    className="text-sm font-medium text-primary bg-primary-50 px-3.5 py-2 rounded-full active:scale-95 transition-transform"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No results */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-display text-xl text-dark mb-2">Sin resultados</p>
            <p className="text-sm text-muted mb-6">No encontramos nada para <strong>"{query.trim()}"</strong>.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {POPULAR.slice(0, 3).map(t => (
                <button key={t} onClick={() => handleSelect(t)}
                  className="text-sm text-primary bg-primary-50 px-3 py-1.5 rounded-full font-medium active:scale-95 transition-transform">
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="px-5 pt-2 pb-6">
            {/* Count */}
            <p className="text-xs text-muted mb-4">
              {productResults.length + routineResults.length} resultado{productResults.length + routineResults.length !== 1 ? 's' : ''} para <span className="font-semibold text-dark">"{query.trim()}"</span>
            </p>

            {/* Products */}
            {productResults.length > 0 && (
              <div className="mb-5">
                <p className="text-[13px] font-semibold text-dark mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  Productos <span className="text-muted font-normal">({productResults.length})</span>
                </p>
                <div className="space-y-2">
                  {productResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProductClick(p.id)}
                      className="w-full card p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                    >
                      <ProductImage product={p} size="sm" className="w-14 h-14 rounded-xl shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark leading-tight line-clamp-1">{p.name}</p>
                        <p className="text-[11px] text-muted mt-0.5">{p.categoryLabel} · {p.size}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-primary">${p.price}</span>
                          {p.originalPrice && (
                            <span className="text-xs text-muted line-through">${p.originalPrice}</span>
                          )}
                          {p.discount && (
                            <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">-{p.discount}%</span>
                          )}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Routines */}
            {routineResults.length > 0 && (
              <div>
                <p className="text-[13px] font-semibold text-dark mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
                    <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" strokeLinejoin="round" />
                  </svg>
                  Rutinas <span className="text-muted font-normal">({routineResults.length})</span>
                </p>
                <div className="space-y-2">
                  {routineResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/routine/${r.id}`)}
                      className="w-full card p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: r.bgColor + '40' }}>
                        ✦
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark">{r.name}</p>
                        <p className="text-[11px] text-muted mt-0.5">{r.stepCount} pasos · {r.duration} min</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-[10px] text-primary bg-primary-50 px-2 py-0.5 rounded-full font-medium">{t}</span>
                          ))}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

