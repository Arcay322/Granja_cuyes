import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Box, Typography, Alert, Paper, Grid, Container,
  IconButton, InputAdornment, Divider, Link, alpha, useTheme,
  CircularProgress
} from '../utils/mui';
import { 
  Email, Lock, Visibility, VisibilityOff, Person, ArrowBack,
  CheckCircleOutline, PersonAdd
} from '@mui/icons-material';
import axios from '../services/api';
import cuyLogo from '../assets/cuy-logo.png';

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      // Limpiar cualquier token existente para evitar problemas
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Realizar el registro
      const response = await axios.post('/auth/register', { email, password, name });
      console.log('Respuesta de registro:', response.data);
      
      // Mostrar mensaje de éxito
      setSuccess('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      
      // Esperar 2 segundos y redireccionar al login
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      console.error('Error de registro:', err);
      setError(err.response?.data?.message || 'Error en el registro. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        backgroundImage: `linear-gradient(to bottom right, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.secondary.light, 0.2)})`,
        p: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="md" disableGutters>
        <Paper 
          elevation={8}
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          {/* Panel lateral izquierdo con imagen y texto */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
              width: '45%',
              bgcolor: theme.palette.primary.main,
              color: 'white',
              position: 'relative',
              backgroundImage: 'linear-gradient(135deg, #5F8D4E 30%, #285430 90%)',
              textAlign: 'center',
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                opacity: 0.1,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="1" fill-rule="evenodd"/%3E%3C/svg%3E")',
              }}
            />
            <img 
              src={cuyLogo} 
              alt="Cuyes Logo" 
              style={{ 
                width: '120px', 
                height: 'auto',
                marginBottom: '2rem',
                filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.2))'
              }}
            />
            <Typography variant="h4" component="h1" fontWeight={700} mb={3}>
              Granja de Cuyes
            </Typography>
            <Typography variant="body1" mb={4}>
              Únete a nuestra plataforma para gestionar de forma eficiente todos los aspectos de tu granja.
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                width: '100%',
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleOutline sx={{ mr: 1 }} />
                <Typography>Gestión completa de inventario</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleOutline sx={{ mr: 1 }} />
                <Typography>Control de alimentación</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleOutline sx={{ mr: 1 }} />
                <Typography>Seguimiento de salud</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutline sx={{ mr: 1 }} />
                <Typography>Reportes financieros</Typography>
              </Box>
            </Box>
          </Box>

          {/* Panel derecho con formulario */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 3, sm: 4, md: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
              <img src={cuyLogo} alt="Cuyes Logo" style={{ width: '80px', height: 'auto' }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <IconButton 
                color="primary" 
                onClick={() => navigate('/login')}
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h5" component="h1" fontWeight="bold">
                Crear una Cuenta
              </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" mb={3}>
              Completa el formulario para registrarte en la plataforma
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
            
            {success && (
              <Alert 
                severity="success" 
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<CheckCircleOutline />}
              >
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Nombre completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Ingresa tu nombre completo"
                  />
                </Grid>
                <Grid item xs={12}>
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
                          <Email color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="ejemplo@granja.com"
                  />
                </Grid>
                <Grid item xs={12}>
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
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="La contraseña debe tener al menos 6 caracteres"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Confirmar contraseña"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={toggleConfirmPasswordVisibility}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                size="large"
                sx={{ 
                  mt: 4, 
                  py: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                  }
                }}
                disabled={isLoading}
                startIcon={<PersonAdd />}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Crear cuenta'
                )}
              </Button>
            </form>

            <Divider sx={{ my: 4 }}>
              <Typography variant="body2" color="text.secondary">
                O
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes una cuenta?{' '}
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={() => navigate('/login')}
                  underline="hover"
                  fontWeight="bold"
                  color="primary"
                >
                  Inicia sesión
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
