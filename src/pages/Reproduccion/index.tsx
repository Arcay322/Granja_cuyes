import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Tabs, Tab } from '../../utils/mui';
import { Link as RouterLink } from 'react-router-dom';
import CamadasTable from '../../components/CamadasTable';
import PrenezTable from '../../components/PrenezTable';

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
      id={`reproduccion-tabpanel-${index}`}
      aria-labelledby={`reproduccion-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ReproduccionPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Gestión de Reproducción
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/" color="inherit">
            Inicio
          </Link>
          <Typography color="text.primary">Reproducción</Typography>
        </Breadcrumbs>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="Tabs de reproducción"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              backgroundColor: 'primary.main'
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minHeight: 56,
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }
          }}
        >
          <Tab 
            label="📦 Camadas" 
            id="reproduccion-tab-0" 
            aria-controls="reproduccion-tabpanel-0"
            sx={{ 
              '&.Mui-selected': { 
                color: '#2e7d32',
                backgroundColor: 'rgba(46, 125, 50, 0.08)'
              }
            }}
          />
          <Tab 
            label="🤰 Preñez" 
            id="reproduccion-tab-1" 
            aria-controls="reproduccion-tabpanel-1"
            sx={{ 
              '&.Mui-selected': { 
                color: '#e91e63',
                backgroundColor: 'rgba(233, 30, 99, 0.08)'
              }
            }}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <CamadasTable />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <PrenezTable />
      </TabPanel>
    </Box>
  );
};

export default ReproduccionPage;
