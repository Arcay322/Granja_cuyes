import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Container, Paper
} from '../utils/mui';
import {
  Dashboard, PregnantWoman, ChildCare, CalendarMonth, 
  NotificationsActive, Assessment, Analytics
} from '@mui/icons-material';

// Importar los componentes nuevos
import ReproductiveDashboard from './dashboard/ReproductiveDashboard';
import ReproductiveCalendar from './calendar/ReproductiveCalendar';
import AlertsManager from './alerts/AlertsManager';
import ReportsGenerator from './reports/ReportsGenerator';

// Importar el componente original para las funciones básicas
import ReproduccionManagerFixedClean from './ReproduccionManagerFixedClean';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reproduction-tabpanel-${index}`}
      aria-labelledby={`reproduction-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `reproduction-tab-${index}`,
    'aria-controls': `reproduction-tabpanel-${index}`,
  };
}

const ReproduccionManagerEnhanced: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%' }}>
        {/* Título principal */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Gestión de Reproducción
        </Typography>

        {/* Tabs principales */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<Dashboard />}
              label="Dashboard"
              {...a11yProps(0)}
            />
            <Tab
              icon={<PregnantWoman />}
              label="Gestión de Preñez"
              {...a11yProps(1)}
            />
            <Tab
              icon={<CalendarMonth />}
              label="Calendario Reproductivo"
              {...a11yProps(2)}
            />
            <Tab
              icon={<NotificationsActive />}
              label="Alertas"
              {...a11yProps(3)}
            />
            <Tab
              icon={<Assessment />}
              label="Reportes"
              {...a11yProps(4)}
            />
            <Tab
              icon={<Analytics />}
              label="Análisis Avanzado"
              {...a11yProps(5)}
            />
          </Tabs>
        </Paper>

        {/* Contenido de cada tab */}
        <TabPanel value={currentTab} index={0}>
          <ReproductiveDashboard />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <ReproduccionManagerFixedClean />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <ReproductiveCalendar />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <AlertsManager />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <ReportsGenerator />
        </TabPanel>

        <TabPanel value={currentTab} index={5}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Análisis Avanzado
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Funcionalidades de análisis avanzado en desarrollo.
              Aquí se incluirán análisis predictivos, tendencias genéticas,
              y recomendaciones de mejora reproductiva.
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default ReproduccionManagerEnhanced;