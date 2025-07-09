import React from 'react';
import { Container, Typography, Box, Paper } from '../utils/mui';
import CriasManagementWidget from '../components/CriasManagementWidget';
import CamadasTable from '../components/CamadasTable';

const CriasTestPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sistema de Gestión de Crías - Prueba
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Esta página demuestra el sistema de gestión de crías. Cuando registras una camada,
          automáticamente se crean registros individuales para cada cría viva.
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <CriasManagementWidget />
      </Paper>
      
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Registro de Camadas
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Registra una nueva camada para ver cómo se crean automáticamente las crías.
          </Typography>
          <CamadasTable />
        </Box>
      </Paper>
    </Container>
  );
};

export default CriasTestPage;
