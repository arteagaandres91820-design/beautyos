import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NAIL_DESIGNS, type NailDesign, type NailPattern } from '../data/nailDesigns';
import { fetchPublicNailDesigns } from '../lib/api';

// MediaPipe typings (loaded from CDN at runtime)
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

// Fingertip landmark indices in MediaPipe Hands
const FINGERTIP_IDS = [4, 8, 12, 16, 20];
// Knuckle just below each fingertip (for sizing nails)
const KNUCKLE_IDS  = [3, 7, 11, 15, 19];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  patternType: NailPattern,
  colors: string[],
  nailW: number,
  nailH: number
) {
  switch (patternType) {
    case 'chrome': {
      const g = ctx.createLinearGradient(-nailW / 2, nailH * 0.1, nailW / 2, nailH * 0.6);
      g.addColorStop(0,    'rgba(90,90,100,0.92)');
      g.addColorStop(0.25, 'rgba(190,190,200,0.92)');
      g.addColorStop(0.5,  'rgba(255,255,255,0.96)');
      g.addColorStop(0.75, 'rgba(170,170,185,0.92)');
      g.addColorStop(1,    'rgba(110,110,125,0.90)');
      ctx.fillStyle = g;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      // second diagonal band for mirror sparkle
      const g2 = ctx.createLinearGradient(nailW / 2, 0, -nailW / 2, nailH * 0.4);
      g2.addColorStop(0, 'rgba(255,255,255,0)');
      g2.addColorStop(0.4, 'rgba(255,255,255,0.18)');
      g2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      break;
    }
    case 'aurora': {
      const g = ctx.createLinearGradient(-nailW * 0.4, 0, nailW * 0.8, nailH);
      g.addColorStop(0,    'rgba(167,139,250,0.90)');
      g.addColorStop(0.18, 'rgba(96,165,250,0.88)');
      g.addColorStop(0.36, 'rgba(52,211,153,0.88)');
      g.addColorStop(0.54, 'rgba(251,191,36,0.82)');
      g.addColorStop(0.72, 'rgba(244,114,182,0.88)');
      g.addColorStop(0.9,  'rgba(167,139,250,0.90)');
      g.addColorStop(1,    'rgba(96,165,250,0.88)');
      ctx.fillStyle = g;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      break;
    }
    case 'glazed': {
      const g = ctx.createRadialGradient(0, nailH * 0.38, 0, 0, nailH * 0.38, nailW * 0.9);
      g.addColorStop(0,   'rgba(255,255,255,0.96)');
      g.addColorStop(0.3, 'rgba(255,230,235,0.80)');
      g.addColorStop(0.6, 'rgba(255,200,210,0.72)');
      g.addColorStop(1,   'rgba(220,160,170,0.65)');
      ctx.fillStyle = g;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      // pearl shimmer streak
      const streak = ctx.createLinearGradient(-nailW * 0.3, nailH * 0.2, nailW * 0.3, nailH * 0.5);
      streak.addColorStop(0, 'rgba(255,255,255,0)');
      streak.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      streak.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = streak;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      break;
    }
    case 'marble': {
      // white base
      ctx.fillStyle = 'rgba(248,248,248,0.97)';
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      // grey veins
      ctx.strokeStyle = 'rgba(170,170,170,0.48)';
      ctx.lineWidth = nailW * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-nailW * 0.28, 0);
      ctx.bezierCurveTo(nailW * 0.08, nailH * 0.22, -nailW * 0.12, nailH * 0.52, nailW * 0.22, nailH);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(140,140,140,0.30)';
      ctx.lineWidth = nailW * 0.022;
      ctx.beginPath();
      ctx.moveTo(nailW * 0.12, 0);
      ctx.bezierCurveTo(-nailW * 0.18, nailH * 0.33, nailW * 0.28, nailH * 0.62, nailW * 0.06, nailH);
      ctx.stroke();
      // gold vein
      ctx.strokeStyle = 'rgba(200,168,95,0.38)';
      ctx.lineWidth = nailW * 0.016;
      ctx.beginPath();
      ctx.moveTo(-nailW * 0.08, nailH * 0.18);
      ctx.bezierCurveTo(nailW * 0.18, nailH * 0.38, -nailW * 0.04, nailH * 0.68, nailW * 0.14, nailH * 0.92);
      ctx.stroke();
      break;
    }
    case 'holographic': {
      const g = ctx.createLinearGradient(-nailW / 2, 0, nailW / 2, nailH * 0.35);
      g.addColorStop(0,    'rgba(255,90,90,0.88)');
      g.addColorStop(0.14, 'rgba(255,175,45,0.88)');
      g.addColorStop(0.28, 'rgba(255,255,70,0.86)');
      g.addColorStop(0.42, 'rgba(80,255,100,0.86)');
      g.addColorStop(0.57, 'rgba(70,145,255,0.88)');
      g.addColorStop(0.71, 'rgba(145,75,255,0.88)');
      g.addColorStop(0.85, 'rgba(255,95,195,0.88)');
      g.addColorStop(1,    'rgba(255,90,90,0.88)');
      ctx.fillStyle = g;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      // repeat band shifted
      const g2 = ctx.createLinearGradient(nailW / 2, nailH * 0.35, -nailW / 2, nailH);
      g2.addColorStop(0,    'rgba(255,90,90,0.55)');
      g2.addColorStop(0.25, 'rgba(80,255,100,0.55)');
      g2.addColorStop(0.5,  'rgba(70,145,255,0.55)');
      g2.addColorStop(0.75, 'rgba(255,95,195,0.55)');
      g2.addColorStop(1,    'rgba(255,90,90,0.55)');
      ctx.fillStyle = g2;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      break;
    }
    case 'aura': {
      const c0 = colors[0] || '#FBCFE8';
      const c1 = colors[1] || '#A78BFA';
      const g = ctx.createRadialGradient(0, nailH * 0.5, nailW * 0.04, 0, nailH * 0.5, nailW * 0.75);
      g.addColorStop(0,   'rgba(255,255,255,0.92)');
      g.addColorStop(0.25, c0 + '60');
      g.addColorStop(0.55, c1 + '90');
      g.addColorStop(0.8,  c0 + 'B8');
      g.addColorStop(1,    c1 + 'D0');
      ctx.fillStyle = g;
      ctx.fillRect(-nailW / 2, 0, nailW, nailH);
      break;
    }
    case 'glitter': {
      // deterministic sparkle dots using golden ratio sequence
      for (let s = 0; s < 28; s++) {
        const sx = (-nailW / 2) + nailW * ((s * 0.618034) % 1);
        const sy = nailH * ((s * 0.381966) % 1);
        const sr = nailW * (0.014 + 0.026 * ((s * 0.7265) % 1));
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,0,${0.38 + 0.50 * ((s * 0.5) % 1)})`;
        ctx.fill();
        if (s % 4 === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.72)';
          ctx.lineWidth = sr * 0.5;
          ctx.beginPath();
          ctx.moveTo(sx - sr * 1.6, sy); ctx.lineTo(sx + sr * 1.6, sy);
          ctx.moveTo(sx, sy - sr * 1.6); ctx.lineTo(sx, sy + sr * 1.6);
          ctx.stroke();
        }
      }
      break;
    }
    case 'floral': {
      const flowers = [
        { x: 0,          y: nailH * 0.28, r: nailW * 0.12 },
        { x: nailW * 0.17,  y: nailH * 0.65, r: nailW * 0.09 },
        { x: -nailW * 0.15, y: nailH * 0.70, r: nailW * 0.07 },
      ];
      for (const fl of flowers) {
        for (let p = 0; p < 5; p++) {
          const pa = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            fl.x + Math.cos(pa) * fl.r,
            fl.y + Math.sin(pa) * fl.r,
            fl.r, fl.r * 0.55, pa, 0, Math.PI * 2
          );
          ctx.fillStyle = 'rgba(255,255,255,0.84)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, fl.r * 0.30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,218,95,0.94)';
        ctx.fill();
      }
      break;
    }
  }
}

function drawNailOnCanvas(
  ctx: CanvasRenderingContext2D,
  tip: { x: number; y: number },
  knuckle: { x: number; y: number },
  design: NailDesign,
  cw: number,
  ch: number,
  imageEl?: HTMLImageElement | null
) {
  const tx = tip.x * cw;
  const ty = tip.y * ch;
  const kx = knuckle.x * cw;
  const ky = knuckle.y * ch;

  const dx = tx - kx;
  const dy = ty - ky;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;

  const nailH = len * 1.1;
  const nailW = nailH * 0.65;
  const angle = Math.atan2(dy, dx) - Math.PI / 2;

  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(angle);

  const r = nailW * 0.45;
  const rr = r * 0.6;

  // Nail shape path (rounded rectangle)
  ctx.beginPath();
  ctx.moveTo(-nailW / 2 + r, 0);
  ctx.arcTo(nailW / 2, 0, nailW / 2, nailH, r);
  ctx.arcTo(nailW / 2, nailH, -nailW / 2, nailH, rr);
  ctx.arcTo(-nailW / 2, nailH, -nailW / 2, 0, rr);
  ctx.arcTo(-nailW / 2, 0, nailW / 2, 0, r);
  ctx.closePath();

  // Fill: real photo image OR gradient/solid color
  if (imageEl && imageEl.complete && imageEl.naturalWidth > 0) {
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.92;
    // Cover-fit: scale image to fill nail, center it
    const imgAspect = imageEl.naturalWidth / imageEl.naturalHeight;
    const nailAspect = nailW / nailH;
    let sx = 0, sy = 0, sw = imageEl.naturalWidth, sh = imageEl.naturalHeight;
    if (imgAspect > nailAspect) {
      sw = imageEl.naturalHeight * nailAspect;
      sx = (imageEl.naturalWidth - sw) / 2;
    } else {
      sh = imageEl.naturalWidth / nailAspect;
      sy = (imageEl.naturalHeight - sh) / 2;
    }
    ctx.drawImage(imageEl, sx, sy, sw, sh, -nailW / 2, 0, nailW, nailH);
    ctx.globalAlpha = 1;
    ctx.restore();
  } else if (design.gradient && design.colors.length >= 2) {
    const grd = ctx.createLinearGradient(0, 0, 0, nailH);
    grd.addColorStop(0, design.colors[0] + 'E0');
    grd.addColorStop(1, design.colors[1] + 'E0');
    ctx.fillStyle = grd;
    ctx.fill();
  } else {
    ctx.fillStyle = design.colors[0] + 'E0';
    ctx.fill();
  }

  // Pattern overlay (clipped to nail shape, drawn on top of base fill)
  if (!imageEl && design.patternType) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-nailW / 2 + r, 0);
    ctx.arcTo(nailW / 2, 0, nailW / 2, nailH, r);
    ctx.arcTo(nailW / 2, nailH, -nailW / 2, nailH, rr);
    ctx.arcTo(-nailW / 2, nailH, -nailW / 2, 0, rr);
    ctx.arcTo(-nailW / 2, 0, nailW / 2, 0, r);
    ctx.closePath();
    ctx.clip();
    drawPattern(ctx, design.patternType, design.colors, nailW, nailH);
    ctx.restore();
  }

  // French tip stripe (only for color mode, not images)
  if (!imageEl && design.tipColor) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = design.tipColor + 'CC';
    ctx.fillRect(-nailW / 2, 0, nailW, nailH * 0.25);
    ctx.restore();

    // Recreate path for stroke
    ctx.beginPath();
    ctx.moveTo(-nailW / 2 + r, 0);
    ctx.arcTo(nailW / 2, 0, nailW / 2, nailH, r);
    ctx.arcTo(nailW / 2, nailH, -nailW / 2, nailH, rr);
    ctx.arcTo(-nailW / 2, nailH, -nailW / 2, 0, rr);
    ctx.arcTo(-nailW / 2, 0, nailW / 2, 0, r);
    ctx.closePath();
  }

  // Gloss highlight
  ctx.save();
  ctx.clip();
  const gloss = ctx.createRadialGradient(
    -nailW * 0.1, nailH * 0.15, 0,
    -nailW * 0.1, nailH * 0.15, nailW * 0.4
  );
  gloss.addColorStop(0, 'rgba(255,255,255,0.45)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(-nailW / 2, 0, nailW, nailH);
  ctx.restore();

  // Subtle border
  ctx.beginPath();
  ctx.moveTo(-nailW / 2 + r, 0);
  ctx.arcTo(nailW / 2, 0, nailW / 2, nailH, r);
  ctx.arcTo(nailW / 2, nailH, -nailW / 2, nailH, rr);
  ctx.arcTo(-nailW / 2, nailH, -nailW / 2, 0, rr);
  ctx.arcTo(-nailW / 2, 0, nailW / 2, 0, r);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();
}

const HF_TOKEN: string | undefined = import.meta.env.VITE_HF_TOKEN;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

async function callHFSegment(blob: Blob, attempt = 0): Promise<Array<{ label: string; mask: string; score: number }>> {
  const r = await fetch('https://api-inference.huggingface.co/models/nngeek195/nail-segmentation-v1', {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/octet-stream' },
    body: blob,
  });
  if (r.status === 503 && attempt === 0) {
    const body = await r.json().catch(() => ({}));
    await new Promise(w => setTimeout(w, Math.min((body.estimated_time ?? 25) * 1000, 40_000)));
    return callHFSegment(blob, 1);
  }
  if (!r.ok) throw new Error(`HF ${r.status}`);
  return r.json();
}

function greyMaskToAlpha(maskImg: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const mc = document.createElement('canvas');
  mc.width = w; mc.height = h;
  const mctx = mc.getContext('2d')!;
  mctx.drawImage(maskImg, 0, 0, w, h);
  const px = mctx.getImageData(0, 0, w, h);
  let whitePixels = 0;
  for (let i = 0; i < px.data.length; i += 4) {
    const lum = px.data[i] * 0.299 + px.data[i + 1] * 0.587 + px.data[i + 2] * 0.114;
    if (lum > 128) whitePixels++;
    px.data[i] = px.data[i + 1] = px.data[i + 2] = 255;
    px.data[i + 3] = lum;
  }
  mctx.putImageData(px, 0, 0);
  (mc as any)._coverage = whitePixels / (w * h);
  return mc;
}

async function buildSegmentedResult(
  cleanPhotoDataUrl: string,
  masks: Array<{ label: string; mask: string; score: number }>,
  design: NailDesign,
  designImg: HTMLImageElement | null
): Promise<string> {
  const photo = await loadImg(cleanPhotoDataUrl);
  const out = document.createElement('canvas');
  out.width = photo.naturalWidth;
  out.height = photo.naturalHeight;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(photo, 0, 0);

  // Aceptar cualquier label (el modelo tiene: nail / background)
  const nailMasks = masks.filter(m =>
    !m.label.toLowerCase().includes('background') && m.score > 0.3
  );
  if (nailMasks.length === 0) return cleanPhotoDataUrl;

  for (const md of nailMasks) {
    const maskImg = await loadImg(`data:image/png;base64,${md.mask}`);
    const alphaMask = greyMaskToAlpha(maskImg, out.width, out.height);

    // Descartar máscara si cubre más del 40 % de la imagen (segmentación errónea)
    if ((alphaMask as any)._coverage > 0.40) continue;

    const dl = document.createElement('canvas');
    dl.width = out.width; dl.height = out.height;
    const dc = dl.getContext('2d')!;

    if (designImg) {
      dc.drawImage(designImg, 0, 0, dl.width, dl.height);
    } else if (design.gradient && design.colors.length >= 2) {
      const g = dc.createLinearGradient(0, 0, 0, dl.height);
      g.addColorStop(0, design.colors[0]); g.addColorStop(1, design.colors[1]);
      dc.fillStyle = g; dc.fillRect(0, 0, dl.width, dl.height);
    } else {
      dc.fillStyle = design.colors[0]; dc.fillRect(0, 0, dl.width, dl.height);
    }

    const gloss = dc.createRadialGradient(dl.width * 0.3, dl.height * 0.18, 0, dl.width * 0.3, dl.height * 0.18, dl.width * 0.6);
    gloss.addColorStop(0, 'rgba(255,255,255,0.38)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
    dc.fillStyle = gloss; dc.fillRect(0, 0, dl.width, dl.height);

    dc.globalCompositeOperation = 'destination-in';
    dc.drawImage(alphaMask, 0, 0);

    ctx.globalAlpha = 0.88; ctx.drawImage(dl, 0, 0); ctx.globalAlpha = 1;
  }
  return out.toDataURL('image/png');
}

export function NailTryOn() {
  const navigate = useNavigate();
  const { designId } = useParams<{ designId: string }>();
  const { state } = useLocation() as { state: { design?: NailDesign; allDesigns?: NailDesign[] } | null };

  // Design lookup: location state → mock data → first mock
  const initialDesign = state?.design
    ?? NAIL_DESIGNS.find(d => d.id === designId)
    ?? NAIL_DESIGNS[0];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animRef = useRef<number>(0);
  const designImageRef = useRef<HTMLImageElement | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'nocamera'>('loading');
  const [captured, setCaptured] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [segmentError, setSegmentError] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<NailDesign>(initialDesign);
  const [pickerDesigns, setPickerDesigns] = useState<NailDesign[]>(
    state?.allDesigns ?? NAIL_DESIGNS.filter(d => d.popular || d.isNew).slice(0, 6)
  );

  // Fetch picker designs from API if not provided in state
  useEffect(() => {
    if (state?.allDesigns && state.allDesigns.length > 0) return;
    fetchPublicNailDesigns({ limit: 10 })
      .then(d => { if (d.length > 0) setPickerDesigns(d.slice(0, 8)); })
      .catch(() => {});
  }, []);

  // Pre-load design image when it changes
  useEffect(() => {
    if (!selectedDesign.imageUrl) {
      designImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { designImageRef.current = img; };
    img.onerror = () => { designImageRef.current = null; };
    img.src = selectedDesign.imageUrl;
  }, [selectedDesign.imageUrl]);

  // Keep canvas buffer dimensions in sync with the container element
  useEffect(() => {
    const syncSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const { width, height } = container.getBoundingClientRect();
      if (canvas.width !== Math.round(width) || canvas.height !== Math.round(height)) {
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
      }
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cw, ch);

    // Mirror-flip the camera feed (selfie mode)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -cw, 0, cw, ch);
    ctx.restore();

    const detected = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    setHandDetected(detected);

    if (detected) {
      for (const landmarks of results.multiHandLandmarks) {
        for (let f = 0; f < 5; f++) {
          const tip = landmarks[FINGERTIP_IDS[f]];
          const knuckle = landmarks[KNUCKLE_IDS[f]];
          if (tip && knuckle) {
            // Mirror x since we flipped the canvas
            const mirroredTip    = { x: 1 - tip.x,    y: tip.y };
            const mirroredKnuckle = { x: 1 - knuckle.x, y: knuckle.y };
            drawNailOnCanvas(ctx, mirroredTip, mirroredKnuckle, selectedDesign, cw, ch, designImageRef.current);
          }
        }
      }
    }
  }, [selectedDesign]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Check camera permission first
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });

        setStatus('loading');

        // Load MediaPipe from CDN
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

        if (cancelled) return;

        const hands = new window.Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(handleResults);
        handsRef.current = hands;

        if (videoRef.current && window.Camera) {
          const cam = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) await hands.send({ image: videoRef.current });
            },
            width: 1280,
            height: 720,
            facingMode: 'environment',
          });
          await cam.start();
          cameraRef.current = cam;
        }

        if (!cancelled) setStatus('ready');
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
          setStatus('nocamera');
        } else {
          setStatus('error');
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (cameraRef.current) {
        try { cameraRef.current.stop(); } catch {}
      }
      if (handsRef.current) {
        try { handsRef.current.close(); } catch {}
      }
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Re-register results handler when design changes (handleResults has selectedDesign in closure)
  useEffect(() => {
    if (handsRef.current) {
      handsRef.current.onResults(handleResults);
    }
  }, [handleResults]);

  const capturePhoto = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    // Foto con overlay (fallback visual si HF falla)
    const overlayDataUrl = canvas.toDataURL('image/png');

    if (!HF_TOKEN || !video) { setCaptured(overlayDataUrl); return; }

    setProcessing(true);
    setSegmentError(false);
    try {
      // Frame limpio del video (sin overlay de MediaPipe) → mejor segmentación
      const clean = document.createElement('canvas');
      clean.width = canvas.width; clean.height = canvas.height;
      const cc = clean.getContext('2d')!;
      cc.save(); cc.scale(-1, 1); // espejo igual que el canvas principal
      cc.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      cc.restore();
      const cleanDataUrl = clean.toDataURL('image/jpeg', 0.88);

      const blob = await (await fetch(cleanDataUrl)).blob();
      const masks = await callHFSegment(blob);
      const result = await buildSegmentedResult(cleanDataUrl, masks, selectedDesign, designImageRef.current);
      setCaptured(result);
    } catch {
      setSegmentError(true);
      setCaptured(overlayDataUrl);
    } finally {
      setProcessing(false);
    }
  };

  const sharePhoto = async () => {
    if (!captured) return;
    try {
      const res = await fetch(captured);
      const blob = await res.blob();
      const file = new File([blob], 'nail-look.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `NailAI — ${selectedDesign.name}` });
      } else {
        const a = document.createElement('a');
        a.href = captured;
        a.download = 'nail-look.png';
        a.click();
      }
    } catch {}
  };

  return (
    <div className="phone-shell bg-black flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Camera viewport */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
            <p className="text-white font-semibold text-sm">Activando NailAI...</p>
            <p className="text-white/50 text-xs mt-1">Cargando detección de manos</p>
          </div>
        )}

        {/* Error overlays */}
        {status === 'nocamera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1B2A] z-10 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" /><path d="M2 2l20 20" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Cámara no disponible</p>
            <p className="text-white/50 text-sm leading-relaxed mb-6">Permite el acceso a la cámara en los ajustes de tu navegador para usar NailAI AR.</p>
            <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white text-primary rounded-2xl font-semibold text-sm">
              Volver
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1B2A] z-10 px-8 text-center">
            <p className="text-white font-semibold mb-2">No se pudo cargar NailAI</p>
            <p className="text-white/50 text-sm mb-6">Revisa tu conexión e inténtalo nuevamente.</p>
            <div className="flex gap-3">
              <button onClick={() => window.location.reload()} className="px-5 py-3 bg-primary text-white rounded-2xl font-semibold text-sm">
                Reintentar
              </button>
              <button onClick={() => navigate(-1)} className="px-5 py-3 bg-white/10 text-white rounded-2xl font-semibold text-sm">
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Hand detection hint */}
        {status === 'ready' && !handDetected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2.5 rounded-full z-10">
            <p className="text-white text-xs font-medium text-center">Muestra tu mano a la cámara ✋</p>
          </div>
        )}

        {/* Hand detected badge */}
        {status === 'ready' && handDetected && (
          <div className="absolute top-safe-top top-4 left-1/2 -translate-x-1/2 bg-primary/80 backdrop-blur-sm px-4 py-1.5 rounded-full z-10">
            <p className="text-white text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Mano detectada
            </p>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-12 pb-4"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" />
            </svg>
          </button>

          <div className="text-center">
            <p className="text-white font-semibold text-sm">{selectedDesign.name}</p>
            <p className="text-white/60 text-[10px]">{selectedDesign.category}</p>
          </div>

          <button
            onClick={() => navigate(`/book?design=${selectedDesign.id}`)}
            className="px-3 py-1.5 bg-white text-primary text-xs font-bold rounded-full active:scale-95 transition-transform"
          >
            Reservar
          </button>
        </div>

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
            <div className="w-14 h-14 rounded-full border-2 border-white/20 border-t-pink-400 animate-spin mb-5" />
            <p className="text-white font-semibold text-sm">Analizando tus uñas...</p>
            <p className="text-white/50 text-xs mt-1">IA detectando contorno exacto</p>
          </div>
        )}

        {/* Captured photo overlay */}
        {captured && (
          <div className="absolute inset-0 z-20 flex flex-col">
            <img src={captured} className="flex-1 object-cover" alt="captured" />
            {segmentError && (
              <div className="absolute top-14 left-4 right-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl px-3 py-2 text-yellow-300 text-xs text-center">
                Sin conexión a IA — mostrando vista previa estándar
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 gap-4">
              <div className="flex gap-3">
                <button
                  onClick={sharePhoto}
                  className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-semibold text-sm active:scale-95 transition-transform shadow-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" />
                  </svg>
                  Compartir
                </button>
                <button
                  onClick={() => navigate(`/book?design=${selectedDesign.id}`)}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-primary rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#083D42" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                  </svg>
                  Reservar cita
                </button>
              </div>
              <button
                onClick={() => setCaptured(null)}
                className="text-white/70 text-sm font-medium active:opacity-60 transition-opacity"
              >
                Volver a la cámara
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!captured && (
        <div className="shrink-0 bg-[#0D1B2A] px-4 pt-4 pb-8">
          {/* Design picker */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-3 mb-4">
            {pickerDesigns.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDesign(d)}
                className="shrink-0 flex flex-col items-center gap-1 active:scale-90 transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-2xl overflow-hidden transition-all ${
                    selectedDesign.id === d.id
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0D1B2A]'
                      : 'opacity-60'
                  }`}
                  style={!d.imageUrl ? {
                    background: d.gradient
                      ? `linear-gradient(160deg, ${d.colors[0]}, ${d.colors[1]})`
                      : d.colors[0]
                  } : undefined}
                >
                  {d.imageUrl
                    ? <img src={d.imageUrl} className="w-full h-full object-cover" alt={d.name} />
                    : d.tipColor && <div className="w-full h-3 rounded-t-2xl" style={{ background: d.tipColor, opacity: 0.9 }} />
                  }
                </div>
                <span className="text-[9px] text-white/60 w-12 text-center leading-tight truncate">{d.name}</span>
              </button>
            ))}
            <button
              onClick={() => navigate('/nail-ai')}
              className="shrink-0 flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-2xl border border-white/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[9px] text-white/60">Ver todos</span>
            </button>
          </div>

          {/* Capture button */}
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={status !== 'ready' || processing}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            >
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
