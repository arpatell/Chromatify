import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5f55ff',
      dark: '#4f46df',
    },
    secondary: {
      main: '#1db954',
    },
    background: {
      default: '#ecf2ff',
      paper: 'rgba(255, 255, 255, 0.66)',
    },
    text: {
      primary: '#151f39',
      secondary: '#4a5a7f',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Sora", "Manrope", "DM Sans", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      borderRadius: 10,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        body: {
          minHeight: '100dvh',
          margin: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 16,
        },
      },
    },
  },
});

export default theme;
