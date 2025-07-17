import React from 'react';
import { 
  Container, Typography, Box, Breadcrumbs, Link
} from '../utils/mui';
import { Home, NavigateNext } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import CuyesManagerFixed from '../components/CuyesManagerFixed';

const CuyesPage: React.FC = () => {
  return (
    <Container 
      maxWidth="xl" 
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
        <Typography color="text.primary">Cuyes</Typography>
      </Breadcrumbs>
      
      {/* Componente principal */}
      <CuyesManagerFixed />
    </Container>
  );
};

export default CuyesPage;
