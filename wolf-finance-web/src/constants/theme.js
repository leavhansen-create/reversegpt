import { colors } from './colors';

export const theme = {
  colors,

  fonts: {
    heading: "'Nunito', 'Poppins', system-ui, sans-serif",
    body: "'Nunito', system-ui, sans-serif",
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },

  fontWeights: {
    regular: 400,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 12px rgba(0,0,0,0.10)',
    lg: '0 8px 24px rgba(0,0,0,0.12)',
    primary: '0 4px 14px rgba(27,94,32,0.30)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  maxWidth: {
    app: '480px', // Mobile-feel in a web container
  },

  transitions: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '400ms ease',
  },
};
