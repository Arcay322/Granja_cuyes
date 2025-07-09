import { createTheme, responsiveFontSizes } from '@mui/material';

// Creamos una paleta de colores inspirada en una granja natural de cuyes
let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5F8D4E', // Verde fresco representando naturaleza y pastizales
      light: '#A4BE7B',
      dark: '#285430',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E5D9B6', // Tonos tierra/paja representando el ambiente natural de los cuyes
      light: '#F0EBCE',
      dark: '#BFA565',
      contrastText: '#5F5F5F',
    },
    background: {
      default: '#FAFAF5', // Crema muy suave, como el pelaje de los cuyes
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    error: {
      main: '#D57E7E',
      light: '#E8A0A0',
      dark: '#A13939',
    },
    warning: {
      main: '#E6B325',
      light: '#F4D35E',
      dark: '#B38A1D',
    },
    info: {
      main: '#78A6C8',
      light: '#9FC7E7',
      dark: '#4C7293',
    },
    success: {
      main: '#65B741',
      light: '#9FD181',
      dark: '#467529',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: "'Outfit', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.9rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.03)',
    '0px 4px 8px rgba(0, 0, 0, 0.04)',
    '0px 6px 12px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.06)',
    '0px 10px 20px rgba(0, 0, 0, 0.07)',
    '0px 12px 24px rgba(0, 0, 0, 0.08)',
    '0px 14px 28px rgba(0, 0, 0, 0.09)',
    '0px 16px 32px rgba(0, 0, 0, 0.1)',
    '0px 18px 36px rgba(0, 0, 0, 0.11)',
    '0px 20px 40px rgba(0, 0, 0, 0.12)',
    '0px 22px 44px rgba(0, 0, 0, 0.13)',
    '0px 24px 48px rgba(0, 0, 0, 0.14)',
    '0px 26px 52px rgba(0, 0, 0, 0.15)',
    '0px 28px 56px rgba(0, 0, 0, 0.16)',
    '0px 30px 60px rgba(0, 0, 0, 0.17)',
    '0px 32px 64px rgba(0, 0, 0, 0.18)',
    '0px 34px 68px rgba(0, 0, 0, 0.19)',
    '0px 36px 72px rgba(0, 0, 0, 0.2)',
    '0px 38px 76px rgba(0, 0, 0, 0.21)',
    '0px 40px 80px rgba(0, 0, 0, 0.22)',
    '0px 42px 84px rgba(0, 0, 0, 0.23)',
    '0px 44px 88px rgba(0, 0, 0, 0.24)',
    '0px 46px 92px rgba(0, 0, 0, 0.25)',
    '0px 48px 96px rgba(0, 0, 0, 0.26)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#F5F5F5',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#CCCCCC',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#AAAAAA',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          '&.Mui-disabled': {
            backgroundColor: '#E0E0E0',
            color: '#999999',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #5F8D4E 30%, #65B741 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #285430 30%, #4B7B30 90%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #E5D9B6 30%, #F0EBCE 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #BFA565 30%, #D7C28F 90%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
        elevation1: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.08)',
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          color: '#333333',
          backgroundColor: '#F8F9FA',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          marginBottom: '4px',
          transition: 'all 0.2s',
          '&.Mui-selected': {
            backgroundColor: 'rgba(95, 141, 78, 0.12)',
            color: '#285430',
            '&:hover': {
              backgroundColor: 'rgba(95, 141, 78, 0.2)',
            },
            '& .MuiListItemIcon-root': {
              color: '#285430',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          backgroundImage: 'linear-gradient(rgba(245, 246, 242, 0.8), rgba(245, 246, 242, 0.8))',
          borderRight: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.3)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5F8D4E',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#E5D9B6',
          color: '#5F8D4E',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: 'rgba(95, 141, 78, 0.12)',
          color: '#285430',
          '&:hover': {
            backgroundColor: 'rgba(95, 141, 78, 0.2)',
          },
        },
        outlined: {
          borderColor: 'rgba(95, 141, 78, 0.5)',
          color: '#5F8D4E',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          borderRadius: '4px',
          fontSize: '0.75rem',
          padding: '8px 12px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

// Hacemos las fuentes responsivas
theme = responsiveFontSizes(theme);

export default theme;
