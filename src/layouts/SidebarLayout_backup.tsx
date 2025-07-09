import React, { useState, useEffect } from 'react';
import { 
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, Box, 
  IconButton, useMediaQuery, useTheme, Divider, Avatar, Badge, Tooltip, Container,
  ListItem, Menu, MenuItem, alpha, Zoom, Paper
} from '../utils/mui';
import { 
  Dashboard, Pets, Restaurant, LocalHospital, PointOfSale, MoneyOff, Logout, 
  Menu as MenuIcon, ChevronLeft, AccountCircle, NotificationsOutlined, 
  Search, HelpOutline, Settings, ExpandMore, KeyboardArrowRight
} from '@mui/icons-material';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import AlertSystem from '../components/AlertSystem';
import cuyLogo from '../assets/cuy-logo.png';

// Ancho ajustable para el drawer
const drawerWidth = 260;
const collapsedWidth = 70;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Cuyes', icon: <Pets />, path: '/cuyes' },
  { text: 'Reproducción', icon: <Pets />, path: '/reproduccion' },
  { text: 'Alimentación', icon: <Restaurant />, path: '/alimentos' },
  { text: 'Salud', icon: <LocalHospital />, path: '/salud' },
  { text: 'Ventas', icon: <PointOfSale />, path: '/ventas' },
  { text: 'Gastos', icon: <MoneyOff />, path: '/gastos' },
];

const SidebarLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = !!localStorage.getItem('token');
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [helpAnchor, setHelpAnchor] = useState<null | HTMLElement>(null);

  // Cierra el drawer automáticamente en modo móvil cuando cambia la ruta
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Ajusta el drawer cuando cambia el tamaño de la ventana
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleHelpMenu = (event: React.MouseEvent<HTMLElement>) => {
    setHelpAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationsAnchor(null);
    setHelpAnchor(null);
  };

  // Definimos el contenido del drawer para reutilizarlo
  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        py: 3,
        backgroundColor: 'primary.dark',
        backgroundImage: 'linear-gradient(to bottom, #285430, #315e39)',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E")',
          pointerEvents: 'none',
        }
      }}>
        <Avatar 
          src={cuyLogo}
          alt="Logo de Granja de Cuyes"
          sx={{ 
            width: 80, 
            height: 80, 
            mb: 2,
            p: 0.5,
            backgroundColor: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}
        />
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Granja de Cuyes
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            mt: 0.5,
            textAlign: 'center',
            px: 2,
            fontSize: '0.8rem'
          }}
        >
          Sistema de Gestión Integral
        </Typography>
      </Box>

      <Box sx={{ py: 1, overflow: 'auto', flexGrow: 1 }}>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton 
                component={Link} 
                to={item.path} 
                key={item.text}
                sx={{
                  my: 0.5,
                  mx: 0.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: isActive ? 'rgba(95, 141, 78, 0.12)' : 'transparent',
                  color: isActive ? 'primary.dark' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(95, 141, 78, 0.08)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isActive ? 'primary.dark' : 'text.secondary',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: 15,
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                {isActive && (
                  <Box 
                    sx={{ 
                      width: 3, 
                      height: 24, 
                      backgroundColor: 'primary.main', 
                      borderRadius: 2,
                      ml: 1
                    }} 
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {isAuth && (
        <Box sx={{ px: 2, pb: 2, pt: 1 }}>
          <Divider sx={{ mb: 2 }} />
          <ListItemButton
            onClick={handleLogout}
            sx={{ 
              borderRadius: 2,
              py: 1.5,
              color: 'error.main',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
              }
            }}
          >
            <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText 
              primary="Cerrar Sesión" 
              primaryTypographyProps={{ 
                fontSize: 15,
                fontWeight: 500
              }}
            />
          </ListItemButton>
        </Box>
      )}
    </>
  );

  // Versión colapsada para desktop
  const collapsedDrawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        py: 3,
        backgroundColor: 'primary.dark',
        backgroundImage: 'linear-gradient(to bottom, #285430, #315e39)',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E")',
          pointerEvents: 'none',
        }
      }}>
        <Avatar 
          src={cuyLogo}
          alt="Logo"
          sx={{ 
            width: 40, 
            height: 40,
            backgroundColor: '#fff',
            p: 0.5,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}
        />
      </Box>

      <Box sx={{ py: 1, overflow: 'auto', flexGrow: 1 }}>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.text} title={item.text} placement="right">
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    my: 0.5,
                    borderRadius: 2,
                    mx: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    p: 1.5,
                    backgroundColor: isActive ? 'rgba(95, 141, 78, 0.12)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(95, 141, 78, 0.08)',
                    },
                    position: 'relative',
                    '&::after': isActive ? {
                      content: '""',
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 24,
                      backgroundColor: 'primary.main',
                      borderRadius: 2
                    } : {}
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.dark' : 'text.secondary',
                      minWidth: 'auto',
                      justifyContent: 'center',
                      m: 0
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {isAuth && (
        <Box sx={{ pb: 2, pt: 1, display: 'flex', justifyContent: 'center' }}>
          <Divider sx={{ mb: 2, width: '80%' }} />
          <Tooltip title="Cerrar Sesión" placement="right">
            <IconButton
              color="error"
              onClick={handleLogout}
              sx={{ mx: 'auto' }}
            >
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* AppBar para toda la app */}
      <AppBar 
        position="fixed" 
        sx={{ 
          boxShadow: 'none',
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && !isMobile ? {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          } : !isMobile ? {
            width: `calc(100% - ${collapsedWidth}px)`,
            marginLeft: `${collapsedWidth}px`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          } : {})
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between',
          minHeight: { xs: 64, sm: 70 }, 
          px: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                display: { xs: 'flex', md: 'none' }, 
                borderRadius: 1.5,
                p: 1
              }}
            >
              <MenuIcon />
            </IconButton>

            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <Avatar
                  src={cuyLogo}
                  alt="Logo"
                  sx={{ width: 32, height: 32, mr: 1.5, backgroundColor: '#fff', p: 0.5 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                  Granja de Cuyes
                </Typography>
              </Box>
            )}

            <Box 
              sx={{ 
                backgroundColor: 'background.default', 
                borderRadius: 2, 
                display: { xs: 'none', sm: 'flex' }, 
                alignItems: 'center',
                py: 0.5,
                px: 2,
                ml: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Search sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">Buscar...</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Ayuda">
              <IconButton onClick={handleHelpMenu} color="inherit" sx={{ ml: 1, borderRadius: 1.5, p: 1 }}>
                <HelpOutline />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={helpAnchor}
              open={Boolean(helpAnchor)}
              onClose={handleClose}
              sx={{ mt: 1.5 }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleClose}>Centro de ayuda</MenuItem>
              <MenuItem onClick={handleClose}>Documentación</MenuItem>
              <MenuItem onClick={handleClose}>Contactar soporte</MenuItem>
            </Menu>

            <Tooltip title="Notificaciones">
              <Box sx={{ ml: 1 }}>
                <AlertSystem onlyShowIcon={true} />
              </Box>
            </Tooltip>
            <Menu
              anchorEl={notificationsAnchor}
              open={Boolean(notificationsAnchor)}
              onClose={handleClose}
              sx={{ mt: 1.5 }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Box sx={{ minWidth: 300, maxWidth: 360, p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Notificaciones
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ p: 1.5, backgroundColor: 'background.default', borderRadius: 1.5 }}>
                    <Typography variant="body2" fontWeight={500}>Alerta de stock bajo</Typography>
                    <Typography variant="caption" color="text.secondary">El alimento "Alfalfa" está por agotarse.</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, backgroundColor: 'background.default', borderRadius: 1.5 }}>
                    <Typography variant="body2" fontWeight={500}>Revisión veterinaria programada</Typography>
                    <Typography variant="caption" color="text.secondary">Mañana a las 10:00 AM</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, backgroundColor: 'background.default', borderRadius: 1.5 }}>
                    <Typography variant="body2" fontWeight={500}>Nueva venta registrada</Typography>
                    <Typography variant="caption" color="text.secondary">Se vendieron 5 cuyes por S/. 250</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 500 }}>
                    Ver todas las notificaciones
                  </Typography>
                </Box>
              </Box>
            </Menu>

            <Tooltip title="Configuración">
              <IconButton color="inherit" sx={{ ml: 1, borderRadius: 1.5, p: 1 }}>
                <Settings />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1.5, my: 1 }} />

            <Box 
              onClick={handleProfileMenu}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'background.default'
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  backgroundColor: 'primary.light',
                  color: 'white' 
                }}
              >
                <AccountCircle />
              </Avatar>
              <Box sx={{ ml: 1.5, display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600}>
                  Admin
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrador
                </Typography>
              </Box>
              <ExpandMore sx={{ ml: 0.5, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{ mt: 1.5 }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleClose}>Mi perfil</MenuItem>
              <MenuItem onClick={handleClose}>Configuración</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon sx={{ color: 'error.main' }}>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer para versión móvil */}
      <Drawer
        variant="temporary"
        open={isMobile ? open : false}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: 'none'
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer para versión desktop */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            boxShadow: '0 0 24px rgba(0,0,0,0.05)',
            border: 'none',
            overflow: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {open ? drawerContent : collapsedDrawerContent}
        
        {/* Botón para expandir/colapsar en desktop */}
        {!isMobile && (
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 16, 
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1
            }}
          >
            <IconButton
              onClick={handleDrawerToggle}
              size="small"
              sx={{ 
                backgroundColor: 'primary.main',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s'
              }}
            >
              <ChevronLeft />
            </IconButton>
          </Box>
        )}
      </Drawer>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: '100vh',
          backgroundColor: 'background.default',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginTop: { xs: '64px', sm: '70px' },
          pt: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 4, sm: 5 },
        }}
      >
        <Container 
          maxWidth={false}
          disableGutters 
          sx={{ 
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            px: { xs: 2, sm: 3, md: 3, lg: 4 }
          }}
        >
          <Box sx={{ 
            mb: { xs: 2, sm: 3 }, 
            display: 'flex', 
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 0.5,
                  fontWeight: 500
                }}
              >
                {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
                <KeyboardArrowRight sx={{ mx: 0.5, fontSize: 16 }} />
                <Typography 
                  component="span" 
                  variant="body2" 
                  color="text.primary"
                  fontWeight={600}
                >
                  {location.pathname === '/' ? 'Resumen' : 'Lista'}
                </Typography>
              </Typography>
              <Typography 
                variant="h4" 
                fontWeight={700}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {location.pathname === '/' && (
                  <Dashboard fontSize="large" color="primary" />
                )}
                {location.pathname === '/cuyes' && (
                  <Pets fontSize="large" color="primary" />
                )}
                {location.pathname === '/alimentos' && (
                  <Restaurant fontSize="large" color="primary" />
                )}
                {location.pathname === '/salud' && (
                  <LocalHospital fontSize="large" color="primary" />
                )}
                {location.pathname === '/ventas' && (
                  <PointOfSale fontSize="large" color="primary" />
                )}
                {location.pathname === '/gastos' && (
                  <MoneyOff fontSize="large" color="primary" />
                )}
                {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
              </Typography>
            </Box>
          </Box>
          <Paper 
            elevation={3} 
            sx={{
              mt: 2,
              mb: 4,
              borderRadius: 3,
              width: '100%', // Aseguramos que ocupe todo el ancho
              overflow: 'hidden',
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
              background: (theme) => `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => `0 10px 28px ${alpha(theme.palette.primary.main, 0.15)}`,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 3, md: 3 }, width: '100%' }}> {/* Ajustamos el padding y aseguramos ancho completo */}
              <Outlet />
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default SidebarLayout;
