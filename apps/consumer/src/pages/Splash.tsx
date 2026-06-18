import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    headline: 'Belleza,',
    italic: 'elevada.',
    sub: 'Tu rutina, tu esencia,\ntu mejor versión.',
  },
  {
    headline: 'Descubre',
    italic: 'tu rutina.',
    sub: 'Rutinas personalizadas para\ncada tipo de piel.',
  },
  {
    headline: 'Productos',
    italic: 'que funcionan.',
    sub: 'Ingredientes que de verdad\nhacen la diferencia.',
  },
  {
    headline: 'Resulta',
    italic: 'visible.',
    sub: 'Únete a miles de mujeres que\nya elevaron su rutina.',
  },
];

export function Splash() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else navigate('/onboarding');
  };

  const s = SLIDES[slide];

  return (
    <div className="phone-shell flex flex-col min-h-dvh bg-[#EFF4F1]">
      {/* Decorative background circles */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-primary-100 opacity-40 -translate-x-1/2 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary-100 opacity-30 translate-x-1/3 translate-y-1/4 pointer-events-none" />

      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 relative z-10 pt-16">
        {/* Logo card */}
        <div className="w-20 h-20 rounded-[22px] bg-primary flex items-center justify-center mb-10 shadow-btn">
          <div className="relative">
            <span className="font-display text-white text-4xl font-light leading-none">b</span>
            <span className="absolute -top-1.5 -right-3 text-[#2DC7B3] text-lg">✦</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h1 className="font-display text-5xl font-light text-dark leading-tight">
            {s.headline}
          </h1>
          <h1 className="font-display text-5xl font-light italic text-primary leading-tight">
            {s.italic}
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-center text-muted text-[15px] leading-relaxed whitespace-pre-line font-light">
          {s.sub}
        </p>

        {/* Illustration placeholder — decorative product bottles */}
        <div className="mt-12 flex items-end justify-center gap-3">
          {[
            { bg: 'linear-gradient(160deg,#B8D8DC,#C8E8EC)', w: 38, h: 108 },
            { bg: 'linear-gradient(160deg,#94C4C8,#AED8DC)', w: 48, h: 136 },
            { bg: 'linear-gradient(160deg,#D4C8DC,#E4D8EC)', w: 38, h: 108 },
          ].map((b, i) => (
            <div key={i}
              className="shadow-card"
              style={{
                width: b.w,
                height: b.h,
                background: b.bg,
                borderRadius: i === 1 ? 24 : 20,
                transform: i === 0 ? 'rotate(-5deg) translateY(8px)' : i === 2 ? 'rotate(5deg) translateY(8px)' : 'none',
                opacity: i === 1 ? 0.9 : 0.65,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-10 space-y-3 relative z-10">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className="transition-all duration-300"
              style={{
                width: i === slide ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === slide ? '#083D42' : '#B0C8C4',
              }}
            />
          ))}
        </div>

        <button onClick={next} className="btn-primary">
          {slide < SLIDES.length - 1 ? 'Comenzar' : 'Empezar ahora'}
        </button>
        <button onClick={() => navigate('/onboarding')} className="btn-ghost text-muted">
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}

