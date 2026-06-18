import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ProductImage } from '../components/ProductImage';

export function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, total, itemCount } = useCart();

  const delivery = total >= 150 ? 0 : 12;
  const finalTotal = total + delivery;

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-5 pt-12 pb-4 bg-[#EFF4F1]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-light text-dark">Mi carrito</h1>
            <p className="text-xs text-muted">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <p className="font-display text-xl text-dark mb-2">Tu carrito está vacío</p>
            <p className="text-sm text-muted mb-6 max-w-xs">Agrega productos desde Descubrir o el detalle de cualquier producto.</p>
            <button
              onClick={() => navigate('/discover')}
              className="btn-primary"
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Free shipping banner */}
            {delivery > 0 ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
                <span className="text-amber-500 text-sm">🚚</span>
                <p className="text-xs text-amber-700 font-medium">
                  Agrega <span className="font-bold">${150 - total}</span> más y envío gratis
                </p>
                <div className="flex-1 h-1.5 bg-amber-100 rounded-full ml-1">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (total / 150) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5">
                <span className="text-sm">✓</span>
                <p className="text-xs text-emerald-700 font-semibold">¡Envío gratis aplicado!</p>
              </div>
            )}

            {/* Items */}
            {items.map(({ product, qty }) => (
              <div key={product.id} className="card p-3 flex gap-3">
                <button onClick={() => navigate(`/product/${product.id}`)} className="shrink-0">
                  <ProductImage product={product} size="sm" className="w-20 h-20 rounded-xl" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-dark leading-tight line-clamp-2">{product.name}</p>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="shrink-0 w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center active:bg-red-100 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A9BA8" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">{product.size}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold text-primary">${product.price * qty}</span>
                    {/* Qty selector */}
                    <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-2 py-1">
                      <button
                        onClick={() => updateQty(product.id, qty - 1)}
                        className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2.5"><path d="M5 12h14" /></svg>
                      </button>
                      <span className="text-sm font-bold text-dark w-4 text-center">{qty}</span>
                      <button
                        onClick={() => updateQty(product.id, qty + 1)}
                        className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Order summary card */}
            <div className="card p-4 mt-2">
              <p className="font-semibold text-dark text-sm mb-3">Resumen</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-dark/70">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</span>
                  <span>${total}</span>
                </div>
                <div className="flex justify-between">
                  <span className={delivery === 0 ? 'text-emerald-600 font-medium' : 'text-dark/70'}>Envío</span>
                  <span className={delivery === 0 ? 'text-emerald-600 font-medium' : 'text-dark/70'}>
                    {delivery === 0 ? 'Gratis' : `$${delivery}`}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-dark text-base">
                  <span>Total</span>
                  <span className="text-primary">${finalTotal}</span>
                </div>
              </div>
            </div>

            {/* Loyalty points earn preview */}
            <div className="flex items-center gap-2.5 bg-primary-50 border border-primary/15 rounded-2xl px-4 py-3">
              <span className="text-primary text-lg">✦</span>
              <div>
                <p className="text-xs font-semibold text-primary">Ganarás {Math.round(total / 5)} puntos</p>
                <p className="text-[10px] text-muted">Con este pedido · 1 punto por cada $5</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-muted">Saldo actual</p>
                <p className="text-xs font-bold text-primary">1.247 pts</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout button */}
      {items.length > 0 && (
        <div className="shrink-0 px-5 pt-3 pb-6 bg-[#EFF4F1]/95 backdrop-blur border-t border-gray-100">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white shadow-btn active:scale-95 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
          >
            Proceder al pago · ${finalTotal}
          </button>
        </div>
      )}
    </div>
  );
}

