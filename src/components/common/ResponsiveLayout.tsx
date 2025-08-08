import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  Backdrop,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Home as HomeIcon,
  Assessment as ReportsIcon,
  Notifications as AlertsIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  showFab?: boolean;
  fabActions?: Array<{
    icon: React.ReactNode;
    name: string;
    onClick: () => void;
  }>;
  onMenuClick?: () => void;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title = 'SUMAQ UYWA',
  showFab = false,
  fabActions = [],
  onMenuClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Cerrar menú móvil cuando cambie a desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (onMenuClick) {
      onMenuClick();
    }
  };

  const defaultFabActions = [
    {
      icon: <AddIcon />,
      name: 'Agregar',
      onClick: () => console.log('Add action')
    },
    {
      icon: <EditIcon />,
      name: 'Editar',
      onClick: () => console.log('Edit action')
    },
    {
      icon: <ViewIcon />,
      name: 'Ver',
      onClick: () => console.log('View action')
    }
  ];

  const actions = fabActions.length > 0 ? fabActions : defaultFabActions;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 'bold',
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Menú
              </Typography>
              <IconButton onClick={() => setMobileMenuOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Navigation items would go here */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Navegación móvil en desarrollo
              </Typography>
            </Box>
          </Box>
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : isTablet ? 2 : 3,
          mt: isMobile ? 8 : 0, // Account for mobile app bar
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>

      {/* Floating Action Button for Mobile */}
      {isMobile && showFab && (
        <>
          <Backdrop
            open={fabOpen}
            onClick={() => setFabOpen(false)}
            sx={{ zIndex: theme.zIndex.speedDial - 1 }}
          />
          <SpeedDial
            ariaLabel="Acciones rápidas"
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16,
              zIndex: theme.zIndex.speedDial
            }}
            icon={<SpeedDialIcon />}
            onClose={() => setFabOpen(false)}
            onOpen={() => setFabOpen(true)}
            open={fabOpen}
          >
            {actions.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={() => {
                  action.onClick();
                  setFabOpen(false);
                }}
              />
            ))}
          </SpeedDial>
        </>
      )}
    </Box>
  );
};

// Hook para detectar el tipo de dispositivo
export const useDeviceType = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};

// Hook para gestión de orientación en móviles
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange(); // Set initial orientation
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Componente para grids responsivos
interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 2,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3
}) => {
  const { isMobile, isTablet } = useDeviceType();
  
  const columns = isMobile ? mobileColumns : isTablet ? tabletColumns : desktopColumns;
  
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing,
        width: '100%'
      }}
    >
      {children}
    </Box>
  );
};

// Componente para cards responsivos
interface ResponsiveCardProps {
  children: React.ReactNode;
  elevation?: number;
  padding?: number;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  elevation = 1,
  padding
}) => {
  const { isMobile } = useDeviceType();
  
  const defaultPadding = isMobile ? 2 : 3;
  
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: elevation,
        p: padding || defaultPadding,
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {children}
    </Box>
  );
};

// Componente para tablas responsivas
interface ResponsiveTableProps {
  children: React.ReactNode;
  maxHeight?: string | number;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  maxHeight = '70vh'
}) => {
  const { isMobile } = useDeviceType();
  
  return (
    <Box
      sx={{
        width: '100%',
        overflow: 'auto',
        maxHeight: isMobile ? '60vh' : maxHeight,
        '& table': {
          minWidth: isMobile ? 'auto' : 650,
        },
        '& th, & td': {
          fontSize: isMobile ? '0.75rem' : '0.875rem',
          padding: isMobile ? '8px 4px' : '16px',
        }
      }}
    >
      {children}
    </Box>
  );
};

export default ResponsiveLayout;