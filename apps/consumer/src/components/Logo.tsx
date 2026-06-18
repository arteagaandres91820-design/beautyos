export function Logo({ size = 56, dark = false }: { size?: number; dark?: boolean }) {
  const color = dark ? '#083D42' : '#ffffff';
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx="16" fill={dark ? '#EFF4F1' : '#083D42'} />
      <text x="13" y="38" fontFamily="Cormorant Garamond, serif" fontSize="28" fontWeight="400" fill={dark ? '#083D42' : '#ffffff'} letterSpacing="-1">b</text>
      <circle cx="38" cy="16" r="3" fill={dark ? '#083D42' : '#2DC7B3'} />
      <path d="M38 13 L39 15 L41 16 L39 17 L38 19 L37 17 L35 16 L37 15 Z" fill={dark ? '#2DC7B3' : '#ffffff'} />
    </svg>
  );
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Logo size={42} dark />
    </div>
  );
}

