export type NailShape = 'oval' | 'square' | 'almond' | 'stiletto' | 'coffin';
export type NailCategory = 'Todos' | 'French' | 'Colores' | 'Ombré' | 'Tendencias' | 'Temporada';

export interface NailDesign {
  id: string;
  name: string;
  category: NailCategory;
  shape: NailShape;
  colors: string[];
  tipColor?: string;
  gradient?: boolean;
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
    id: 'nd1', name: 'French Clásico', category: 'French', shape: 'oval',
    colors: ['#F5E6D8', '#F5E6D8'], tipColor: '#FFFFFF',
    tags: ['clásico', 'elegante', 'oficina'], popular: true,
    description: 'El eterno french manicure en acabado natural',
  },
  {
    id: 'nd2', name: 'French Rosa', category: 'French', shape: 'almond',
    colors: ['#FADADD', '#FADADD'], tipColor: '#FFE4E8',
    tags: ['romántico', 'suave'], popular: true,
    description: 'French con base rosada para un look más cálido',
  },
  {
    id: 'nd3', name: 'Nude Silk', category: 'Colores', shape: 'coffin',
    colors: ['#E8D5C4', '#E8D5C4'],
    tags: ['neutral', 'minimalista', 'oficina'], popular: true,
    description: 'Nude profundo efecto seda para uñas largas',
  },
  {
    id: 'nd4', name: 'Rojo Pasión', category: 'Colores', shape: 'oval',
    colors: ['#C0392B', '#C0392B'],
    tags: ['clásico', 'sensual', 'noche'], popular: true,
    description: 'El rojo carmín intemporal para cada ocasión',
  },
  {
    id: 'nd5', name: 'Coral Sunset', category: 'Colores', shape: 'oval',
    colors: ['#E8744B', '#E8744B'],
    tags: ['verano', 'vibrante'],
    description: 'Coral vivo inspirado en atardeceres tropicales',
  },
  {
    id: 'nd6', name: 'Rosé Ombré', category: 'Ombré', shape: 'almond',
    colors: ['#F5C5D0', '#C2185B'], gradient: true,
    tags: ['degradado', 'romántico', 'tendencia'], isNew: true,
    description: 'Degradado de rosado suave a fucsia intenso',
  },
  {
    id: 'nd7', name: 'Lavender Mist', category: 'Colores', shape: 'oval',
    colors: ['#C9B1D9', '#C9B1D9'],
    tags: ['pastel', 'primavera', 'suave'],
    description: 'Lavanda tenue para un look delicado y femenino',
  },
  {
    id: 'nd8', name: 'Midnight Chrome', category: 'Tendencias', shape: 'coffin',
    colors: ['#1A1A2E', '#4A4A8A'],
    tags: ['oscuro', 'metálico', 'noche'], isNew: true,
    description: 'Negro con efecto espejo cromado de alta gama',
  },
  {
    id: 'nd9', name: 'Sage Dream', category: 'Colores', shape: 'square',
    colors: ['#8FAF8A', '#8FAF8A'],
    tags: ['tendencia', 'natural', 'boho'], isNew: true,
    description: 'Verde sage apagado, el nuevo neutro de temporada',
  },
  {
    id: 'nd10', name: 'Baby Blue', category: 'Colores', shape: 'oval',
    colors: ['#AEC6CF', '#AEC6CF'],
    tags: ['pastel', 'suave', 'primavera'],
    description: 'Azul bebé suave, fresco y atemporal',
  },
  {
    id: 'nd11', name: 'Nude Ombré', category: 'Ombré', shape: 'stiletto',
    colors: ['#E8D5C4', '#D4A57A'], gradient: true,
    tags: ['neutral', 'sofisticado', 'largo'],
    description: 'Degradado de beige a dorado para uñas stiletto',
  },
  {
    id: 'nd12', name: 'Rosa Quartz', category: 'Temporada', shape: 'almond',
    colors: ['#F2A7B7', '#F2A7B7'],
    tags: ['temporada', 'rosa', 'femenino'], popular: true,
    description: 'Rosa cuarzo suave, color de la temporada',
  },
  {
    id: 'nd13', name: 'Emerald Gel', category: 'Tendencias', shape: 'coffin',
    colors: ['#1B5E20', '#2E7D32'],
    tags: ['oscuro', 'gel', 'tendencia'], isNew: true,
    description: 'Verde esmeralda profundo en acabado gel',
  },
  {
    id: 'nd14', name: 'Glazed Donut', category: 'Tendencias', shape: 'oval',
    colors: ['#FDE8D8', '#E8B4A0'],
    tags: ['tendencia', 'glossy', 'viral'], popular: true,
    description: 'El viral glazed efecto espejo rosado-neutro',
  },
  {
    id: 'nd15', name: 'Burgundy Velvet', category: 'Temporada', shape: 'almond',
    colors: ['#5D1A1A', '#5D1A1A'],
    tags: ['otoño', 'oscuro', 'elegante'],
    description: 'Borgoña intenso con acabado terciopelo mate',
  },
  {
    id: 'nd16', name: 'Blush Nude', category: 'French', shape: 'square',
    colors: ['#F0D6CD', '#F0D6CD'], tipColor: '#F8F0EE',
    tags: ['suave', 'natural', 'diario'],
    description: 'French nude rosado para un look natural diario',
  },
];

export const NAIL_CATEGORIES: NailCategory[] = ['Todos', 'French', 'Colores', 'Ombré', 'Tendencias', 'Temporada'];
