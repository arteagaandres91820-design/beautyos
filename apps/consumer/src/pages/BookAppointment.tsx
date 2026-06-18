import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NAIL_DESIGNS, type NailDesign } from '../data/nailDesigns';

const SERVICES = [
  { id: 'manicure', name: 'Manicure', desc: 'Limpieza, limado y esmaltado', duration: '45 min', price: 35000, icon: '💅' },
  { id: 'acrilico', name: 'Acrílico', desc: 'Extensión en acrílico natural o color', duration: '90 min', price: 85000, icon: '✨' },
  { id: 'gel', name: 'Gel', desc: 'Esmaltado semipermanente en gel', duration: '60 min', price: 55000, icon: '💎' },
  { id: 'semipermanente', name: 'Semipermanente', desc: 'Duración hasta 3 semanas', duration: '50 min', price: 45000, icon: '🌟' },
];

const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const BUSY = new Set(['10:00', '14:00', '17:00']);

function getDaysFromNow(n: number) {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function NailMini({ design }: { design: NailDesign }) {
  return (
    <svg width="28" height="36" viewBox="0 0 28 36">
      <defs>
        {design.gradient && (
          <linearGradient id={`bk-g-${design.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={design.colors[0]} />
            <stop offset="100%" stopColor={design.colors[1]} />
          </linearGradient>
        )}
      </defs>
      <rect x="2" y="2" width="24" height="32" rx="8"
        fill={design.gradient ? `url(#bk-g-${design.id})` : design.colors[0]}
        stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      {design.tipColor && (
        <rect x="2" y="2" width="24" height="9" rx="8" fill={design.tipColor} opacity="0.9" />
      )}
      <rect x="5" y="4" width="7" height="12" rx="3" fill="white" opacity="0.2" />
    </svg>
  );
}

export function BookAppointment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const designId = params.get('design');
  const design = NAIL_DESIGNS.find(d => d.id === designId) ?? null;

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const days = useMemo(() => getDaysFromNow(14), []);
  const service = SERVICES.find(s => s.id === selectedService);

  const canContinue = [
    selectedService !== null,
    selectedDay !== null && selectedTime !== null,
    name.trim().length >= 2 && phone.trim().length >= 7,
  ];

  const goNext = () => {
    if (step < 2) setStep(s => s + 1);
    else setConfirmed(true);
  };

  if (confirmed && service && selectedDay && selectedTime) {
    const dayStr = `${DAY_NAMES[selectedDay.getDay()]} ${selectedDay.getDate()} ${MONTH_NAMES[selectedDay.getMonth()]}`;
    return (
      <div className="phone-shell bg-[#EFF4F1] flex flex-col items-center justify-center px-6 text-center page-enter">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-btn">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">¡Reserva confirmada!</p>
        <h1 className="font-display text-3xl font-light text-dark mb-4 leading-tight">
          Tu cita está<br /><em>agendada</em>
        </h1>

        <div className="w-full bg-white rounded-3xl shadow-card p-5 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center text-lg">{service.icon}</div>
            <div>
              <p className="text-xs text-muted">Servicio</p>
              <p className="font-semibold text-dark text-sm">{service.name}</p>
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted">Fecha y hora</p>
              <p className="font-semibold text-dark text-sm">{dayStr} · {selectedTime}</p>
            </div>
          </div>
          {design && (
            <>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${design.colors[0]}33` }}>
                  <NailMini design={design} />
                </div>
                <div>
                  <p className="text-xs text-muted">Diseño seleccionado</p>
                  <p className="font-semibold text-dark text-sm">{design.name}</p>
                </div>
              </div>
            </>
          )}
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Total estimado</p>
            <p className="text-base font-bold text-primary">${service.price.toLocaleString()}</p>
          </div>
        </div>

        <p className="text-xs text-muted mb-8 leading-relaxed">
          Recibirás un mensaje de confirmación. Llega 5 min antes de tu cita. 🌸
        </p>

        <button
          onClick={() => navigate('/nail-ai')}
          className="btn-primary mb-3"
          style={{ background: '#083D42' }}
        >
          Ver más diseños
        </button>
        <button
          onClick={() => navigate('/home')}
          className="w-full py-3 text-sm text-muted font-medium active:opacity-60 transition-opacity"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="phone-shell bg-[#EFF4F1] flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            className="w-9 h-9 -ml-1 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted font-semibold">{step + 1}/3</span>
        </div>

        {design && (
          <div className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-2.5 shadow-card">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: `${design.colors[0]}33` }}>
              <NailMini design={design} />
            </div>
            <div>
              <p className="text-[10px] text-muted">Diseño elegido</p>
              <p className="text-sm font-semibold text-dark">{design.name}</p>
            </div>
            <button
              onClick={() => navigate('/nail-ai')}
              className="ml-auto text-[11px] text-primary font-semibold active:opacity-60"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">

        {/* Step 0: Service */}
        {step === 0 && (
          <div className="page-enter">
            <h2 className="font-display text-2xl font-light text-dark mb-1">Elige tu servicio</h2>
            <p className="text-sm text-muted mb-5">¿Qué tipo de servicio quieres para tu cita?</p>
            <div className="space-y-3">
              {SERVICES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                    selectedService === s.id
                      ? 'border-primary bg-primary text-white shadow-btn'
                      : 'border-gray-100 bg-white shadow-card'
                  }`}
                >
                  <span className="text-2xl shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-[15px] ${selectedService === s.id ? 'text-white' : 'text-dark'}`}>{s.name}</p>
                    <p className={`text-xs mt-0.5 truncate ${selectedService === s.id ? 'text-white/75' : 'text-muted'}`}>{s.desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-bold text-sm ${selectedService === s.id ? 'text-white' : 'text-primary'}`}>
                      ${s.price.toLocaleString()}
                    </p>
                    <p className={`text-[10px] ${selectedService === s.id ? 'text-white/70' : 'text-muted'}`}>{s.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="page-enter">
            <h2 className="font-display text-2xl font-light text-dark mb-1">Elige fecha y hora</h2>
            <p className="text-sm text-muted mb-5">Selecciona cuándo quieres tu cita.</p>

            {/* Day picker */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 mb-5">
              {days.map((d, i) => {
                const isSelected = selectedDay?.toDateString() === d.toDateString();
                const isToday = i === 0;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDay(d); setSelectedTime(null); }}
                    className={`shrink-0 flex flex-col items-center px-3 py-3 rounded-2xl border-2 min-w-[52px] transition-all active:scale-90 ${
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-btn'
                        : 'border-gray-100 bg-white shadow-card'
                    }`}
                  >
                    <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-white/80' : 'text-muted'}`}>
                      {isToday ? 'Hoy' : DAY_NAMES[d.getDay()]}
                    </span>
                    <span className={`text-lg font-bold leading-tight ${isSelected ? 'text-white' : 'text-dark'}`}>
                      {d.getDate()}
                    </span>
                    <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-muted'}`}>
                      {MONTH_NAMES[d.getMonth()]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time picker */}
            {selectedDay && (
              <>
                <p className="text-sm font-semibold text-dark mb-3">
                  Horarios disponibles — {DAY_NAMES[selectedDay.getDay()]} {selectedDay.getDate()}
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {TIMES.map(t => {
                    const busy = BUSY.has(t);
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        disabled={busy}
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 border-2 ${
                          busy
                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            : isSelected
                            ? 'border-primary bg-primary text-white shadow-btn'
                            : 'border-gray-100 bg-white shadow-card text-dark'
                        }`}
                      >
                        {t}
                        {busy && <span className="block text-[9px] text-gray-300 font-normal">Ocupado</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Contact */}
        {step === 2 && (
          <div className="page-enter">
            <h2 className="font-display text-2xl font-light text-dark mb-1">Tus datos</h2>
            <p className="text-sm text-muted mb-5">Para confirmar tu reserva necesitamos tu contacto.</p>

            {/* Summary card */}
            {service && selectedDay && selectedTime && (
              <div className="bg-white rounded-3xl shadow-card p-4 mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Servicio</span>
                  <span className="text-sm font-semibold text-dark">{service.icon} {service.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Fecha</span>
                  <span className="text-sm font-semibold text-dark">
                    {DAY_NAMES[selectedDay.getDay()]} {selectedDay.getDate()} {MONTH_NAMES[selectedDay.getMonth()]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Hora</span>
                  <span className="text-sm font-semibold text-dark">{selectedTime}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Total</span>
                  <span className="text-base font-bold text-primary">${service.price.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark block mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-white rounded-2xl px-4 py-3.5 text-sm text-dark shadow-card outline-none border-2 border-transparent focus:border-primary/30 placeholder:text-muted"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark block mb-1.5">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="w-full bg-white rounded-2xl px-4 py-3.5 text-sm text-dark shadow-card outline-none border-2 border-transparent focus:border-primary/30 placeholder:text-muted"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted mt-4 leading-relaxed">
              Al confirmar aceptas recibir recordatorios por WhatsApp. Sin compromiso de pago anticipado.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="shrink-0 px-5 pt-3 pb-8">
        <button
          onClick={goNext}
          disabled={!canContinue[step]}
          className={`btn-primary transition-all ${!canContinue[step] ? 'opacity-40 cursor-not-allowed' : ''}`}
          style={canContinue[step] ? { background: '#083D42' } : {}}
        >
          {step === 2 ? 'Confirmar reserva' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
