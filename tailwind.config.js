
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        logistica: {
          blue: '#3b82f6', // Azul padrão profissional
          accent: '#55aaff', // Azul vibrante da marca
          dark: '#020617', // Fundo principal
          surface: '#0f172a', // Superfície de cards
          border: '#1e293b', // Bordas de inputs
          text: '#94a3b8', // Texto secundário
          input: '#1a1a1a', // Cor de fundo de inputs da imagem
          button: '#444444'  // Cor de botões padrão da imagem
        },
        enterprise: {
          dark: '#050a14',
          surface: '#0b1221',
          input: '#1a1a1a',
          accent: '#2563eb'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
