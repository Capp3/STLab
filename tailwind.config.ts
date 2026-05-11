import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/client/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#1a1a2e',
          panel: '#16213e',
          border: '#0f3460',
        },
        node: {
          source: '#3B82F6',
          destination: '#10B981',
          'switch-dedicated': '#8B5CF6',
          'switch-shared': '#F59E0B',
          grandmaster: '#EAB308',
          nmos: '#06B6D4',
        },
        plane: {
          media: '#3B82F6',
          ptp: '#EAB308',
          nmos: '#06B6D4',
          management: '#6B7280',
        },
        violation: {
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
