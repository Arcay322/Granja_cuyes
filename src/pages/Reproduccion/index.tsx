import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '../../utils/mui';
import { Link as RouterLink } from 'react-router-dom';
import { Home, NavigateNext } from '@mui/icons-material';
import ReproduccionManagerEnhanced from '../../components/ReproduccionManagerEnhanced';
import ErrorBoundary, { ReproductionErrorFallback } from '../../components/common/ErrorBoundary';

const ReproduccionPage: React.FC = () => {
  return (
    <Box 
      sx={{ 
        mt: { xs: 2, md: 4 }, 
        mb: { xs: 2, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Migas de pan */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ 
          mb: { xs: 2, md: 3 },
          px: { xs: 1, md: 0 }
        }}
      >
        <Link
          underline="hover"
          color="inherit"
          component={RouterLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Inicio
        </Link>
        <Typography color="text.primary">Reproducción</Typography>
      </Breadcrumbs>
      
      {/* Módulo de reproducción mejorado con todas las funcionalidades */}
      <ErrorBoundary 
        fallback={ReproductionErrorFallback}
        onError={(error, errorInfo) => {
          console.error('Error en módulo de reproducción:', error, errorInfo);
        }}
      >
        <ReproduccionManagerEnhanced />
      </ErrorBoundary>
    </Box>
  );
};

export default ReproduccionPage;
