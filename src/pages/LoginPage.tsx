import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TextField, Button, Box, Typography, Alert, Paper, Container, 
  Avatar, InputAdornment, IconButton, Card, CardContent, Grid,
  Checkbox, FormControlLabel, Divider, useTheme, alpha, CircularProgress
} from '../utils/mui';
import { 
  Visibility, VisibilityOff, Email, Lock, Pets,
  LoginOutlined, ArrowForward, ArrowBack
} from '@mui/icons-material';
import axios from '../services/api';
import cuyLogo from '../assets/cuy-logo.png';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si ya hay una sesión activa
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Limpiar cualquier token existente
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Hacer la solicitud de login
      const res = await axios.post('/auth/login', { email, password });
      
      // Guardar el token según la preferencia del usuario
      const token = res.data.token;
      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }
      
      // Verificar que el token se guardó correctamente
      console.log('Token guardado:', token);
      console.log('Token en localStorage:', localStorage.getItem('token'));
      console.log('Token en sessionStorage:', sessionStorage.getItem('token'));
      
      // Redirigir a la página principal
      navigate('/');
    } catch (err: any) {
      console.error('Error de login:', err);
      setError(err.response?.data?.message || 'Error de autenticación. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.primary.main, 0.8)})`,
        display: 'flex',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E")',
          opacity: 0.6,
          zIndex: 0,
        }
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          py: { xs: 4, md: 8 },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Grid container spacing={0} justifyContent="center" alignItems="center">
          {/* Panel izquierdo (visible solo en pantallas medianas y grandes) */}
          <Grid 
            item 
            md={6} 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 5,
              position: 'relative'
            }}
          >
            <Box 
              sx={{ 
                textAlign: 'center',
                animation: 'fadeIn 1s ease-out'
              }}
            >
              <Avatar
                src={cuyLogo}
                alt="Logo Granja de Cuyes"
                sx={{
                  width: 180,
                  height: 180,
                  mb: 4,
                  mx: 'auto',
                  backgroundColor: 'white',
                  p: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}
              />
              <Typography 
                variant="h2" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 800, 
                  mb: 2,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                Granja de Cuyes
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 400,
                  opacity: 0.9,
                  maxWidth: 500,
                  mx: 'auto',
                  lineHeight: 1.5,
                  mb: 4
                }}
              >
                Sistema de gestión integral para optimizar la administración de tu granja
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  p: 2, 
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  width: 160,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" color="white" fontWeight={700}>100%</Typography>
                  <Typography variant="body2" color="white" opacity={0.8}>Gestión Eficiente</Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  p: 2, 
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  width: 160,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" color="white" fontWeight={700}>24/7</Typography>
                  <Typography variant="body2" color="white" opacity={0.8}>Acceso Seguro</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          
          {/* Panel de login */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card 
              sx={{ 
                maxWidth: 450,
                width: '100%',
                borderRadius: 4,
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                p: { xs: 2, sm: 0 }
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                {/* Logo para móviles */}
                <Box 
                  sx={{ 
                    display: { xs: 'flex', md: 'none' }, 
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4
                  }}
                >
                  <Avatar
                    src={cuyLogo}
                    alt="Logo"
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      backgroundColor: 'white',
                      p: 1,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      textAlign: 'center',
                      color: 'primary.main'
                    }}
                  >
                    Granja de Cuyes
                  </Typography>
                </Box>

                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 1, 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <LoginOutlined color="primary" />
                  Iniciar Sesión
                </Typography>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 4 }}
                >
                  Accede a tu cuenta para gestionar tu granja
                </Typography>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <TextField
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                            aria-label={showPassword ? 'ocultar contraseña' : 'mostrar contraseña'}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 3,
                      flexWrap: 'wrap',
                      gap: 1
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={rememberMe} 
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">Recordarme</Typography>
                      }
                    />
                    <Typography 
                      variant="body2" 
                      color="primary" 
                      sx={{ 
                        cursor: 'pointer',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Typography>
                  </Box>

                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginOutlined />}
                    sx={{ 
                      py: 1.5,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 15px rgba(95, 141, 78, 0.4)',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
                        animation: 'shimmer 2s infinite',
                        zIndex: 0,
                      }
                    }}
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    o
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ¿No tienes una cuenta?
                  </Typography>
                  <Button 
                    variant="outlined"
                    fullWidth
                    component={Link}
                    to="/register"
                    endIcon={<ArrowForward />}
                    sx={{ 
                      fontWeight: 500,
                      py: 1.2,
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      }
                    }}
                  >
                    Crear una cuenta
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box 
          sx={{ 
            mt: { xs: 4, md: 8 }, 
            textAlign: 'center',
            color: 'white',
            opacity: 0.8
          }}
        >
          <Typography variant="body2">
            © {new Date().getFullYear()} Granja de Cuyes. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
