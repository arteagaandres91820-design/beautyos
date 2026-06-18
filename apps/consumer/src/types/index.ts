export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  size: string;
  description: string;
  benefits: string[];
  howToUse: string;
  bgColor: string;
  bottleColor: string;
  isFavorite?: boolean;
  isNew?: boolean;
  discount?: number;
}

export interface RoutineStep {
  step: number;
  action: string;
  productId: string;
  productName: string;
  duration: number;
  morning: boolean;
  night: boolean;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  stepCount: number;
  duration: number;
  level: 'Básica' | 'Intermedia' | 'Avanzada';
  tags: string[];
  steps: RoutineStep[];
  bgColor: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}
