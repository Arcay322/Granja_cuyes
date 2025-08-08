import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Breadcrumbs, Link, Grid, Card, CardContent,
  Avatar, useTheme, alpha, Chip, IconButton, Button, Divider,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Collapse, CircularProgress, Alert, Badge, Tooltip, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '../utils/mui';
import {
  Home, Warehouse, GridOn, Pets, ExpandLess, ExpandMore,
  Add, ArrowBack, Refresh, Filter, Sort, Analytics, MoreVert,
  Edit, Delete, Warning
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';
import { isSuccessfulApiResponse } from '../utils/typeGuards';
import CuyesTable from './CuyesTable';
import RegistroJaulaForm from './RegistroJaulaForm';
import GalponForm from './GalponForm';

interface GalponData {
  galpon: string;
  totalJaulas: number;
  totalCuyes: number;
  jaulas: JaulaData[];
  descripcion?: string;
  ubicacion?: string;
  capacidadMaxima?: number;
  estado?: string;
}

interface JaulaData {
  jaula: string;
  galpon: string;
  totalCuyes: number;
  cuyesPorSexo: {
    machos: number;
    hembras: number;
  };
  razas: string[];
  edadPromedio: number;
  descripcion?: string;
  capacidadMaxima?: number;
  tipo?: string;
  estado?: string;
}

interface Cuy {
  id: number;
  raza: string;
  fechaNacimiento: string;
  sexo: string;
  peso: number;
  galpon: string;
  jaula: string;
  estado: string;
  etapaVida?: string;
  proposito?: string;
}

const GalponesJaulasNavigator: React.FC = () => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<'galpones' | 'jaulas' | 'cuyes'>('galpones');
  const [selectedGalpon, setSelectedGalpon] = useState<string>('');
  const [selectedJaula, setSelectedJaula] = useState<string>('');
  
  const [galpones, setGalpones] = useState<GalponData[]>([]);
  const [jaulas, setJaulas] = useState<JaulaData[]>([]);
  const [cuyes, setCuyes] = useState<Cuy[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [expandedGalpones, setExpandedGalpones] = useState<string[]>([]);
  const [showRegistroForm, setShowRegistroForm] = useState(false);
  
  // Estados para formularios CRUD
  const [showGalponForm, setShowGalponForm] = useState(false);
  const [showJaulaForm, setShowJaulaForm] = useState(false);
  const [editingGalpon, setEditingGalpon] = useState<GalponData | null>(null);
  const [galponFormMode, setGalponFormMode] = useState<'create' | 'edit'>('create');
  
  // Estados para confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'galpon' | 'jaula', data: any} | null>(null);
  
  // Estados para menús contextuales
  const [galponMenuAnchor, setGalponMenuAnchor] = useState<{element: HTMLElement, galpon: GalponData} | null>(null);
  const [jaulaMenuAnchor, setJaulaMenuAnchor] = useState<{element: HTMLElement, jaula: JaulaData} | null>(null);

  // Cargar datos según la vista actual
  useEffect(() => {
    loadData();
  }, [currentView, selectedGalpon, selectedJaula]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentView === 'galpones') {
        await loadGalpones();
      } else if (currentView === 'jaulas') {
        await loadJaulas();
      } else if (currentView === 'cuyes') {
        await loadCuyes();
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toastService.error('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadGalpones = async () => {
    try {
      const response = await api.get('/cuyes/galpones/resumen');
      if (isSuccessfulApiResponse<GalponData[]>(response.data)) {
        setGalpones(response.data.data);
      }
    } catch (error) {
      // Si no existe el endpoint, generar datos desde cuyes existentes
      const cuyesResponse = await api.get('/cuyes');
      if (!isSuccessfulApiResponse<Cuy[]>(cuyesResponse.data)) return;
      const cuyesData = cuyesResponse.data.data;
      
      const galponesMap = new Map<string, GalponData>();
      
      cuyesData.forEach((cuy: Cuy) => {
        if (!galponesMap.has(cuy.galpon)) {
          galponesMap.set(cuy.galpon, {
            galpon: cuy.galpon,
            totalJaulas: 0,
            totalCuyes: 0,
            jaulas: []
          });
        }
        
        const galponData = galponesMap.get(cuy.galpon)!;
        galponData.totalCuyes++;
        
        // Agregar jaula si no existe
        const jaulaExists = galponData.jaulas.some(j => j.jaula === cuy.jaula);
        if (!jaulaExists) {
          galponData.jaulas.push({
            jaula: cuy.jaula,
            galpon: cuy.galpon,
            totalCuyes: 1,
            cuyesPorSexo: { machos: 0, hembras: 0 },
            razas: [],
            edadPromedio: 0
          });
          galponData.totalJaulas++;
        }
      });
      
      setGalpones(Array.from(galponesMap.values()));
    }
  };

  const loadJaulas = async () => {
    try {
      const response = await api.get(`/cuyes/galpones/${selectedGalpon}/jaulas`);
      if (isSuccessfulApiResponse<JaulaData[]>(response.data)) {
        setJaulas(response.data.data);
      }
    } catch (error) {
      // Generar desde datos existentes
      const cuyesResponse = await api.get('/cuyes');
      const cuyesData = isSuccessfulApiResponse<Cuy[]>(cuyesResponse.data) 
        ? cuyesResponse.data.data.filter((cuy: Cuy) => cuy.galpon === selectedGalpon)
        : [];
      
      const jaulasMap = new Map<string, JaulaData>();
      
      cuyesData.forEach((cuy: Cuy) => {
        if (!jaulasMap.has(cuy.jaula)) {
          jaulasMap.set(cuy.jaula, {
            jaula: cuy.jaula,
            galpon: cuy.galpon,
            totalCuyes: 0,
            cuyesPorSexo: { machos: 0, hembras: 0 },
            razas: [],
            edadPromedio: 0
          });
        }
        
        const jaulaData = jaulasMap.get(cuy.jaula)!;
        jaulaData.totalCuyes++;
        
        if (cuy.sexo === 'M') jaulaData.cuyesPorSexo.machos++;
        if (cuy.sexo === 'H') jaulaData.cuyesPorSexo.hembras++;
        
        if (!jaulaData.razas.includes(cuy.raza)) {
          jaulaData.razas.push(cuy.raza);
        }
      });
      
      setJaulas(Array.from(jaulasMap.values()));
    }
  };

  const loadCuyes = async () => {
    try {
      const response = await api.get(`/cuyes?galpon=${selectedGalpon}&jaula=${selectedJaula}`);
      if (isSuccessfulApiResponse<Cuy[]>(response.data)) {
        setCuyes(response.data.data);
      }
    } catch (error) {
      // Filtrar desde todos los cuyes
      const cuyesResponse = await api.get('/cuyes');
      const filteredCuyes = isSuccessfulApiResponse<Cuy[]>(cuyesResponse.data)
        ? cuyesResponse.data.data.filter((cuy: Cuy) => cuy.galpon === selectedGalpon && cuy.jaula === selectedJaula)
        : [];
      setCuyes(filteredCuyes);
    }
  };

  const handleGalponClick = (galpon: string) => {
    setSelectedGalpon(galpon);
    setCurrentView('jaulas');
  };

  const handleJaulaClick = (jaula: string) => {
    setSelectedJaula(jaula);
    setCurrentView('cuyes');
  };

  const handleBack = () => {
    if (currentView === 'cuyes') {
      setCurrentView('jaulas');
      setSelectedJaula('');
    } else if (currentView === 'jaulas') {
      setCurrentView('galpones');
      setSelectedGalpon('');
    }
  };

  const toggleGalponExpanded = (galpon: string) => {
    setExpandedGalpones(prev => 
      prev.includes(galpon) 
        ? prev.filter(g => g !== galpon)
        : [...prev, galpon]
    );
  };

  // Funciones para CRUD de Galpones
  const handleCreateGalpon = () => {
    setEditingGalpon(null);
    setGalponFormMode('create');
    setShowGalponForm(true);
  };

  const handleEditGalpon = (galpon: GalponData) => {
    setEditingGalpon(galpon);
    setGalponFormMode('edit');
    setShowGalponForm(true);
    setGalponMenuAnchor(null);
  };

  const handleDeleteGalpon = (galpon: GalponData) => {
    setDeleteTarget({ type: 'galpon', data: galpon });
    setConfirmDelete(true);
    setGalponMenuAnchor(null);
  };

  // Funciones para CRUD de Jaulas
  const handleCreateJaula = () => {
    setShowJaulaForm(true);
  };

  const handleEditJaula = (jaula: JaulaData) => {
    // Para editar, podemos abrir el RegistroJaulaForm con datos pre-poblados
    setShowJaulaForm(true);
    setJaulaMenuAnchor(null);
  };

  const handleDeleteJaula = (jaula: JaulaData) => {
    setDeleteTarget({ type: 'jaula', data: jaula });
    setConfirmDelete(true);
    setJaulaMenuAnchor(null);
  };

  // Función para confirmar eliminación
  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      if (deleteTarget.type === 'galpon') {
        await api.delete(`/galpones/${deleteTarget.data.galpon}`);
        toastService.success(
          'Galpón Eliminado',
          `El galpón "${deleteTarget.data.galpon}" ha sido eliminado`
        );        } else {
          await api.delete(`/jaulas/${deleteTarget.data.galpon}/${deleteTarget.data.jaula}`);
          toastService.success(
            'Jaula Eliminada',
            `La jaula "${deleteTarget.data.jaula}" ha sido eliminada`
          );
        }
      
      setConfirmDelete(false);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      console.error('Error al eliminar:', err);
      toastService.error(
        'Error al Eliminar',
(err as any).response?.data?.message || `No se pudo eliminar ${deleteTarget.type === 'galpon' ? 'el galpón' : 'la jaula'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const renderBreadcrumbs = () => (
    <Breadcrumbs sx={{ mb: 2 }}>
      <Link
        component="button"
        variant="body1"
        onClick={() => setCurrentView('galpones')}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <Home fontSize="small" />
        Galpones
      </Link>
      
      {selectedGalpon && (
        <Link
          component="button"
          variant="body1"
          onClick={() => setCurrentView('jaulas')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Warehouse fontSize="small" />
          {selectedGalpon}
        </Link>
      )}
      
      {selectedJaula && (
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <GridOn fontSize="small" />
          {selectedJaula}
        </Typography>
      )}
    </Breadcrumbs>
  );

  const renderGalponesView = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          {galpones.length} galpones encontrados
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateGalpon}
        >
          Nuevo Galpón
        </Button>
      </Box>

      <Grid container spacing={3}>
        {galpones.map((galpon) => (
          <Grid item xs={12} sm={6} md={4} key={galpon.galpon}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }} onClick={() => handleGalponClick(galpon.galpon)}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Warehouse />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Galpón {galpon.galpon}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {galpon.totalJaulas} jaulas
                      </Typography>
                      {galpon.estado && (
                        <Chip 
                          label={galpon.estado}
                          size="small"
                          color={galpon.estado === 'Activo' ? 'success' : galpon.estado === 'Mantenimiento' ? 'warning' : 'error'}
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalponMenuAnchor({ element: e.currentTarget, galpon });
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
                
                {galpon.descripcion && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} onClick={() => handleGalponClick(galpon.galpon)}>
                    {galpon.descripcion}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }} onClick={() => handleGalponClick(galpon.galpon)}>
                  <Chip
                    label={`${galpon.totalCuyes} cuyes`}
                    color="primary"
                    variant="outlined"
                    icon={<Pets />}
                  />
                  <Chip
                    label={`${galpon.totalJaulas} jaulas`}
                    color="secondary"
                    variant="outlined"
                    icon={<GridOn />}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderJaulasView = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          {jaulas.length} jaulas en galpón {selectedGalpon}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateJaula}
        >
          Nueva Jaula
        </Button>
      </Box>

      <Grid container spacing={3}>
        {jaulas.map((jaula) => (
          <Grid item xs={12} sm={6} md={4} key={jaula.jaula}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }} onClick={() => handleJaulaClick(jaula.jaula)}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <GridOn />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Jaula {jaula.jaula}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {jaula.totalCuyes} cuyes total
                      </Typography>
                      {jaula.tipo && (
                        <Chip 
                          label={jaula.tipo}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setJaulaMenuAnchor({ element: e.currentTarget, jaula });
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }} onClick={() => handleJaulaClick(jaula.jaula)}>
                  {jaula.cuyesPorSexo.machos > 0 && (
                    <Chip 
                      label={`${jaula.cuyesPorSexo.machos} ♂`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {jaula.cuyesPorSexo.hembras > 0 && (
                    <Chip 
                      label={`${jaula.cuyesPorSexo.hembras} ♀`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }} onClick={() => handleJaulaClick(jaula.jaula)}>
                  {jaula.razas.slice(0, 2).map((raza) => (
                    <Chip 
                      key={raza}
                      label={raza}
                      size="small"
                      variant="filled"
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    />
                  ))}
                  {jaula.razas.length > 2 && (
                    <Chip 
                      label={`+${jaula.razas.length - 2}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderCuyesView = () => (
    <Box>
      <CuyesTable 
        filtroGalpon={selectedGalpon}
        filtroJaula={selectedJaula}
        showLocationColumns={false}
      />
    </Box>
  );

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header con navegación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {currentView !== 'galpones' && (
              <IconButton onClick={handleBack} size="small">
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h5" fontWeight={600}>
              {currentView === 'galpones' && 'Gestión por Galpones'}
              {currentView === 'jaulas' && `Jaulas del Galpón ${selectedGalpon}`}
              {currentView === 'cuyes' && `Cuyes de ${selectedGalpon} - ${selectedJaula}`}
            </Typography>
          </Box>
          {renderBreadcrumbs()}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="info"
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
            sx={{
              fontWeight: 'bold',
              '&:hover': {
                transform: 'rotate(90deg)',
                transition: 'transform 0.3s ease'
              }
            }}
          >
            Actualizar
          </Button>
          
          {currentView === 'cuyes' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowRegistroForm(true)}
            >
              Agregar Cuyes
            </Button>
          )}
        </Box>
      </Box>

      {/* Contenido principal */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {currentView === 'galpones' && renderGalponesView()}
          {currentView === 'jaulas' && renderJaulasView()}
          {currentView === 'cuyes' && renderCuyesView()}
        </>
      )}

      {/* Modal de registro */}
      <RegistroJaulaForm
        open={showRegistroForm}
        onClose={() => setShowRegistroForm(false)}
        onSuccess={() => {
          setShowRegistroForm(false);
          loadData();
        }}
        defaultGalpon={selectedGalpon}
        defaultJaula={selectedJaula}
      />

      {/* Formulario de Galpón */}
      <GalponForm
        open={showGalponForm}
        onClose={() => setShowGalponForm(false)}
        onSuccess={() => {
          setShowGalponForm(false);
          loadData();
        }}
        galpon={editingGalpon ? {
          nombre: editingGalpon.galpon,
          descripcion: editingGalpon.descripcion,
          ubicacion: editingGalpon.ubicacion,
          capacidadMaxima: editingGalpon.capacidadMaxima,
          estado: editingGalpon.estado
        } : null}
        mode={galponFormMode}
      />

      {/* Formulario de Jaula - Reutilizando RegistroJaulaForm */}
      <RegistroJaulaForm
        open={showJaulaForm}
        onClose={() => setShowJaulaForm(false)}
        onSuccess={() => {
          setShowJaulaForm(false);
          loadData();
        }}
        defaultGalpon={selectedGalpon}
        defaultJaula="" // Para crear jaula nueva, dejar vacío
        mode="create-empty-jaula" // Modo para crear jaula vacía
      />

      {/* Menú contextual para Galpones */}
      <Menu
        anchorEl={galponMenuAnchor?.element}
        open={Boolean(galponMenuAnchor)}
        onClose={() => setGalponMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 160 }
        }}
      >
        <MenuItem onClick={() => handleEditGalpon(galponMenuAnchor!.galpon)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteGalpon(galponMenuAnchor!.galpon)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Menú contextual para Jaulas */}
      <Menu
        anchorEl={jaulaMenuAnchor?.element}
        open={Boolean(jaulaMenuAnchor)}
        onClose={() => setJaulaMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 160 }
        }}
      >
        <MenuItem onClick={() => {
          setSelectedJaula(jaulaMenuAnchor!.jaula.jaula);
          setShowRegistroForm(true);
          setJaulaMenuAnchor(null);
        }}>
          <Add fontSize="small" sx={{ mr: 1 }} />
          Agregar Cuyes
        </MenuItem>
        <MenuItem onClick={() => handleEditJaula(jaulaMenuAnchor!.jaula)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteJaula(jaulaMenuAnchor!.jaula)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.type === 'galpon' 
              ? `¿Estás seguro de que deseas eliminar el galpón "${deleteTarget.data.galpon}"? Esta acción eliminará también todas las jaulas y cuyes asociados.`
              : `¿Estás seguro de que deseas eliminar la jaula "${deleteTarget?.data.jaula}"? Esta acción eliminará también todos los cuyes asociados.`
            }
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. Todos los datos asociados se perderán permanentemente.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDeleteAction}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default GalponesJaulasNavigator;
