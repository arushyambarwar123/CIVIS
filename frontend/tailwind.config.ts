import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // Core palette
        navy:    '#172B4D',
        teal:    '#287D79',
        bg:      '#F7F8F6',
        surface: '#FFFFFF',
        surface2:'#EFF2F1',
        text1:   '#202B35',
        text2:   '#64717D',
        border:  '#DCE2E3',

        // Risk semantic
        'risk-low':      '#31785B',
        'risk-medium':   '#B77928',
        'risk-high':     '#C46A00',
        'risk-critical': '#B54747',

        // Risk backgrounds
        'risk-low-bg':      '#EAF4EF',
        'risk-medium-bg':   '#FDF3E3',
        'risk-high-bg':     '#FDF0E3',
        'risk-critical-bg': '#FDEAEA',

        // Status
        'status-open':      '#B54747',
        'status-review':    '#287D79',
        'status-resolved':  '#31785B',
        'status-dismissed': '#64717D',
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs:    ['12px', '18px'],
        sm:    ['13px', '20px'],
        base:  ['14px', '22px'],
        md:    ['15px', '24px'],
        lg:    ['16px', '26px'],
        xl:    ['18px', '28px'],
        '2xl': ['22px', '32px'],
        '3xl': ['28px', '36px'],
      },
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
        '22':  '88px',
      },
    },
  },
  plugins: [],
}

export default config
