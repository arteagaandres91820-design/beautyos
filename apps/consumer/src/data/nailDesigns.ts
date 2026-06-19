export type NailShape = 'oval' | 'square' | 'almond' | 'stiletto' | 'coffin';
export type NailCategory = 'Todos' | 'French' | 'Colores' | 'Ombré' | 'Tendencias' | 'Temporada';
export type NailPattern = 'chrome' | 'aurora' | 'glazed' | 'marble' | 'holographic' | 'aura' | 'glitter' | 'floral';

export interface NailDesign {
  id: string;
  name: string;
  category: NailCategory;
  shape: NailShape;
  colors: string[];
  tipColor?: string;
  gradient?: boolean;
  patternType?: NailPattern;
  tags: string[];
  popular?: boolean;
  isNew?: boolean;
  description: string;
  imageUrl?: string;   // real photo uploaded by admin
  price?: number;
  duration?: number;
}

export const NAIL_DESIGNS: NailDesign[] = [
  {
    id: 'nd1', name: 'Aurora Boreal', category: 'Tendencias', shape: 'almond',
    colors: ['#A78BFA', '#34D399'], gradient: true, patternType: 'aurora',
    tags: ['aurora', 'viral', 'iridiscente', 'tendencia'], popular: true, isNew: true,
    description: 'Efecto aurora boreal multicolor difuminado — el diseño más viral del año',
    price: 75000, duration: 75,
  },
  {
    id: 'nd2', name: 'French Corazón', category: 'French', shape: 'almond',
    colors: ['#FDE8EC', '#FDE8EC'], tipColor: '#F472B6',
    tags: ['french', 'corazón', 'romántico', 'san valentin'], popular: true,
    description: 'French clásico con tips en forma de corazón pintados a mano',
    price: 55000, duration: 60,
  },
  {
    id: 'nd3', name: 'Chrome Espejo', category: 'Tendencias', shape: 'coffin',
    colors: ['#C0C0C0', '#E8E8FF'], gradient: true, patternType: 'chrome',
    tags: ['chrome', 'espejo', 'metalico', 'plata'], popular: true, isNew: true,
    description: 'Polvo chrome plateado sobre base nude — efecto espejo perfecto',
    price: 80000, duration: 80,
  },
  {
    id: 'nd4', name: 'Glazed Donut', category: 'Tendencias', shape: 'oval',
    colors: ['#FEE2E2', '#FECACA'], gradient: true, patternType: 'glazed',
    tags: ['glazed', 'glossy', 'viral', 'hailey'], popular: true,
    description: 'El glazed nails viral de Hailey Bieber — efecto espejo rosado perlado',
    price: 65000, duration: 70,
  },
  {
    id: 'nd5', name: 'Elegant Black Gold', category: 'Colores', shape: 'coffin',
    colors: ['#1A1A1A', '#1A1A1A'],
    tags: ['negro', 'dorado', 'elegante', 'noche', 'líneas'], popular: true,
    description: 'Negro mate con líneas doradas geométricas — elegancia oscura',
    price: 70000, duration: 75,
  },
  {
    id: 'nd6', name: 'Aura Nails', category: 'Tendencias', shape: 'oval',
    colors: ['#FBCFE8', '#A78BFA'], gradient: true, patternType: 'aura',
    tags: ['aura', 'difuminado', 'pastel', 'tendencia'], isNew: true,
    description: 'Técnica aura: color difuminado desde el centro hacia los bordes',
    price: 72000, duration: 70,
  },
  {
    id: 'nd7', name: 'Barbie Pink', category: 'Tendencias', shape: 'stiletto',
    colors: ['#FF69B4', '#FF1493'],
    tags: ['barbie', 'rosa', 'bold', 'fucsia', 'tendencia'], popular: true,
    description: 'Rosa Barbie intenso en uñas stiletto — atrevido y glamoroso',
    price: 68000, duration: 65,
  },
  {
    id: 'nd8', name: 'Novia Perlas', category: 'Temporada', shape: 'almond',
    colors: ['#FDF6F0', '#F8F0E3'],
    tags: ['novia', 'perlas', 'boda', 'blanco', 'elegante'], popular: true,
    description: 'Nude perla con detalles 3D para bodas y eventos especiales',
    price: 90000, duration: 90,
  },
  {
    id: 'nd9', name: 'Marble White', category: 'Tendencias', shape: 'coffin',
    colors: ['#F8F8F8', '#E5E5E5'], patternType: 'marble',
    tags: ['mármol', 'blanco', 'elegante', 'minimalista'], isNew: true,
    description: 'Mármol blanco pintado a mano con venas grises y doradas',
    price: 75000, duration: 80,
  },
  {
    id: 'nd10', name: 'Y2K Holográfico', category: 'Tendencias', shape: 'square',
    colors: ['#E040FB', '#40C4FF'], gradient: true, patternType: 'holographic',
    tags: ['y2k', 'holografico', 'brillante', 'retro', '2000s'], isNew: true,
    description: 'Efecto holográfico arcoíris inspirado en la estética Y2K',
    price: 78000, duration: 75,
  },
  {
    id: 'nd11', name: 'Sunset Ombré', category: 'Ombré', shape: 'almond',
    colors: ['#FF6B35', '#FF1744'], gradient: true,
    tags: ['degradado', 'naranja', 'rojo', 'atardecer', 'verano'],
    description: 'Degradado naranja a rojo intenso inspirado en atardeceres de playa',
    price: 60000, duration: 65,
  },
  {
    id: 'nd12', name: 'Dark Academia', category: 'Colores', shape: 'oval',
    colors: ['#5C3317', '#8B4513'],
    tags: ['oscuro', 'marrón', 'chocolate', 'otoño', 'dark academia'],
    description: 'Marrón oscuro tipo chocolate — la estética Dark Academia en tus uñas',
    price: 55000, duration: 55,
  },
  {
    id: 'nd13', name: 'Flores 3D', category: 'Tendencias', shape: 'almond',
    colors: ['#FDE68A', '#FCA5A5'], gradient: true, patternType: 'floral',
    tags: ['flores', '3d', 'artístico', 'primavera', 'gel'], popular: true, isNew: true,
    description: 'Flores volumétricas 3D en gel hechas a mano sobre base pastel',
    price: 95000, duration: 100,
  },
  {
    id: 'nd14', name: 'Océano Profundo', category: 'Ombré', shape: 'coffin',
    colors: ['#0EA5E9', '#0C4A6E'], gradient: true,
    tags: ['azul', 'océano', 'degradado', 'marino', 'verano'],
    description: 'Ombré de azul cielo a azul marino con efecto agua cristalina',
    price: 62000, duration: 65,
  },
  {
    id: 'nd15', name: 'Navidad Glitter', category: 'Temporada', shape: 'oval',
    colors: ['#1B5E20', '#B71C1C'], patternType: 'glitter',
    tags: ['navidad', 'glitter', 'rojo', 'verde', 'festivo'],
    description: 'Rojo y verde con glitter dorado — glamour navideño irresistible',
    price: 70000, duration: 70,
  },
  {
    id: 'nd16', name: 'Nude Minimalista', category: 'Colores', shape: 'square',
    colors: ['#D4B896', '#C9A882'],
    tags: ['nude', 'minimalista', 'natural', 'oficina', 'diario'], popular: true,
    description: 'Nude cálido perfecto para el día a día — elegante y versátil',
    price: 45000, duration: 45,
  },
];

export const NAIL_CATEGORIES: NailCategory[] = ['Todos', 'French', 'Colores', 'Ombré', 'Tendencias', 'Temporada'];
