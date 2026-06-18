import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

function BLogo({ size = 32, color = '#083D42' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 40 44" width={size} height={size * 1.1} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 5 L10 39" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M10 21 C10 21 16 15 23 19 C30 23 30 33 23 37 C16 41 10 38 10 38"
        stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M31 6 L31 12 M28 9 L34 9" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

const SLIDES = [
  {
    image: 'https://picsum.photos/seed/beauty-teal1/400/500',
    eyebrow: 'Bienvenida',
    title: <>Belleza,<br /><span className="italic text-[#2DC7B3]">elevada.</span></>,
    body: 'Tu rutina, tu esencia, tu mejor versión.',
  },
  {
    image: 'https://picsum.photos/seed/beauty-teal2/400/500',
    eyebrow: 'Explora & prueba',
    title: <>Mira cómo<br /><span className="italic text-[#2DC7B3]">te quedan.</span></>,
    body: 'Prueba más de 200 diseños sobre tu propia mano antes de decidir. IA al servicio de tu estilo.',
  },
  {
    image: 'https://picsum.photos/seed/beauty-teal3/400/500',
    eyebrow: 'Tu decisión',
    title: <>Aprueba con<br /><span className="italic text-[#2DC7B3]">confianza.</span></>,
    body: 'Tu estilista propone diseños personalizados. Pruébalos virtualmente y elige el que más te guste.',
  },
];

export function ClientOnboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem('beautyos_client_onboarded', '1');
      navigate('/cliente/home');
    } else {
      setSlide(v => v + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EFF4F1]">
      {/* Skip */}
      <div className="flex justify-end p-5 pt-12">
        <button onClick={() => navigate('/cliente/home')}
          className="text-sm text-[#083D42]/50 font-medium px-3 py-1 rounded-full hover:bg-white/60 transition-colors">
          Omitir
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4 animate-fade-in" key={slide}>
        {/* Logo — primer slide */}
        {slide === 0 && (
          <div className="mb-10 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-[0_4px_24px_rgba(8,61,66,0.12)] flex items-center justify-center">
              <BLogo size={40} color="#083D42" />
            </div>
          </div>
        )}

        {/* Imagen */}
        <div className="relative w-56 h-56 mb-10">
          <img
            src={s.image} alt=""
            className="w-full h-full object-cover rounded-[32px] shadow-[0_16px_48px_rgba(8,61,66,0.15)]"
          />
          {slide === 1 && (
            <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl px-3 py-2 shadow-[0_4px_16px_rgba(8,61,66,0.12)] flex items-center gap-2 animate-bounce-soft">
              <Sparkles className="w-4 h-4 text-[#2DC7B3]" />
              <span className="text-xs font-semibold text-[#083D42]">IA Try-On</span>
            </div>
          )}
          {slide === 2 && (
            <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl px-3 py-2 shadow-[0_4px_16px_rgba(8,61,66,0.12)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2DC7B3]" />
              <span className="text-xs font-semibold text-[#083D42]">¡Aprobado!</span>
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="text-center space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2DC7B3]">{s.eyebrow}</p>
          <h1 className="font-serif text-[42px] font-bold text-[#083D42] leading-tight">{s.title}</h1>
          <p className="text-[15px] text-[#083D42]/50 leading-relaxed max-w-xs mx-auto font-body">{s.body}</p>
        </div>
      </div>

      {/* Dots + CTA */}
      <div className="px-8 pb-14 space-y-4">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={cn('rounded-full transition-all duration-300',
                i === slide ? 'w-6 h-2 bg-[#083D42]' : 'w-2 h-2 bg-[#083D42]/20')} />
          ))}
        </div>

        <button onClick={next}
          className="w-full py-4 bg-[#083D42] text-white font-semibold rounded-2xl text-base flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(8,61,66,0.28)] active:scale-[0.98] transition-all">
          {isLast
            ? <><Sparkles className="w-5 h-5" /> Comenzar</>
            : <>Siguiente <ChevronRight className="w-5 h-5" /></>}
        </button>

        {slide === 0 && (
          <button onClick={() => navigate('/cliente/home')}
            className="w-full py-3 text-[#083D42]/60 font-medium text-[15px] hover:text-[#083D42] transition-colors">
            Iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}
