import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Heart, Search, X, Upload, Camera, ChevronLeft, ChevronRight,
  Clock, Info, Loader2, Star, Scale,
  Plus, Trash2, Grid3x3, LayoutGrid, ExternalLink,
  ImagePlus,
} from 'lucide-react';
import { nailApi } from '../lib/api';
import { NailDesign, NailDesignCategory } from '../types';
import { formatCOP, CATEGORY_LABELS, CATEGORY_EMOJI, cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Constantes
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_CATEGORIES: NailDesignCategory[] = [
  'TRENDS_2026','FRENCH','ACRYLIC','GEL','MINIMALIST','ELEGANT',
  'GRADIENT','FLORAL','CHROME','GLITTER','PASTEL',
  'GEOMETRIC','ARTISTIC','WEDDING','CORPORATE',
  'SUMMER','VALENTINES','BIRTHDAY','CHRISTMAS','HALLOWEEN',
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Virtual Try-On â€” cÃ¡mara en vivo + IA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type TryOnStep = 'design' | 'camera' | 'processing' | 'result';

export function TryOnFlow({ design, onClose }: { design: NailDesign; onClose: () => void }) {
  const [step, setStep] = useState<TryOnStep>('design');
  const [handImage, setHandImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Analizando tu foto...');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Arranca la cÃ¡mara al entrar al paso 'camera'
  useEffect(() => {
    if (step !== 'camera') return;
    setCameraError(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      })
      .catch(() => setCameraError(true));

    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };
  }, [step]);

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };

  const processImage = useCallback(async (dataUrl: string) => {
    setHandImage(dataUrl);
    setStep('processing');
    setProgress(0);

    const LABELS = ['Analizando tu foto...', 'Detectando tus manos...', 'Aplicando el diseÃ±o con IA...', 'Â¡Casi listo!'];
    let p = 0;
    const tick = setInterval(() => {
      p += p < 30 ? 3 : p < 60 ? 1.5 : p < 88 ? 0.6 : 0;
      setProgress(Math.min(p, 90));
      setProgressLabel(p < 30 ? LABELS[0] : p < 55 ? LABELS[1] : p < 80 ? LABELS[2] : LABELS[3]);
    }, 300);

    try {
      const { data } = await nailApi.tryOn(design.id, dataUrl);
      clearInterval(tick);
      setProgress(100);
      setProgressLabel('Â¡Listo! âœ¨');
      setTimeout(() => { setResultImage(data.resultImageUrl); setIsFallback(data.fallback ?? false); setStep('result'); }, 500);
    } catch {
      clearInterval(tick);
      toast('Error al procesar. Intenta con otra foto.', 'error');
      setResultImage(design.imageUrl); setIsFallback(true); setStep('result');
    }
  }, [design, toast]);

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    stopCamera();
    processImage(canvas.toDataURL('image/jpeg', 0.92));
  }, [processImage]);

  const startCountdown = useCallback(() => {
    let n = 3;
    setCountdown(n);
    const iv = setInterval(() => {
      n--;
      if (n === 0) { clearInterval(iv); setCountdown(null); captureFromCamera(); }
      else setCountdown(n);
    }, 1000);
  }, [captureFromCamera]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { stopCamera(); processImage(ev.target?.result as string); };
    reader.readAsDataURL(f);
  };

  const restart = () => { setHandImage(null); setResultImage(null); setProgress(0); setCountdown(null); setStep('camera'); };

  // â”€â”€ STEP: design â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'design') return (
    <div className="p-5 space-y-5 animate-fade-in">
      <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl items-center">
        <img src={design.imageUrl} alt={design.name}
          className="w-24 h-24 rounded-xl object-cover shrink-0"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/200/200`; }} />
        <div>
          <p className="font-display font-bold text-gray-900 leading-tight">{design.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{CATEGORY_EMOJI[design.category]} {CATEGORY_LABELS[design.category]}</p>
          <p className="text-primary font-bold mt-2">{formatCOP(design.price)}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{design.duration} min</p>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center space-y-1.5">
        <Sparkles className="w-7 h-7 text-primary mx-auto" />
        <p className="font-display font-semibold text-primary-900">Prueba virtual con IA</p>
        <p className="text-xs text-primary-700/80 leading-relaxed">
          Abre la cÃ¡mara, apunta tus manos y presiona el botÃ³n.<br />
          La IA aplicarÃ¡ el diseÃ±o en segundos.
        </p>
      </div>

      <button onClick={() => setStep('camera')} className="btn-primary w-full justify-center py-4 text-base rounded-2xl">
        <Camera className="w-5 h-5" /> Abrir cÃ¡mara
      </button>
    </div>
  );

  // â”€â”€ STEP: camera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'camera') return (
    <div className="animate-fade-in">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {cameraError ? (
        <div className="p-8 text-center space-y-4">
          <Camera className="w-14 h-14 mx-auto text-gray-200" />
          <div>
            <p className="font-semibold text-gray-700">No se pudo acceder a la cÃ¡mara</p>
            <p className="text-sm text-gray-400 mt-1">Permite el acceso en tu navegador o elige una foto</p>
          </div>
          <button onClick={() => fileRef.current?.click()} className="btn-primary w-full justify-center">
            <Upload className="w-4 h-4" /> Elegir foto de galerÃ­a
          </button>
          <button onClick={() => setStep('design')} className="btn-ghost w-full justify-center">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
        </div>
      ) : (
        <div className="relative bg-black overflow-hidden" style={{ height: '62vh', minHeight: 320 }}>
          {/* Video en vivo */}
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

          {/* Overlay: instrucciÃ³n superior */}
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
            <div className="bg-black/55 backdrop-blur-sm rounded-full px-4 py-1.5">
              <p className="text-white text-xs font-medium">ðŸ’… Centra tus manos en el encuadre</p>
            </div>
          </div>

          {/* Marco guÃ­a */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-44">
              <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white/70 rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white/70 rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white/70 rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white/70 rounded-br-lg" />
            </div>
          </div>

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                <span className="font-display text-5xl font-bold text-white">{countdown}</span>
              </div>
            </div>
          )}

          {/* Controles inferiores */}
          <div className="absolute bottom-5 inset-x-0 px-8 flex items-center justify-between">
            {/* GalerÃ­a */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Upload className="w-5 h-5" />
            </button>

            {/* Disparador */}
            {countdown === null ? (
              <button
                onClick={startCountdown}
                className="w-[72px] h-[72px] rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform shadow-2xl"
              >
                <div className="w-14 h-14 rounded-full bg-white" />
              </button>
            ) : (
              <div className="w-[72px] h-[72px] rounded-full border-4 border-white/40 bg-white/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
            )}

            {/* Cerrar */}
            <button
              onClick={() => { stopCamera(); setStep('design'); }}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // â”€â”€ STEP: processing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'processing') return (
    <div className="p-8 text-center space-y-6 animate-fade-in">
      {handImage && (
        <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden">
          <img src={handImage} alt="Tu mano" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/30 backdrop-blur-[2px]" />
        </div>
      )}

      <div className="space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-bounce-soft" />
        </div>
        <p className="font-display text-lg font-bold text-gray-900">Aplicando el diseÃ±o...</p>
        <p className="text-sm text-gray-400">{progressLabel}</p>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2DC7B3 0%, #0D5C63 100%)' }}
          />
        </div>
        <p className="text-xs text-gray-300">{Math.round(progress)}%</p>
      </div>
    </div>
  );

  // â”€â”€ STEP: result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'result' && resultImage) return (
    <div className="p-5 space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold text-center">
        {isFallback ? 'âœ¨ Vista previa del diseÃ±o' : 'ðŸŽ‰ Â¡Tu prueba virtual!'}
      </h3>

      {isFallback && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Modo demo. Configura REPLICATE_API_TOKEN para ver el resultado real en tu mano.
        </div>
      )}

      {handImage && !isFallback ? (
        <div
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-col-resize select-none touch-none"
          onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setSliderPos(Math.max(5, Math.min(95, ((e.clientX - r.left) / r.width) * 100))); }}
          onTouchMove={e => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setSliderPos(Math.max(5, Math.min(95, ((e.touches[0].clientX - r.left) / r.width) * 100))); }}
        >
          <img src={resultImage} alt="Con diseÃ±o" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
            <img src={handImage} alt="Sin diseÃ±o" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none" style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
              <ChevronLeft className="w-3 h-3 text-gray-600" /><ChevronRight className="w-3 h-3 text-gray-600" />
            </div>
          </div>
          <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">Antes</span>
          <span className="absolute top-2 right-2 bg-primary/80 text-white text-xs px-2 py-0.5 rounded-full">DespuÃ©s âœ¨</span>
          <p className="absolute bottom-2 inset-x-0 text-center text-white/70 text-[10px]">â† Desliza para comparar â†’</p>
        </div>
      ) : (
        <img src={resultImage} alt="DiseÃ±o" className="w-full rounded-2xl object-cover max-h-72"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/600/600`; }} />
      )}

      <div className="flex gap-2">
        <button onClick={restart} className="btn-ghost flex-1 justify-center">
          <Camera className="w-4 h-4" /> Volver a intentar
        </button>
        <button onClick={onClose} className="btn-primary flex-1 justify-center">Reservar cita</button>
      </div>
    </div>
  );

  return null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Upload Design Modal
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UploadDesignModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '', category: 'TRENDS_2026' as NailDesignCategory,
    price: '', duration: '', description: '', tags: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => nailApi.upload(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nail-designs'] });
      toast('DiseÃ±o subido exitosamente âœ¨', 'success');
      onClose();
    },
    onError: () => toast('Error al subir el diseÃ±o', 'error'),
  });

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast('Selecciona una imagen', 'error'); return; }
    const fd = new FormData();
    fd.append('image', file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    uploadMutation.mutate(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden',
          dragOver ? 'border-primary bg-primary-50 scale-[1.01]' : 'border-gray-200 hover:border-primary hover:bg-gray-50',
          preview ? 'h-48' : 'h-36',
        )}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <ImagePlus className="w-10 h-10" />
            <p className="text-sm font-medium">Arrastra tu foto aquÃ­ o haz clic</p>
            <p className="text-xs text-gray-300">JPG, PNG, WEBP â€” mÃ¡x 15 MB</p>
          </div>
        )}
        {preview && (
          <button type="button" onClick={e => { e.stopPropagation(); setPreview(null); setFile(null); }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f); }} />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Nombre del diseÃ±o *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ej: Rosas 3D Rojas" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">CategorÃ­a *</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)} required>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Precio COP *</label>
          <input className="input" type="number" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="80000" min="0" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">DuraciÃ³n (min) *</label>
          <input className="input" type="number" value={form.duration} onChange={e => set('duration', e.target.value)} required placeholder="90" min="5" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Tags</label>
          <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="flores, rojo, 3d (coma separado)" />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">DescripciÃ³n</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe el diseÃ±o brevemente" />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" disabled={uploadMutation.isPending} className="btn-primary flex-1 justify-center">
          {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</> : <><Upload className="w-4 h-4" /> Publicar diseÃ±o</>}
        </button>
      </div>
    </form>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Design Card
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DesignCard({
  design, onTryOn, onCompare, isCompared, onFavorite, isFavorited, onDelete, isOwner, compact,
}: {
  design: NailDesign; onTryOn: () => void; onCompare: () => void; isCompared: boolean;
  onFavorite: () => void; isFavorited: boolean; onDelete?: () => void; isOwner?: boolean; compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary-200 hover:shadow-beauty transition-all"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div className={cn('relative overflow-hidden', compact ? 'aspect-[3/4]' : 'aspect-square')}>
        <img src={design.imageUrl} alt={design.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${design.id}/400/400`; }}
        />
        {/* Overlay */}
        <div className={cn('absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300', hovered ? 'opacity-100' : 'opacity-0')} />
        <div className={cn('absolute inset-0 flex flex-col justify-end p-3 transition-all duration-300', hovered ? 'opacity-100' : 'opacity-0 translate-y-2')}>
          <button onClick={e => { e.stopPropagation(); onTryOn(); }}
            className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary-700 transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> Probar en mis manos
          </button>
        </div>

        {/* Top actions */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div className="flex gap-1">
            {design.saveCount > 80 && (
              <span className="bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                <Star className="w-2.5 h-2.5" fill="white" /> Top
              </span>
            )}
            {isOwner && (
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">MÃ­o</span>
            )}
          </div>
          <div className="flex gap-1.5">
            <button onClick={e => { e.stopPropagation(); onFavorite(); }}
              className={cn('w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all',
                isFavorited ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:text-red-500')}>
              <Heart className="w-3.5 h-3.5" fill={isFavorited ? 'white' : 'none'} />
            </button>
            <button onClick={e => { e.stopPropagation(); onCompare(); }}
              className={cn('w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all',
                isCompared ? 'bg-primary text-white' : 'bg-white/90 text-gray-500 hover:text-primary')}>
              <Scale className="w-3.5 h-3.5" />
            </button>
            {onDelete && (
              <button onClick={e => { e.stopPropagation(); onDelete(); }}
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-md bg-white/90 text-gray-500 hover:text-red-500 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-2.5">
        <p className="font-semibold text-xs text-gray-900 truncate">{design.name}</p>
        <p className="text-[10px] text-gray-400">{CATEGORY_EMOJI[design.category]} {CATEGORY_LABELS[design.category]}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-primary font-bold">{formatCOP(design.price)}</span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Heart className="w-2.5 h-2.5 fill-red-300 text-red-300" />{design.saveCount}</span>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Compare bar
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CompareBar({ designs, onRemove, onClear }: { designs: NailDesign[]; onRemove: (id: string) => void; onClear: () => void }) {
  if (designs.length < 2) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-slide-up w-[95vw] max-w-xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-900">Comparando ({designs.length}/3)</p>
        <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600">Limpiar</button>
      </div>
      <div className="flex gap-2">
        {designs.map(d => (
          <div key={d.id} className="flex-1 relative">
            <img src={d.imageUrl} alt={d.name} className="w-full aspect-square rounded-xl object-cover"
              onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${d.id}/200/200`; }} />
            <button onClick={() => onRemove(d.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow">
              <X className="w-3 h-3" />
            </button>
            <p className="text-[10px] text-center mt-1 truncate font-medium">{d.name}</p>
            <p className="text-[10px] text-primary font-bold text-center">{formatCOP(d.price)}</p>
          </div>
        ))}
        {designs.length < 3 && (
          <div className="flex-1 aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs text-center">
            + agregar
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Category sidebar / pills
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CategorySidebar({
  active, counts, onSelect,
}: { active: NailDesignCategory | 'ALL'; counts: Record<string, number>; onSelect: (c: NailDesignCategory | 'ALL') => void }) {
  return (
    <div className="hidden lg:flex flex-col gap-1 w-44 shrink-0">
      <button onClick={() => onSelect('ALL')}
        className={cn('flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all',
          active === 'ALL' ? 'bg-primary text-white shadow-beauty' : 'text-gray-600 hover:bg-gray-100')}>
        <span>Todos</span>
        <span className={cn('text-xs rounded-full px-1.5 py-0.5', active === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>
          {Object.values(counts).reduce((a,b) => a+b, 0)}
        </span>
      </button>
      {ALL_CATEGORIES.map(c => (
        <button key={c} onClick={() => onSelect(c)}
          className={cn('flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all',
            active === c ? 'bg-primary text-white shadow-beauty font-medium' : 'text-gray-600 hover:bg-gray-100')}>
          <span className="flex items-center gap-1.5 truncate">
            <span>{CATEGORY_EMOJI[c]}</span>
            <span className="truncate">{CATEGORY_LABELS[c]}</span>
          </span>
          {counts[c] ? (
            <span className={cn('text-xs rounded-full px-1.5 py-0.5 shrink-0', active === c ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>
              {counts[c]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main NailAI Page
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function NailAI() {
  const [tab, setTab] = useState<'explore' | 'mine' | 'trending'>('explore');
  const [activeCategory, setActiveCategory] = useState<NailDesignCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [tryOnDesign, setTryOnDesign] = useState<NailDesign | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<NailDesign[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [gridSize, setGridSize] = useState<'sm' | 'lg'>('sm');
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const queryParams = {
    category: activeCategory !== 'ALL' ? activeCategory : undefined,
    search: search || undefined,
    mine: tab === 'mine' ? 'true' : undefined,
  };

  const { data: designs = [], isLoading } = useQuery<NailDesign[]>({
    queryKey: ['nail-designs', tab, activeCategory, search],
    queryFn: () => nailApi.list(queryParams).then(r => r.data),
  });

  const { data: trendingData = [] } = useQuery<NailDesign[]>({
    queryKey: ['nail-trending'],
    queryFn: () => nailApi.trending().then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['nail-stats'],
    queryFn: () => nailApi.stats().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => nailApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nail-designs'] }); toast('DiseÃ±o eliminado', 'success'); },
  });

  // Conteos por categorÃ­a
  const counts = (designs as NailDesign[]).reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast('Eliminado de favoritos', 'info'); }
      else { next.add(id); toast('â¤ï¸ Guardado en favoritos', 'success'); }
      return next;
    });
  };

  const toggleCompare = (design: NailDesign) => {
    setCompareList(prev => {
      if (prev.find(d => d.id === design.id)) return prev.filter(d => d.id !== design.id);
      if (prev.length >= 3) { toast('MÃ¡ximo 3 diseÃ±os para comparar', 'info'); return prev; }
      return [...prev, design];
    });
  };

  const gridCols = gridSize === 'sm'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="min-h-full animate-fade-in">
      {/* â”€â”€ Hero â”€â”€ */}
      <div className="bg-[#083D42] px-4 sm:px-6 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize:'40px 40px' }} />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white/80 text-sm font-medium">IA Â· Prueba Virtual</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-white">NailAI Studio</h2>
            <p className="text-white/80 text-sm mt-1">{stats?.total ?? '130+'} diseÃ±os en {Object.keys(CATEGORY_LABELS).filter(k => !['HAIR','NAILS','FACE','BARBERSHOP','SPA','OTHER'].includes(k)).length} categorÃ­as</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-white text-primary font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary-50 transition-colors shadow-beauty">
              <Plus className="w-4 h-4" /> Subir diseÃ±o
            </button>
            <a href="/try-on" target="_blank"
              className="flex items-center gap-2 bg-white/15 text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-white/25 transition-colors text-center justify-center">
              <ExternalLink className="w-4 h-4" /> Portal cliente
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex gap-3 mt-5 flex-wrap">
          {[
            { label: 'DiseÃ±os', value: stats?.total ?? '130+' },
            { label: 'Propios', value: stats?.mine ?? 0 },
            { label: 'Total guardados', value: stats?.totalSaves ?? 0 },
            { label: 'CategorÃ­as', value: 20 },
          ].map(s => (
            <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <p className="text-white font-bold text-lg leading-none">{s.value}</p>
              <p className="text-white/70 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Tabs â”€â”€ */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6">
        <div className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {[
            { id: 'explore', label: 'ðŸ” Explorar', count: null },
            { id: 'mine', label: 'ðŸ’… Mis diseÃ±os', count: stats?.mine },
            { id: 'trending', label: 'ðŸ”¥ Tendencias', count: null },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as typeof tab); setActiveCategory('ALL'); setSearch(''); }}
              className={cn('flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {t.label}
              {t.count != null && <span className="bg-primary-100 text-primary text-xs rounded-full px-1.5 py-0.5">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-0">
        {/* â”€â”€ Sidebar (desktop) â”€â”€ */}
        {tab !== 'trending' && (
          <div className="p-4 sm:p-6 pr-0 shrink-0">
            <CategorySidebar active={activeCategory} counts={counts} onSelect={setActiveCategory} />
          </div>
        )}

        {/* â”€â”€ Main content â”€â”€ */}
        <div className="flex-1 p-4 sm:p-6 min-w-0 space-y-4">
          {tab !== 'trending' && (
            <>
              {/* Search + controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input pl-9 py-2" placeholder="Buscar diseÃ±os, estilos, tags..." value={search} onChange={e => setSearch(e.target.value)} />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setGridSize('sm')} className={cn('p-2 rounded-lg transition-colors', gridSize === 'sm' ? 'bg-primary-100 text-primary' : 'text-gray-400 hover:text-gray-600')}><Grid3x3 className="w-4 h-4" /></button>
                  <button onClick={() => setGridSize('lg')} className={cn('p-2 rounded-lg transition-colors', gridSize === 'lg' ? 'bg-primary-100 text-primary' : 'text-gray-400 hover:text-gray-600')}><LayoutGrid className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Mobile category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
                <button onClick={() => setActiveCategory('ALL')}
                  className={cn('px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all',
                    activeCategory === 'ALL' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600')}>
                  Todos
                </button>
                {ALL_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)}
                    className={cn('px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all',
                      activeCategory === c ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600')}>
                    {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* â”€â”€ Tab: Tendencias â”€â”€ */}
          {tab === 'trending' && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-gray-900">Top 12 â€” MÃ¡s guardados</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {trendingData.map((d, i) => (
                  <div key={d.id} className="relative">
                    <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-beauty">
                      {i + 1}
                    </div>
                    <DesignCard
                      design={d} onTryOn={() => setTryOnDesign(d)}
                      onCompare={() => toggleCompare(d)} isCompared={compareList.some(x => x.id === d.id)}
                      onFavorite={() => toggleFavorite(d.id)} isFavorited={favorites.has(d.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* â”€â”€ Tab: Mis diseÃ±os â”€â”€ */}
          {tab === 'mine' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{designs.length} diseÃ±os propios subidos</p>
                <button onClick={() => setShowUpload(true)} className="btn-primary">
                  <Plus className="w-4 h-4" /> Subir nuevo
                </button>
              </div>
              {designs.length === 0 && !isLoading && (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                  <ImagePlus className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 font-medium">AÃºn no has subido diseÃ±os propios</p>
                  <p className="text-sm text-gray-300 mt-1">Sube tus mejores diseÃ±os para que las clientas los prueben</p>
                  <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 mx-auto">
                    <Upload className="w-4 h-4" /> Subir primer diseÃ±o
                  </button>
                </div>
              )}
            </div>
          )}

          {/* â”€â”€ Grid â”€â”€ */}
          {tab !== 'trending' && (
            isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : designs.length === 0 && tab !== 'mine' ? (
              <div className="text-center py-16">
                <Sparkles className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">Sin diseÃ±os para esta bÃºsqueda</p>
              </div>
            ) : (
              <div className={cn('grid gap-3', gridCols)}>
                {designs.map(d => (
                  <DesignCard
                    key={d.id} design={d}
                    onTryOn={() => setTryOnDesign(d)}
                    onCompare={() => toggleCompare(d)}
                    isCompared={compareList.some(x => x.id === d.id)}
                    onFavorite={() => toggleFavorite(d.id)}
                    isFavorited={favorites.has(d.id)}
                    isOwner={d.saveCount >= 0}
                    onDelete={tab === 'mine' ? () => { if(confirm('Â¿Eliminar este diseÃ±o?')) deleteMutation.mutate(d.id); } : undefined}
                    compact={gridSize === 'sm'}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Compare bar */}
      <CompareBar designs={compareList} onRemove={id => setCompareList(p => p.filter(d => d.id !== id))} onClear={() => setCompareList([])} />

      {/* Try-On Modal */}
      <Modal open={!!tryOnDesign} onClose={() => setTryOnDesign(null)} title="âœ¨ Prueba Virtual" size="lg">
        {tryOnDesign && <TryOnFlow design={tryOnDesign} onClose={() => setTryOnDesign(null)} />}
      </Modal>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Subir diseÃ±o propio" size="lg">
        <UploadDesignModal onClose={() => setShowUpload(false)} />
      </Modal>
    </div>
  );
}

