import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ORDER_NUM = `BOS-${Math.floor(10000 + Math.random() * 90000)}`;

const STEPS = [
  { icon: '📦', label: 'Pedido recibido', done: true },
  { icon: '✅', label: 'Pago confirmado', done: true },
  { icon: '🏭', label: 'En preparación', done: false },
  { icon: '🚚', label: 'En camino', done: false },
  { icon: '🏠', label: 'Entregado', done: false },
];

export function OrderSuccess() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col items-center">
      <div className="flex-1 overflow-y-auto w-full px-5 pb-8">
        {/* Success animation */}
        <div className="flex flex-col items-center pt-16 pb-8">
          {/* Checkmark circle */}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-all duration-700 ${visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
            style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
          >
            <svg
              className={`transition-all duration-500 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
              width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
            >
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Sparkles */}
          <div className={`absolute text-2xl select-none transition-all duration-500 delay-500 ${visible ? 'opacity-100 -translate-y-2' : 'opacity-0 translate-y-2'}`}
            style={{ top: 120, left: '25%' }}>✦</div>
          <div className={`absolute text-lg select-none transition-all duration-500 delay-700 ${visible ? 'opacity-60' : 'opacity-0'}`}
            style={{ top: 110, right: '22%' }}>✦</div>

          <h1 className={`font-display text-3xl font-light text-dark text-center mb-2 transition-all duration-500 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            ¡Pedido confirmado!
          </h1>
          <p className={`text-sm text-muted text-center transition-all duration-500 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            Recibirás una notificación cuando tu<br />pedido esté en camino.
          </p>
        </div>

        {/* Points earned */}
        <div className={`flex items-center gap-3 bg-primary text-white rounded-2xl px-4 py-3 mb-4 transition-all duration-500 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="text-2xl">✦</span>
          <div>
            <p className="text-xs text-white/70 font-medium">Puntos ganados</p>
            <p className="text-lg font-bold">+120 puntos</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-white/60">Nuevo saldo</p>
            <p className="text-sm font-bold">1.367 pts</p>
          </div>
        </div>

        {/* Order number */}
        <div className={`card p-4 mb-4 text-center transition-all duration-500 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xs text-muted font-medium mb-1">Número de pedido</p>
          <p className="font-display text-2xl font-medium text-primary">{ORDER_NUM}</p>
          <p className="text-xs text-muted mt-1">Entrega estimada: 1–3 días hábiles</p>
        </div>

        {/* Tracking steps */}
        <div className={`card p-4 mb-6 transition-all duration-500 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm font-semibold text-dark mb-4">Estado del pedido</p>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-100" />
            <div className="absolute left-4 top-5 w-0.5 bg-primary transition-all duration-1000 delay-600"
              style={{ height: visible ? 64 : 0 }} />

            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 transition-all duration-300 ${step.done ? 'bg-primary shadow-sm' : 'bg-gray-100'}`}
                    style={{ transitionDelay: `${600 + i * 100}ms` }}>
                    <span>{step.done ? '✓' : step.icon}</span>
                  </div>
                  <p className={`text-sm font-medium transition-colors ${step.done ? 'text-dark' : 'text-muted'}`}>
                    {step.label}
                  </p>
                  {i === 2 && (
                    <span className="ml-auto text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      En curso
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips while waiting */}
        <div className={`rounded-3xl p-5 mb-6 transition-all duration-500 delay-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ background: 'linear-gradient(120deg, #EFF4F1 0%, #D0EEEA 100%)' }}>
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Mientras esperas ✦</p>
          <p className="font-display text-lg text-dark mb-3">Completa tu rutina de hoy</p>
          <button
            onClick={() => navigate('/routines')}
            className="text-xs font-semibold text-white bg-primary rounded-xl px-4 py-2 active:scale-95 transition-transform"
          >
            Ver mis rutinas →
          </button>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/home')}
            className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white shadow-btn active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #083D42 0%, #2DC7B3 100%)' }}
          >
            Seguir comprando
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-primary bg-white border border-primary/20 shadow-card active:scale-95 transition-all"
          >
            Ver mis pedidos
          </button>
        </div>
      </div>
    </div>
  );
}

