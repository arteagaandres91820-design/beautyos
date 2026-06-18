import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueries, useMutation } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Clock, Scissors, User, Phone, Mail, CheckCircle2, Loader2, Ban, MessageCircle, Search, X, Package2, Star } from 'lucide-react';
import { publicApi } from '../../lib/api';
import { formatCOP, cn } from '../../lib/utils';

interface Service {
  id: string; name: string; category: string; price: number; duration: number; description?: string; image?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  NAILS: 'UÃ±as', HAIR: 'Cabello', FACE: 'Facial', BARBERSHOP: 'BarberÃ­a', SPA: 'Spa', OTHER: 'Otros',
};

const CATEGORY_EMOJI: Record<string, string> = {
  NAILS: 'ðŸ’…', HAIR: 'âœ‚ï¸', FACE: 'ðŸ§–', BARBERSHOP: 'ðŸ’ˆ', SPA: 'ðŸŒ¸', OTHER: 'âœ¨',
};

function generateSlots(openTime: string, closeTime: string, slotMin: number): string[] {
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const startMin = oh * 60 + om;
  const endMin   = ch * 60 + cm;
  const slots: string[] = [];
  for (let m = startMin; m < endMin; m += slotMin) {
    slots.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);
  }
  return slots;
}

const DEFAULT_SLOTS = generateSlots('09:00', '18:00', 30);

function getDates(count = 14) {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) dates.push(d); // skip Sundays
  }
  return dates;
}

const DAY_NAMES = ['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b', 'Dom'];
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Pkg {
  id: string; name: string; description?: string | null; price: number; duration: number; image?: string | null;
  services: Array<{ service: { id: string; name: string; price: number; duration: number; category: string } }>;
}

// Step 1: Choose services (multi-select) or a package
function StepService({ onSelect, initialServiceId }: {
  onSelect: (services: Service[], pkg?: { id: string; name: string; price: number }) => void;
  initialServiceId?: string;
}) {
  const [tab, setTab] = useState<'services' | 'packages'>('services');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selected, setSelected] = useState<Service[]>([]);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['public-services'],
    queryFn: () => publicApi.services().then(r => r.data),
  });

  const { data: packages = [] } = useQuery<Pkg[]>({
    queryKey: ['public-packages'],
    queryFn: () => publicApi.packages().then(r => r.data),
  });

  const autoSelected = useRef(false);
  useEffect(() => {
    if (!initialServiceId || autoSelected.current || services.length === 0) return;
    const match = services.find(s => s.id === initialServiceId);
    if (match) { autoSelected.current = true; setSelected([match]); }
  }, [initialServiceId, services]);

  const toggle = (s: Service) => {
    setSelected(prev =>
      prev.find(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]
    );
  };

  const categories = useMemo(() => [...new Set(services.map(s => s.category || 'OTHER'))], [services]);

  const filtered = useMemo(() => {
    let list = services;
    if (activeCategory !== 'ALL') list = list.filter(s => (s.category || 'OTHER') === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    return list;
  }, [services, activeCategory, search]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, s) => {
      const cat = s.category || 'OTHER';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [filtered]);

  const totalPrice = selected.reduce((s, sv) => s + sv.price, 0);
  const totalDuration = selected.reduce((s, sv) => s + sv.duration, 0);

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-7 h-7 animate-spin text-client-400" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">Â¿QuÃ© deseas hoy?</h2>
        <p className="text-sm text-gray-400">Elige servicios individuales o un paquete especial</p>
      </div>

      {/* Tab toggle */}
      {packages.length > 0 && (
        <div className="flex bg-white rounded-2xl p-1 border border-client-100 shadow-sm">
          <button onClick={() => setTab('services')}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'services' ? 'bg-[#083D42] text-white shadow-[0_8px_24px_rgba(8,61,66,0.28)]' : 'text-client-400 hover:text-client-600')}>
            <Scissors className="w-4 h-4" /> Servicios
          </button>
          <button onClick={() => setTab('packages')}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'packages' ? 'bg-[#083D42] text-white shadow-[0_8px_24px_rgba(8,61,66,0.28)]' : 'text-client-400 hover:text-client-600')}>
            <Package2 className="w-4 h-4" /> Paquetes
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', tab === 'packages' ? 'bg-white/20' : 'bg-client-100 text-client-500')}>
              {packages.length}
            </span>
          </button>
        </div>
      )}

      {/* Packages tab */}
      {tab === 'packages' && (
        <div className="space-y-3">
          {packages.map(pkg => {
            const sumOriginal = pkg.services.reduce((a, s) => a + s.service.price, 0);
            const discount = sumOriginal > 0 ? Math.round((1 - pkg.price / sumOriginal) * 100) : 0;
            const pkgServices: Service[] = pkg.services.map(s => ({ ...s.service, description: undefined, image: undefined }));
            return (
              <div key={pkg.id}
                className="bg-white rounded-3xl border border-client-100 shadow-sm overflow-hidden">
                {pkg.image && (
                  <div className="h-36 overflow-hidden">
                    <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                        {discount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5" /> -{discount}% descuento
                          </span>
                        )}
                      </div>
                      {pkg.description && <p className="text-xs text-gray-400 mt-0.5">{pkg.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pkg.services.map(s => (
                      <span key={s.service.id} className="text-xs bg-client-50 text-client-600 border border-client-100 px-2.5 py-1 rounded-full font-medium">
                        {s.service.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400">Precio del paquete</p>
                      <p className="text-xl font-bold text-client-600">{formatCOP(pkg.price)}</p>
                      {sumOriginal > pkg.price && (
                        <p className="text-xs text-gray-300 line-through">{formatCOP(sumOriginal)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {pkg.duration} min
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(pkgServices, { id: pkg.id, name: pkg.name, price: pkg.price })}
                    className="mt-3 w-full py-3.5 bg-[#083D42] text-white font-bold rounded-2xl shadow-client active:scale-[0.98] transition-all text-sm">
                    Elegir este paquete â†’
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Services tab content */}
      {tab === 'services' && <>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-client-300" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar servicio..."
          className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-client-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button onClick={() => setActiveCategory('ALL')}
            className={cn('shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all border',
              activeCategory === 'ALL' ? 'bg-client-600 text-white border-client-600 shadow-client' : 'bg-white text-gray-500 border-gray-200 hover:border-client-300')}>
            Todos
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={cn('shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border',
                activeCategory === cat ? 'bg-client-600 text-white border-client-600 shadow-client' : 'bg-white text-gray-500 border-gray-200 hover:border-client-300')}>
              <span>{CATEGORY_EMOJI[cat] || 'âœ¨'}</span>{CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No se encontraron servicios</p>
          {search && (
            <button onClick={() => { setSearch(''); setActiveCategory('ALL'); }}
              className="text-xs text-client-500 font-semibold mt-2">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              {activeCategory === 'ALL' && (
                <p className="text-xs font-bold text-client-500 uppercase tracking-widest mb-2">
                  {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat] || cat}
                </p>
              )}
              <div className="space-y-2">
                {items.map(s => {
                  const isSelected = !!selected.find(x => x.id === s.id);
                  return (
                    <button key={s.id} onClick={() => toggle(s)}
                      className={cn(
                        'w-full rounded-2xl text-left border shadow-sm transition-all active:scale-[0.98] overflow-hidden flex items-stretch gap-0',
                        isSelected
                          ? 'border-client-400 ring-2 ring-client-300/50 bg-client-50'
                          : 'border-gray-100 bg-white hover:border-client-300 hover:shadow-client'
                      )}>
                      {s.image ? (
                        <div className="w-20 h-20 shrink-0">
                          <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={cn('w-20 h-20 shrink-0 flex items-center justify-center text-2xl',
                          isSelected ? 'bg-client-100' : 'bg-gradient-to-br from-client-50 to-client-100')}>
                          {CATEGORY_EMOJI[s.category] || 'âœ¨'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                          {s.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{s.duration} min</span>
                            <span className="text-xs font-bold text-client-600">{formatCOP(s.price)}</span>
                          </div>
                        </div>
                        <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected ? 'border-client-500 bg-client-500' : 'border-gray-300')}>
                          {isSelected && <ChevronRight className="w-3 h-3 text-white rotate-0" style={{ transform: 'rotate(0deg)' }} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky CTA */}
      {selected.length > 0 && (
        <div className="sticky bottom-0 pt-2 pb-1 bg-client-sage">
          <button
            onClick={() => onSelect(selected)}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-between gap-3 bg-[#083D42] text-white shadow-[0_8px_24px_rgba(8,61,66,0.28)] active:scale-[0.98] px-5 transition-all">
            <span>{selected.length} servicio{selected.length !== 1 ? 's' : ''} Â· {totalDuration} min</span>
            <span className="flex items-center gap-1.5">{formatCOP(totalPrice)} <ChevronRight className="w-5 h-5" /></span>
          </button>
        </div>
      )}
      </>}
    </div>
  );
}

// Step 2: Choose professional + date + time
interface Professional { id: string; name: string; avatar: string | null; workDays: number[]; weeklySchedule?: string }

function StepDateTime({ onSelect }: { onSelect: (date: string, time: string, professionalId: string | null, professionalName?: string) => void }) {
  const { data: biz } = useQuery<{ openTime: string; closeTime: string; slotDuration: number; closedDays: string; weeklySchedule?: string }>({
    queryKey: ['public-business'],
    queryFn: () => publicApi.business().then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const weekSched: Record<number, { open: string; close: string; closed: boolean }> = useMemo(() => {
    try { if (biz?.weeklySchedule) return JSON.parse(biz.weeklySchedule); } catch { /* fall through */ }
    return {};
  }, [biz]);

  const closedDaysSet: Set<number> = useMemo(() => {
    if (Object.keys(weekSched).length > 0) {
      return new Set(Object.entries(weekSched).filter(([, v]) => v.closed).map(([k]) => Number(k)));
    }
    try { return new Set(JSON.parse(biz?.closedDays || '[0]') as number[]); } catch { return new Set([0]); }
  }, [weekSched, biz]);

  const getSlotsForDate = (d: Date): string[] => {
    const dayIdx = d.getDay();
    const daySched = weekSched[dayIdx];
    if (daySched && !daySched.closed && biz) return generateSlots(daySched.open, daySched.close, biz.slotDuration);
    return biz ? generateSlots(biz.openTime, biz.closeTime, biz.slotDuration) : DEFAULT_SLOTS;
  };

  const [selectedProf, setSelectedProf] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['public-professionals'],
    queryFn: () => publicApi.professionals().then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const profWorkDays: Set<number> = useMemo(() => {
    if (!selectedProf) return new Set([0,1,2,3,4,5,6]);
    const prof = professionals.find(p => p.id === selectedProf);
    return new Set(prof?.workDays ?? [0,1,2,3,4,5,6]);
  }, [selectedProf, professionals]);

  // Ahora sÃ­: dates usa profWorkDays que ya estÃ¡ definido
  const dates = useMemo(
    () => getDates().filter(d => !closedDaysSet.has(d.getDay()) && profWorkDays.has(d.getDay())),
    [closedDaysSet, profWorkDays]
  );

  // Pre-fetch ocupaciÃ³n de cada dÃ­a visible
  const batchAvail = useQueries({
    queries: dates.map(d => ({
      queryKey: ['avail-batch', formatDate(d), selectedProf ?? 'any'],
      queryFn: () => publicApi.availability(formatDate(d), selectedProf).then(r => r.data),
      enabled: !!biz,
      staleTime: 2 * 60_000,
    })),
  });

  // Mapa dateKey â†’ { free, total, loading }
  const occupancyMap = useMemo(() => {
    const map: Record<string, { free: number; total: number; loading: boolean }> = {};
    dates.forEach((d, i) => {
      const res = batchAvail[i];
      const key = formatDate(d);
      if (!res || res.isLoading || !res.data) { map[key] = { free: 0, total: 0, loading: true }; return; }
      const daySched = weekSched[d.getDay()];
      const slots: string[] = (() => {
        if (res.data.staffDaySched) {
          if (res.data.staffDaySched.closed) return [];
          return biz ? generateSlots(res.data.staffDaySched.open, res.data.staffDaySched.close, biz.slotDuration) : [];
        }
        if (daySched && !daySched.closed && biz) return generateSlots(daySched.open, daySched.close, biz.slotDuration);
        return biz ? generateSlots(biz.openTime, biz.closeTime, biz.slotDuration) : DEFAULT_SLOTS;
      })();
      const bookedCount = slots.filter(t =>
        res.data.booked?.some((b: { start: string; end: string }) => b.start <= t && t < b.end)
      ).length;
      map[key] = { free: slots.length - bookedCount, total: slots.length, loading: false };
    });
    return map;
  }, [batchAvail, dates, weekSched, biz]);

  const dateStr = selectedDate ? formatDate(selectedDate) : '';

  const { data: avail } = useQuery<{
    booked: { start: string; end: string }[];
    staffDaySched?: { open: string; close: string; closed: boolean } | null;
  }>({
    queryKey: ['availability', dateStr, selectedProf],
    queryFn: () => publicApi.availability(dateStr, selectedProf).then(r => r.data),
    enabled: !!dateStr,
    staleTime: 30_000,
  });

  const getSlotsForSelectedDate = (d: Date): string[] => {
    // Priority: staff day schedule â†’ business weekly schedule â†’ business default
    if (avail?.staffDaySched) {
      if (avail.staffDaySched.closed) return [];
      return biz ? generateSlots(avail.staffDaySched.open, avail.staffDaySched.close, biz.slotDuration) : [];
    }
    return getSlotsForDate(d);
  };

  const timeSlots = selectedDate ? getSlotsForSelectedDate(selectedDate) : (biz ? generateSlots(biz.openTime, biz.closeTime, biz.slotDuration) : DEFAULT_SLOTS);

  const isBooked = (slot: string) =>
    avail?.booked.some(b => b.start <= slot && slot < b.end) ?? false;

  const allBooked = selectedDate && timeSlots.length > 0 && timeSlots.every(t => isBooked(t));

  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [wlName, setWlName] = useState('');
  const [wlPhone, setWlPhone] = useState('');
  const [wlNotes, setWlNotes] = useState('');
  const [wlDone, setWlDone] = useState(false);

  const joinWaitlist = useMutation({
    mutationFn: () => publicApi.joinWaitlist({
      clientName: wlName.trim(),
      clientPhone: wlPhone.trim(),
      date: formatDate(selectedDate!),
      timeSlot: selectedTime ?? undefined,
      notes: wlNotes.trim() || undefined,
    }),
    onSuccess: () => setWlDone(true),
  });

  const canContinue = selectedDate && selectedTime;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">Â¿CuÃ¡ndo te queda bien?</h2>
        <p className="text-sm text-gray-400">Elige tu estilista, fecha y hora</p>
      </div>

      {/* Professional picker */}
      {professionals.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Estilista</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {/* "No preference" option */}
            <button
              onClick={() => { setSelectedProf(null); setSelectedDate(null); setSelectedTime(null); }}
              className={cn(
                'shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 transition-all min-w-[72px]',
                selectedProf === null
                  ? 'border-client-400 bg-client-50 text-client-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-client-200'
              )}>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                âœ¨
              </div>
              <span className="text-[10px] font-semibold leading-tight text-center">Sin<br/>preferencia</span>
            </button>
            {professionals.map(p => (
              <button key={p.id}
                onClick={() => { setSelectedProf(p.id); setSelectedDate(null); setSelectedTime(null); }}
                className={cn(
                  'shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 transition-all min-w-[72px]',
                  selectedProf === p.id
                    ? 'border-client-400 bg-client-50 text-client-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-client-200'
                )}>
                <div className="w-10 h-10 rounded-full bg-[#083D42] flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                  {p.avatar
                    ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    : p.name.charAt(0).toUpperCase()
                  }
                </div>
                <span className="text-[10px] font-semibold leading-tight text-center max-w-[64px] truncate">{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date picker */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Fecha</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {dates.map(d => {
            const key = formatDate(d);
            const isSelected = selectedDate && key === formatDate(selectedDate);
            const occ = occupancyMap[key];
            const isFull   = occ && !occ.loading && occ.total > 0 && occ.free === 0;
            const isAlmost = occ && !occ.loading && occ.total > 0 && occ.free > 0 && (occ.free / occ.total) <= 0.3;
            const isFree   = occ && !occ.loading && occ.total > 0 && (occ.free / occ.total) > 0.3;

            return (
              <button key={d.toISOString()}
                onClick={() => { if (!isFull) { setSelectedDate(d); setSelectedTime(null); } }}
                disabled={!!isFull}
                className={cn(
                  'shrink-0 w-[58px] pt-2.5 pb-2 rounded-2xl flex flex-col items-center gap-0.5 transition-all border',
                  isFull
                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    : isSelected
                      ? 'bg-client-600 text-white border-client-600 shadow-client'
                      : 'bg-white text-gray-600 border-gray-100 active:border-client-300'
                )}>
                <span className={cn('text-[10px] font-medium', isFull ? 'text-gray-300' : isSelected ? 'text-white/80' : 'text-gray-400')}>
                  {DAY_NAMES[(d.getDay() + 6) % 7]}
                </span>
                <span className={cn('text-[17px] font-bold leading-none', isFull ? 'text-gray-300' : '')}>
                  {d.getDate()}
                </span>
                <span className={cn('text-[9px]', isFull ? 'text-gray-300' : isSelected ? 'text-white/70' : 'text-gray-400')}>
                  {MONTH_NAMES[d.getMonth()]}
                </span>

                {/* â”€â”€ Indicador de ocupaciÃ³n â”€â”€ */}
                {!isSelected && (
                  <div className="mt-1 flex flex-col items-center gap-0.5">
                    {occ?.loading ? (
                      <div className="w-4 h-1 rounded-full bg-gray-200 animate-pulse" />
                    ) : isFull ? (
                      <span className="text-[8px] font-bold text-red-400 leading-none">Lleno</span>
                    ) : isAlmost ? (
                      <>
                        <div className="w-4 h-1 rounded-full bg-amber-400" />
                        <span className="text-[8px] font-semibold text-amber-500 leading-none">{occ!.free} libre{occ!.free !== 1 ? 's' : ''}</span>
                      </>
                    ) : isFree ? (
                      <>
                        <div className="w-4 h-1 rounded-full bg-emerald-400" />
                        <span className="text-[8px] font-semibold text-emerald-600 leading-none">{occ!.free} libre{occ!.free !== 1 ? 's' : ''}</span>
                      </>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Hora disponible</p>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map(t => {
              const booked = isBooked(t);
              const selected = selectedTime === t;
              return (
                <button key={t}
                  onClick={() => !booked && setSelectedTime(t)}
                  disabled={booked}
                  title={booked ? 'Hora ocupada' : undefined}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-semibold transition-all border flex flex-col items-center gap-0.5',
                    booked
                      ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                      : selected
                        ? 'bg-client-600 text-white border-client-600 shadow-client'
                        : 'bg-white text-gray-600 border-gray-100 hover:border-client-300'
                  )}>
                  {booked
                    ? <><Ban className="w-3 h-3" /><span className="text-[10px]">{t}</span></>
                    : t
                  }
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Waitlist CTA when day is fully booked */}
      {allBooked && selectedDate && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          {wlDone ? (
            <div className="text-center space-y-1 py-2">
              <CheckCircle2 className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-semibold text-amber-800 text-sm">Â¡Anotado! Te avisamos cuando haya un espacio.</p>
            </div>
          ) : showWaitlistForm ? (
            <>
              <p className="text-sm font-semibold text-amber-800">Lista de espera</p>
              <input className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Tu nombre" value={wlName} onChange={e => setWlName(e.target.value)} />
              <input className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Tu WhatsApp" type="tel" value={wlPhone} onChange={e => setWlPhone(e.target.value)} />
              <input className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Nota opcional (hora preferida, etc.)" value={wlNotes} onChange={e => setWlNotes(e.target.value)} />
              <button
                onClick={() => joinWaitlist.mutate()}
                disabled={!wlName.trim() || wlPhone.trim().length < 7 || joinWaitlist.isPending}
                className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm disabled:opacity-50">
                {joinWaitlist.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Anotarme'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-amber-700">Todos los turnos de este dÃ­a estÃ¡n ocupados.</p>
              <button onClick={() => setShowWaitlistForm(true)} className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm">
                Unirme a lista de espera
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => { if (!canContinue) return; const pName = selectedProf ? professionals.find(p => p.id === selectedProf)?.name : undefined; onSelect(formatDate(selectedDate!), selectedTime!, selectedProf, pName); }}
        disabled={!canContinue}
        className={cn(
          'w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all',
          canContinue ? 'bg-[#083D42] text-white shadow-[0_8px_24px_rgba(8,61,66,0.28)] active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}>
        Continuar <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// Step 3: Personal info
function StepInfo({ onSubmit, loading }: { onSubmit: (name: string, phone: string, email: string, notes: string) => void; loading: boolean }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const canSubmit = name.trim().length >= 2 && phone.trim().length >= 7;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">Â¿CÃ³mo te llamamos?</h2>
        <p className="text-sm text-gray-400">Solo necesitamos tu nombre y telÃ©fono</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-client-300" />
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-client-400"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-client-300" />
          <input
            value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="Tu nÃºmero de celular"
            type="tel"
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-client-400"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-client-300" />
          <input
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email (opcional)"
            type="email"
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-client-400"
          />
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Notas para tu estilista (preferencias, alergias, etc.) â€” opcional"
          rows={2}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-client-400 resize-none"
        />
      </div>

      <button
        onClick={() => canSubmit && onSubmit(name.trim(), phone.trim(), email.trim(), notes.trim())}
        disabled={!canSubmit || loading}
        className={cn(
          'w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all',
          canSubmit && !loading ? 'bg-[#083D42] text-white shadow-[0_8px_24px_rgba(8,61,66,0.28)] active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Confirmar cita</>}
      </button>
    </div>
  );
}

// Step 4: Confirmed
function StepConfirmed({ services, date, time, name, professionalName, pkg }: {
  services: Service[]; date: string; time: string; name: string; professionalName?: string;
  pkg?: { id: string; name: string; price: number } | null;
}) {
  const navigate = useNavigate();
  const { data: biz } = useQuery<{ name: string; whatsapp?: string }>({
    queryKey: ['public-business'],
    queryFn: () => publicApi.business().then(r => r.data),
    staleTime: 5 * 60_000,
  });
  const d = new Date(date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const serviceNames = pkg ? pkg.name : services.map(s => s.name).join(', ');
  const totalPrice = pkg ? pkg.price : services.reduce((s, sv) => s + sv.price, 0);

  return (
    <div className="flex flex-col items-center text-center py-8 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-[#083D42] shadow-[0_12px_40px_rgba(8,61,66,0.32)] flex items-center justify-center animate-bounce-soft">
          <CheckCircle2 className="w-14 h-14 text-white" />
        </div>
        {['âœ¨','ðŸ“…','ðŸ’…','ðŸŽ‰','ðŸ’š'].map((e, i) => (
          <span key={i} className="absolute text-2xl animate-bounce-soft"
            style={{ top: `${[-10,-5,20,30,-8][i]}%`, left: `${[110,120,115,-15,-20][i]}%`, animationDelay: `${i*150}ms` }}>
            {e}
          </span>
        ))}
      </div>
      <h2 className="font-serif text-2xl font-bold text-client-900 mb-2">Â¡Cita solicitada!</h2>
      <p className="text-client-600 text-sm mb-8 max-w-xs">
        Nos pondremos en contacto contigo para confirmar. Â¡Hasta pronto, {name}!
      </p>

      <div className="w-full bg-white rounded-3xl p-5 border border-client-100 shadow-sm text-left space-y-3 mb-8">
        <div className="flex items-start gap-3">
          {pkg ? <Package2 className="w-5 h-5 text-client-400 mt-0.5 shrink-0" /> : <Scissors className="w-5 h-5 text-client-400 mt-0.5 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">{pkg ? 'Paquete' : (services.length === 1 ? 'Servicio' : `${services.length} servicios`)}</p>
            {pkg ? (
              <>
                <p className="font-semibold text-gray-800 text-sm">{pkg.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{services.map(s => s.name).join(' Â· ')}</p>
                <p className="text-xs font-bold text-client-600 mt-1">{formatCOP(pkg.price)}</p>
              </>
            ) : (
              <>
                {services.map(s => (
                  <p key={s.id} className="font-semibold text-gray-800 text-sm">{s.name}</p>
                ))}
                {services.length > 1 && (
                  <p className="text-xs font-bold text-client-600 mt-1">Total: {formatCOP(totalPrice)}</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-client-400" />
          <div>
            <p className="text-xs text-gray-400">Fecha</p>
            <p className="font-semibold text-gray-800 text-sm capitalize">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-client-400" />
          <div>
            <p className="text-xs text-gray-400">Hora</p>
            <p className="font-semibold text-gray-800 text-sm">{time}</p>
          </div>
        </div>
        {professionalName && (
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-client-400" />
            <div>
              <p className="text-xs text-gray-400">Estilista preferida</p>
              <p className="font-semibold text-gray-800 text-sm">{professionalName}</p>
            </div>
          </div>
        )}
      </div>

      {biz?.whatsapp && (
        <a
          href={`https://wa.me/${biz.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Â¡Hola ${biz.name}! Acabo de solicitar una cita de ${serviceNames} para el ${dateStr} a las ${time}. Â¡Confirmo mi asistencia!`)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all mb-3">
          <MessageCircle className="w-5 h-5" /> Confirmar por WhatsApp
        </a>
      )}
      <button onClick={() => navigate('/cliente')}
        className="w-full py-4 bg-[#083D42] text-white font-bold rounded-2xl shadow-client active:scale-[0.98] transition-transform">
        Volver al inicio
      </button>
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ClientBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const biz = searchParams.get('biz');
    if (biz) localStorage.setItem('beautyos_biz_slug', biz);
  }, []);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<{ id: string; name: string; price: number } | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const bookMutation = useMutation({
    mutationFn: (data: object) => publicApi.book(data),
    onSuccess: () => {
      if (phone) localStorage.setItem('beautyos_booking_phone', phone);
      localStorage.removeItem('beautyos_guest_mode');
      setStep(4);
    },
  });

  const handleInfo = (clientName: string, clientPhone: string, email: string, notes: string) => {
    setName(clientName);
    setPhone(clientPhone);
    const pkgNote = selectedPackage ? `[paquete: ${selectedPackage.name}]` : null;
    bookMutation.mutate({
      clientName,
      clientPhone,
      clientEmail: email || undefined,
      notes: [pkgNote, notes || null].filter(Boolean).join(' ') || undefined,
      date,
      timeSlot: time,
      serviceId: services[0]?.id,
      serviceIds: services.map(s => s.id),
      professionalId: professionalId ?? undefined,
    });
  };

  const STEPS = ['Servicios', 'Fecha', 'Tus datos', 'Confirmado'];

  return (
    <div className="min-h-screen bg-client-sage">
      {/* Header */}
      <div className="bg-client-hero px-5 pt-10 pb-5 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          {step < 4 && (
            <button onClick={() => step > 1 ? setStep((step - 1) as any) : navigate(-1)}
              className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <ChevronLeft className="w-5 h-5 text-client-500" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-client-900">Agendar cita</h1>
          </div>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={cn(
              'h-1 rounded-full flex-1 transition-all duration-300',
              i < step ? 'bg-client-600' : i === step - 1 ? 'bg-client-400' : 'bg-client-100'
            )} />
          ))}
        </div>
        <p className="text-xs text-client-400 mt-1.5">{STEPS[step - 1]} Â· Paso {step} de 4</p>
      </div>

      <div className="px-5 py-6">
        {step === 1 && (
          <StepService
            onSelect={(sel, pkg) => { setServices(sel); setSelectedPackage(pkg ?? null); setStep(2); }}
            initialServiceId={searchParams.get('serviceId') ?? undefined}
          />
        )}
        {step === 2 && (
          <StepDateTime onSelect={(d, t, profId, profName) => { setDate(d); setTime(t); setProfessionalId(profId); setProfessionalName(profName); setStep(3); }} />
        )}
        {step === 3 && (
          <StepInfo onSubmit={handleInfo} loading={bookMutation.isPending} />
        )}
        {step === 4 && services.length > 0 && (
          <StepConfirmed services={services} date={date} time={time} name={name} professionalName={professionalName} pkg={selectedPackage} />
        )}
      </div>
    </div>
  );
}

