import React from 'react';
import { 
  Container, Typography, Box, Breadcrumbs, Link, Paper
} from '../utils/mui';
import { Home, Warehouse } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import GalponesJaulasNavigator from '../components/GalponesJaulasNavigator';

const GalponesPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Home fontSize="small" />
            Inicio
          </Link>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warehouse fontSize="small" />
            Gestión por Galpones
          </Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Gestión por Galpones y Jaulas
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Navega y gestiona tus cuyes organizados por galpones y jaulas para un control más eficiente de la granja.
        </Typography>
      </Box>

      <GalponesJaulasNavigator />
    </Container>
  );
};

export default GalponesPage;
