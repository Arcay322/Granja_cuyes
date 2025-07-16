import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Alert, CircularProgress, useTheme, alpha, Badge,
  Paper, Divider, IconButton, Tooltip, Stack, TablePagination, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox
} from '../utils/mui';
import {
  Pets, Add, Edit, Delete, Analytics, Warning, Groups, TrendingUp,
  Male, Female, Search, FilterList, Refresh, History, Close, CalendarMonth,
  Scale, LocationOn, Info, CheckCircle, ViewModule, ViewList, TableChart
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface Cuy {
  id: number;
  raza: string;
  fechaNacimiento: string;
  sexo: string;
  peso: number;
  galpon: string;
  jaula: string;
  estado: string;
  etapaVida: string;
  proposito: string;
  fechaRegistro?: string;
  ultimaEvaluacion?: string;
  fechaVenta?: string | null;
  fechaFallecimiento?: string | null;
}

interface CuyForm {
  raza: string;
  fechaNacimiento: string;
  sexo: string;
  peso: number;
  galpon: string;
  jaula: string;
  estado: string;
  etapaVida: string;
  proposito: string;
  fechaVenta?: string | null;
  fechaFallecimiento?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CuyHistorial {
  cuy: {
    id: number;
    raza: string;
    sexo: string;
    fechaNacimiento: string;
    etapaActual: string;
    propositoActual: string;
    pesoActual: number;
    estadoActual: string;
  };
  historial: Array<{
    fecha: string;
    tipo: string;
    etapa?: string;
    descripcion: string;
    veterinario?: string;
    medicamento?: string;
  }>;
}

interface EstadisticasAvanzadas {
  resumen: {
    totalCuyes: number;
    cuyesActivos: number;
    cuyesNuevos: number;
    cuyesProximosCambio: number;
    periodo: number;
  };
  distribucion: {
    etapas: Array<{ etapa: string; cantidad: number }>;
    propositos: Array<{ proposito: string; cantidad: number }>;
    galpones: Array<{ galpon: string; cantidad: number; pesoPromedio: number }>;
  };
  analisis: {
    pesoPromedioPorEtapa: Array<{ etapa: string; pesoPromedio: number; cantidad: number }>;
  };
}

const razasOptions = ['Peruano', 'Andino', 'Inti', 'Criollo', 'Mejorado', 'Otros'];
const sexosOptions = ['M', 'H'];
const estadosOptions = ['Activo', 'Enfermo', 'Vendido', 'Fallecido'];
const etapasOptions = ['Cría', 'Juvenil', 'Engorde', 'Reproductor', 'Reproductora', 'Retirado'];
const propositosOptions = ['Cría', 'Juvenil', 'Engorde', 'Reproducción', 'Venta', 'Indefinido'];

const initialCuyForm: CuyForm = {
  raza: 'Peruano',
  fechaNacimiento: new Date().toISOString().split('T')[0],
  sexo: 'M',
  peso: 0.5,
  galpon: '',
  jaula: '',
  estado: 'Activo',
  etapaVida: 'Cría',
  proposito: 'Indefinido',
  fechaVenta: null,
  fechaFallecimiento: null
};

const CuyesManagerFixed: React.FC = () => {
  const theme = useTheme();
  const [cuyes, setCuyes] = useState<Cuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuy, setSelectedCuy] = useState<Cuy | null>(null);

  // Estados para diálogos
  const [openCuyDialog, setOpenCuyDialog] = useState(false);
  const [openHistorialDialog, setOpenHistorialDialog] = useState(false);
  const [openEstadisticasDialog, setOpenEstadisticasDialog] = useState(false);

  // Estados para formularios
  const [cuyForm, setCuyForm] = useState<CuyForm>(initialCuyForm);
  const [editId, setEditId] = useState<number | null>(null);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    galpon: '',
    jaula: '',
    raza: '',
    sexo: '',
    estado: '',
    etapaVida: '',
    proposito: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Estados para paginación
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Estados para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    machos: 0,
    hembras: 0,
    crias: 0,
    adultos: 0
  });

  // Estado para estadísticas avanzadas
  const [estadisticasAvanzadas, setEstadisticasAvanzadas] = useState<EstadisticasAvanzadas | null>(null);

  // Estado para historial
  const [historial, setHistorial] = useState<CuyHistorial | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Estados para errores de formulario
  const [cuyErrors, setCuyErrors] = useState({
    raza: '',
    fechaNacimiento: '',
    sexo: '',
    peso: '',
    galpon: '',
    jaula: ''
  });

  // Estado para vista (tarjetas o tabla)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Estados para selección múltiple
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);

  // Estados para registro masivo
  const [openMasiveDialog, setOpenMasiveDialog] = useState(false);
  const [masiveForm, setMasiveForm] = useState({
    cantidad: 5,
    raza: 'Peruano',
    fechaNacimiento: new Date().toISOString().split('T')[0],
    sexo: 'M',
    pesoMin: 0.4,
    pesoMax: 0.6,
    galpon: '',
    jaulaInicio: '',
    estado: 'Activo',
    etapaVida: 'Cría',
    proposito: 'Indefinido'
  });
  const [masiveLoading, setMasiveLoading] = useState(false);

  // Configuración para diálogo de confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      try {
        const response = await api.delete(`/cuyes/${id}`);
        if (response.data.success) {
          fetchCuyes();
          fetchStats();
          toastService.success('Cuy eliminado', 'El cuy ha sido eliminado exitosamente');
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'No se pudo eliminar el cuy';
        toastService.error('Error al eliminar', errorMsg);
      }
    },
    itemName: 'cuy',
    successMessage: 'Cuy eliminado exitosamente'
  });

  useEffect(() => {
    fetchCuyes();
    fetchStats();
  }, [pagination.page, pagination.limit]);

  // Función para aplicar filtros manualmente
  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCuyes();
  };

  const fetchCuyes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.galpon && { galpon: filters.galpon }),
        ...(filters.jaula && { jaula: filters.jaula }),
        ...(filters.raza && { raza: filters.raza }),
        ...(filters.sexo && { sexo: filters.sexo }),
        ...(filters.estado && { estado: filters.estado }),
        ...(filters.etapaVida && { etapaVida: filters.etapaVida }),
        ...(filters.proposito && { proposito: filters.proposito }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/cuyes?${params}`);
      const data = response.data;

      if (data.success) {
        setCuyes(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error al obtener cuyes:', error);
      toastService.error('Error', 'No se pudieron cargar los cuyes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/cuyes/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  const fetchEstadisticasAvanzadas = async () => {
    console.log('🔍 Función fetchEstadisticasAvanzadas ejecutada');
    try {
      setLoading(true);
      console.log('📡 Enviando petición a /cuyes/estadisticas-avanzadas');
      const response = await api.get('/cuyes/estadisticas-avanzadas');
      console.log('📊 Respuesta recibida:', response.data);
      console.log('📊 Datos específicos:', response.data.data);
      console.log('📊 Estructura de etapas:', response.data.data?.distribucion?.etapas);
      console.log('📊 Estructura de propósitos:', response.data.data?.distribucion?.propositos);
      console.log('📊 Estructura de galpones:', response.data.data?.distribucion?.galpones);

      if (response.data.success) {
        setEstadisticasAvanzadas(response.data.data);
        setOpenEstadisticasDialog(true);
        console.log('✅ Diálogo de estadísticas abierto');
        console.log('✅ Estado estadisticasAvanzadas:', response.data.data);
      } else {
        console.log('❌ Respuesta no exitosa:', response.data);
        toastService.error('Error', 'No se pudieron cargar las estadísticas avanzadas');
      }
    } catch (error) {
      console.error('❌ Error al obtener estadísticas avanzadas:', error);
      toastService.error('Error', 'No se pudieron cargar las estadísticas avanzadas');
    } finally {
      setLoading(false);
      console.log('🏁 Función fetchEstadisticasAvanzadas terminada');
    }
  };

  const fetchHistorial = async (id: number) => {
    try {
      setLoadingHistorial(true);
      const response = await api.get(`/cuyes/${id}/historial`);
      if (response.data.success) {
        setHistorial(response.data.data);
        setOpenHistorialDialog(true);
      }
    } catch (error) {
      console.error('Error al obtener historial:', error);
      toastService.error('Error', 'No se pudo cargar el historial del cuy');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleOpenCuyDialog = (cuy?: Cuy) => {
    if (cuy) {
      setCuyForm({
        raza: cuy.raza,
        fechaNacimiento: cuy.fechaNacimiento.split('T')[0], // Formato YYYY-MM-DD
        sexo: cuy.sexo,
        peso: cuy.peso,
        galpon: cuy.galpon,
        jaula: cuy.jaula,
        estado: cuy.estado,
        etapaVida: cuy.etapaVida,
        proposito: cuy.proposito,
        fechaVenta: cuy.fechaVenta ? cuy.fechaVenta.split('T')[0] : null,
        fechaFallecimiento: cuy.fechaFallecimiento ? cuy.fechaFallecimiento.split('T')[0] : null
      });
      setEditId(cuy.id);
    } else {
      setCuyForm(initialCuyForm);
      setEditId(null);
    }
    setCuyErrors({
      raza: '',
      fechaNacimiento: '',
      sexo: '',
      peso: '',
      galpon: '',
      jaula: ''
    });
    setOpenCuyDialog(true);
  };

  const handleOpenHistorialDialog = async (cuy: Cuy) => {
    setSelectedCuy(cuy);
    await fetchHistorial(cuy.id);
  };

  const handleCuyChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCuyForm(prev => ({ ...prev, [name]: value }));
      if (cuyErrors[name as keyof typeof cuyErrors]) {
        setCuyErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const validateCuyForm = () => {
    const newErrors = {
      raza: '',
      fechaNacimiento: '',
      sexo: '',
      peso: '',
      galpon: '',
      jaula: ''
    };

    if (!cuyForm.raza) {
      newErrors.raza = 'La raza es obligatoria';
    }

    if (!cuyForm.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    } else {
      const fechaNac = new Date(cuyForm.fechaNacimiento);
      const hoy = new Date();
      if (fechaNac > hoy) {
        newErrors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura';
      }
    }

    if (!cuyForm.sexo) {
      newErrors.sexo = 'El sexo es obligatorio';
    }

    if (!cuyForm.peso || cuyForm.peso <= 0) {
      newErrors.peso = 'El peso debe ser mayor a 0';
    } else if (cuyForm.peso > 5) {
      newErrors.peso = 'El peso parece muy alto para un cuy (máximo 5kg)';
    }

    if (!cuyForm.galpon.trim()) {
      newErrors.galpon = 'El galpón es obligatorio';
    }

    if (!cuyForm.jaula.trim()) {
      newErrors.jaula = 'La jaula es obligatoria';
    }

    // Validaciones cruzadas
    if (cuyForm.estado === 'Vendido' && !cuyForm.fechaVenta) {
      newErrors.fechaNacimiento = 'Si el estado es Vendido, debe especificar la fecha de venta';
    }

    if (cuyForm.estado === 'Fallecido' && !cuyForm.fechaFallecimiento) {
      newErrors.fechaNacimiento = 'Si el estado es Fallecido, debe especificar la fecha de fallecimiento';
    }

    setCuyErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmitCuy = async () => {
    if (!validateCuyForm()) return;

    try {
      setLoading(true);
      if (editId) {
        const response = await api.put(`/cuyes/${editId}`, cuyForm);
        if (response.data.success) {
          toastService.success('Cuy actualizado', 'El cuy ha sido actualizado exitosamente');
        }
      } else {
        const response = await api.post('/cuyes', cuyForm);
        if (response.data.success) {
          toastService.success('Cuy creado', 'El cuy ha sido creado exitosamente');
        }
      }
      setOpenCuyDialog(false);
      fetchCuyes();
      fetchStats();
    } catch (error: any) {
      console.error('Error al guardar cuy:', error);
      const errorMsg = error.response?.data?.error || 'No se pudo guardar el cuy';
      toastService.error('Error al guardar', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarAReproductor = async (id: number) => {
    try {
      const response = await api.patch(`/cuyes/${id}/hacer-reproductor`);
      if (response.data.success) {
        toastService.success('Cambio exitoso', 'Cuy cambiado a reproductor exitosamente');
        fetchCuyes();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'No se pudo cambiar a reproductor';
      toastService.error('Error al cambiar', errorMsg);
    }
  };

  const handleCambiarAEngorde = async (id: number) => {
    try {
      const response = await api.patch(`/cuyes/${id}/enviar-engorde`);
      if (response.data.success) {
        toastService.success('Cambio exitoso', 'Cuy enviado a engorde exitosamente');
        fetchCuyes();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'No se pudo enviar a engorde';
      toastService.error('Error al cambiar', errorMsg);
    }
  };

  const handleActualizarEtapas = async () => {
    try {
      setLoading(true);
      const response = await api.post('/cuyes/actualizar-etapas');
      if (response.data.success) {
        const { actualizados } = response.data.data;
        toastService.success(
          'Etapas actualizadas',
          `Se actualizaron automáticamente ${actualizados} cuyes según su edad actual`
        );
        fetchCuyes();
        fetchStats();
      }
    } catch (error: unknown) {
      const errorMsg = error.response?.data?.error || 'No se pudieron actualizar las etapas';
      toastService.error('Error al actualizar', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      galpon: '',
      jaula: '',
      raza: '',
      sexo: '',
      estado: '',
      etapaVida: '',
      proposito: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Funciones para selección múltiple
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelectedIds = cuyes.map(cuy => cuy.id);
      setSelectedIds(newSelectedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1)
      );
    }

    setSelectedIds(newSelected);
  };

  const isSelected = (id: number) => selectedIds.indexOf(id) !== -1;

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) {
      toastService.warning('Selección requerida', 'Debe seleccionar al menos un cuy para eliminar');
      return;
    }
    setOpenBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/cuyes/${id}`)));

      toastService.success(
        'Eliminación Exitosa',
        `Se eliminaron ${selectedIds.length} cuyes exitosamente`
      );

      setSelectedIds([]);
      setOpenBulkDeleteDialog(false);
      fetchCuyes();
      fetchStats();
    } catch (error: unknown) {
      console.error('Error en eliminación masiva:', error);
      toastService.error('Error al eliminar', 'No se pudieron eliminar algunos cuyes');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteCancel = () => {
    setOpenBulkDeleteDialog(false);
  };

  // Funciones para registro masivo
  const handleMasiveChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setMasiveForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMasiveSubmit = async () => {
    if (!masiveForm.galpon.trim() || !masiveForm.jaulaInicio.trim()) {
      toastService.error('Campos requeridos', 'Galpón y jaula inicial son obligatorios');
      return;
    }

    if (masiveForm.cantidad < 1 || masiveForm.cantidad > 50) {
      toastService.error('Cantidad inválida', 'La cantidad debe estar entre 1 y 50 cuyes');
      return;
    }

    setMasiveLoading(true);
    try {
      const cuyes = [];
      const jaulaInicial = parseInt(masiveForm.jaulaInicio);

      for (let i = 0; i < masiveForm.cantidad; i++) {
        // Convertir a números para asegurar que no sean strings
        const pesoMin = parseFloat(masiveForm.pesoMin.toString());
        const pesoMax = parseFloat(masiveForm.pesoMax.toString());
        const pesoRandom = pesoMin + (Math.random() * (pesoMax - pesoMin));
        const sexoRandom = Math.random() > 0.5 ? 'M' : 'H';

        const cuy = {
          raza: masiveForm.raza,
          fechaNacimiento: masiveForm.fechaNacimiento,
          sexo: masiveForm.sexo === 'Aleatorio' ? sexoRandom : masiveForm.sexo,
          peso: Math.round(pesoRandom * 100) / 100, // Redondear a 2 decimales
          galpon: masiveForm.galpon,
          jaula: (jaulaInicial + i).toString(),
          estado: masiveForm.estado,
          etapaVida: masiveForm.etapaVida,
          proposito: masiveForm.proposito
        };

        console.log('🐹 Cuy a crear:', cuy);
        console.log('🔢 Peso calculado:', cuy.peso, 'tipo:', typeof cuy.peso);
        cuyes.push(cuy);
      }

      // Crear cuyes uno por uno (podríamos optimizar esto con un endpoint masivo)
      let creados = 0;
      let errores = 0;

      for (const cuy of cuyes) {
        try {
          const response = await api.post('/cuyes', cuy);
          if (response.data.success) {
            creados++;
          } else {
            errores++;
          }
        } catch (error) {
          errores++;
        }
      }

      if (creados > 0) {
        toastService.success(
          'Registro Masivo Exitoso',
          `Se crearon ${creados} cuyes exitosamente${errores > 0 ? ` (${errores} errores)` : ''}`
        );
        setOpenMasiveDialog(false);
        fetchCuyes();
        fetchStats();
      } else {
        toastService.error('Error en Registro Masivo', 'No se pudo crear ningún cuy');
      }
    } catch (error) {
      console.error('Error en registro masivo:', error);
      toastService.error('Error', 'Error inesperado en el registro masivo');
    } finally {
      setMasiveLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo': return 'success';
      case 'enfermo': return 'error';
      case 'vendido': return 'info';
      case 'fallecido': return 'default';
      default: return 'default';
    }
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa?.toLowerCase()) {
      case 'cría': return 'info';
      case 'juvenil': return 'primary';
      case 'engorde': return 'warning';
      case 'reproductor':
      case 'reproductora': return 'success';
      default: return 'default';
    }
  };

  const calcularEdad = (fechaNacimiento: string) => {
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();

    let años = hoy.getFullYear() - fechaNac.getFullYear();
    let meses = hoy.getMonth() - fechaNac.getMonth();

    if (meses < 0 || (meses === 0 && hoy.getDate() < fechaNac.getDate())) {
      años--;
      meses += 12;
    }

    if (años > 0) {
      return `${años} año${años !== 1 ? 's' : ''} ${meses} mes${meses !== 1 ? 'es' : ''}`;
    } else {
      return `${meses} mes${meses !== 1 ? 'es' : ''}`;
    }
  };

  if (loading && cuyes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
          <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
          Sistema de Cuyes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={fetchEstadisticasAvanzadas}
          >
            Estadísticas
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleActualizarEtapas}
          >
            Actualizar Etapas
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenCuyDialog()}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            Nuevo Cuy
          </Button>
          <Button
            variant="contained"
            startIcon={<Groups />}
            onClick={() => setOpenMasiveDialog(true)}
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          >
            Registro Masivo
          </Button>
        </Box>
      </Box>

      {/* Resumen general */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Typography variant="h6" gutterBottom>
          Resumen General
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 1 }}>
              <Pets />
            </Avatar>
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Cuyes
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: theme.palette.info.main, mx: 'auto', mb: 1 }}>
              <Male />
            </Avatar>
            <Typography variant="h4">{stats.machos}</Typography>
            <Typography variant="body2" color="text.secondary">
              Machos
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: theme.palette.success.main, mx: 'auto', mb: 1 }}>
              <Female />
            </Avatar>
            <Typography variant="h4">{stats.hembras}</Typography>
            <Typography variant="body2" color="text.secondary">
              Hembras
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: theme.palette.warning.main, mx: 'auto', mb: 1 }}>
              <Groups />
            </Avatar>
            <Typography variant="h4">{stats.crias}</Typography>
            <Typography variant="body2" color="text.secondary">
              Crías
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Barra de búsqueda y filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar cuyes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleApplyFilters}
            size="small"
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          >
            Buscar
          </Button>
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { fetchCuyes(); fetchStats(); }}
            size="small"
          >
            Actualizar
          </Button>
          {Object.values(filters).some(f => f !== '') && (
            <Button
              variant="contained"
              color="warning"
              onClick={clearFilters}
              size="small"
            >
              Limpiar Filtros
            </Button>
          )}

          {/* Toggle de vista */}
          <Box sx={{ display: 'flex', ml: 'auto' }}>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              startIcon={<ViewModule />}
              onClick={() => setViewMode('cards')}
              size="small"
              sx={{ borderRadius: '8px 0 0 8px' }}
            >
              Tarjetas
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              startIcon={<TableChart />}
              onClick={() => setViewMode('table')}
              size="small"
              sx={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
            >
              Tabla
            </Button>
          </Box>
        </Box>

        {/* Panel de filtros */}
        {showFilters && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <FormControl size="small">
              <InputLabel>Galpón</InputLabel>
              <Select
                value={filters.galpon}
                label="Galpón"
                onChange={(e) => handleFilterChange('galpon', e.target.value as string)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Raza</InputLabel>
              <Select
                value={filters.raza}
                label="Raza"
                onChange={(e) => handleFilterChange('raza', e.target.value as string)}
              >
                <MenuItem value="">Todas</MenuItem>
                {razasOptions.map(raza => (
                  <MenuItem key={raza} value={raza}>{raza}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Sexo</InputLabel>
              <Select
                value={filters.sexo}
                label="Sexo"
                onChange={(e) => handleFilterChange('sexo', e.target.value as string)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="M">Macho</MenuItem>
                <MenuItem value="H">Hembra</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.estado}
                label="Estado"
                onChange={(e) => handleFilterChange('estado', e.target.value as string)}
              >
                <MenuItem value="">Todos</MenuItem>
                {estadosOptions.map(estado => (
                  <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Etapa</InputLabel>
              <Select
                value={filters.etapaVida}
                label="Etapa"
                onChange={(e) => handleFilterChange('etapaVida', e.target.value as string)}
              >
                <MenuItem value="">Todas</MenuItem>
                {etapasOptions.map(etapa => (
                  <MenuItem key={etapa} value={etapa}>{etapa}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Propósito</InputLabel>
              <Select
                value={filters.proposito}
                label="Propósito"
                onChange={(e) => handleFilterChange('proposito', e.target.value as string)}
              >
                <MenuItem value="">Todos</MenuItem>
                {propositosOptions.map(proposito => (
                  <MenuItem key={proposito} value={proposito}>{proposito}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      {/* Barra de acciones masivas */}
      {selectedIds.length > 0 && viewMode === 'table' && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {selectedIds.length} cuy{selectedIds.length !== 1 ? 'es' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setSelectedIds([])}
                size="small"
              >
                Cancelar Selección
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={handleBulkDeleteClick}
                disabled={bulkActionLoading}
                size="small"
              >
                {bulkActionLoading ? 'Eliminando...' : `Eliminar ${selectedIds.length}`}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Vista de cuyes - Tarjetas o Tabla */}
      {viewMode === 'cards' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
          {cuyes.map((cuy) => (
            <Card key={cuy.id} sx={{
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    Cuy #{cuy.id}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={cuy.estado}
                      color={getEstadoColor(cuy.estado) as unknown}
                      size="small"
                    />
                    <Tooltip title="Editar cuy">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCuyDialog(cuy)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar cuy">
                      <IconButton
                        size="small"
                        onClick={() => deleteConfirmation.handleDeleteClick(cuy.id)}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={cuy.etapaVida}
                    color={getEtapaColor(cuy.etapaVida) as unknown}
                    size="small"
                    variant="outlined"
                    icon={<Info fontSize="small" />}
                  />
                  <Chip
                    label={cuy.proposito}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: cuy.sexo === 'M' ? theme.palette.info.main : theme.palette.success.main }}>
                      {cuy.sexo === 'M' ? <Male fontSize="small" /> : <Female fontSize="small" />}
                    </Avatar>
                    <Typography variant="body2">
                      {cuy.sexo === 'M' ? 'Macho' : 'Hembra'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Scale fontSize="small" color="action" />
                    <Typography variant="body2">{cuy.peso} kg</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{cuy.galpon}-{cuy.jaula}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth fontSize="small" color="action" />
                    <Tooltip title={`Nacimiento: ${new Date(cuy.fechaNacimiento).toLocaleDateString()}`}>
                      <Typography variant="body2">{calcularEdad(cuy.fechaNacimiento)}</Typography>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Raza:</strong> {cuy.raza}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<History />}
                    onClick={() => handleOpenHistorialDialog(cuy)}
                  >
                    Historial
                  </Button>
                  {cuy.sexo === 'M' && cuy.etapaVida !== 'Reproductor' && (
                    <Button
                      size="small"
                      color="success"
                      onClick={() => handleCambiarAReproductor(cuy.id)}
                    >
                      → Reproductor
                    </Button>
                  )}
                  {cuy.etapaVida !== 'Engorde' && (
                    <Button
                      size="small"
                      color="warning"
                      onClick={() => handleCambiarAEngorde(cuy.id)}
                    >
                      → Engorde
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Vista de tabla profesional
        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selectedIds.length > 0 && selectedIds.length < cuyes.length}
                      checked={cuyes.length > 0 && selectedIds.length === cuyes.length}
                      onChange={handleSelectAll}
                      title="Seleccionar todos los cuyes"
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Raza</TableCell>
                  <TableCell>Sexo</TableCell>
                  <TableCell>Peso</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Etapa</TableCell>
                  <TableCell>Edad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuyes.map((cuy) => (
                  <TableRow key={cuy.id} selected={isSelected(cuy.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isSelected(cuy.id)}
                        onChange={() => handleSelectOne(cuy.id)}
                        title={isSelected(cuy.id) ? 'Deseleccionar' : 'Seleccionar'}
                      />
                    </TableCell>
                    <TableCell>{cuy.id}</TableCell>
                    <TableCell>{cuy.raza}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{
                          width: 20,
                          height: 20,
                          bgcolor: cuy.sexo === 'M' ? theme.palette.info.main : theme.palette.success.main
                        }}>
                          {cuy.sexo === 'M' ? <Male fontSize="small" /> : <Female fontSize="small" />}
                        </Avatar>
                        <Typography variant="body2">
                          {cuy.sexo === 'M' ? 'Macho' : 'Hembra'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{cuy.peso} kg</TableCell>
                    <TableCell>{cuy.galpon}-{cuy.jaula}</TableCell>
                    <TableCell>
                      <Chip
                        label={cuy.estado}
                        color={getEstadoColor(cuy.estado) as unknown}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cuy.etapaVida}
                        color={getEtapaColor(cuy.etapaVida) as unknown}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`Nacimiento: ${new Date(cuy.fechaNacimiento).toLocaleDateString()}`}>
                        <Typography variant="body2">{calcularEdad(cuy.fechaNacimiento)}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Ver historial">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenHistorialDialog(cuy)}
                            sx={{ color: theme.palette.info.main }}
                          >
                            <History fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar cuy">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCuyDialog(cuy)}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar cuy">
                          <IconButton
                            size="small"
                            onClick={() => deleteConfirmation.handleDeleteClick(cuy.id)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {cuyes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay cuyes registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {cuyes.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay cuyes registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea tu primer cuy para comenzar a gestionar tu granja
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenCuyDialog()}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            Crear Primer Cuy
          </Button>
        </Box>
      )}

      {/* Paginación */}
      {pagination.total > 0 && (
        <Paper sx={{ mt: 3 }}>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pagination.limit}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Cuyes por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>
      )}

      {/* Diálogo para crear/editar cuy */}
      <Dialog open={openCuyDialog} onClose={() => setOpenCuyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Pets color="primary" />
              <Typography variant="h6">
                {editId ? 'Editar Cuy' : 'Nuevo Cuy'}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenCuyDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small" error={!!cuyErrors.raza}>
                <InputLabel>Raza</InputLabel>
                <Select
                  name="raza"
                  value={cuyForm.raza}
                  onChange={handleCuyChange}
                  label="Raza"
                >
                  {razasOptions.map(raza => (
                    <MenuItem key={raza} value={raza}>{raza}</MenuItem>
                  ))}
                </Select>
                {cuyErrors.raza && <Typography variant="caption" color="error">{cuyErrors.raza}</Typography>}
              </FormControl>

              <FormControl fullWidth size="small" error={!!cuyErrors.sexo}>
                <InputLabel>Sexo</InputLabel>
                <Select
                  name="sexo"
                  value={cuyForm.sexo}
                  onChange={handleCuyChange}
                  label="Sexo"
                >
                  <MenuItem value="M">Macho</MenuItem>
                  <MenuItem value="H">Hembra</MenuItem>
                </Select>
                {cuyErrors.sexo && <Typography variant="caption" color="error">{cuyErrors.sexo}</Typography>}
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Fecha de Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={cuyForm.fechaNacimiento}
                onChange={handleCuyChange}
                fullWidth
                required
                error={!!cuyErrors.fechaNacimiento}
                helperText={cuyErrors.fechaNacimiento}
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Peso (kg)"
                name="peso"
                type="number"
                value={cuyForm.peso}
                onChange={handleCuyChange}
                fullWidth
                required
                error={!!cuyErrors.peso}
                helperText={cuyErrors.peso}
                size="small"
                inputProps={{ step: 0.1, min: 0.05, max: 5 }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Galpón"
                name="galpon"
                value={cuyForm.galpon}
                onChange={handleCuyChange}
                fullWidth
                required
                error={!!cuyErrors.galpon}
                helperText={cuyErrors.galpon}
                size="small"
              />

              <TextField
                label="Jaula"
                name="jaula"
                value={cuyForm.jaula}
                onChange={handleCuyChange}
                fullWidth
                required
                error={!!cuyErrors.jaula}
                helperText={cuyErrors.jaula}
                size="small"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={cuyForm.estado}
                  onChange={handleCuyChange}
                  label="Estado"
                >
                  {estadosOptions.map(estado => (
                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Etapa de Vida</InputLabel>
                <Select
                  name="etapaVida"
                  value={cuyForm.etapaVida}
                  onChange={handleCuyChange}
                  label="Etapa de Vida"
                >
                  {etapasOptions.map(etapa => (
                    <MenuItem key={etapa} value={etapa}>{etapa}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Propósito</InputLabel>
                <Select
                  name="proposito"
                  value={cuyForm.proposito}
                  onChange={handleCuyChange}
                  label="Propósito"
                >
                  {propositosOptions.map(proposito => (
                    <MenuItem key={proposito} value={proposito}>{proposito}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Campos condicionales según el estado */}
            {cuyForm.estado === 'Vendido' && (
              <TextField
                label="Fecha de Venta"
                name="fechaVenta"
                type="date"
                value={cuyForm.fechaVenta || ''}
                onChange={handleCuyChange}
                fullWidth
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            )}

            {cuyForm.estado === 'Fallecido' && (
              <TextField
                label="Fecha de Fallecimiento"
                name="fechaFallecimiento"
                type="date"
                value={cuyForm.fechaFallecimiento || ''}
                onChange={handleCuyChange}
                fullWidth
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCuyDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCuy}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminación masiva */}
      <Dialog open={openBulkDeleteDialog} onClose={handleBulkDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: theme.palette.error.main, width: 40, height: 40 }}>
              <Delete />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Confirmar Eliminación Masiva
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
              ¿Está seguro de que desea eliminar {selectedIds.length} cuyes seleccionados?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Esta acción no se puede deshacer. Los cuyes y toda su información asociada serán eliminados permanentemente.
            </Typography>
          </Alert>

          <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), p: 2, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
              Cuyes que serán eliminados:
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {selectedIds.map(id => {
                const cuy = cuyes.find(c => c.id === id);
                return cuy ? (
                  <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <Chip
                      label={`#${cuy.id}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2">
                      {cuy.raza} - {cuy.sexo === 'M' ? 'Macho' : 'Hembra'} - {cuy.galpon}-{cuy.jaula}
                    </Typography>
                  </Box>
                ) : null;
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleBulkDeleteCancel}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            variant="contained"
            color="error"
            size="large"
            disabled={bulkActionLoading}
            startIcon={bulkActionLoading ? <CircularProgress size={20} /> : <Delete />}
            sx={{ minWidth: 120 }}
          >
            {bulkActionLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de estadísticas avanzadas */}
      <Dialog open={openEstadisticasDialog} onClose={() => setOpenEstadisticasDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics color="primary" />
              <Typography variant="h6">
                Estadísticas Avanzadas de Cuyes
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenEstadisticasDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {!estadisticasAvanzadas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>Resumen General</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                        <Pets fontSize="small" />
                      </Avatar>
                      <Typography variant="h6">{estadisticasAvanzadas.resumen.totalCuyes}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">Total de Cuyes</Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>
                        <CheckCircle fontSize="small" />
                      </Avatar>
                      <Typography variant="h6">{estadisticasAvanzadas.resumen.cuyesActivos}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">Cuyes Activos</Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ bgcolor: theme.palette.info.main, width: 32, height: 32 }}>
                        <Add fontSize="small" />
                      </Avatar>
                      <Typography variant="h6">{estadisticasAvanzadas.resumen.cuyesNuevos}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">Cuyes Nuevos (últimos {estadisticasAvanzadas.resumen.periodo} días)</Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 32, height: 32 }}>
                        <Warning fontSize="small" />
                      </Avatar>
                      <Typography variant="h6">{estadisticasAvanzadas.resumen.cuyesProximosCambio}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">Próximos a cambiar de etapa</Typography>
                  </CardContent>
                </Card>
              </Box>

              <Typography variant="h6" gutterBottom>Distribución por Etapas</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Etapas de Vida</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {estadisticasAvanzadas.distribucion.etapas.map((item, index) => (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{item.etapa}</Typography>
                            <Typography variant="body2">{item.cantidad} cuyes</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(item.cantidad / estadisticasAvanzadas.resumen.cuyesActivos) * 100}
                            color={getEtapaColor(item.etapa) as unknown}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Propósitos</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {estadisticasAvanzadas.distribucion.propositos.map((item, index) => (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{item.proposito}</Typography>
                            <Typography variant="body2">{item.cantidad} cuyes</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(item.cantidad / estadisticasAvanzadas.resumen.cuyesActivos) * 100}
                            color="primary"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              <Typography variant="h6" gutterBottom>Distribución por Galpones</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
                {estadisticasAvanzadas.distribucion.galpones.length > 0 ? (
                  estadisticasAvanzadas.distribucion.galpones.map((item, index) => (
                    <Card key={index}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Galpón {item.galpon}</Typography>
                        <Typography variant="h4">{item.cantidad}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>cuyes</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Peso promedio:</strong> {item.pesoPromedio.toFixed(2)} kg
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card sx={{ gridColumn: '1 / -1' }}>
                    <CardContent>
                      <Alert severity="info">
                        No hay datos de distribución por galpones disponibles.
                        {estadisticasAvanzadas.resumen.totalCuyes === 0 ?
                          ' Registra algunos cuyes para ver las estadísticas.' :
                          ' Los cuyes existentes no tienen galpones asignados.'
                        }
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>Análisis de Peso por Etapa</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {estadisticasAvanzadas.analisis.pesoPromedioPorEtapa.length > 0 ? (
                  estadisticasAvanzadas.analisis.pesoPromedioPorEtapa.map((item, index) => (
                    <Card key={index}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>{item.etapa}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Scale color="action" />
                          <Typography variant="h5">{item.pesoPromedio.toFixed(2)} kg</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Basado en {item.cantidad} cuyes
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card sx={{ gridColumn: '1 / -1' }}>
                    <CardContent>
                      <Alert severity="info">
                        No hay datos de análisis de peso por etapa disponibles.
                        {estadisticasAvanzadas.resumen.totalCuyes === 0 ?
                          ' Registra algunos cuyes para ver las estadísticas.' :
                          ' Los cuyes existentes no tienen datos de peso o etapa suficientes.'
                        }
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEstadisticasDialog(false)}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={handleActualizarEtapas}
            startIcon={<Refresh />}
          >
            Actualizar Etapas
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de registro masivo */}
      <Dialog open={openMasiveDialog} onClose={() => setOpenMasiveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Groups color="primary" />
              <Typography variant="h6">
                Registro Masivo de Cuyes
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenMasiveDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Esta herramienta te permite registrar múltiples cuyes de una vez con características similares.
              Los pesos se asignarán aleatoriamente dentro del rango especificado y las jaulas se numerarán consecutivamente.
            </Typography>
          </Alert>

          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Cantidad de Cuyes"
                name="cantidad"
                type="number"
                value={masiveForm.cantidad}
                onChange={handleMasiveChange}
                fullWidth
                required
                size="small"
                inputProps={{ min: 1, max: 50 }}
                helperText="Máximo 50 cuyes por registro"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Raza</InputLabel>
                <Select
                  name="raza"
                  value={masiveForm.raza}
                  onChange={handleMasiveChange}
                  label="Raza"
                >
                  {razasOptions.map(raza => (
                    <MenuItem key={raza} value={raza}>{raza}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Fecha de Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={masiveForm.fechaNacimiento}
                onChange={handleMasiveChange}
                fullWidth
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Sexo</InputLabel>
                <Select
                  name="sexo"
                  value={masiveForm.sexo}
                  onChange={handleMasiveChange}
                  label="Sexo"
                >
                  <MenuItem value="M">Macho</MenuItem>
                  <MenuItem value="H">Hembra</MenuItem>
                  <MenuItem value="Aleatorio">Aleatorio (50/50)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Peso Mínimo (kg)"
                name="pesoMin"
                type="number"
                value={masiveForm.pesoMin}
                onChange={handleMasiveChange}
                fullWidth
                required
                size="small"
                inputProps={{ step: 0.1, min: 0.1, max: 5 }}
              />

              <TextField
                label="Peso Máximo (kg)"
                name="pesoMax"
                type="number"
                value={masiveForm.pesoMax}
                onChange={handleMasiveChange}
                fullWidth
                required
                size="small"
                inputProps={{ step: 0.1, min: 0.1, max: 5 }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Galpón"
                name="galpon"
                value={masiveForm.galpon}
                onChange={handleMasiveChange}
                fullWidth
                required
                size="small"
                placeholder="Ej: A, B, C"
              />

              <TextField
                label="Jaula Inicial"
                name="jaulaInicio"
                type="number"
                value={masiveForm.jaulaInicio}
                onChange={handleMasiveChange}
                fullWidth
                required
                size="small"
                inputProps={{ min: 1 }}
                helperText="Las jaulas se numerarán consecutivamente"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={masiveForm.estado}
                  onChange={handleMasiveChange}
                  label="Estado"
                >
                  {estadosOptions.map(estado => (
                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Etapa de Vida</InputLabel>
                <Select
                  name="etapaVida"
                  value={masiveForm.etapaVida}
                  onChange={handleMasiveChange}
                  label="Etapa de Vida"
                >
                  {etapasOptions.map(etapa => (
                    <MenuItem key={etapa} value={etapa}>{etapa}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Propósito</InputLabel>
                <Select
                  name="proposito"
                  value={masiveForm.proposito}
                  onChange={handleMasiveChange}
                  label="Propósito"
                >
                  {propositosOptions.map(proposito => (
                    <MenuItem key={proposito} value={proposito}>{proposito}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Vista previa */}
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Vista Previa del Registro:
              </Typography>
              <Typography variant="body2">
                • Se crearán <strong>{masiveForm.cantidad}</strong> cuyes de raza <strong>{masiveForm.raza}</strong>
              </Typography>
              <Typography variant="body2">
                • Sexo: <strong>{masiveForm.sexo === 'Aleatorio' ? 'Aleatorio (50% M / 50% H)' : (masiveForm.sexo === 'M' ? 'Macho' : 'Hembra')}</strong>
              </Typography>
              <Typography variant="body2">
                • Peso: Entre <strong>{masiveForm.pesoMin} kg</strong> y <strong>{masiveForm.pesoMax} kg</strong> (aleatorio)
              </Typography>
              <Typography variant="body2">
                • Ubicación: Galpón <strong>{masiveForm.galpon || '[Especificar]'}</strong>,
                Jaulas <strong>{masiveForm.jaulaInicio || '[Especificar]'}</strong> a <strong>{masiveForm.jaulaInicio ? (parseInt(masiveForm.jaulaInicio) + masiveForm.cantidad - 1) : '[Calcular]'}</strong>
              </Typography>
              <Typography variant="body2">
                • Estado: <strong>{masiveForm.estado}</strong>, Etapa: <strong>{masiveForm.etapaVida}</strong>, Propósito: <strong>{masiveForm.proposito}</strong>
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setOpenMasiveDialog(false)}
            variant="outlined"
            size="large"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMasiveSubmit}
            variant="contained"
            size="large"
            disabled={masiveLoading}
            startIcon={masiveLoading ? <CircularProgress size={20} /> : <Groups />}
            sx={{ minWidth: 160 }}
          >
            {masiveLoading ? 'Creando...' : `Crear ${masiveForm.cantidad} Cuyes`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación individual */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="cuy"
        loading={deleteConfirmation.loading}
      />
    </Box>
  );
};

export default CuyesManagerFixed;