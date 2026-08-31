import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA',
        primary: '#1A2B4A',
        border: '#DEE2E6',
        accent: '#1D6FA4',
        sidebar: '#1A2B4A',
        'risk-low': '#198754',
        'risk-medium': '#FFC107',
        'risk-high': '#FD7E14',
        'risk-critical': '#DC3545',
      },
    },
  },
  plugins: [],
}
export default config
