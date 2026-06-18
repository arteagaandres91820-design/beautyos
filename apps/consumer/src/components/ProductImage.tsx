import type { Product } from '../types';

export function ProductImage({ product, className = '', size = 'md' }: {
  product: Pick<Product, 'bgColor' | 'bottleColor' | 'name'>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const heights: Record<string, string> = { sm: '80px', md: '130px', lg: '220px' };
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: product.bgColor, minHeight: heights[size] }}
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 50% 60%, ${product.bgColor}00, ${product.bgColor}88)`,
      }} />
      {/* Bottle SVG */}
      <svg
        viewBox="0 0 80 160"
        width={size === 'lg' ? 100 : size === 'md' ? 64 : 44}
        className="relative z-10 drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dropper cap */}
        <rect x="32" y="4" width="16" height="24" rx="8" fill={product.bottleColor} opacity="0.9" />
        {/* Bottle neck */}
        <rect x="30" y="26" width="20" height="12" rx="4" fill={product.bottleColor} />
        {/* Bottle body */}
        <rect x="14" y="36" width="52" height="96" rx="14" fill={product.bottleColor} opacity="0.85" />
        {/* Glass highlight */}
        <rect x="20" y="44" width="8" height="48" rx="4" fill="white" opacity="0.25" />
        {/* Label */}
        <rect x="20" y="80" width="40" height="38" rx="6" fill="white" opacity="0.35" />
        {/* b· on label */}
        <text x="31" y="103" fontFamily="serif" fontSize="14" fill={product.bottleColor} fontWeight="500" opacity="0.9">b·</text>
        {/* Bottom */}
        <rect x="14" y="126" width="52" height="6" rx="3" fill={product.bottleColor} opacity="0.5" />
      </svg>
    </div>
  );
}
