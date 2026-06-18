/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── SinergIA corporate — admin dashboard ──────────────────────
        primary: {
          50:  '#E6F9F7', 100: '#CCF3EF', 200: '#99E7DF', 300: '#66DBCF',
          400: '#33CFBF', 500: '#2DC7B3', 600: '#28B3A1', 700: '#1A8F81',
          800: '#0D5C63', 900: '#083D42',
          DEFAULT: '#2DC7B3',
        },
        sidebar: '#0D1B2A',
        surface: '#F4F7FB',
        ink:    '#1A1F2E',
        muted:  '#6B7280',
        edge:   '#E4E9F0',

        // ── SinergIA corporate — client app (same teal, lighter bg) ──
        client: {
          50:  '#E6F9F7', 100: '#CCF3EF', 200: '#99E7DF', 300: '#66DBCF',
          400: '#33CFBF', 500: '#2DC7B3', 600: '#28B3A1', 700: '#1A8F81',
          800: '#0D5C63', 900: '#083D42',
          DEFAULT: '#2DC7B3',
        },
        'client-bg':   '#EBF8F6',
        'client-card': '#FFFFFF',
        'client-sage': '#EAF3F0',   /* fondo de página suave */
        'client-mint': '#CBE6DF',   /* fondo tarjeta featured */
        'client-ink':  '#083D42',   /* texto oscuro premium */
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'ui-serif', 'serif'],
      },
      backgroundImage: {
        // Admin
        'beauty-gradient': 'linear-gradient(135deg, #2DC7B3 0%, #0D5C63 100%)',
        'soft-gradient':   'linear-gradient(135deg, #E6F9F7 0%, #CCF3EF 100%)',
        // Client — refined, softer
        'client-gradient': 'linear-gradient(135deg, #2DC7B3 0%, #0D5C63 100%)',
        'client-hero':     'linear-gradient(170deg, #D4EDE7 0%, #E8F5F2 45%, #F5FAFA 100%)',
        'client-card-grad':'linear-gradient(180deg, rgba(13,92,99,0.04) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        beauty:      '0 4px 24px -4px rgba(45, 199, 179, 0.30)',
        card:        '0 2px 16px -2px rgba(0,0,0,0.07)',
        client:      '0 4px 28px -4px rgba(45, 199, 179, 0.20)',
        'client-lg': '0 16px 48px -8px rgba(13, 92, 99, 0.22)',
        'client-card': '0 2px 12px -2px rgba(13,92,99,0.08)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-up-lg':  'slideUpLg 0.5s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':   'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-left':'slideInLeft 0.25s cubic-bezier(0.16,1,0.3,1)',
        'pulse-teal':   'pulseTeal 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-soft':  'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:      { '0%': { opacity:'0' },                                        '100%': { opacity:'1' } },
        slideUp:     { '0%': { transform:'translateY(16px)', opacity:'0' },          '100%': { transform:'translateY(0)', opacity:'1' } },
        slideUpLg:   { '0%': { transform:'translateY(40px)', opacity:'0' },         '100%': { transform:'translateY(0)', opacity:'1' } },
        slideDown:   { '0%': { transform:'translateY(-100%)', opacity:'0' },        '100%': { transform:'translateY(0)', opacity:'1' } },
        slideInLeft: { '0%': { transform:'translateX(-100%)' },                      '100%': { transform:'translateX(0)' } },
        pulseTeal:   { '0%,100%': { opacity:'1' },                                   '50%':  { opacity:'.5' } },
        bounceSoft:  { '0%,100%': { transform:'translateY(0)' },                    '50%':  { transform:'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
};
