/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#083D42',
        'primary-hover': '#052E32',
        'primary-50': '#EFF4F1',
        'primary-100': '#CBE6DF',
        'primary-200': '#A4D9D3',
        'primary-500': '#2DC7B3',
        muted: '#8A9BA8',
        dark: '#0D1B2A',
        surface: '#F7FAFA',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(11,82,82,0.08)',
        'card-hover': '0 8px 32px rgba(11,82,82,0.14)',
        btn: '0 4px 20px rgba(11,82,82,0.35)',
      },
    },
  },
  plugins: [],
}
