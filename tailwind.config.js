/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── Typographie ────────────────────────────────────────────────────────────
      fontFamily: {
        sans:  ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        tight: ['"Inter Tight"', 'Inter', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },

      // ── Couleurs — Thème "cockpit sombre" / glassmorphism cyan (FleetOS) ──────────
      colors: {
        // Fond applicatif (utilisé pour dégradés/chrome en dur, voir index.css)
        app: {
          bg:       '#020817',
          elevated: '#0a1628',
          card:     'rgba(13,27,46,0.85)',
          header:   'rgba(5,14,31,0.9)',
        },

        // "navy" = repris comme échelle ACCENT cyan (boutons, focus, badges "info",
        // icônes actives, chips) — utilisée dans tout le code existant (bg-navy-600, etc.)
        navy: {
          50:  'rgba(0,212,255,0.08)',
          100: 'rgba(0,212,255,0.14)',
          200: 'rgba(0,212,255,0.30)',
          300: '#4de6ff',
          400: '#22d3ee',
          500: '#00d4ff',   // accent brand — kit FleetOS
          600: '#00b8e0',
          700: '#0088cc',
          800: '#046a9e',
          900: '#004766',
          950: '#00293d',
        },

        // Accent — Amber safety (alertes, attention) — teintes vives inchangées,
        // seules les nuances "tint" (50/100/200) et "texte sur fond sombre" (700/800/900)
        // sont adaptées pour un rendu glass sur fond sombre.
        amber: {
          50:  'rgba(255,179,0,0.10)',
          100: 'rgba(255,179,0,0.16)',
          200: 'rgba(255,179,0,0.32)',
          300: '#ffcf4d',
          400: '#ffc233',
          500: '#ffb300',
          600: '#e6a100',
          700: '#ffcf66',   // texte ambre lisible sur fond sombre
          800: '#ffe0a3',
          900: '#fff3d6',
        },

        // Safety orange — critique / danger industriel
        safety: {
          50:  'rgba(255,140,66,0.10)',
          100: 'rgba(255,140,66,0.16)',
          200: 'rgba(255,140,66,0.32)',
          300: '#ffab73',
          400: '#ff8c42',
          500: '#ff7a1a',
          600: '#e66a10',
          700: '#ffb37a',   // texte safety lisible sur fond sombre
          800: '#ffd0ad',
        },

        // Succès / validé — vert néon FleetOS
        success: {
          50:  'rgba(0,230,118,0.10)',
          100: 'rgba(0,230,118,0.16)',
          200: 'rgba(0,230,118,0.30)',
          400: '#33ea92',
          500: '#00e676',
          600: '#00c765',
          700: '#7bf5b8',   // texte succès lisible sur fond sombre
        },

        // Danger / critique — rouge FleetOS
        danger: {
          50:  'rgba(255,68,68,0.10)',
          100: 'rgba(255,68,68,0.16)',
          200: 'rgba(255,68,68,0.30)',
          400: '#ff7373',
          500: '#ff4444',
          600: '#e63939',
          700: '#ffabab',   // texte danger lisible sur fond sombre
        },

        // Surfaces & neutrals — échelle "verre" sombre (remplace le gris clair)
        surface: {
          0:   '#0a1628',
          50:  '#0a1628',
          100: '#0f2040',
          200: '#1e3a5f',
          300: '#234878',
          400: '#4a7a9b',
          500: '#7bacc8',
          600: '#2a5070',
          700: '#c9e3f5',
          800: '#e8f4fd',
          900: '#f4faff',
        },

        // Rétro-compat
        warning: {
          50:  'rgba(255,179,0,0.10)',
          500: '#ffb300',
          600: '#e6a100',
        },
      },

      // ── Ombres — glows & profondeur "cockpit sombre" ─────────────────────────────
      boxShadow: {
        'xs':         '0 1px 2px 0 rgba(0,0,0,0.20)',
        'sm':         '0 1px 3px 0 rgba(0,0,0,0.30), 0 1px 2px -1px rgba(0,0,0,0.25)',
        'card':       '0 2px 8px 0 rgba(0,0,0,0.25), 0 1px 3px 0 rgba(0,0,0,0.20)',
        'card-hover': '0 8px 28px 0 rgba(0,0,0,0.35), 0 0 0 1px rgba(0,212,255,0.08)',
        'panel':      '0 8px 32px 0 rgba(0,0,0,0.35)',
        'modal':      '0 20px 60px 0 rgba(0,0,0,0.55), 0 8px 24px 0 rgba(0,0,0,0.30)',
        'kpi':        '0 2px 12px 0 rgba(0,0,0,0.25)',
        'sidebar':    '4px 0 24px 0 rgba(0,0,0,0.35)',
        'inner':      'inset 0 1px 3px 0 rgba(0,0,0,0.25)',
        'glow-navy':  '0 0 24px 0 rgba(0,212,255,0.18)',
        'glow-amber': '0 0 16px 0 rgba(255,179,0,0.25)',
        'glow-success':'0 0 24px 0 rgba(0,230,118,0.15)',
        'glow-danger': '0 0 24px 0 rgba(255,68,68,0.15)',
      },

      // ── Animations ────────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          from: { backgroundPosition: '-400px 0' },
          to:   { backgroundPosition: '400px 0'  },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.90)', opacity: '0' },
          '60%':  { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.2s ease-out',
        'fade-in-up':     'fade-in-up 0.25s ease-out',
        'fade-in-scale':  'fade-in-scale 0.2s ease-out',
        'slide-in-left':  'slide-in-left 0.22s ease-out',
        'slide-in-right': 'slide-in-right 0.22s ease-out',
        'shimmer':        'shimmer 1.6s infinite linear',
        'bounce-in':      'bounce-in 0.3s ease-out',
      },

      // ── Spacing extras ────────────────────────────────────────────────────────
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};
