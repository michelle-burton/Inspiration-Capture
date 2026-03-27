import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surface hierarchy — tonal layering, no borders
        'surface':                   '#0d0e12',
        'surface-dim':               '#0d0e12',
        'surface-container-lowest':  '#000000',
        'surface-container-low':     '#121318',
        'surface-container':         '#18191e',
        'surface-container-high':    '#1e1f25',
        'surface-container-highest': '#24252b',
        'surface-variant':           '#24252b',
        'surface-bright':            '#2a2c32',
        'background':                '#0d0e12',
        // On-surface
        'on-surface':         '#faf8fe',
        'on-surface-variant': '#abaab0',
        'on-background':      '#faf8fe',
        // Primary — cyan
        'primary':              '#81ecff',
        'primary-dim':          '#00d4ec',
        'primary-fixed':        '#00e3fd',
        'primary-fixed-dim':    '#00d4ec',
        'primary-container':    '#00e3fd',
        'on-primary':           '#005762',
        'on-primary-fixed':     '#003840',
        'on-primary-container': '#004d57',
        'inverse-primary':      '#006976',
        'surface-tint':         '#81ecff',
        // Secondary — purple
        'secondary':               '#a68cff',
        'secondary-dim':           '#7e51ff',
        'secondary-container':     '#591adc',
        'secondary-fixed':         '#d8caff',
        'secondary-fixed-dim':     '#cabaff',
        'on-secondary':            '#25006b',
        'on-secondary-container':  '#e4daff',
        'on-secondary-fixed':      '#3b00a0',
        'on-secondary-fixed-variant': '#591bdc',
        // Tertiary — pink/hot accent (use sparingly)
        'tertiary':           '#ff6c95',
        'tertiary-dim':       '#ff6c95',
        'tertiary-container': '#fd3e80',
        'tertiary-fixed':     '#ff8fa9',
        'tertiary-fixed-dim': '#ff769b',
        'on-tertiary':                 '#48001c',
        'on-tertiary-container':       '#100003',
        'on-tertiary-fixed':           '#380014',
        'on-tertiary-fixed-variant':   '#770033',
        // Outlines
        'outline':         '#75757a',
        'outline-variant': '#47484c',
        // Error
        'error':           '#ff716c',
        'error-dim':       '#d7383b',
        'error-container': '#9f0519',
        'on-error':        '#490006',
        'on-error-container': '#ffa8a3',
        // Inverse
        'inverse-surface':    '#faf8fe',
        'inverse-on-surface': '#54555a',
      },
      fontFamily: {
        headline: ['"Space Grotesk"', 'sans-serif'],
        body:     ['Manrope', 'sans-serif'],
        label:    ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md:   '0.75rem',
        lg:   '0.5rem',
        xl:   '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        'neon-cyan':   '0 0 20px rgba(129, 236, 255, 0.35)',
        'neon-purple': '0 0 20px rgba(166, 140, 255, 0.35)',
        'neon-pink':   '0 0 20px rgba(255, 108, 149, 0.35)',
        'glow-sm':     '0 0 10px rgba(129, 236, 255, 0.25)',
        'ambient':     '0 20px 40px rgba(166, 139, 255, 0.08)',
      },
      backgroundImage: {
        'neon-curtain':
          'radial-gradient(circle at 0% 0%, rgba(129,236,255,0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(166,140,255,0.05) 0%, transparent 50%)',
        'gradient-cta':
          'linear-gradient(135deg, #81ecff 0%, #00e3fd 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config
