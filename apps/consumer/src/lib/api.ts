import type { NailDesign, NailCategory, NailShape } from '../data/nailDesigns';

export const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000';

export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

// API category → consumer category
const CAT_MAP: Record<string, NailCategory> = {
  FRENCH: 'French',
  GRADIENT: 'Ombré',
  TRENDS_2026: 'Tendencias',
  CHROME: 'Tendencias',
  GLITTER: 'Tendencias',
  GEOMETRIC: 'Tendencias',
  ARTISTIC: 'Tendencias',
  WEDDING: 'Temporada',
  VALENTINES: 'Temporada',
  BIRTHDAY: 'Temporada',
  CHRISTMAS: 'Temporada',
  HALLOWEEN: 'Temporada',
  SUMMER: 'Temporada',
  MINIMALIST: 'Colores',
  ELEGANT: 'Colores',
  CORPORATE: 'Colores',
  PASTEL: 'Colores',
  FLORAL: 'Colores',
  ACRYLIC: 'Colores',
  GEL: 'Colores',
};

function apiToDesign(d: any): NailDesign {
  return {
    id: d.id,
    name: d.name,
    category: CAT_MAP[d.category] ?? 'Colores',
    shape: 'oval' as NailShape,
    colors: ['#F5E6D8'],
    tags: Array.isArray(d.tags) ? d.tags : [],
    description: d.description ?? '',
    imageUrl: d.imageUrl ? resolveImageUrl(d.imageUrl) : undefined,
    popular: d.saveCount > 5,
    isNew: false,
    price: d.price,
    duration: d.duration,
  };
}

export async function fetchPublicNailDesigns(params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<NailDesign[]> {
  const url = new URL(`${API_BASE}/api/nail-designs/public`);
  if (params?.category) url.searchParams.set('category', params.category);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(apiToDesign);
}
