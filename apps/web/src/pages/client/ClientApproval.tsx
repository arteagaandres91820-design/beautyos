import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ChevronLeft, Sparkles, Clock, Heart, Camera, Upload,
  Check, ChevronRight, X, CheckCircle2, Info, Loader2, MessageCircle, AlertCircle
} from 'lucide-react';
import { nailApi, publicApi } from '../../lib/api';
import { NailDesign } from '../../types';
import { formatCOP, CATEGORY_EMOJI, CATEGORY_LABELS, cn } from '../../lib/utils';
import { ToastProvider, useToast } from '../../components/ui/Toast';

// â”€â”€â”€ Try-On inline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TryOnInline({ design, onApprove }: { design: NailDesign; onApprove: () => void }) {
  useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [handImage, setHandImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [slider, setSlider] = useState(50);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = e => { setHandImage(e.target?.result as string); setStep(2); };
    reader.readAsDataURL(f);
  };

  const runTryOn = useCallback(async () => {
    if (!handImage) return;
    setProcessing(true);
    try {
      const { data } = await nailApi.tryOn(design.id, handImage);
      setResult(data.resultImageUrl);
      setIsFallback(data.fallback ?? false);
      setStep(3);
    } catch {
      setResult(design.imageUrl); setIsFallback(true); setStep(3);
    } finally { setProcessing(false); }
  }, [handImage, design]);

  return (
    <div className="space-y-4 p-4">
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {step === 1 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-gray-500 text-center">Sube la foto de tu mano para ver cÃ³mo te queda este diseÃ±o</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { fileRef.current?.removeAttribute('capture'); fileRef.current?.click(); }}
              className="aspect-square rounded-2xl border-2 border-dashed border-client-200 hover:border-client-500 flex flex-col items-center justify-center gap-2 text-client-400 hover:text-client-500 transition-colors bg-client-50/50">
              <Upload className="w-8 h-8" />
              <span className="text-xs font-medium text-center">Desde galerÃ­a</span>
            </button>
            <button onClick={() => { fileRef.current?.setAttribute('capture', 'environment'); fileRef.current?.click(); }}
              className="aspect-square rounded-2xl border-2 border-dashed border-client-200 hover:border-client-500 flex flex-col items-center justify-center gap-2 text-client-400 hover:text-client-500 transition-colors bg-client-50/50">
              <Camera className="w-8 h-8" />
              <span className="text-xs font-medium text-center">Tomar foto</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && handImage && (
        <div className="space-y-3 animate-fade-in">
          <div className="relative rounded-2xl overflow-hidden aspect-square">
            <img src={handImage} alt="Tu mano" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              {processing ? (
                <div className="bg-white/95 rounded-2xl p-5 text-center shadow-xl">
                  <div className="relative w-14 h-14 mx-auto mb-2">
                    <div className="absolute inset-0 rounded-full border-3 border-client-100" />
                    <div className="absolute inset-0 rounded-full border-3 border-client-500 border-t-transparent animate-spin" style={{ borderWidth: 3 }} />
                    <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-client-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Aplicando IA...</p>
                </div>
              ) : (
                <button onClick={runTryOn}
                  className="bg-[#083D42] text-white font-semibold px-6 py-3 rounded-2xl shadow-client-lg flex items-center gap-2 active:scale-[0.97] transition-transform">
                  <Sparkles className="w-5 h-5" /> Â¡Aplicar diseÃ±o!
                </button>
              )}
            </div>
          </div>
          {!processing && (
            <button onClick={() => setStep(1)} className="w-full text-center text-sm text-client-400 font-medium py-2">
              â† Cambiar foto
            </button>
          )}
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-3 animate-fade-in">
          {isFallback && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-600">
              <Info className="w-4 h-4 shrink-0" /> Vista de referencia del diseÃ±o
            </div>
          )}
          {handImage && !isFallback ? (
            <div
              className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-col-resize select-none"
              onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setSlider(Math.max(5, Math.min(95, ((e.clientX - r.left) / r.width) * 100))); }}
              onTouchMove={e => { const r = e.currentTarget.getBoundingClientRect(); setSlider(Math.max(5, Math.min(95, ((e.touches[0].clientX - r.left) / r.width) * 100))); }}
            >
              <img src={result} alt="Con diseÃ±o" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
                <img src={handImage} alt="Sin diseÃ±o" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none" style={{ left: `${slider}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <ChevronLeft className="w-3 h-3 text-gray-400" /><ChevronRight className="w-3 h-3 text-gray-400" />
                </div>
              </div>
              <span className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">Antes</span>
              <span className="absolute top-2 right-2 bg-client-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">DespuÃ©s âœ¨</span>
            </div>
          ) : (
            <img src={result} alt="DiseÃ±o" className="w-full rounded-2xl aspect-square object-cover"
              onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/500/500`; }} />
          )}
          <button onClick={onApprove}
            className="w-full py-4 bg-[#083D42] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 shadow-client-lg active:scale-[0.98] transition-transform">
            <CheckCircle2 className="w-5 h-5" /> Â¡Este me encanta! Aprobar
          </button>
          <button onClick={() => setStep(1)} className="w-full text-center text-sm text-client-400 font-medium py-2">
            Volver a probar
          </button>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Design card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProposalCard({
  design, index, isSelected, onSelect, onExpand,
}: { design: NailDesign; index: number; isSelected: boolean; onSelect: () => void; onExpand: () => void }) {
  return (
    <div className={cn(
      'bg-white rounded-3xl overflow-hidden border-2 transition-all duration-200 shadow-sm',
      isSelected ? 'border-client-500 shadow-client' : 'border-gray-100',
    )}>
      <div className="relative aspect-square" onClick={onExpand}>
        <img src={design.imageUrl} alt={design.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/500/500`; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow font-display font-bold text-client-700 text-sm">
          {index + 1}
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 text-client-600 text-[10px] font-bold px-2 py-1 rounded-full">
            {CATEGORY_EMOJI[design.category]} {CATEGORY_LABELS[design.category]}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display font-bold text-white text-lg leading-tight drop-shadow">{design.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/90 text-sm font-semibold">{formatCOP(design.price)}</span>
            <span className="text-white/60 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{design.duration}min</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex gap-2">
        <button onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-client-50 text-client-600 font-semibold rounded-2xl text-sm active:scale-[0.97] transition-transform">
          <Sparkles className="w-4 h-4" /> Probar
        </button>
        <button onClick={onSelect}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-2xl text-sm transition-all active:scale-[0.97]',
            isSelected ? 'bg-[#083D42] text-white shadow-[0_8px_24px_rgba(8,61,66,0.28)]' : 'bg-gray-100 text-gray-600'
          )}>
          {isSelected ? <><Check className="w-4 h-4" /> Elegido</> : <><Heart className="w-4 h-4" /> Elegir</>}
        </button>
      </div>
    </div>
  );
}

function TryOnSheet({ design, onClose, onApprove }: { design: NailDesign; onClose: () => void; onApprove: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[430px] bg-white rounded-t-[32px] shadow-2xl animate-slide-up overflow-y-auto"
        style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-4 pb-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-client-400 font-medium uppercase tracking-widest">{CATEGORY_LABELS[design.category]}</p>
            <h3 className="font-display text-xl font-bold text-gray-900">{design.name}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <ToastProvider>
          <TryOnInline design={design} onApprove={onApprove} />
        </ToastProvider>
      </div>
    </div>
  );
}

function ApprovalConfirmed({ design, proposal, onDone }: {
  design: NailDesign;
  proposal: { salonName: string; date: string; startTime: string; whatsapp?: string };
  onDone: () => void;
}) {
  const dateStr = new Date(proposal.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
  const wa = proposal.whatsapp?.replace(/\D/g, '') || '573001234567';
  const msg = encodeURIComponent(`Â¡Hola! Acabo de aprobar mi diseÃ±o "${design.name}" ðŸ’…`);

  return (
    <div className="min-h-screen bg-client-hero flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-[#083D42] shadow-[0_12px_40px_rgba(8,61,66,0.32)] flex items-center justify-center animate-bounce-soft">
          <CheckCircle2 className="w-14 h-14 text-white" />
        </div>
        {['âœ¨','ðŸ’…','ðŸŽ‰','ðŸ’š','â­'].map((e, i) => (
          <span key={i} className="absolute text-2xl animate-bounce-soft"
            style={{ top: `${[-10,-5,20,30,-8][i]}%`, left: `${[110,120,115,-15,-20][i]}%`, animationDelay: `${i*150}ms` }}>
            {e}
          </span>
        ))}
      </div>
      <h1 className="font-serif text-3xl font-bold text-client-900 mb-2">Â¡DiseÃ±o aprobado!</h1>
      <p className="text-client-600 text-base leading-relaxed mb-6 max-w-xs">
        Tu estilista ya sabe cuÃ¡l preparar. Â¡Te esperamos el <strong>{dateStr} a las {proposal.startTime}</strong>!
      </p>
      <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-client mb-4 border-4 border-white">
        <img src={design.imageUrl} alt={design.name} className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/200/200`; }} />
      </div>
      <p className="font-semibold text-gray-700 mb-1">{design.name}</p>
      <p className="text-sm text-gray-400 mb-8">{proposal.salonName}</p>
      <a href={`https://wa.me/${wa}?text=${msg}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 w-full max-w-xs justify-center bg-green-500 text-white font-semibold py-4 rounded-2xl shadow-lg mb-3 active:scale-[0.98] transition-transform">
        <MessageCircle className="w-5 h-5" fill="white" /> Confirmar por WhatsApp
      </a>
      <button onClick={onDone} className="text-sm text-client-400 font-medium py-3 hover:text-client-600 transition-colors">
        Volver al inicio
      </button>
    </div>
  );
}

// â”€â”€â”€ Main Approval Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ClientApproval() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tryOnDesign, setTryOnDesign] = useState<NailDesign | null>(null);
  const [approved, setApproved] = useState<NailDesign | null>(null);

  const isDemo = token === 'demo';

  // Persist token so ClientHome can show the pending proposal
  useEffect(() => {
    if (!isDemo && token) {
      localStorage.setItem('beautyos_client_token', token);
    }
  }, [token, isDemo]);

  // Real proposal fetch
  const { data: proposal, isLoading: proposalLoading, error: proposalError } = useQuery({
    queryKey: ['proposal', token],
    queryFn: () => publicApi.getProposal(token!).then(r => r.data),
    enabled: !isDemo && !!token,
  });

  // Demo: load first 3 public designs
  const { data: demoDesigns = [], isLoading: demoLoading } = useQuery<NailDesign[]>({
    queryKey: ['demo-approval-designs'],
    queryFn: () => nailApi.listPublic({ limit: 3 }).then(r => r.data),
    enabled: isDemo,
  });

  const approveMutation = useMutation({
    mutationFn: (designId: string) => publicApi.approveDesign(token!, designId),
  });

  const proposedDesigns: NailDesign[] = isDemo ? demoDesigns.slice(0, 3) : (proposal?.designs ?? []);
  const isLoading = isDemo ? demoLoading : proposalLoading;

  const proposalInfo = isDemo
    ? { clientName: 'Valeria', salonName: 'Nail Studio Valentina', stylistName: 'Laura Torres', stylistAvatar: 'https://picsum.photos/seed/laura/60/60', date: new Date().toISOString(), startTime: '3:00 PM', whatsapp: '+57 300 123 4567', note: 'BasÃ¡ndonos en lo que hablamos, te proponemos estas 3 opciones. Â¡PruÃ©balas en tu mano y elige la que mÃ¡s te inspire!' }
    : proposal;

  const handleApprove = async (design: NailDesign) => {
    if (!isDemo) {
      try { await approveMutation.mutateAsync(design.id); } catch { /* ignore */ }
      localStorage.removeItem('beautyos_client_token');
    }
    setSelectedId(design.id);
    setTryOnDesign(null);
    setTimeout(() => setApproved(design), 300);
  };

  if (approved && proposalInfo) {
    return (
      <ApprovalConfirmed
        design={approved}
        proposal={{ salonName: proposalInfo.salonName, date: proposalInfo.date, startTime: proposalInfo.startTime, whatsapp: proposalInfo.whatsapp }}
        onDone={() => navigate('/cliente')}
      />
    );
  }

  if (!isDemo && !proposalLoading && proposalError) {
    return (
      <div className="min-h-screen bg-client-sage flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="w-16 h-16 text-client-300 mb-4" />
        <h2 className="font-display text-xl font-bold text-gray-800 mb-2">Propuesta no encontrada</h2>
        <p className="text-sm text-gray-500 mb-6">El enlace puede haber expirado o no ser vÃ¡lido.</p>
        <button onClick={() => navigate('/cliente')} className="text-client-600 font-semibold">Ir al inicio</button>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-full bg-client-sage">
        {/* Header */}
        <div className="bg-client-hero px-5 pt-10 pb-5">
          <button onClick={() => navigate('/cliente')} className="flex items-center gap-1 text-client-400 text-sm font-medium mb-4">
            <ChevronLeft className="w-4 h-4" /> Inicio
          </button>

          {isLoading ? (
            <div className="bg-white rounded-3xl p-4 animate-pulse h-24" />
          ) : proposalInfo && (
            <div className="flex gap-3 items-start bg-white rounded-3xl p-4 shadow-sm border border-client-100">
              <img src={proposalInfo.stylistAvatar || `https://picsum.photos/seed/stylist/60/60`} alt={proposalInfo.stylistName}
                className="w-12 h-12 rounded-2xl object-cover shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/laura/60/60`; }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-gray-800">{proposalInfo.stylistName}</p>
                  <span className="bg-client-100 text-client-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">Tu estilista</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{proposalInfo.salonName}</p>
                <p className="text-sm text-gray-600 leading-relaxed">"{proposalInfo.note || 'Te proponemos estos diseÃ±os especialmente para ti. Â¡PruÃ©balos en tu mano!'}"</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-5">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
            {proposedDesigns.length} diseÃ±os para ti <span className="text-client-500">âœ¦</span>
          </h1>
          <p className="text-sm text-gray-400">PruÃ©balos en tu mano y elige el que mÃ¡s te guste</p>
        </div>

        <div className="px-4 pb-8 space-y-4">
          {isLoading
            ? Array(3).fill(null).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100">
                  <div className="aspect-square bg-client-50 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-client-50 rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-client-50 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            : proposedDesigns.map((design, i) => (
                <ProposalCard
                  key={design.id}
                  design={design}
                  index={i}
                  isSelected={selectedId === design.id}
                  onSelect={() => setSelectedId(selectedId === design.id ? null : design.id)}
                  onExpand={() => setTryOnDesign(design)}
                />
              ))
          }
        </div>

        {selectedId && !isLoading && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-client-100 px-5 py-4 z-40">
            <button
              onClick={() => { const d = proposedDesigns.find(d => d.id === selectedId); if (d) handleApprove(d); }}
              className="w-full py-4 bg-[#083D42] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 shadow-client-lg active:scale-[0.98] transition-transform">
              <CheckCircle2 className="w-5 h-5" /> Aprobar este diseÃ±o
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Tu estilista recibirÃ¡ tu selecciÃ³n de inmediato</p>
          </div>
        )}

        {tryOnDesign && (
          <TryOnSheet
            design={tryOnDesign}
            onClose={() => setTryOnDesign(null)}
            onApprove={() => handleApprove(tryOnDesign)}
          />
        )}
      </div>
    </ToastProvider>
  );
}

