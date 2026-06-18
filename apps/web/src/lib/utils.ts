import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Hoy';
  if (isTomorrow(d)) return 'Mañana';
  return format(d, "d 'de' MMMM", { locale: es });
}

export function formatDateTime(dateStr: string) {
  return format(parseISO(dateStr), "d MMM, HH:mm", { locale: es });
}

export function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export const CATEGORY_LABELS: Record<string, string> = {
  // Servicios
  HAIR: 'Cabello', NAILS: 'Uñas', FACE: 'Rostro',
  BARBERSHOP: 'Barbería', SPA: 'Spa', OTHER: 'Otro',
  // Diseños — 20 categorías
  FRENCH: 'Francesas', ACRYLIC: 'Acrílicas', GEL: 'Gel',
  MINIMALIST: 'Minimalistas', ELEGANT: 'Elegantes',
  WEDDING: 'Bodas', CHRISTMAS: 'Navidad', HALLOWEEN: 'Halloween',
  CORPORATE: 'Corporativos', TRENDS_2026: 'Tendencias 2026',
  GRADIENT: 'Degradados', FLORAL: 'Florales',
  GEOMETRIC: 'Geométrico', GLITTER: 'Glitter', PASTEL: 'Pasteles',
  SUMMER: 'Verano', VALENTINES: 'San Valentín',
  BIRTHDAY: 'Cumpleaños', CHROME: 'Chrome', ARTISTIC: 'Arte',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  FRENCH: '🤍', ACRYLIC: '💅', GEL: '✨', MINIMALIST: '〰️',
  ELEGANT: '👑', WEDDING: '💍', CHRISTMAS: '🎄', HALLOWEEN: '🎃',
  CORPORATE: '💼', TRENDS_2026: '🔥', GRADIENT: '🌈', FLORAL: '🌸',
  GEOMETRIC: '🔷', GLITTER: '⭐', PASTEL: '🍬', SUMMER: '☀️',
  VALENTINES: '❤️', BIRTHDAY: '🎂', CHROME: '🪞', ARTISTIC: '🎨',
};

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada', CANCELLED: 'Cancelada', NO_SHOW: 'No asistió',
};

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo', CARD: 'Tarjeta', NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata', TRANSFER: 'Transferencia', GIFT_CARD: 'Gift Card',
};

export const LOYALTY_TIERS = [
  { label: 'Bronce',  minVisits: 0,  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',  dot: 'bg-orange-400' },
  { label: 'Plata',   minVisits: 5,  color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200',    dot: 'bg-slate-400' },
  { label: 'Oro',     minVisits: 10, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',    dot: 'bg-amber-400' },
  { label: 'Platino', minVisits: 20, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200',  dot: 'bg-violet-500' },
] as const;

export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export function getLoyaltyTier(visits: number): LoyaltyTier {
  return ([...LOYALTY_TIERS].reverse().find(t => visits >= t.minVisits) ?? LOYALTY_TIERS[0]) as LoyaltyTier;
}

export function getNextTier(visits: number): LoyaltyTier | undefined {
  return LOYALTY_TIERS.find(t => visits < t.minVisits) as LoyaltyTier | undefined;
}
