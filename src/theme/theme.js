import { createTheme } from '@mui/material/styles';

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode Palette
          primary: {
            main: '#4F46E5', // Deep rich indigo
            light: '#6366F1',
            dark: '#3730A3',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#0284C7', // Refined sky blue
            light: '#38BDF8',
            dark: '#0369A1',
            contrastText: '#FFFFFF',
          },
          background: {
            default: '#F8FAFC', // Slate 50
            paper: '#FFFFFF',
            subtle: '#F1F5F9',
            elevated: '#FFFFFF'
          },
          text: {
            primary: '#0F172A', // Slate 900
            secondary: '#475569', // Slate 600
            disabled: '#94A3B8',
          },
          divider: 'rgba(226, 232, 240, 0.8)',
          action: {
            hover: 'rgba(79, 70, 229, 0.04)',
            selected: 'rgba(79, 70, 229, 0.08)',
          }
        }
      : {
          // Dark Mode Palette
          primary: {
            main: '#6366F1', // Indigo 500
            light: '#818CF8',
            dark: '#4338CA',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#38BDF8', // Sky 400
            light: '#7DD3FC',
            dark: '#0284C7',
            contrastText: '#0F172A',
          },
          background: {
            default: '#0B0F19', // Ultra dark slate
            paper: '#111827', // Gray 900
            subtle: '#1E293B',
            elevated: '#1F2937'
          },
          text: {
            primary: '#F8FAFC',
            secondary: '#94A3B8',
            disabled: '#64748B',
          },
          divider: 'rgba(255, 255, 255, 0.08)',
          action: {
            hover: 'rgba(99, 102, 241, 0.08)',
            selected: 'rgba(99, 102, 241, 0.14)',
          }
        }),
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.015em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 500, letterSpacing: '-0.005em' },
    subtitle2: { fontWeight: 600, letterSpacing: '0em' },
    body1: { fontSize: '0.975rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: mode === 'light'
    ? [
        'none',
        '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.18)',
        ...Array(18).fill('0 20px 25px -5px rgba(0, 0, 0, 0.08)')
      ]
    : [
        'none',
        '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
        '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        ...Array(18).fill('0 20px 25px -5px rgba(0, 0, 0, 0.6)')
      ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'light' ? '#CBD5E1 transparent' : '#334155 transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: mode === 'light' ? '#CBD5E1' : '#334155',
            minHeight: 24,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(79, 70, 229, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: mode === 'light' ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },
    },
  },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));
