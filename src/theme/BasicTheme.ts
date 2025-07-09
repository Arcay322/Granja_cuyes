import { createTheme } from '@mui/material';

// Tema simplificado para depuración
const basicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5F8D4E',
    },
    secondary: {
      main: '#E5D9B6',
    },
    background: {
      default: '#FAFAF5',
      paper: '#FFFFFF',
    }
  },
});

export default basicTheme;
