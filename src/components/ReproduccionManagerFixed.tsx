import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Alert, CircularProgress, useTheme, alpha,
  Paper, Divider, IconButton, Tooltip, TablePagination,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Grid, Fab
} from '../utils/mui';
import {
  Pets, Add, Edit, Delete, Analytics, Warning,
  Male, Female, Search, FilterList, Refresh, Close,
  PregnantWoman, ChildCare, Schedule, Favorite, Science, Assessment
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';
import { Cuy } from '../types';

// Importar componentes avanzados
import ReproductorSelectionDialog from './ReproductorSelectionDialog';
import CompatibilidadReproductiva from './CompatibilidadReproductiva';
import EstadisticasReproduccionWidget from './EstadisticasReproduccionWidget';
import RecomendacionesReproductivasWidget from './RecomendacionesReproductivasWidget';
import AlertasReproduccionWidget from './AlertasReproduccionWidget';

interface ReproduccionManagerProps {
  showNewPrenezButton?: boolean;
  showNewCamadaButton?: boolean;
  showViewToggle?: boolean;
  showFiltersPanel?: boolean;
  showStats?: boolean;
  showTitle?: boolean;
  showAlertas?: boolean;
  initialView?: 'prenez' | 'camadas';
}

interface Prenez {
  id: number;
  madreId: number;
  padreId?: number;
  fechaPrenez: string;
  fechaProbableParto: string;
  notas?: string;
  estado: string;
  madre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
  };
  padre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
  };
}

interface Camada {
  id: number;
  fechaNacimiento: string;
  numVivos: number;
  numMuertos: number;
  padreId?: number;
  madreId?: number;
  madre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
  };
  padre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
  };
}

const ReproduccionManagerFixed: React.FC<ReproduccionManagerProps> = ({
  showNewPrenezButton = true,
  showNewCamadaButton = true,
  showStats = true,
  showTitle = true,
  initialView = 'prenez'
}) => {
  const theme = useTheme();
  
  // Estados principales
  const [currentTab, setCurrentTab] = useState<'prenez' | 'camadas'>(initialView);
  const [preneces, setPreneces] = useState<Prenez[]>([]);
  const [camadas, setCamadas] = useState<Camada[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para formularios
  const [showPrenezForm, setShowPrenezForm] = useState(false);
  const [showCamadaForm, setShowCamadaForm] = useState(false);
  const [editingPrenez, setEditingPrenez] = useState<Prenez | null>(null);
  const [editingCamada, setEditingCamada] = useState<Camada | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Estados para datos de formularios
  const [prenezFormData, setPrenezFormData] = useState({
    madreId: '',
    padreId: '',
    fechaPrenez: new Date().toISOString().split('T')[0],
    notas: ''
  });
  
  const [camadaFormData, setCamadaFormData] = useState({
    fechaNacimiento: new Date().toISOString().split('T')[0],
    numVivos: '',
    numMuertos: '',
    madreId: '',
    padreId: '',
    numMachos: '',
    numHembras: ''
  });

  // Estados para datos auxiliares
  const [availableCuyes, setAvailableCuyes] = useState<Cuy[]>([]);
  
  // Estados para componentes avanzados
  const [showReproductorDialog, setShowReproductorDialog] = useState(false);
  const [reproductorDialogType, setReproductorDialogType] = useState<'madre' | 'padre'>('madre');
  const [availableReproductores, setAvailableReproductores] = useState<any[]>([]);
  const [reproductorLoading, setReproductorLoading] = useState(false);
  const [showCompatibilidadDialog, setShowCompatibilidadDialog] = useState(false);
  const [selectedMadreId, setSelectedMadreId] = useState<number | undefined>();
  const [selectedPadreId, setSelectedPadreId] = useState<number | undefined>();

  // Funciones de carga de datos
  const fetchPreneces = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/reproduccion/prenez');
      const data = response.data as any;

      if (data.success) {
        setPreneces(data.data || []);
      }
    } catch (error) {
      console.error('Error al obtener preñeces:', error);
      toastService.error('Error', 'No se pudieron cargar las preñeces');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCamadas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/reproduccion/camadas');
      const data = response.data as any;

      if (data.success) {
        setCamadas(data.data || []);
      }
    } catch (error) {
      console.error('Error al obtener camadas:', error);
      toastService.error('Error', 'No se pudieron cargar las camadas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableCuyes = useCallback(async () => {
    try {
      const response = await api.get('/cuyes', {
        params: {
          estado: 'Activo',
          limit: 500,
          page: 1
        }
      });
      const data = response.data as any;
      if (data.success) {
        setAvailableCuyes(data.data || []);
      }
    } catch (error) {
      console.error('Error al obtener cuyes disponibles:', error);
      toastService.error('Error', 'Error al cargar cuyes disponibles');
    }
  }, []);

  // Efectos
  useEffect(() => {
    if (currentTab === 'prenez') {
      fetchPreneces();
    } else {
      fetchCamadas();
    }
  }, [currentTab, fetchPreneces, fetchCamadas]); 
 // Funciones para manejar formularios
  const handleOpenPrenezForm = (prenez?: Prenez) => {
    if (prenez) {
      setEditingPrenez(prenez);
      setPrenezFormData({
        madreId: prenez.madreId.toString(),
        padreId: prenez.padreId?.toString() || '',
        fechaPrenez: prenez.fechaPrenez.split('T')[0],
        notas: prenez.notas || ''
      });
    } else {
      setEditingPrenez(null);
      setPrenezFormData({
        madreId: '',
        padreId: '',
        fechaPrenez: new Date().toISOString().split('T')[0],
        notas: ''
      });
    }
    fetchAvailableCuyes();
    setShowPrenezForm(true);
  };

  const handleOpenCamadaForm = (camada?: Camada) => {
    if (camada) {
      setEditingCamada(camada);
      setCamadaFormData({
        fechaNacimiento: camada.fechaNacimiento.split('T')[0],
        numVivos: camada.numVivos.toString(),
        numMuertos: camada.numMuertos.toString(),
        madreId: camada.madreId?.toString() || '',
        padreId: camada.padreId?.toString() || '',
        numMachos: '',
        numHembras: ''
      });
    } else {
      setEditingCamada(null);
      setCamadaFormData({
        fechaNacimiento: new Date().toISOString().split('T')[0],
        numVivos: '',
        numMuertos: '',
        madreId: '',
        padreId: '',
        numMachos: '',
        numHembras: ''
      });
    }
    fetchAvailableCuyes();
    setShowCamadaForm(true);
  };

  const handleCloseForms = () => {
    setShowPrenezForm(false);
    setShowCamadaForm(false);
    setEditingPrenez(null);
    setEditingCamada(null);
  };

  const handleSubmitPrenez = async () => {
    try {
      setFormLoading(true);
      
      if (!prenezFormData.madreId) {
        toastService.error('Error', 'Debe seleccionar una madre');
        return;
      }

      const dataToSend = {
        madreId: Number(prenezFormData.madreId),
        padreId: prenezFormData.padreId ? Number(prenezFormData.padreId) : null,
        fechaPrenez: prenezFormData.fechaPrenez,
        notas: prenezFormData.notas || null
      };

      if (editingPrenez) {
        await api.put(`/reproduccion/prenez/${editingPrenez.id}`, dataToSend);
        toastService.success('Éxito', 'Preñez actualizada correctamente');
      } else {
        await api.post('/reproduccion/prenez', dataToSend);
        toastService.success('Éxito', 'Preñez registrada correctamente');
      }

      handleCloseForms();
      fetchPreneces();
    } catch (error: any) {
      console.error('Error al guardar preñez:', error);
      toastService.error('Error', error.response?.data?.message || 'Error al guardar la preñez');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitCamada = async () => {
    try {
      setFormLoading(true);
      
      if (!camadaFormData.numVivos && camadaFormData.numVivos !== '0') {
        toastService.error('Error', 'Debe especificar el número de crías vivas');
        return;
      }

      const numVivos = Number(camadaFormData.numVivos);
      const numMachos = Number(camadaFormData.numMachos) || 0;
      const numHembras = Number(camadaFormData.numHembras) || 0;

      if (numVivos > 0 && (numMachos + numHembras !== numVivos)) {
        toastService.error('Error', `La suma de machos (${numMachos}) y hembras (${numHembras}) debe ser igual al número de crías vivas (${numVivos})`);
        return;
      }

      const dataToSend = {
        fechaNacimiento: camadaFormData.fechaNacimiento,
        numVivos: numVivos,
        numMuertos: Number(camadaFormData.numMuertos) || 0,
        madreId: camadaFormData.madreId ? Number(camadaFormData.madreId) : null,
        padreId: camadaFormData.padreId ? Number(camadaFormData.padreId) : null,
        numMachos: numMachos,
        numHembras: numHembras,
        crearCuyes: numVivos > 0
      };

      if (editingCamada) {
        await api.put(`/reproduccion/camadas/${editingCamada.id}`, dataToSend);
        toastService.success('Éxito', 'Camada actualizada correctamente');
      } else {
        await api.post('/reproduccion/camadas', dataToSend);
        toastService.success('Éxito', `Camada registrada correctamente${numVivos > 0 ? ` y ${numVivos} crías creadas automáticamente` : ''}`);
      }

      handleCloseForms();
      fetchCamadas();
    } catch (error: any) {
      console.error('Error al guardar camada:', error);
      toastService.error('Error', error.response?.data?.message || 'Error al guardar la camada');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number, type: 'prenez' | 'camada') => {
    try {
      if (type === 'prenez') {
        await api.delete(`/reproduccion/prenez/${id}`);
        toastService.success('Éxito', 'Preñez eliminada correctamente');
        fetchPreneces();
      } else {
        await api.delete(`/reproduccion/camadas/${id}`);
        toastService.success('Éxito', 'Camada eliminada correctamente');
        fetchCamadas();
      }
    } catch (error: unknown) {
      console.error('Error al eliminar:', error);
      toastService.error('Error', error.response?.data?.message || 'Error al eliminar');
    }
  };

  const renderPrenezTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Madre</TableCell>
            <TableCell>Padre</TableCell>
            <TableCell>Fecha Preñez</TableCell>
            <TableCell>Fecha Probable Parto</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {preneces.map((prenez) => (
            <TableRow key={prenez.id}>
              <TableCell>{prenez.id}</TableCell>
              <TableCell>
                {prenez.madre ? `${prenez.madre.raza} (${prenez.madre.galpon}-${prenez.madre.jaula})` : `ID: ${prenez.madreId}`}
              </TableCell>
              <TableCell>
                {prenez.padre ? `${prenez.padre.raza} (${prenez.padre.galpon}-${prenez.padre.jaula})` : prenez.padreId ? `ID: ${prenez.padreId}` : 'N/A'}
              </TableCell>
              <TableCell>{new Date(prenez.fechaPrenez).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(prenez.fechaProbableParto).toLocaleDateString()}</TableCell>
              <TableCell>{prenez.estado}</TableCell>
              <TableCell>
                <IconButton onClick={() => handleOpenPrenezForm(prenez)} size="small">
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(prenez.id, 'prenez')} size="small" color="error">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCamadasTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Madre</TableCell>
            <TableCell>Padre</TableCell>
            <TableCell>Fecha Nacimiento</TableCell>
            <TableCell>Vivos</TableCell>
            <TableCell>Muertos</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {camadas.map((camada) => (
            <TableRow key={camada.id}>
              <TableCell>{camada.id}</TableCell>
              <TableCell>
                {camada.madre ? `${camada.madre.raza} (${camada.madre.galpon}-${camada.madre.jaula})` : camada.madreId ? `ID: ${camada.madreId}` : 'N/A'}
              </TableCell>
              <TableCell>
                {camada.padre ? `${camada.padre.raza} (${camada.padre.galpon}-${camada.padre.jaula})` : camada.padreId ? `ID: ${camada.padreId}` : 'N/A'}
              </TableCell>
              <TableCell>{new Date(camada.fechaNacimiento).toLocaleDateString()}</TableCell>
              <TableCell>{camada.numVivos}</TableCell>
              <TableCell>{camada.numMuertos}</TableCell>
              <TableCell>
                <IconButton onClick={() => handleOpenCamadaForm(camada)} size="small">
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(camada.id, 'camada')} size="small" color="error">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Funciones para componentes avanzados
  const handleOpenReproductorDialog = async (tipo: 'madre' | 'padre') => {
    try {
      setReproductorLoading(true);
      setReproductorDialogType(tipo);
      
      // Cargar reproductores disponibles según el tipo
      const endpoint = tipo === 'madre' ? '/reproduccion/reproductores/madres' : '/reproduccion/reproductores/padres';
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setAvailableReproductores(response.data.data || []);
      } else {
        // Fallback: usar cuyes disponibles
        await fetchAvailableCuyes();
        const filteredCuyes = availableCuyes.filter(cuy => 
          tipo === 'madre' 
            ? cuy.sexo === 'H' && cuy.etapaVida === 'Reproductora'
            : cuy.sexo === 'M' && cuy.etapaVida === 'Reproductor'
        );
        setAvailableReproductores(filteredCuyes);
      }
      
      setShowReproductorDialog(true);
    } catch (error) {
      console.error('Error al cargar reproductores:', error);
      toastService.error('Error', 'No se pudieron cargar los reproductores disponibles');
    } finally {
      setReproductorLoading(false);
    }
  };

  const handleSelectReproductor = (reproductor: unknown) => {
    if (reproductorDialogType === 'madre') {
      setPrenezFormData(prev => ({ ...prev, madreId: reproductor.id.toString() }));
      setSelectedMadreId(reproductor.id);
    } else {
      setPrenezFormData(prev => ({ ...prev, padreId: reproductor.id.toString() }));
      setSelectedPadreId(reproductor.id);
    }
    setShowReproductorDialog(false);
  };

  const handleOpenCompatibilidadDialog = () => {
    if (selectedMadreId && selectedPadreId) {
      setShowCompatibilidadDialog(true);
    } else {
      toastService.warning('Advertencia', 'Seleccione una madre y un padre para analizar compatibilidad');
    }
  };

  return (
    <Box>
      {showTitle && (
        <Typography variant="h4" gutterBottom>
          Gestión de Reproducción Avanzada
        </Typography>
      )}

      {/* Dashboard de widgets cuando showStats está habilitado */}
      {showStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <EstadisticasReproduccionWidget />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <AlertasReproduccionWidget />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <RecomendacionesReproductivasWidget />
          </Grid>
        </Grid>
      )}

      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab 
            value="prenez"
            icon={<PregnantWoman />} 
            label="Preñez" 
          />
          <Tab 
            value="camadas"
            icon={<ChildCare />} 
            label="Camadas" 
          />
        </Tabs>
      </Box>

      {/* Botones de acción */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {currentTab === 'prenez' && showNewPrenezButton && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenPrenezForm()}
          >
            Nueva Preñez
          </Button>
        )}
        {currentTab === 'camadas' && showNewCamadaButton && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenCamadaForm()}
          >
            Nueva Camada
          </Button>
        )}
        
        {/* Botones avanzados para preñez */}
        {currentTab === 'prenez' && (
          <>
            <Button
              variant="outlined"
              startIcon={<Female />}
              onClick={() => handleOpenReproductorDialog('madre')}
              color="secondary"
            >
              Seleccionar Madre
            </Button>
            <Button
              variant="outlined"
              startIcon={<Male />}
              onClick={() => handleOpenReproductorDialog('padre')}
              color="primary"
            >
              Seleccionar Padre
            </Button>
            <Button
              variant="outlined"
              startIcon={<Science />}
              onClick={handleOpenCompatibilidadDialog}
              color="info"
              disabled={!selectedMadreId || !selectedPadreId}
            >
              Analizar Compatibilidad
            </Button>
          </>
        )}
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={currentTab === 'prenez' ? fetchPreneces : fetchCamadas}
        >
          Actualizar
        </Button>
      </Box>

      {/* Contenido */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {currentTab === 'prenez' && renderPrenezTable()}
          {currentTab === 'camadas' && renderCamadasTable()}
        </>
      )}      
{/* Diálogo de Preñez */}
      <Dialog open={showPrenezForm} onClose={handleCloseForms} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPrenez ? 'Editar Preñez' : 'Nueva Preñez'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Madre</InputLabel>
                <Select
                  value={prenezFormData.madreId}
                  onChange={(e) => setPrenezFormData(prev => ({ ...prev, madreId: e.target.value as string }))}
                  label="Madre"
                >
                  {availableCuyes
                    .filter(cuy => cuy.sexo === 'H' && cuy.etapaVida === 'Reproductora')
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Padre (Opcional)</InputLabel>
                <Select
                  value={prenezFormData.padreId}
                  onChange={(e) => setPrenezFormData(prev => ({ ...prev, padreId: e.target.value as string }))}
                  label="Padre (Opcional)"
                >
                  <MenuItem value="">Sin padre registrado</MenuItem>
                  {availableCuyes
                    .filter(cuy => cuy.sexo === 'M' && cuy.etapaVida === 'Reproductor')
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Preñez"
                type="date"
                value={prenezFormData.fechaPrenez}
                onChange={(e) => setPrenezFormData(prev => ({ ...prev, fechaPrenez: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Notas (Opcional)"
                multiline
                rows={3}
                value={prenezFormData.notas}
                onChange={(e) => setPrenezFormData(prev => ({ ...prev, notas: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForms}>Cancelar</Button>
          <Button 
            onClick={handleSubmitPrenez} 
            variant="contained"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : (editingPrenez ? 'Actualizar' : 'Registrar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Camada */}
      <Dialog open={showCamadaForm} onClose={handleCloseForms} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCamada ? 'Editar Camada' : 'Nueva Camada'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                type="date"
                value={camadaFormData.fechaNacimiento}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Madre</InputLabel>
                <Select
                  value={camadaFormData.madreId}
                  onChange={(e) => setCamadaFormData(prev => ({ ...prev, madreId: e.target.value as string }))}
                  label="Madre"
                >
                  {availableCuyes
                    .filter(cuy => cuy.sexo === 'H')
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Padre (Opcional)</InputLabel>
                <Select
                  value={camadaFormData.padreId}
                  onChange={(e) => setCamadaFormData(prev => ({ ...prev, padreId: e.target.value as string }))}
                  label="Padre (Opcional)"
                >
                  <MenuItem value="">Sin padre registrado</MenuItem>
                  {availableCuyes
                    .filter(cuy => cuy.sexo === 'M')
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Crías Vivas"
                type="number"
                value={camadaFormData.numVivos}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numVivos: e.target.value }))}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Crías Muertas"
                type="number"
                value={camadaFormData.numMuertos}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numMuertos: e.target.value }))}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Machos"
                type="number"
                value={camadaFormData.numMachos}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numMachos: e.target.value }))}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Hembras"
                type="number"
                value={camadaFormData.numHembras}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numHembras: e.target.value }))}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForms}>Cancelar</Button>
          <Button 
            onClick={handleSubmitCamada} 
            variant="contained"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : (editingCamada ? 'Actualizar' : 'Registrar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Selección de Reproductores */}
      <ReproductorSelectionDialog
        open={showReproductorDialog}
        onClose={() => setShowReproductorDialog(false)}
        onSelect={handleSelectReproductor}
        reproductores={availableReproductores}
        tipo={reproductorDialogType}
        loading={reproductorLoading}
      />

      {/* Diálogo de Compatibilidad Reproductiva */}
      <CompatibilidadReproductiva
        open={showCompatibilidadDialog}
        onClose={() => setShowCompatibilidadDialog(false)}
        madreId={selectedMadreId}
        padreId={selectedPadreId}
      />
    </Box>
  );
};

export default ReproduccionManagerFixed;