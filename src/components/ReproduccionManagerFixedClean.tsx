import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Alert, CircularProgress,
  Paper, IconButton, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Grid
} from '../utils/mui';
import {
  Add, Edit, Delete, Analytics, Refresh, Science, PregnantWoman, ChildCare
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';
import { Cuy } from '../types';
import ReproductorSelectionDialog, { EstadisticasDialog } from './ReproductorSelectionDialog';
import CompatibilidadReproductiva from './CompatibilidadReproductiva';
import EstadisticasReproduccionWidget from './EstadisticasReproduccionWidget';
import RecomendacionesReproductivasWidget from './RecomendacionesReproductivasWidget';
import AlertasReproduccionWidget from './AlertasReproduccionWidget';

// Improved auxiliary component with proper types
interface CuyStats {
  raza: string;
  edad: number;
  peso: number;
  totalPreneces: number;
  prenecesExitosas: number;
  tasaExito: number;
}

interface EstadisticasCuyDialogProps {
  open: boolean;
  onClose: () => void;
  cuyId?: string;
  tipo: 'madre' | 'padre';
}

function EstadisticasCuyDialog({ open, onClose, cuyId, tipo }: EstadisticasCuyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CuyStats | null>(null);
  useEffect(() => {
    if (open && cuyId) {
      setLoading(true);
      Promise.resolve(api.get(`/cuyes/${cuyId}/estadisticas`))
        .then(res => setStats(res.data))
        .catch(() => setStats(null))
        .finally(() => setLoading(false));
    }
  }, [open, cuyId]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Estadísticas de {tipo === 'madre' ? 'la madre' : 'el padre'}</DialogTitle>
      <DialogContent>
        {loading ? <CircularProgress /> : stats ? (
          <Box>
            <Typography variant="subtitle1">Raza: {stats.raza}</Typography>
            <Typography variant="subtitle1">Edad: {stats.edad} meses</Typography>
            <Typography variant="subtitle1">Peso: {stats.peso} g</Typography>
            <Typography variant="subtitle2">Historial reproductivo:</Typography>
            <ul>
              <li>Total preñeces: {stats.totalPreneces}</li>
              <li>Preñeces exitosas: {stats.prenecesExitosas}</li>
              <li>Tasa de éxito: {stats.tasaExito}%</li>
            </ul>
          </Box>
        ) : <Typography color="text.secondary">No hay datos disponibles.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}


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

// Improved TypeScript interfaces
interface AnimalInfo {
  id: number;
  raza: string;
  galpon: string;
  jaula: string;
}

interface Prenez {
  id: number;
  madreId: number;
  padreId?: number | null;
  fechaPrenez: string;
  fechaProbableParto: string;
  notas?: string | null;
  estado: 'activa' | 'completada' | 'fallida';
  madre?: AnimalInfo;
  padre?: AnimalInfo;
}

interface Camada {
  id: number;
  fechaNacimiento: string;
  numVivos: number;
  numMuertos: number;
  padreId?: number | null;
  madreId?: number | null;
  madre?: AnimalInfo;
  padre?: AnimalInfo;
}

interface FormErrors {
  madreId?: string;
  fechaPrenez?: string;
  numVivos?: string;
  numMuertos?: string;
}

interface PrenezFormData {
  madreId: string;
  padreId: string;
  fechaPrenez: string;
  notas: string;
}

interface CamadaFormData {
  fechaNacimiento: string;
  numVivos: string;
  numMuertos: string;
  madreId: string;
  padreId: string;
  numMachos: string;
  numHembras: string;
}

const ReproduccionManagerFixedClean: React.FC<ReproduccionManagerProps> = ({
  showNewPrenezButton = true,
  showNewCamadaButton = true,
  showStats = true,
  showTitle = true,
  initialView = 'prenez'
}) => {
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
  const [prenezFormErrors, setPrenezFormErrors] = useState<{ madreId?: string; fechaPrenez?: string }>({});
  const [compatibilidadResult, setCompatibilidadResult] = useState<string | null>(null);

  const [camadaFormData, setCamadaFormData] = useState({
    fechaNacimiento: new Date().toISOString().split('T')[0],
    numVivos: '',
    numMuertos: '',
    madreId: '',
    padreId: '',
    numMachos: '',
    numHembras: ''
  });
  // Estados para validación de jaula y traslado
  const [jaulaOcupada, setJaulaOcupada] = useState(false);
  const [showTrasladoDialog, setShowTrasladoDialog] = useState(false);
  const [jaulasDisponibles, setJaulasDisponibles] = useState<any[]>([]);
  const [jaulaDestino, setJaulaDestino] = useState('');

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
  const [showMadreStats, setShowMadreStats] = useState(false);
  const [showPadreStats, setShowPadreStats] = useState(false);

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
        madreId: selectedMadreId ? selectedMadreId.toString() : '',
        padreId: selectedPadreId ? selectedPadreId.toString() : '',
        fechaPrenez: new Date().toISOString().split('T')[0],
        notas: ''
      });
    }
    setPrenezFormErrors({});
    setCompatibilidadResult(null);
    fetchAvailableCuyes();
    setShowPrenezForm(true);
  };

  const handleOpenCamadaForm = (camada?: Camada) => {
    setJaulaOcupada(false);
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
    setJaulaOcupada(false);
    setShowTrasladoDialog(false);
    setJaulaDestino('');
  };

  const handleSubmitPrenez = async () => {
    // Validaciones
    const errors: { madreId?: string; fechaPrenez?: string } = {};
    if (!prenezFormData.madreId) {
      errors.madreId = 'Debe seleccionar una madre';
    } else {
      // Validar que la madre no esté ya preñada
      const madreOcupada = preneces.some(
        p => p.madreId?.toString() === prenezFormData.madreId && p.estado !== 'Finalizada'
      );
      if (madreOcupada) {
        errors.madreId = 'La madre seleccionada ya está preñada';
      }
    }
    if (!prenezFormData.fechaPrenez) {
      errors.fechaPrenez = 'Debe ingresar una fecha';
    } else {
      const fecha = new Date(prenezFormData.fechaPrenez);
      const hoy = new Date();
      if (fecha > hoy) {
        errors.fechaPrenez = 'La fecha no puede ser futura';
      }
    }
    setPrenezFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setFormLoading(true);
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

        // Actualizar etapa de vida del padre y madre si corresponde
        const padreId = prenezFormData.padreId;
        const madreId = prenezFormData.madreId;
        // Buscar los cuyes en availableCuyes
        const padre = availableCuyes.find(c => c.id.toString() === padreId);
        const madre = availableCuyes.find(c => c.id.toString() === madreId);
        // Si el padre existe y está en Engorde, actualizar a Reproductor
        if (padre && padre.etapaVida === 'Engorde') {
          await api.put(`/cuyes/${padre.id}`, { etapaVida: 'Reproductor' });
        }
        // Si la madre existe y no es Reproductora, actualizar a Reproductora
        if (madre && madre.etapaVida !== 'Reproductora') {
          await api.put(`/cuyes/${madre.id}`, { etapaVida: 'Reproductora' });
        }
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
        setFormLoading(false);
        return;
      }
      const numVivos = Number(camadaFormData.numVivos);
      const numMachos = Number(camadaFormData.numMachos) || 0;
      const numHembras = Number(camadaFormData.numHembras) || 0;
      if (numVivos > 0 && (numMachos + numHembras !== numVivos)) {
        toastService.error('Error', `La suma de machos (${numMachos}) y hembras (${numHembras}) debe ser igual al número de crías vivas (${numVivos})`);
        setFormLoading(false);
        return;
      }
      // Validar espacio en la jaula de la madre SIEMPRE antes de registrar camada
      if (camadaFormData.madreId && numVivos > 0) {
        // Buscar la madre
        const madre = availableCuyes.find(c => c.id.toString() === camadaFormData.madreId);
        if (!madre || !madre.galpon || !madre.jaula) {
          toastService.error('Error', 'La madre seleccionada no tiene galpón o jaula asignados. Corrija los datos antes de registrar la camada.');
          setFormLoading(false);
          return;
        }
        let cuyesEnJaula = 0;
        let capacidad = 10;
        let jaulaExiste = true;
        try {
          const res = await api.get(`/jaulas/${madre.galpon}/${madre.jaula}`);
          cuyesEnJaula = Number(res.data?.totalCuyes) || 0;
          capacidad = Number(res.data?.capacidad) || 10;
        } catch (err: any) {
          if (err?.response?.status === 404) {
            jaulaExiste = false;
            cuyesEnJaula = 0;
            capacidad = 10;
          } else {
            toastService.error('Error', 'No se pudo consultar la jaula de la madre');
            setFormLoading(false);
            return;
          }
        }
        // Si la jaula existe y está llena o sobrepasada, bloquear registro y mostrar alerta
        if (jaulaExiste && cuyesEnJaula + numVivos + 1 > capacidad) {
          setJaulaOcupada(true);
          // Buscar jaulas disponibles en el galpón
          try {
            const resJaulas = await api.get(`/galpones/${madre.galpon}/jaulas-disponibles`, { params: { minEspacio: numVivos + 1 } });
            setJaulasDisponibles(resJaulas.data?.data || []);
          } catch {}
          setShowTrasladoDialog(true);
          setFormLoading(false);
          return;
        }
        // Si la jaula ya está sobrepasada (por error previo), bloquear registro y mostrar alerta
        if (jaulaExiste && cuyesEnJaula >= capacidad) {
          setJaulaOcupada(true);
          toastService.error('Error', 'La jaula de la madre ya está llena o sobrepasada. Traslade antes de registrar la camada.');
          try {
            const resJaulas = await api.get(`/galpones/${madre.galpon}/jaulas-disponibles`, { params: { minEspacio: numVivos + 1 } });
            setJaulasDisponibles(resJaulas.data?.data || []);
          } catch {}
          setShowTrasladoDialog(true);
          setFormLoading(false);
          return;
        }
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

  // Función para trasladar madre y crías a otra jaula
  const handleTrasladarMadreYCrias = async () => {
    if (!jaulaDestino) {
      toastService.error('Error', 'Debe seleccionar una jaula destino');
      return;
    }
    try {
      setFormLoading(true);
      // Trasladar madre
      await api.put(`/cuyes/${camadaFormData.madreId}/trasladar`, { galpon: jaulaDestino.split('-')[0], jaula: jaulaDestino.split('-')[1] });
      // Registrar camada normalmente (ahora en la nueva jaula)
      setShowTrasladoDialog(false);
      setJaulaOcupada(false);
      setJaulaDestino('');
      await handleSubmitCamada();
    } catch (error: any) {
      toastService.error('Error', error.response?.data?.message || 'Error al trasladar madre');
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
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      toastService.error('Error', error.response?.data?.message || 'Error al eliminar');
    }
  };

  // Funciones para componentes avanzados
  const handleOpenReproductorDialog = async (tipo: 'madre' | 'padre') => {
    try {
      setReproductorLoading(true);
      setReproductorDialogType(tipo);
      const endpoint = tipo === 'madre'
        ? '/reproduccion/prenez/madres-disponibles'
        : '/reproduccion/prenez/padres-disponibles';
      const response = await api.get(endpoint);
      if (response.data.success) {
        setAvailableReproductores(response.data.data || []);
      } else {
        await fetchAvailableCuyes();
        const filteredCuyes = availableCuyes.filter(cuy =>
          tipo === 'madre'
            ? cuy.sexo === 'H' && cuy.proposito === 'Reproducción'
            : cuy.sexo === 'M' && cuy.proposito === 'Reproducción'
        );
        setAvailableReproductores(filteredCuyes);
      }
      setShowReproductorDialog(true);
      setCompatibilidadResult(null);
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

  // Tablas responsive
  const renderPrenezTable = () => (
    <TableContainer 
      component={Paper} 
      sx={{ 
        overflowX: 'auto',
        '& .MuiTable-root': {
          minWidth: { xs: 800, md: 'auto' }
        }
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 60 }}>ID</TableCell>
            <TableCell sx={{ minWidth: { xs: 150, md: 200 } }}>Madre</TableCell>
            <TableCell sx={{ minWidth: { xs: 150, md: 200 } }}>Padre</TableCell>
            <TableCell sx={{ minWidth: { xs: 120, md: 140 } }}>F. Preñez</TableCell>
            <TableCell sx={{ minWidth: { xs: 120, md: 140 } }}>F. Parto</TableCell>
            <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
            <TableCell sx={{ minWidth: 100, textAlign: 'center' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {preneces.map((prenez) => (
            <TableRow key={prenez.id} hover>
              <TableCell sx={{ fontWeight: 'medium' }}>{prenez.id}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {prenez.madre ? prenez.madre.raza : `ID: ${prenez.madreId}`}
                  </Typography>
                  {prenez.madre && (
                    <Typography variant="caption" color="text.secondary">
                      {prenez.madre.galpon}-{prenez.madre.jaula}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {prenez.padre ? prenez.padre.raza : prenez.padreId ? `ID: ${prenez.padreId}` : 'N/A'}
                  </Typography>
                  {prenez.padre && (
                    <Typography variant="caption" color="text.secondary">
                      {prenez.padre.galpon}-{prenez.padre.jaula}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(prenez.fechaPrenez).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(prenez.fechaProbableParto).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: prenez.estado === 'activa' ? 'success.main' : 
                           prenez.estado === 'completada' ? 'info.main' : 'error.main',
                    fontWeight: 'medium'
                  }}
                >
                  {prenez.estado}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  <IconButton 
                    onClick={() => handleOpenPrenezForm(prenez)} 
                    size="small"
                    sx={{ 
                      minWidth: { xs: 32, md: 40 },
                      minHeight: { xs: 32, md: 40 }
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(prenez.id, 'prenez')} 
                    size="small" 
                    color="error"
                    sx={{ 
                      minWidth: { xs: 32, md: 40 },
                      minHeight: { xs: 32, md: 40 }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCamadasTable = () => (
    <TableContainer 
      component={Paper}
      sx={{ 
        overflowX: 'auto',
        '& .MuiTable-root': {
          minWidth: { xs: 700, md: 'auto' }
        }
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 60 }}>ID</TableCell>
            <TableCell sx={{ minWidth: { xs: 150, md: 200 } }}>Madre</TableCell>
            <TableCell sx={{ minWidth: { xs: 150, md: 200 } }}>Padre</TableCell>
            <TableCell sx={{ minWidth: { xs: 120, md: 140 } }}>F. Nacimiento</TableCell>
            <TableCell sx={{ minWidth: 80, textAlign: 'center' }}>Vivos</TableCell>
            <TableCell sx={{ minWidth: 80, textAlign: 'center' }}>Muertos</TableCell>
            <TableCell sx={{ minWidth: 100, textAlign: 'center' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {camadas.map((camada) => (
            <TableRow key={camada.id} hover>
              <TableCell sx={{ fontWeight: 'medium' }}>{camada.id}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {camada.madre ? camada.madre.raza : camada.madreId ? `ID: ${camada.madreId}` : 'N/A'}
                  </Typography>
                  {camada.madre && (
                    <Typography variant="caption" color="text.secondary">
                      {camada.madre.galpon}-{camada.madre.jaula}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {camada.padre ? camada.padre.raza : camada.padreId ? `ID: ${camada.padreId}` : 'N/A'}
                  </Typography>
                  {camada.padre && (
                    <Typography variant="caption" color="text.secondary">
                      {camada.padre.galpon}-{camada.padre.jaula}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(camada.fechaNacimiento).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </Typography>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                  {camada.numVivos}
                </Typography>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                  {camada.numMuertos}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  <IconButton 
                    onClick={() => handleOpenCamadaForm(camada)} 
                    size="small"
                    sx={{ 
                      minWidth: { xs: 32, md: 40 },
                      minHeight: { xs: 32, md: 40 }
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(camada.id, 'camada')} 
                    size="small" 
                    color="error"
                    sx={{ 
                      minWidth: { xs: 32, md: 40 },
                      minHeight: { xs: 32, md: 40 }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {showTitle && (
        <Typography variant="h4" gutterBottom>
          Gestión de Reproducción Avanzada
        </Typography>
      )}

      {/* Dashboard de widgets cuando showStats está habilitado */}
      {showStats && (
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <EstadisticasReproduccionWidget />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <AlertasReproduccionWidget />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
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
        {currentTab === 'camadas' && showNewCamadaButton !== false && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenCamadaForm()}
          >
            Nueva Camada
          </Button>
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!prenezFormErrors.madreId} disabled={formLoading}>
                <InputLabel>Madre</InputLabel>
                <Select
                  value={prenezFormData.madreId}
                  onChange={(e) => setPrenezFormData(prev => ({ ...prev, madreId: e.target.value as string }))}
                  label="Madre"
                  MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                >
                  {availableCuyes.length === 0 && (
                    <MenuItem disabled>No hay madres disponibles</MenuItem>
                  )}
                  {availableCuyes
                    .filter(cuy => {
                      if (cuy.sexo !== 'H' || cuy.proposito !== 'Reproducción') return false;
                      // Excluir madres ya preñadas (que tengan una preñez activa)
                      const madreOcupada = preneces.some(
                        p => p.madreId === cuy.id && p.estado !== 'Finalizada'
                      );
                      return !madreOcupada;
                    })
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
                {prenezFormErrors.madreId && (
                  <span style={{ color: 'red', fontSize: 12 }}>{prenezFormErrors.madreId}</span>
                )}
                {prenezFormData.madreId && (
                  <small style={{ color: '#888' }}>
                    {(() => {
                      const madre = availableCuyes.find(c => c.id.toString() === prenezFormData.madreId);
                      return madre ? `Raza: ${madre.raza}, Galpón: ${madre.galpon}, Jaula: ${madre.jaula}` : '';
                    })()}
                  </small>
                )}
                {/* Botón para ver estadísticas de la madre */}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Analytics />}
                    disabled={!prenezFormData.madreId}
                    onClick={() => setShowMadreStats(true)}
                  >
                    Ver estadísticas
                  </Button>
                </Box>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={formLoading}>
                <InputLabel>Padre (Opcional)</InputLabel>
                <Select
                  value={prenezFormData.padreId}
                  onChange={(e) => setPrenezFormData(prev => ({ ...prev, padreId: e.target.value as string }))}
                  label="Padre (Opcional)"
                  MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                >
                  <MenuItem value="">Sin padre registrado</MenuItem>
                  {availableCuyes.length === 0 && (
                    <MenuItem disabled>No hay padres disponibles</MenuItem>
                  )}
                  {availableCuyes
                    .filter(cuy => cuy.sexo === 'M' && cuy.proposito === 'Reproducción')
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
                {prenezFormData.padreId && (
                  <small style={{ color: '#888' }}>
                    {(() => {
                      const padre = availableCuyes.find(c => c.id.toString() === prenezFormData.padreId);
                      return padre ? `Raza: ${padre.raza}, Galpón: ${padre.galpon}, Jaula: ${padre.jaula}` : '';
                    })()}
                  </small>
                )}
                {/* Botón para ver estadísticas del padre */}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Analytics />}
                    disabled={!prenezFormData.padreId}
                    onClick={() => setShowPadreStats(true)}
                  >
                    Ver estadísticas
                  </Button>
                </Box>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Preñez"
                type="date"
                value={prenezFormData.fechaPrenez}
                onChange={(e) => setPrenezFormData(prev => ({ ...prev, fechaPrenez: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={!!prenezFormErrors.fechaPrenez}
                helperText={prenezFormErrors.fechaPrenez}
                disabled={formLoading}
              />
            </Grid>
            {/* Botón para analizar compatibilidad */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<Science />}
                  disabled={!prenezFormData.madreId || !prenezFormData.padreId}
                  onClick={() => {
                    setSelectedMadreId(Number(prenezFormData.madreId));
                    setSelectedPadreId(Number(prenezFormData.padreId));
                    setShowCompatibilidadDialog(true);
                  }}
                >
                  Analizar compatibilidad
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas (Opcional)"
                multiline
                rows={3}
                value={prenezFormData.notas}
                onChange={(e) => setPrenezFormData(prev => ({ ...prev, notas: e.target.value }))}
                disabled={formLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForms} disabled={formLoading}>Cancelar</Button>
          <Button 
            onClick={handleSubmitPrenez} 
            variant="contained"
            disabled={formLoading || Object.keys(prenezFormErrors).length > 0}
          >
            {formLoading ? <CircularProgress size={20} /> : (editingPrenez ? 'Actualizar' : 'Registrar')}
          </Button>
        </DialogActions>
        {compatibilidadResult && (
          <Box sx={{ p: 2 }}>
            <Alert severity={compatibilidadResult.includes('OK') ? 'success' : 'warning'}>
              {compatibilidadResult}
            </Alert>
          </Box>
        )}
      </Dialog>

      {/* Diálogo de Camada */}
      <Dialog open={showCamadaForm} onClose={handleCloseForms} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCamada ? 'Editar Camada' : 'Nueva Camada'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                type="date"
                value={camadaFormData.fechaNacimiento}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Madre</InputLabel>
                <Select
                  value={camadaFormData.madreId}
                  onChange={(e) => {
                    setCamadaFormData(prev => ({ ...prev, madreId: e.target.value as string }));
                    setJaulaOcupada(false);
                  }}
                  label="Madre"
                >
                  {availableCuyes
                    .filter(cuy => cuy.sexo === 'H' && cuy.proposito === 'Reproducción' && cuy.estado === 'Activo')
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Padre (Opcional)</InputLabel>
                <Select
                  value={camadaFormData.padreId}
                  onChange={(e) => setCamadaFormData(prev => ({ ...prev, padreId: e.target.value as string }))}
                  label="Padre (Opcional)"
                >
                  <MenuItem value="">Sin padre registrado</MenuItem>
                  {availableCuyes
                    .filter(cuy => cuy.sexo === 'M' && cuy.proposito === 'Reproducción' && cuy.estado === 'Activo')
                    .map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id.toString()}>
                        {cuy.raza} - {cuy.galpon}-{cuy.jaula} (ID: {cuy.id})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Crías Vivas"
                type="number"
                value={camadaFormData.numVivos}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numVivos: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Crías Muertas"
                type="number"
                value={camadaFormData.numMuertos}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numMuertos: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Machos"
                type="number"
                value={camadaFormData.numMachos}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numMachos: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Hembras"
                type="number"
                value={camadaFormData.numHembras}
                onChange={(e) => setCamadaFormData(prev => ({ ...prev, numHembras: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            {jaulaOcupada && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  No hay espacio suficiente en la jaula de la madre para la camada y las crías.<br />
                  Puede trasladar a la madre y sus crías a otra jaula disponible.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForms}>Cancelar</Button>
          <Button 
            onClick={() => {
              if (!jaulaOcupada) handleSubmitCamada();
            }}
            variant="contained"
            disabled={formLoading || jaulaOcupada}
            style={jaulaOcupada ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          >
            {formLoading ? <CircularProgress size={20} /> : (editingCamada ? 'Actualizar' : 'Registrar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de traslado de jaula */}
      <Dialog open={showTrasladoDialog} onClose={() => { setShowTrasladoDialog(false); setJaulaOcupada(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>Trasladar madre y crías a otra jaula</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Seleccione una jaula con espacio suficiente para la madre y las crías ({Number(camadaFormData.numVivos) + 1} lugares requeridos):
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Jaula destino</InputLabel>
            <Select
              value={jaulaDestino}
              onChange={e => setJaulaDestino(e.target.value)}
              label="Jaula destino"
            >
              {jaulasDisponibles.length === 0 && (
                <MenuItem disabled>No hay jaulas disponibles</MenuItem>
              )}
              {jaulasDisponibles.map(j => (
                <MenuItem key={j.galpon + '-' + j.jaula} value={j.galpon + '-' + j.jaula}>
                  Galpón {j.galpon} - Jaula {j.jaula} (Capacidad: {j.capacidad}, Ocupados: {j.ocupados})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTrasladoDialog(false)}>Cancelar</Button>
          <Button onClick={handleTrasladarMadreYCrias} variant="contained" disabled={!jaulaDestino || formLoading}>
            Trasladar y Registrar Camada
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

      {/* Diálogos de estadísticas */}
      <EstadisticasDialog
        open={showMadreStats}
        onClose={() => setShowMadreStats(false)}
        cuy={prenezFormData.madreId ? { id: prenezFormData.madreId } : null}
        tipo="madre"
      />
      <EstadisticasDialog
        open={showPadreStats}
        onClose={() => setShowPadreStats(false)}
        cuy={prenezFormData.padreId ? { id: prenezFormData.padreId } : null}
        tipo="padre"
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

export default ReproduccionManagerFixedClean;
