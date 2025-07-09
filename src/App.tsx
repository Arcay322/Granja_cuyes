import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from './utils/mui';
import { Toaster } from 'react-hot-toast';
import theme from './theme/CuyesTheme';
import DashboardPage from './pages/DashboardPage';
import CuyesPage from './pages/CuyesPage';
import GalponesPage from './pages/GalponesPage';
import AlimentosPage from './pages/AlimentosPage';
import SaludPage from './pages/SaludPage';
import VentasPage from './pages/VentasPage';
import GastosPage from './pages/GastosPage';
import ReproduccionPage from './pages/Reproduccion';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SidebarLayout from './layouts/SidebarLayout';
import PrivateRoute from './components/PrivateRoute';
import { NotificationProvider } from './contexts/NotificationContext';
import { useSystemNotifications } from './hooks/useSystemNotifications';
import './App.css';

// Componente interno que usa el hook de notificaciones del sistema
const AppContent = () => {
  // Inicializar las notificaciones del sistema con parámetros más conservadores
  useSystemNotifications({
    stockCriticoThreshold: 2,  // Solo cuando el stock esté muy bajo (<=2kg)
    vacunacionDaysAhead: 7,    // Solo una semana antes de necesitar vacunación
    partoDaysAhead: 3,         // Solo 3 días antes del parto
    checkInterval: 30,         // revisar cada 30 minutos
  });

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<PrivateRoute />}>
          <Route element={<SidebarLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cuyes" element={<CuyesPage />} />
            <Route path="/galpones" element={<GalponesPage />} />
            <Route path="/alimentos" element={<AlimentosPage />} />
            <Route path="/salud" element={<SaludPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/gastos" element={<GastosPage />} />
            <Route path="/reproduccion" element={<ReproduccionPage />} />
          </Route>
        </Route>
      </Routes>
      
      {/* Toaster para notificaciones de acciones del usuario */}
      <Toaster 
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '16px',
          },
        }}
      />
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
