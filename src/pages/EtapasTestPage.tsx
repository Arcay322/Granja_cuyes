import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '../utils/mui';
import EtapasManagementWidget from '../components/EtapasManagementWidget';
import CuyesTable from '../components/CuyesTable';

const EtapasTestPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sistema de Gestión de Etapas de Vida - Demostración
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Este sistema gestiona automáticamente las etapas de vida de los cuyes según su edad, sexo y propósito.
          Las transiciones pueden ser automáticas (basadas en edad) o manuales (según decisiones del usuario).
        </Typography>
        
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50' }}>
          <Typography variant="h6" gutterBottom color="info.main">
            📋 Etapas Disponibles:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Cría (0-3 meses):</strong> Recién nacidos
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Juvenil (3-6 meses):</strong> En crecimiento
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Engorde (6+ meses):</strong> Listos para venta
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Reproductor/a (6+ meses):</strong> Para reproducción
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <EtapasManagementWidget />
      </Paper>
      
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Tabla de Cuyes con Etapas
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Aquí puedes ver todos los cuyes con sus etapas de vida actuales.
            Las etapas se actualizan automáticamente según la edad o manualmente según las decisiones de manejo.
          </Typography>
          <CuyesTable />
        </Box>
      </Paper>
    </Container>
  );
};

export default EtapasTestPage;
