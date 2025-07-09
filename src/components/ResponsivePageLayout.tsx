import React from 'react';
import { Box, Container, useTheme, useMediaQuery } from '../utils/mui';

interface ResponsivePageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disablePadding?: boolean;
  fullHeight?: boolean;
}

const ResponsivePageLayout: React.FC<ResponsivePageLayoutProps> = ({
  children,
  maxWidth = 'xl',
  disablePadding = false,
  fullHeight = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Container 
      maxWidth={maxWidth}
      disableGutters={isMobile}
      sx={{
        // Padding responsivo
        px: disablePadding ? 0 : {
          xs: 1, // 8px en móvil
          sm: 2, // 16px en tablet
          md: 3  // 24px en desktop
        },
        py: disablePadding ? 0 : {
          xs: 1, // 8px en móvil
          sm: 2, // 16px en tablet
          md: 3  // 24px en desktop
        },
        
        // Altura si se solicita
        height: fullHeight ? '100%' : 'auto',
        minHeight: fullHeight ? '100vh' : 'auto',
        
        // Ancho responsivo
        width: '100%',
        maxWidth: {
          xs: '100%',
          sm: maxWidth === false ? '100%' : theme.breakpoints.values[maxWidth as keyof typeof theme.breakpoints.values]
        },
        
        // Overflow para contenido que se desborde
        overflowX: 'hidden',
      }}
    >
      <Box 
        sx={{
          // Espaciado interno para el contenido
          '& > *:not(:last-child)': {
            mb: { xs: 2, sm: 3 }
          },
          
          // Mejoras específicas para formularios y tablas en móvil
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' }
          },
          
          // Mejoras para botones en móvil
          '& .MuiButton-root': {
            minHeight: { xs: 44, sm: 36 }, // Botones más grandes en móvil para touch
          },
          
          // Mejoras para campos de texto en móvil
          '& .MuiTextField-root': {
            '& .MuiInputBase-root': {
              fontSize: { xs: '16px', sm: '14px' }, // Evita zoom automático en iOS
            }
          },
          
          // Mejoras para tablas en móvil
          '& .MuiTableContainer-root': {
            // Ya aplicado en cada tabla individual
          },
          
          // Mejoras para cards en móvil
          '& .MuiCard-root': {
            borderRadius: { xs: 1, sm: 2 },
            margin: { xs: 0, sm: 'inherit' }
          }
        }}
      >
        {children}
      </Box>
    </Container>
  );
};

export default ResponsivePageLayout;
