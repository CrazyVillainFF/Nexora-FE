import { alpha, createTheme } from '@mui/material/styles';

const navy = '#123B5D';
const blue = '#176B9E';
const ink = '#17212B';

export const getDesignTokens = (mode) => {
  const light = mode === 'light';
  const surface = light ? '#FFFFFF' : '#17212B';
  const canvas = light ? '#F6F8FA' : '#101820';
  const border = light ? '#DCE4EA' : '#2A3B49';

  return {
    palette: {
      mode,
      primary: { main: light ? navy : '#75BDE9', light: light ? '#E8F2F8' : '#B8E0F6', dark: light ? '#0B2A43' : '#3A8DBC', contrastText: '#FFFFFF' },
      secondary: { main: blue, light: '#E8F2F8', dark: '#0E4E76', contrastText: '#FFFFFF' },
      success: { main: light ? '#287A5A' : '#63C29A' },
      error: { main: light ? '#B43C45' : '#F08A91' },
      warning: { main: light ? '#A76612' : '#EDB866' },
      background: { default: canvas, paper: surface, subtle: light ? '#EDF2F5' : '#1E2C38', elevated: light ? '#FFFFFF' : '#1B2935' },
      text: { primary: light ? ink : '#F0F5F8', secondary: light ? '#526372' : '#AABAC7', disabled: light ? '#82909B' : '#6F8190' },
      divider: border,
      action: { hover: alpha(light ? navy : '#75BDE9', light ? 0.055 : 0.11), selected: alpha(light ? navy : '#75BDE9', light ? 0.1 : 0.17), focus: alpha(light ? navy : '#75BDE9', 0.16) },
    },
    typography: {
      fontFamily: '"Aptos", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      h1: { fontWeight: 750, letterSpacing: '-0.045em', lineHeight: 1.04 }, h2: { fontWeight: 740, letterSpacing: '-0.035em', lineHeight: 1.12 }, h3: { fontWeight: 720, letterSpacing: '-0.03em', lineHeight: 1.18 }, h4: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.22 }, h5: { fontWeight: 700, letterSpacing: '-0.018em', lineHeight: 1.28 }, h6: { fontWeight: 700, letterSpacing: '-0.012em', lineHeight: 1.34 },
      subtitle1: { fontWeight: 650 }, subtitle2: { fontWeight: 650 }, body1: { fontSize: '0.975rem', lineHeight: 1.62 }, body2: { fontSize: '0.875rem', lineHeight: 1.56 }, button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0' }, caption: { lineHeight: 1.45 },
    },
    shape: { borderRadius: 10 },
    shadows: light ? ['none', '0 1px 2px rgba(26, 54, 75, 0.05)', '0 3px 10px rgba(26, 54, 75, 0.07)', '0 12px 30px rgba(26, 54, 75, 0.09)', ...Array(21).fill('0 16px 38px rgba(26, 54, 75, 0.10)')] : ['none', '0 1px 2px rgba(0, 0, 0, 0.22)', '0 3px 10px rgba(0, 0, 0, 0.25)', '0 12px 30px rgba(0, 0, 0, 0.3)', ...Array(21).fill('0 16px 38px rgba(0, 0, 0, 0.34)')],
    components: {
      MuiCssBaseline: { styleOverrides: { '*': { boxSizing: 'border-box' }, html: { scrollBehavior: 'smooth' }, body: { margin: 0, backgroundColor: canvas, scrollbarColor: `${light ? '#AABAC7' : '#405261'} transparent`, '&::-webkit-scrollbar, & *::-webkit-scrollbar': { width: 8, height: 8 }, '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': { borderRadius: 8, backgroundColor: light ? '#AABAC7' : '#405261' } }, '::selection': { backgroundColor: alpha(light ? navy : '#75BDE9', 0.22) }, '@media (prefers-reduced-motion: reduce)': { '*, *::before, *::after': { scrollBehavior: 'auto !important', transitionDuration: '0.01ms !important', animationDuration: '0.01ms !important' } } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 40, borderRadius: 8, padding: '8px 16px', transition: 'background-color .18s ease, border-color .18s ease, transform .18s ease', '&:active': { transform: 'translateY(1px)' } }, sizeLarge: { minHeight: 48, padding: '11px 20px' }, containedPrimary: { boxShadow: '0 5px 12px rgba(18, 59, 93, 0.18)', '&:hover': { backgroundColor: '#0B2A43', boxShadow: '0 7px 16px rgba(18, 59, 93, 0.24)' } }, outlined: { borderColor: border, '&:hover': { borderColor: navy, backgroundColor: alpha(navy, 0.045) } } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 12, border: `1px solid ${border}`, backgroundImage: 'none', boxShadow: light ? '0 1px 2px rgba(26, 54, 75, 0.03)' : 'none', transition: 'border-color .2s ease, box-shadow .2s ease, transform .2s ease' } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiTextField: { styleOverrides: { root: { '& .MuiInputLabel-root': { fontWeight: 600 }, '& .MuiOutlinedInput-root': { borderRadius: 8, backgroundColor: light ? '#FFFFFF' : '#1B2935', transition: 'box-shadow .18s ease, border-color .18s ease', '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: light ? '#8FA3B1' : '#567083' }, '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(light ? navy : '#75BDE9', 0.16)}` } } } } },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 }, root: { minHeight: 52 }, flexContainer: { gap: 8 } } },
      MuiTab: { styleOverrides: { root: { minHeight: 52, borderRadius: 7, minWidth: 'auto', paddingInline: 14, '&.Mui-selected': { fontWeight: 750 } } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 650, border: `1px solid ${border}` }, filledPrimary: { borderColor: 'transparent' } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${border}` } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: 10, border: `1px solid ${border}`, boxShadow: light ? '0 14px 34px rgba(26, 54, 75, 0.14)' : undefined } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 8, alignItems: 'center' } } },
    },
  };
};

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));
