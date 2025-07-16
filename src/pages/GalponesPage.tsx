import React from 'react';
import { 
  Container, Typography, Box, Breadcrumbs, Link
} from '../utils/mui';
import { Home, NavigateNext } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import GalponesManagerFixed from '../components/GalponesManagerFixed';

const GalponesPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Migas de pan */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
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
        <Typography color="text.primary">Galpones</Typography>
      </Breadcrumbs>
      
      {/* Componente principal */}
      <GalponesManagerFixed />
    </Container>
  );
};

export default GalponesPage;
