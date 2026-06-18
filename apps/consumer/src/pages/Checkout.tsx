import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ProductImage } from '../components/ProductImage';

const ADDRESSES = [
  { id: '1', label: 'Casa', street: 'Cra. 45 #23-12', city: 'Bogotá, Colombia', default: true },
  { id: '2', label: 'Trabajo', street: 'Cl. 100 #9A-45 Of. 302', city: 'Bogotá, Colombia', default: false },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Tarjeta de crédito', sub: '•••• •••• •••• 4231', icon: '💳' },
  { id: 'nequi', label: 'Nequi', sub: '311 456 7890', icon: '📱' },
  { id: 'cod', label: 'Contraentrega', sub: 'Paga al recibir', icon: '💵' },
];

export function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [selectedAddress, setSelectedAddress] = useState('1');
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [placing, setPlacing] = useState(false);

  const delivery = total >= 150 ? 0 : 12;
  const finalTotal = total + delivery;
  const estimatedDays = selectedPayment === 'cod' ? '3-5' : '1-3';

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleConfirm = () => {
    setPlacing(true);
    setTimeout(() => {
      clearCart();
      navigate('/order-success');
    }, 1400);
  };

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
          <h1 className="font-display text-2xl font-light text-dark">Checkout</h1>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

        {/* Delivery address */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-dark">Dirección de entrega</p>
            <button className="text-xs text-primary font-medium">+ Nueva</button>
          </div>
          <div className="space-y-2">
            {ADDRESSES.map(addr => (
              <button
                key={addr.id}
                onClick={() => setSelectedAddress(addr.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-2xl border transition-all text-left ${selectedAddress === addr.id ? 'border-primary bg-primary-50' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${selectedAddress === addr.id ? 'border-primary' : 'border-gray-300'}`}>
                  {selectedAddress === addr.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-dark">{addr.label}</p>
                  <p className="text-xs text-dark/70 mt-0.5">{addr.street}</p>
                  <p className="text-xs text-muted">{addr.city}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" />
            </svg>
            Entrega estimada en {estimatedDays} días hábiles
          </div>
        </div>

        {/* Payment method */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-dark mb-3">Método de pago</p>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${selectedPayment === pm.id ? 'border-primary bg-primary-50' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedPayment === pm.id ? 'border-primary' : 'border-gray-300'}`}>
                  {selectedPayment === pm.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-lg">{pm.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-dark">{pm.label}</p>
                  <p className="text-[10px] text-muted">{pm.sub}</p>
                </div>
                {selectedPayment === pm.id && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-dark mb-3">Tu pedido</p>
          <div className="space-y-3 mb-4">
            {items.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-3">
                <ProductImage product={product} size="sm" className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark line-clamp-1">{product.name}</p>
                  <p className="text-[10px] text-muted">x{qty} · {product.size}</p>
                </div>
                <span className="text-sm font-semibold text-dark shrink-0">${product.price * qty}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-dark/60">
              <span>Subtotal</span>
              <span>${total}</span>
            </div>
            <div className="flex justify-between">
              <span className={delivery === 0 ? 'text-emerald-600 font-medium' : 'text-dark/60'}>Envío</span>
              <span className={delivery === 0 ? 'text-emerald-600 font-medium' : 'text-dark/60'}>
                {delivery === 0 ? 'Gratis' : `$${delivery}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-dark text-base border-t border-gray-100 pt-2">
              <span>Total a pagar</span>
              <span className="text-primary">${finalTotal}</span>
            </div>
          </div>
        </div>

        {/* Promo code */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-dark mb-2">Código de descuento</p>
          <div className="flex gap-2">
            <input
              placeholder="Ingresa tu código"
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-dark placeholder:text-muted outline-none focus:border-primary/40 transition-colors"
            />
            <button className="px-4 py-2.5 rounded-xl bg-primary-50 text-primary text-sm font-semibold active:scale-95 transition-transform">
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="shrink-0 px-5 pt-3 pb-6 bg-[#EFF4F1]/95 backdrop-blur border-t border-gray-100">
        <button
          onClick={handleConfirm}
          disabled={placing}
          className={`w-full py-4 rounded-2xl font-semibold text-[15px] text-white shadow-btn transition-all duration-300 ${placing ? 'opacity-80 scale-95' : 'active:scale-95'}`}
          style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
        >
          {placing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Procesando...
            </span>
          ) : (
            `Confirmar pedido · $${finalTotal}`
          )}
        </button>
        <p className="text-[10px] text-muted text-center mt-2">
          Al confirmar aceptas nuestros términos y política de privacidad
        </p>
      </div>
    </div>
  );
}

