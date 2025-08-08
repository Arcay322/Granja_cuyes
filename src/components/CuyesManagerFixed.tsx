import React, { useState, useEffect, useCallback } from 'react';
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
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import DeleteCuyWithRelationsDialog from './DeleteCuyWithRelationsDialog';
import BulkDeleteWarningDialog from './BulkDeleteWarningDialog';

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

interface CuyesManagerProps {
  // Props para configurar qué funcionalidades mostrar
  showNewCuyButton?: boolean;
  showMassiveRegistration?: boolean;
  showViewToggle?: boolean;
  showFiltersPanel?: boolean;
  showStats?: boolean;
  showTitle?: boolean;
  showUpdateStagesButton?: boolean;
  showFiltersButton?: boolean;
  showRefreshButton?: boolean;
  showSearchButton?: boolean;
  // Props para filtros preestablecidos
  presetFilters?: {
    galpon?: string;
    jaula?: string;
  };
  // Props para personalizar el título
  customTitle?: string;
}

const CuyesManagerFixed: React.FC<CuyesManagerProps> = ({
  showNewCuyButton = true,
  showMassiveRegistration = true,
  showViewToggle = true,
  showFiltersPanel = true,
  showStats = true,
  showTitle = true,
  showUpdateStagesButton = false,
  showFiltersButton = true,
  showRefreshButton = false,
  showSearchButton = true,
  presetFilters,
  customTitle
}) => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
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
    jaula: '',
    estado: 'Activo',
    etapaVida: 'Cría',
    proposito: 'Indefinido'
  });
  const [masiveLoading, setMasiveLoading] = useState(false);

  // Estados para galpones y jaulas
  const [galpones, setGalpones] = useState<Array<{ id: number, nombre: string }>>([]);
  const [jaulas, setJaulas] = useState<Array<{ id: number, nombre: string, galponNombre: string, capacidadMaxima?: number }>>([]);
  const [jaulasDisponibles, setJaulasDisponibles] = useState<Array<{ id: number, nombre: string, galponNombre: string, capacidadMaxima?: number, ocupacionActual?: number }>>([]);
  // Estado separado para el registro masivo
  const [jaulasDisponiblesMasivo, setJaulasDisponiblesMasivo] = useState<Array<{ id: number, nombre: string, galponNombre: string, capacidadMaxima?: number, ocupacionActual?: number }>>([]);

  // Estados para crear nuevos galpones y jaulas
  const [openNewGalponDialog, setOpenNewGalponDialog] = useState(false);
  const [openNewJaulaDialog, setOpenNewJaulaDialog] = useState(false);
  const [newGalponForm, setNewGalponForm] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    capacidadMaxima: 50
  });
  const [newJaulaForm, setNewJaulaForm] = useState({
    nombre: '',
    galponNombre: '',
    descripcion: '',
    capacidadMaxima: 10,
    tipo: 'Estándar'
  });
  const [creatingGalpon, setCreatingGalpon] = useState(false);
  const [creatingJaula, setCreatingJaula] = useState(false);

  // Estados para información de capacidad en tiempo real
  const [capacidadInfo, setCapacidadInfo] = useState<{
    jaula?: {
      ocupacionActual: number;
      capacidadMaxima: number;
      porcentajeOcupacion: number;
      espacioDisponible: number;
    };
    galpon?: {
      ocupacionActual: number;
      capacidadMaxima: number;
      porcentajeOcupacion: number;
      espacioDisponible: number;
    };
  }>({});

  // Estados para diálogo de advertencia de capacidad
  const [openCapacidadWarningDialog, setOpenCapacidadWarningDialog] = useState(false);
  const [capacidadWarningData, setCapacidadWarningData] = useState<{
    jaula: unknown;
    galpon: unknown;
    cantidad: number;
    totalJaula: number;
    totalGalpon: number;
    porcentajeJaula: number;
    porcentajeGalpon: number;
  } | null>(null);

  // Estados para eliminación con verificación de relaciones
  const [openDeleteWithRelationsDialog, setOpenDeleteWithRelationsDialog] = useState(false);
  const [cuyToDelete, setCuyToDelete] = useState<number | null>(null);

  // Estados para el nuevo diálogo de advertencia de eliminación múltiple
  const [openBulkWarningDialog, setOpenBulkWarningDialog] = useState(false);
  const [bulkWarningData, setBulkWarningData] = useState<{
    selectedCount: number;
    cuyesWithRelations: Array<{
      id: number;
      tieneRelaciones: boolean;
      totalRelaciones: number;
      raza?: string;
      sexo?: string;
      galpon?: string;
      jaula?: string;
    }>;
    totalRelations: number;
  } | null>(null);

  // Estado para mostrar el diálogo de carga durante verificación de relaciones múltiples
  const [showBulkVerificationLoading, setShowBulkVerificationLoading] = useState(false);

  // Función para manejar la eliminación confirmada con relaciones
  const handleDeleteWithRelationsConfirmed = async (cuyId: number) => {
    try {
      const response = await api.delete(`/cuyes/${cuyId}/eliminar-con-relaciones`);
      if ((response.data as any).success) {
        const eliminados = (response.data as any).data.eliminados;
        const totalEliminados = Object.values(eliminados).reduce((sum: number, count: any) => sum + (count as number), 0);
        
        toastService.success(
          'Eliminación Exitosa',
          `Cuy eliminado junto con ${totalEliminados} registros relacionados`
        );
        
        fetchCuyes();
        fetchStats();
        setOpenDeleteWithRelationsDialog(false);
        setCuyToDelete(null);
      }
    } catch (error: any) {
      console.error('Error al eliminar cuy con relaciones:', error);
      const errorMsg = error.response?.data?.message || 'No se pudo eliminar el cuy';
      toastService.error('Error al eliminar', errorMsg);
    }
  };

  // Configuración para diálogo de confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      try {
        const response = await api.delete(`/cuyes/${id}`);
        if ((response.data as any).success) {
          fetchCuyes();
          fetchStats();
          // La notificación de éxito la maneja automáticamente el hook
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'No se pudo eliminar el cuy';
        // Re-lanzar el error para que el hook maneje la notificación de error
        throw new Error(errorMsg);
      }
    },
    itemName: 'cuy',
    successMessage: 'El cuy ha sido eliminado exitosamente'
  });

  // Función para aplicar filtros manualmente
  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCuyes(searchTerm); // Pasar el término de búsqueda explícitamente
  };

  const fetchCuyes = useCallback(async (searchTermToUse?: string) => {
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
        ...(searchTermToUse && { search: searchTermToUse })
      });

      const response = await api.get(`/cuyes?${params}`);
      const data = (response.data as any);

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
  }, [pagination.page, pagination.limit, filters]);

  // Efecto para aplicar filtros desde URL o props al cargar el componente
  useEffect(() => {
    const galponParam = searchParams.get('galpon') || presetFilters?.galpon;
    const jaulaParam = searchParams.get('jaula') || presetFilters?.jaula;

    if (galponParam || jaulaParam) {
      setFilters(prev => ({
        ...prev,
        galpon: galponParam || '',
        jaula: jaulaParam || ''
      }));

      // Mostrar filtros automáticamente si vienen desde URL o props
      if (showFiltersPanel) {
        setShowFilters(true);
      }

      // Mostrar mensaje informativo solo si vienen desde URL
      if (searchParams.get('galpon') || searchParams.get('jaula')) {
        if (galponParam && jaulaParam) {
          toastService.info(
            'Filtros aplicados',
            `Mostrando cuyes del Galpón ${galponParam}, Jaula ${jaulaParam}`
          );
        } else if (galponParam) {
          toastService.info(
            'Filtros aplicados',
            `Mostrando cuyes del Galpón ${galponParam}`
          );
        }
      }
    }
  }, [searchParams, presetFilters, showFiltersPanel]);

  const fetchStats = useCallback(async () => {
    try {
      let response;

      // Si hay filtros preestablecidos de galpón y jaula, usar estadísticas específicas
      if (presetFilters?.galpon && presetFilters?.jaula) {
        const params = new URLSearchParams({
          galpon: presetFilters.galpon,
          jaula: presetFilters.jaula
        });
        response = await api.get(`/cuyes/estadisticas-jaula?${params}`);

        // Adaptar la respuesta al formato esperado por el componente
        if ((response.data as any).success) {
          const jaulaData = (response.data as any).data;
          const resumen = jaulaData.resumen;
          const distribucion = jaulaData.distribucion;

          // Obtener estadísticas reales de la jaula
          const totalCuyes = resumen.totalCuyes;
          const crias = distribucion.etapas.find((e: any) => e.etapa === 'Cría')?.cantidad || 0;

          // Hacer una consulta adicional para obtener datos de sexo específicos de la jaula
          const cuyesResponse = await api.get(`/cuyes?galpon=${presetFilters.galpon}&jaula=${presetFilters.jaula}&limit=1000`);
          if ((cuyesResponse.data as any).success) {
            const cuyesJaula = (cuyesResponse.data as any).data;
            const machos = cuyesJaula.filter((c: any) => c.sexo === 'M').length;
            const hembras = cuyesJaula.filter((c: any) => c.sexo === 'H').length;

            setStats({
              total: totalCuyes,
              machos: machos,
              hembras: hembras,
              crias: crias,
              adultos: totalCuyes - crias
            });
          } else {
            // Fallback con aproximación si falla la consulta de cuyes
            setStats({
              total: totalCuyes,
              machos: Math.floor(totalCuyes * 0.5),
              hembras: Math.ceil(totalCuyes * 0.5),
              crias: crias,
              adultos: totalCuyes - crias
            });
          }
        }
      } else {
        // Usar estadísticas generales
        response = await api.get('/cuyes/stats');
        if ((response.data as any).success) {
          setStats((response.data as any).data);
        }
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  }, [presetFilters]);

  useEffect(() => {
    fetchCuyes(); // Sin término de búsqueda para carga inicial
    fetchStats();
    fetchGalpones();
    fetchJaulas();
  }, [pagination.page, pagination.limit, filters, fetchCuyes, fetchStats]);

  // Efecto separado para fetchStats cuando cambien los presetFilters
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Efecto para actualizar jaulas disponibles cuando cambie el galpón en el formulario individual
  useEffect(() => {
    if (cuyForm.galpon) {
      // Filtrar jaulas del galpón seleccionado
      const jaulasDelGalpon = jaulas.filter(jaula => jaula.galponNombre === cuyForm.galpon);
      setJaulasDisponibles(jaulasDelGalpon);
      
      // Si la jaula actual no pertenece al galpón seleccionado, limpiarla
      if (cuyForm.jaula && !jaulasDelGalpon.some(jaula => jaula.nombre === cuyForm.jaula)) {
        setCuyForm(prev => ({ ...prev, jaula: '' }));
      }
    } else {
      setJaulasDisponibles([]);
      setCuyForm(prev => ({ ...prev, jaula: '' }));
    }
  }, [cuyForm.galpon, jaulas]);

  const fetchEstadisticasAvanzadas = async () => {
    console.log('🔍 Función fetchEstadisticasAvanzadas ejecutada');
    try {
      setLoading(true);
      console.log('📡 Enviando petición a /cuyes/estadisticas-avanzadas');
      const response = await api.get('/cuyes/estadisticas-avanzadas');
      console.log('📊 Respuesta recibida:', response.data);
      console.log('📊 Datos específicos:', (response.data as any).data);
      console.log('📊 Estructura de etapas:', (response.data as any).data?.distribucion?.etapas);
      console.log('📊 Estructura de propósitos:', (response.data as any).data?.distribucion?.propositos);
      console.log('📊 Estructura de galpones:', (response.data as any).data?.distribucion?.galpones);

      if ((response.data as any).success) {
        setEstadisticasAvanzadas((response.data as any).data);
        setOpenEstadisticasDialog(true);
        console.log('✅ Diálogo de estadísticas abierto');
        console.log('✅ Estado estadisticasAvanzadas:', (response.data as any).data);
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
      if ((response.data as any).success) {
        setHistorial((response.data as any).data);
        setOpenHistorialDialog(true);
      }
    } catch (error) {
      console.error('Error al obtener historial:', error);
      toastService.error('Error', 'No se pudo cargar el historial del cuy');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const fetchGalpones = async () => {
    try {
      const response = await api.get('/galpones');
      if ((response.data as any).success) {
        setGalpones((response.data as any).data);
      }
    } catch (error) {
      console.error('Error al obtener galpones:', error);
    }
  };

  const fetchJaulas = async () => {
    try {
      const response = await api.get('/galpones/jaulas/todas');
      if ((response.data as any).success) {
        setJaulas((response.data as any).data);
      }
    } catch (error) {
      console.error('Error al obtener jaulas:', error);
    }
  };

  // Función para verificar capacidad de jaula
  const verificarCapacidadJaula = async (galponNombre: string, jaulaNombre: string) => {
    try {
      // Obtener cuyes actuales en la jaula
      const cuyesResponse = await api.get(`/cuyes?galpon=${galponNombre}&jaula=${jaulaNombre}&limit=1000`);
      const cuyesActuales = (cuyesResponse.data as any).data?.length || 0;

      // Obtener información fresca de la jaula directamente de la API
      const jaulasResponse = await api.get('/galpones/jaulas/todas');
      const jaulasActualizadas = (jaulasResponse.data as any).success ? (jaulasResponse.data as any).data : jaulas;

      // Buscar la jaula para obtener su capacidad máxima
      const jaula = jaulasActualizadas.find((j: any) => j.galponNombre === galponNombre && j.nombre === jaulaNombre);
      const capacidadMaxima = jaula?.capacidadMaxima || 10;

      console.log(`🔍 Verificando jaula ${jaulaNombre} en galpón ${galponNombre}:`);
      console.log(`📊 Cuyes actuales: ${cuyesActuales}`);
      console.log(`📊 Capacidad máxima: ${capacidadMaxima}`);
      console.log(`📊 Espacio disponible: ${capacidadMaxima - cuyesActuales}`);

      return {
        ocupacionActual: cuyesActuales,
        capacidadMaxima,
        porcentajeOcupacion: (cuyesActuales / capacidadMaxima) * 100,
        espacioDisponible: capacidadMaxima - cuyesActuales
      };
    } catch (error) {
      console.error('Error al verificar capacidad de jaula:', error);
      return null;
    }
  };

  // Función para verificar capacidad de galpón
  const verificarCapacidadGalpon = async (galponNombre: string) => {
    try {
      const response = await api.get(`/cuyes?galpon=${galponNombre}&limit=1000`);
      const cuyesActuales = (response.data as any).data?.length || 0;

      // Buscar el galpón para obtener su capacidad máxima
      const galpon = galpones.find(g => g.nombre === galponNombre);
      const capacidadMaxima = (galpon as any)?.capacidadMaxima || 50;

      return {
        ocupacionActual: cuyesActuales,
        capacidadMaxima,
        porcentajeOcupacion: (cuyesActuales / capacidadMaxima) * 100,
        espacioDisponible: capacidadMaxima - cuyesActuales
      };
    } catch (error) {
      console.error('Error al verificar capacidad de galpón:', error);
      return null;
    }
  };

  // Funciones para actualizar información de capacidad en tiempo real
  const actualizarCapacidadGalpon = async (galponNombre: string) => {
    if (!galponNombre) return;

    const capacidad = await verificarCapacidadGalpon(galponNombre);
    if (capacidad) {
      setCapacidadInfo(prev => ({ ...prev, galpon: capacidad }));
    }
  };

  const actualizarCapacidadJaula = async (galponNombre: string, jaulaNombre: string) => {
    if (!galponNombre || !jaulaNombre) return;

    const capacidad = await verificarCapacidadJaula(galponNombre, jaulaNombre);
    if (capacidad) {
      setCapacidadInfo(prev => ({ ...prev, jaula: capacidad }));
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

  const handleCuyChange = (e: any) => {
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

    console.log('[DEBUG] handleSubmitCuy ejecutado');
    if (!validateCuyForm()) {
      toastService.error('Error', 'Formulario inválido. Revisa los campos obligatorios.');
      console.warn('[DEBUG] Validación fallida en handleSubmitCuy', cuyForm);
      return;
    }

    try {
      setLoading(true);
      if (editId) {
        const response = await api.put(`/cuyes/${editId}`, cuyForm);
        if ((response.data as any).success) {
          toastService.success('Cuy actualizado', 'El cuy ha sido actualizado exitosamente');
        }
      } else {
        const response = await api.post('/cuyes', cuyForm);
        if ((response.data as any).success) {
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
      if ((response.data as any).success) {
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
      if ((response.data as any).success) {
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
      if ((response.data as any).success) {
        const { actualizados } = (response.data as any).data;
        toastService.success(
          'Etapas actualizadas',
          `Se actualizaron automáticamente ${actualizados} cuyes según su edad actual`
        );
        fetchCuyes();
        fetchStats();
      }
    } catch (error: any) {
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

  const handleBulkDeleteClick = async () => {
    if (selectedIds.length === 0) {
      toastService.warning('Selección requerida', 'Debe seleccionar al menos un cuy para eliminar');
      return;
    }

    // Mostrar diálogo de carga mientras se verifican las relaciones
    setShowBulkVerificationLoading(true);
    
    // Para eliminación múltiple, verificar si algún cuy tiene relaciones
    setBulkActionLoading(true);
    try {
      const verificaciones = await Promise.all(
        selectedIds.map(async (id) => {
          try {
            const response = await api.get(`/cuyes/${id}/verificar-relaciones`);
            return {
              id,
              tieneRelaciones: (response.data as any).data.relacionesEncontradas.length > 0,
              totalRelaciones: (response.data as any).data.relacionesEncontradas.reduce((sum: any, rel: any) => sum + rel.cantidad, 0)
            };
          } catch (error) {
            return { id, tieneRelaciones: false, totalRelaciones: 0 };
          }
        })
      );

      const cuyesConRelaciones = verificaciones.filter(v => v.tieneRelaciones);
      const totalRelaciones = verificaciones.reduce((sum, v) => sum + v.totalRelaciones, 0);

      // Obtener información adicional de los cuyes para el diálogo
      const cuyesWithRelationsData = await Promise.all(
        cuyesConRelaciones.map(async (cuyRel) => {
          const cuy = cuyes.find(c => c.id === cuyRel.id);
          return {
            id: cuyRel.id,
            tieneRelaciones: cuyRel.tieneRelaciones,
            totalRelaciones: cuyRel.totalRelaciones,
            raza: cuy?.raza,
            sexo: cuy?.sexo,
            galpon: cuy?.galpon,
            jaula: cuy?.jaula
          };
        })
      );

      // Configurar datos para el nuevo diálogo de advertencia
      setBulkWarningData({
        selectedCount: selectedIds.length,
        cuyesWithRelations: cuyesWithRelationsData,
        totalRelations: totalRelaciones
      });

      setOpenBulkWarningDialog(true);
    } catch (error) {
      console.error('Error al verificar relaciones:', error);
      toastService.error('Error', 'No se pudo verificar las relaciones de los cuyes');
    } finally {
      setBulkActionLoading(false);
      setShowBulkVerificationLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkActionLoading(true);
    try {
      // Usar el endpoint de eliminación con relaciones para cada cuy
      const resultados = await Promise.all(
        selectedIds.map(async (id) => {
          try {
            const response = await api.delete(`/cuyes/${id}/eliminar-con-relaciones`);
            return {
              id,
              success: (response.data as any).success,
              eliminados: (response.data as any).data?.eliminados || {},
              error: null
            };
          } catch (error) {
            return {
              id,
              success: false,
              eliminados: {},
              error: (error as any).response?.data?.message || 'Error desconocido'
            };
          }
        })
      );

      const exitosos = resultados.filter(r => r.success);
      const fallidos = resultados.filter(r => !r.success);

      // Calcular total de registros eliminados
      const totalRegistrosEliminados = exitosos.reduce((total, resultado) => {
        return total + Object.values((resultado as any).eliminados).reduce((sum: number, count: any) => sum + (count as number), 0);
      }, 0);

      if (exitosos.length > 0) {
        toastService.success(
          'Eliminación Exitosa',
          `Se eliminaron ${exitosos.length} cuyes junto con ${totalRegistrosEliminados} registros relacionados${fallidos.length > 0 ? ` (${fallidos.length} errores)` : ''}`
        );
      }

      if (fallidos.length > 0 && exitosos.length === 0) {
        toastService.error(
          'Error en Eliminación',
          `No se pudo eliminar ningún cuy. ${fallidos.length} errores encontrados.`
        );
      }

      setSelectedIds([]);
      setOpenBulkDeleteDialog(false);
      fetchCuyes();
      fetchStats();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error inesperado durante la eliminación múltiple';
      toastService.error('Error al eliminar', errorMsg);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteCancel = () => {
    setOpenBulkDeleteDialog(false);
  };

  // Función para manejar la confirmación del diálogo de advertencia de eliminación múltiple
  const handleBulkWarningConfirm = () => {
    setOpenBulkWarningDialog(false);
    setOpenBulkDeleteDialog(true);
  };



  // Funciones para el diálogo de advertencia de capacidad
  const handleCapacidadWarningConfirm = async () => {
    setOpenCapacidadWarningDialog(false);
    // Continuar con el registro masivo
    await continuarRegistroMasivo();
  };

  const handleCapacidadWarningCancel = () => {
    setOpenCapacidadWarningDialog(false);
    setMasiveLoading(false);
  };

  const continuarRegistroMasivo = async () => {
    // Esta función contiene la lógica de registro que se ejecuta después de confirmar la advertencia
    try {
      const cuyes = [];
      const cantidadNumerica = Number(masiveForm.cantidad);

      for (let i = 0; i < cantidadNumerica; i++) {
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
          jaula: masiveForm.jaula, // Usar la jaula específica seleccionada
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
          if ((response.data as any).success) {
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
          `Se crearon ${creados} cuyes exitosamente en ${masiveForm.galpon}-${masiveForm.jaula}${errores > 0 ? ` (${errores} errores)` : ''}`
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

  const handleOpenMasiveDialog = () => {
    // Limpiar formulario y estados
    setMasiveForm({
      cantidad: 5,
      raza: 'Peruano',
      fechaNacimiento: new Date().toISOString().split('T')[0],
      sexo: 'M',
      pesoMin: 0.4,
      pesoMax: 0.6,
      galpon: '',
      jaula: '',
      estado: 'Activo',
      etapaVida: 'Cría',
      proposito: 'Indefinido'
    });
    setJaulasDisponibles([]);
    setOpenMasiveDialog(true);
  };

  // Funciones para crear nuevos galpones y jaulas
  const handleNewGalponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewGalponForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNewJaulaChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      if (name === 'capacidadMaxima') {
        setNewJaulaForm(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
      } else {
        setNewJaulaForm(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleCreateGalpon = async () => {
    if (!newGalponForm.nombre.trim()) {
      toastService.error('Error', 'El nombre del galpón es obligatorio');
      return;
    }

    setCreatingGalpon(true);
    try {
      const response = await api.post('/galpones', {
        nombre: newGalponForm.nombre,
        descripcion: newGalponForm.descripcion,
        ubicacion: newGalponForm.ubicacion,
        capacidadMaxima: newGalponForm.capacidadMaxima
      });

      if ((response.data as any).success) {
        toastService.success('Galpón creado', 'El galpón ha sido creado exitosamente');
        setOpenNewGalponDialog(false);
        setNewGalponForm({
          nombre: '',
          descripcion: '',
          ubicacion: '',
          capacidadMaxima: 50
        });

        // Actualizar lista de galpones y seleccionar el nuevo
        await fetchGalpones();
        setMasiveForm(prev => ({ ...prev, galpon: newGalponForm.nombre }));
      }
    } catch (error: unknown) {
      const errorMsg = (error as any).response?.data?.error || 'No se pudo crear el galpón';
      toastService.error('Error al crear galpón', errorMsg);
    } finally {
      setCreatingGalpon(false);
    }
  };

  const handleCreateJaula = async () => {
    if (!newJaulaForm.nombre.trim() || !newJaulaForm.galponNombre.trim()) {
      toastService.error('Error', 'El nombre de la jaula y el galpón son obligatorios');
      return;
    }

    // Buscar el ID del galpón
    const galpon = galpones.find(g => g.nombre === newJaulaForm.galponNombre);
    if (!galpon) {
      toastService.error('Error', 'Galpón no encontrado');
      return;
    }

    setCreatingJaula(true);
    try {
      // Guardar los valores antes de resetear el formulario
      const jaulaNombre = newJaulaForm.nombre;
      const galponNombre = newJaulaForm.galponNombre;

      const response = await api.post('/galpones/jaulas', {
        nombre: jaulaNombre,
        galponId: galpon.id,
        galponNombre: galponNombre,
        descripcion: newJaulaForm.descripcion,
        capacidadMaxima: newJaulaForm.capacidadMaxima,
        tipo: newJaulaForm.tipo
      });

      if ((response.data as any).success) {
        toastService.success('Jaula creada', 'La jaula ha sido creada exitosamente');
        setOpenNewJaulaDialog(false);
        setNewJaulaForm({
          nombre: '',
          galponNombre: '',
          descripcion: '',
          capacidadMaxima: 10,
          tipo: 'Estándar'
        });

        // Actualizar lista de jaulas global y disponibles usando el endpoint específico del galpón
        const jaulasGalponResponse = await api.get(`/galpones/${encodeURIComponent(galponNombre)}/jaulas`);
        if ((jaulasGalponResponse.data as any).success) {
          const jaulasDelGalpon = (jaulasGalponResponse.data as any).data;
          // Actualizar jaulas globales (opcional, si quieres mantener sincronía)
          setJaulas(prev => {
            // Remover las jaulas de este galpón y agregar las nuevas
            const otrasJaulas = prev.filter(j => j.galponNombre !== galponNombre);
            return [...otrasJaulas, ...jaulasDelGalpon];
          });
          setJaulasDisponibles(jaulasDelGalpon);
          setJaulasDisponiblesMasivo(jaulasDelGalpon); // Actualiza el estado masivo
          setMasiveForm(prev => ({ ...prev, jaula: jaulaNombre }));
        }
      }
    } catch (error: unknown) {
      const errorMsg = (error as any).response?.data?.error || 'No se pudo crear la jaula';
      toastService.error('Error al crear jaula', errorMsg);
    } finally {
      setCreatingJaula(false);
    }
  };

  // Funciones para registro masivo
  const handleMasiveChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      setMasiveForm(prev => ({ ...prev, [name]: value }));

      // Si cambia el galpón, filtrar las jaulas disponibles SOLO para el masivo
      if (name === 'galpon') {
        const jaulasDelGalpon = jaulas.filter(jaula => jaula.galponNombre === value);
        setJaulasDisponiblesMasivo(jaulasDelGalpon);
        setMasiveForm(prev => ({ ...prev, jaula: '' }));
        actualizarCapacidadGalpon(value as string);
        setCapacidadInfo(prev => ({ ...prev, jaula: undefined }));
      }

      // Si cambia la jaula, actualizar información de capacidad
      if (name === 'jaula' && masiveForm.galpon) {
        actualizarCapacidadJaula(masiveForm.galpon, value as string);
      }
    }
  };

  const handleMasiveSubmit = async () => {
    if (!masiveForm.galpon.trim() || !masiveForm.jaula.trim()) {
      toastService.error('Campos requeridos', 'Galpón y jaula son obligatorios');
      return;
    }

    if (masiveForm.cantidad < 1 || masiveForm.cantidad > 50) {
      toastService.error('Cantidad inválida', 'La cantidad debe estar entre 1 y 50 cuyes');
      return;
    }

    // Validar que la jaula seleccionada pertenece al galpón seleccionado
    const jaulaValida = jaulasDisponiblesMasivo.find(j => j.nombre === masiveForm.jaula);
    if (!jaulaValida) {
      toastService.error('Jaula inválida', 'La jaula seleccionada no pertenece al galpón especificado');
      return;
    }

    // Verificar capacidad de la jaula y galpón (obtener datos frescos)
    console.log('🔍 Verificando capacidad antes del registro...');
    const capacidadJaula = await verificarCapacidadJaula(masiveForm.galpon, masiveForm.jaula);
    const capacidadGalpon = await verificarCapacidadGalpon(masiveForm.galpon);

    console.log('📊 Capacidad Jaula:', capacidadJaula);
    console.log('📊 Capacidad Galpón:', capacidadGalpon);

    if (capacidadJaula && capacidadGalpon) {
      // Convertir cantidad a número para evitar concatenación de strings
      const cantidadNumerica = Number(masiveForm.cantidad);
      const totalDespuesDeRegistroJaula = capacidadJaula.ocupacionActual + cantidadNumerica;
      const totalDespuesDeRegistroGalpon = capacidadGalpon.ocupacionActual + cantidadNumerica;

      console.log(`🧮 Cálculo Jaula: ${capacidadJaula.ocupacionActual} + ${cantidadNumerica} = ${totalDespuesDeRegistroJaula} (máx: ${capacidadJaula.capacidadMaxima})`);
      console.log(`🧮 Cálculo Galpón: ${capacidadGalpon.ocupacionActual} + ${cantidadNumerica} = ${totalDespuesDeRegistroGalpon} (máx: ${capacidadGalpon.capacidadMaxima})`);

      // Verificar si excede la capacidad máxima de la jaula
      if (totalDespuesDeRegistroJaula > capacidadJaula.capacidadMaxima) {
        console.log('❌ Error: Excede capacidad de jaula');
        toastService.error(
          'Capacidad Excedida - Jaula',
          `La jaula ${masiveForm.jaula} no tiene suficiente espacio.\n` +
          `Capacidad máxima: ${capacidadJaula.capacidadMaxima}\n` +
          `Ocupación actual: ${capacidadJaula.ocupacionActual}\n` +
          `Espacio disponible: ${capacidadJaula.espacioDisponible}\n` +
          `Cuyes a registrar: ${masiveForm.cantidad}\n` +
          `Total después: ${totalDespuesDeRegistroJaula}`
        );
        setMasiveLoading(false);
        return;
      } else {
        console.log('✅ Capacidad de jaula OK');
      }

      // Verificar si excede la capacidad máxima del galpón
      if (totalDespuesDeRegistroGalpon > capacidadGalpon.capacidadMaxima) {
        toastService.error(
          'Capacidad Excedida - Galpón',
          `El galpón ${masiveForm.galpon} no tiene suficiente espacio.\n` +
          `Capacidad máxima: ${capacidadGalpon.capacidadMaxima}\n` +
          `Ocupación actual: ${capacidadGalpon.ocupacionActual}\n` +
          `Espacio disponible: ${capacidadGalpon.espacioDisponible}\n` +
          `Cuyes a registrar: ${masiveForm.cantidad}`
        );
        setMasiveLoading(false);
        return;
      }

      // Advertencia si la jaula quedará con más del 80% de ocupación
      const porcentajeOcupacionJaula = (totalDespuesDeRegistroJaula / capacidadJaula.capacidadMaxima) * 100;
      const porcentajeOcupacionGalpon = (totalDespuesDeRegistroGalpon / capacidadGalpon.capacidadMaxima) * 100;

      if (porcentajeOcupacionJaula > 80 || porcentajeOcupacionGalpon > 80) {
        // Preparar datos para el diálogo de advertencia
        setCapacidadWarningData({
          jaula: capacidadJaula,
          galpon: capacidadGalpon,
          cantidad: cantidadNumerica,
          totalJaula: totalDespuesDeRegistroJaula,
          totalGalpon: totalDespuesDeRegistroGalpon,
          porcentajeJaula: porcentajeOcupacionJaula,
          porcentajeGalpon: porcentajeOcupacionGalpon
        });
        setOpenCapacidadWarningDialog(true);
        setMasiveLoading(false);
        return;
      }
    }

    setMasiveLoading(true);
    try {
      // Usar el endpoint masivo optimizado
      const registroMasivoData = {
        galpon: masiveForm.galpon,
        jaula: masiveForm.jaula,
        raza: masiveForm.raza,
        grupos: [
          {
            sexo: masiveForm.sexo === 'Aleatorio' ? 'M' : masiveForm.sexo, // Para el primer grupo
            cantidad: masiveForm.sexo === 'Aleatorio' ? Math.ceil(masiveForm.cantidad / 2) : masiveForm.cantidad,
            edadDias: Math.floor((new Date().getTime() - new Date(masiveForm.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24)),
            pesoPromedio: (parseFloat(masiveForm.pesoMin.toString()) + parseFloat(masiveForm.pesoMax.toString())) / 2 * 1000, // Convertir a gramos
            variacionPeso: Math.abs(parseFloat(masiveForm.pesoMax.toString()) - parseFloat(masiveForm.pesoMin.toString())) * 500 // Variación en gramos
          }
        ]
      };

      // Si es aleatorio, agregar grupo de hembras
      if (masiveForm.sexo === 'Aleatorio') {
        registroMasivoData.grupos.push({
          sexo: 'H',
          cantidad: Math.floor(masiveForm.cantidad / 2),
          edadDias: Math.floor((new Date().getTime() - new Date(masiveForm.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24)),
          pesoPromedio: (parseFloat(masiveForm.pesoMin.toString()) + parseFloat(masiveForm.pesoMax.toString())) / 2 * 1000,
          variacionPeso: Math.abs(parseFloat(masiveForm.pesoMax.toString()) - parseFloat(masiveForm.pesoMin.toString())) * 500
        });
      }

      console.log('📦 Datos para registro masivo:', registroMasivoData);

      const response = await api.post('/cuyes/jaula', registroMasivoData);
      
      if ((response.data as any).success) {
        const creados = (response.data as any).data.length;
        toastService.success(
          'Registro Masivo Exitoso',
          `Se crearon ${creados} cuyes exitosamente en ${masiveForm.galpon}-${masiveForm.jaula}`
        );
        setOpenMasiveDialog(false);
        fetchCuyes();
        fetchStats();
      } else {
        toastService.error('Error en Registro Masivo', (response.data as any).message || 'No se pudo crear los cuyes');
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        gap: { xs: 2, md: 0 },
        mb: 3
      }}>
        {showTitle && (
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: '#2e7d32',
              textAlign: { xs: 'center', md: 'left' },
              mb: { xs: 1, md: 0 }
            }}
          >
            <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
            {customTitle || 'Sistema de Cuyes'}
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          alignItems: 'stretch'
        }}>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={fetchEstadisticasAvanzadas}
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              order: { xs: 4, sm: 1 },
              color: '#9c27b0',
              borderColor: '#9c27b0',
              '&:hover': {
                borderColor: '#7b1fa2',
                backgroundColor: alpha('#9c27b0', 0.04)
              }
            }}
          >
            Estadísticas
          </Button>

          {showUpdateStagesButton && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleActualizarEtapas}
              sx={{
                minWidth: { xs: '100%', sm: 'auto' },
                order: { xs: 3, sm: 2 }
              }}
            >
              Actualizar Etapas
            </Button>
          )}

          {showNewCuyButton && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenCuyDialog()}
              sx={{
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#45a049' },
                minWidth: { xs: '100%', sm: 'auto' },
                order: { xs: 1, sm: 3 }
              }}
            >
              Nuevo Cuy
            </Button>
          )}

          {showMassiveRegistration && (
            <Button
              variant="contained"
              startIcon={<Groups />}
              onClick={handleOpenMasiveDialog}
              sx={{
                bgcolor: '#2196f3',
                '&:hover': { bgcolor: '#1976d2' },
                minWidth: { xs: '100%', sm: 'auto' },
                order: { xs: 2, sm: 4 }
              }}
            >
              Registro Masivo
            </Button>
          )}
        </Box>
      </Box>

      {/* Resumen general */}
      {showStats && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Typography variant="h6" gutterBottom>
            {customTitle || 'Resumen General'}
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
              <Avatar sx={{ bgcolor: '#2196f3', mx: 'auto', mb: 1 }}>
                <Male />
              </Avatar>
              <Typography variant="h4">{stats.machos}</Typography>
              <Typography variant="body2" color="text.secondary">
                Machos
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#e91e63', mx: 'auto', mb: 1 }}>
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
      )}

      {/* Search and Filter Bar */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        {/* Search Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 2,
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <TextField
            placeholder="Buscar por ID, raza, galpón, jaula, peso, fecha, edad, sexo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              minWidth: { xs: '100%', sm: 250 },
              maxWidth: { xs: '100%', sm: 400 }
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
          />

          {/* Action Buttons */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            alignItems: 'stretch'
          }}>
            {showSearchButton && (
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleApplyFilters}
                size="small"
                sx={{
                  bgcolor: '#ff9800',
                  '&:hover': { bgcolor: '#f57c00' },
                  minWidth: { xs: '100%', sm: 'auto' }
                }}
              >
                Buscar
              </Button>
            )}

            {showFiltersButton && (
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
              >
                Filtros
              </Button>
            )}

            {showRefreshButton && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => { fetchCuyes(); fetchStats(); }}
                size="small"
                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
              >
                Actualizar
              </Button>
            )}

            {showFiltersButton && Object.values(filters).some(f => f !== '') && (
              <Button
                variant="contained"
                color="warning"
                onClick={clearFilters}
                size="small"
                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>
        </Box>

        {/* View Toggle */}
        {showViewToggle && (
          <Box sx={{
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'flex-end' },
            mt: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ display: 'flex' }}>
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                startIcon={<ViewModule />}
                onClick={() => setViewMode('cards')}
                size="small"
                sx={{
                  borderRadius: '8px 0 0 8px',
                  minWidth: { xs: 120, sm: 'auto' }
                }}
              >
                Tarjetas
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                startIcon={<TableChart />}
                onClick={() => setViewMode('table')}
                size="small"
                sx={{
                  borderRadius: '0 8px 8px 0',
                  borderLeft: 'none',
                  minWidth: { xs: 120, sm: 'auto' }
                }}
              >
                Tabla
              </Button>
            </Box>
          </Box>
        )}

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
                      color={getEstadoColor(cuy.estado)}
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
                        onClick={() => {
                          setCuyToDelete(cuy.id);
                          setOpenDeleteWithRelationsDialog(true);
                        }}
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
                    color={getEtapaColor(cuy.etapaVida)}
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
                        color={getEstadoColor(cuy.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cuy.etapaVida}
                        color={getEtapaColor(cuy.etapaVida)}
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
                            onClick={() => {
                              setCuyToDelete(cuy.id);
                              setOpenDeleteWithRelationsDialog(true);
                            }}
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
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <FormControl fullWidth size="small" required error={!!cuyErrors.galpon}>
                    <InputLabel>Galpón</InputLabel>
                    <Select
                      name="galpon"
                      value={cuyForm.galpon}
                      onChange={handleCuyChange}
                      label="Galpón"
                    >
                      <MenuItem value="">
                        <em>Seleccionar galpón</em>
                      </MenuItem>
                      {galpones.map(galpon => (
                        <MenuItem key={galpon.id} value={galpon.nombre}>
                          {galpon.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                    {cuyErrors.galpon && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{cuyErrors.galpon}</Typography>}
                  </FormControl>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setOpenNewGalponDialog(true)}
                    sx={{ minWidth: 'auto', px: 1 }}
                    title="Agregar nuevo galpón"
                  >
                    <Add fontSize="small" />
                  </Button>
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <FormControl fullWidth size="small" required disabled={!cuyForm.galpon} error={!!cuyErrors.jaula}>
                    <InputLabel>Jaula</InputLabel>
                    <Select
                      name="jaula"
                      value={cuyForm.jaula}
                      onChange={handleCuyChange}
                      label="Jaula"
                    >
                      <MenuItem value="">
                        <em>Seleccionar jaula</em>
                      </MenuItem>
                      {jaulasDisponibles
                        .filter(jaula => jaula.galponNombre === cuyForm.galpon)
                        .map(jaula => (
                          <MenuItem key={jaula.id} value={jaula.nombre}>
                            {jaula.nombre} {jaula.capacidadMaxima ? `(Cap: ${jaula.capacidadMaxima})` : ''}
                          </MenuItem>
                        ))}
                    </Select>
                    {cuyErrors.jaula && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{cuyErrors.jaula}</Typography>}
                  </FormControl>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setNewJaulaForm(prev => ({ ...prev, galponNombre: cuyForm.galpon }));
                      setOpenNewJaulaDialog(true);
                    }}
                    disabled={!cuyForm.galpon}
                    sx={{ minWidth: 'auto', px: 1 }}
                    title="Agregar nueva jaula"
                  >
                    <Add fontSize="small" />
                  </Button>
                </Box>
                {!cuyForm.galpon ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Primero selecciona un galpón
                  </Typography>
                ) : jaulasDisponibles.filter(jaula => jaula.galponNombre === cuyForm.galpon).length === 0 ? (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                    No hay jaulas disponibles en este galpón
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {jaulasDisponibles.filter(jaula => jaula.galponNombre === cuyForm.galpon).length} jaula{jaulasDisponibles.filter(jaula => jaula.galponNombre === cuyForm.galpon).length !== 1 ? 's' : ''} disponible{jaulasDisponibles.filter(jaula => jaula.galponNombre === cuyForm.galpon).length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Información de capacidad en tiempo real */}
            {cuyForm.galpon && cuyForm.jaula && (
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  📊 Información de Capacidad
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    📍 {cuyForm.galpon} - {cuyForm.jaula}
                  </Typography>
                  <Chip 
                    label="Verificando capacidad..." 
                    size="small" 
                    color="info" 
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  La información de capacidad se actualizará automáticamente
                </Typography>
              </Paper>
            )}

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
                            color={getEtapaColor(item.etapa) === 'default' ? 'primary' : getEtapaColor(item.etapa) as 'primary' | 'secondary' | 'inherit' | 'error' | 'info' | 'success' | 'warning'}
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
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Galpón</InputLabel>
                    <Select
                      name="galpon"
                      value={masiveForm.galpon}
                      onChange={handleMasiveChange}
                      label="Galpón"
                    >
                      <MenuItem value="">
                        <em>Seleccionar galpón</em>
                      </MenuItem>
                      {galpones.map(galpon => (
                        <MenuItem key={galpon.id} value={galpon.nombre}>
                          {galpon.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setOpenNewGalponDialog(true)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    <Add fontSize="small" />
                  </Button>
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <FormControl fullWidth size="small" required disabled={!masiveForm.galpon}>
                    <InputLabel>Jaula</InputLabel>
                    <Select
                      name="jaula"
                      value={masiveForm.jaula}
                      onChange={handleMasiveChange}
                      label="Jaula"
                    >
                      <MenuItem value="">
                        <em>Seleccionar jaula</em>
                      </MenuItem>
                      {jaulasDisponiblesMasivo.map(jaula => (
                        <MenuItem key={jaula.id} value={jaula.nombre}>
                          {jaula.nombre} {jaula.capacidadMaxima ? `(Cap: ${jaula.capacidadMaxima})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setNewJaulaForm(prev => ({ ...prev, galponNombre: masiveForm.galpon }));
                      setOpenNewJaulaDialog(true);
                    }}
                    disabled={!masiveForm.galpon}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    <Add fontSize="small" />
                  </Button>
                </Box>
                {!masiveForm.galpon ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Primero selecciona un galpón
                  </Typography>
                ) : jaulasDisponiblesMasivo.length === 0 ? (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                    No hay jaulas disponibles en este galpón
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {jaulasDisponiblesMasivo.length} jaula{jaulasDisponiblesMasivo.length !== 1 ? 's' : ''} disponible{jaulasDisponiblesMasivo.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Información de capacidad en tiempo real */}
            {(capacidadInfo.galpon || capacidadInfo.jaula) && (
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  📊 Información de Capacidad
                </Typography>

                {capacidadInfo.galpon && (
                  <Box sx={{ mb: capacidadInfo.jaula ? 2 : 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      🏠 Galpón {masiveForm.galpon}:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(capacidadInfo.galpon.porcentajeOcupacion, 100)}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.grey[300], 0.3),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: capacidadInfo.galpon.porcentajeOcupacion > 90
                              ? theme.palette.error.main
                              : capacidadInfo.galpon.porcentajeOcupacion > 80
                                ? theme.palette.warning.main
                                : theme.palette.success.main
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'right' }}>
                        {capacidadInfo.galpon.ocupacionActual}/{capacidadInfo.galpon.capacidadMaxima}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {capacidadInfo.galpon.porcentajeOcupacion.toFixed(1)}% ocupado • {capacidadInfo.galpon.espacioDisponible} espacios disponibles
                    </Typography>
                  </Box>
                )}

                {capacidadInfo.jaula && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      🏢 Jaula {masiveForm.jaula}:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(capacidadInfo.jaula.porcentajeOcupacion, 100)}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.grey[300], 0.3),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: capacidadInfo.jaula.porcentajeOcupacion > 90
                              ? theme.palette.error.main
                              : capacidadInfo.jaula.porcentajeOcupacion > 80
                                ? theme.palette.warning.main
                                : theme.palette.success.main
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'right' }}>
                        {capacidadInfo.jaula.ocupacionActual}/{capacidadInfo.jaula.capacidadMaxima}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {capacidadInfo.jaula.porcentajeOcupacion.toFixed(1)}% ocupado • {capacidadInfo.jaula.espacioDisponible} espacios disponibles
                    </Typography>
                  </Box>
                )}

                {/* Predicción después del registro */}
                {capacidadInfo.jaula && masiveForm.cantidad > 0 && (
                  <Alert
                    severity={
                      (capacidadInfo.jaula.ocupacionActual + masiveForm.cantidad) > capacidadInfo.jaula.capacidadMaxima
                        ? 'error'
                        : ((capacidadInfo.jaula.ocupacionActual + masiveForm.cantidad) / capacidadInfo.jaula.capacidadMaxima) > 0.8
                          ? 'warning'
                          : 'info'
                    }
                    sx={{ mt: 1.5 }}
                  >
                    <Typography variant="caption">
                      <strong>Después del registro:</strong> {capacidadInfo.jaula.ocupacionActual + masiveForm.cantidad}/{capacidadInfo.jaula.capacidadMaxima} cuyes
                      ({(((capacidadInfo.jaula.ocupacionActual + masiveForm.cantidad) / capacidadInfo.jaula.capacidadMaxima) * 100).toFixed(1)}%)
                    </Typography>
                  </Alert>
                )}
              </Paper>
            )}

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
                • Ubicación: Galpón <strong>{masiveForm.galpon || '[Seleccionar]'}</strong>,
                Jaula <strong>{masiveForm.jaula || '[Seleccionar]'}</strong>
              </Typography>
              <Typography variant="body2">
                • Todos los cuyes se crearán en la <strong>misma jaula</strong> especificada
              </Typography>
              <Typography variant="body2">
                • Estado: <strong>{masiveForm.estado}</strong>, Etapa: <strong>{masiveForm.etapaVida}</strong>, Propósito: <strong>{masiveForm.proposito}</strong>
              </Typography>
              {masiveForm.galpon && masiveForm.jaula && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Los {masiveForm.cantidad} cuyes se registrarán en: <strong>{masiveForm.galpon} - {masiveForm.jaula}</strong>
                </Alert>
              )}
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

      {/* Diálogo de advertencia de capacidad */}
      <Dialog
        open={openCapacidadWarningDialog}
        onClose={handleCapacidadWarningCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[20]
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
        }}>
          <Avatar sx={{
            bgcolor: theme.palette.warning.main,
            width: 48,
            height: 48
          }}>
            <Warning />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              ⚠️ Advertencia de Capacidad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              La ocupación superará el 80% de la capacidad
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {capacidadWarningData && (
            <Stack spacing={3}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Se registrarán <strong>{capacidadWarningData.cantidad} cuyes</strong> en una ubicación con alta ocupación.
                </Typography>
              </Alert>

              {/* Información de la Jaula */}
              <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                  <ViewModule /> Jaula {masiveForm.jaula}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Ocupación actual:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(capacidadWarningData.jaula as any).ocupacionActual}/{(capacidadWarningData.jaula as any).capacidadMaxima}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(capacidadWarningData.jaula as any).porcentajeOcupacion}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.warning.main
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(capacidadWarningData.jaula as any).porcentajeOcupacion.toFixed(1)}% ocupado
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Después del registro:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {capacidadWarningData.totalJaula}/{(capacidadWarningData.jaula as any).capacidadMaxima}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={capacidadWarningData.porcentajeJaula}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: capacidadWarningData.porcentajeJaula > 90
                          ? theme.palette.error.main
                          : theme.palette.warning.main
                      }
                    }}
                  />
                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 'medium' }}>
                    {capacidadWarningData.porcentajeJaula.toFixed(1)}% ocupado
                  </Typography>
                </Box>
              </Paper>

              {/* Información del Galpón */}
              <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}>
                  <LocationOn /> Galpón {masiveForm.galpon}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Ocupación actual:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(capacidadWarningData.galpon as any).ocupacionActual}/{(capacidadWarningData.galpon as any).capacidadMaxima}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(capacidadWarningData.galpon as any).porcentajeOcupacion}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.info.main
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(capacidadWarningData.galpon as any).porcentajeOcupacion.toFixed(1)}% ocupado
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Después del registro:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {capacidadWarningData.totalGalpon}/{(capacidadWarningData.galpon as any).capacidadMaxima}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={capacidadWarningData.porcentajeGalpon}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: capacidadWarningData.porcentajeGalpon > 90
                          ? theme.palette.error.main
                          : theme.palette.info.main
                      }
                    }}
                  />
                  <Typography variant="caption" color="info.main" sx={{ fontWeight: 'medium' }}>
                    {capacidadWarningData.porcentajeGalpon.toFixed(1)}% ocupado
                  </Typography>
                </Box>
              </Paper>

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Recomendación:</strong> Considera crear una nueva jaula o distribuir los cuyes en diferentes ubicaciones para mantener una ocupación óptima.
                </Typography>
              </Alert>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
          <Button
            onClick={handleCapacidadWarningCancel}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCapacidadWarningConfirm}
            variant="contained"
            color="warning"
            size="large"
            disabled={masiveLoading}
            startIcon={masiveLoading ? <CircularProgress size={20} /> : <CheckCircle />}
            sx={{ minWidth: 160 }}
          >
            {masiveLoading ? 'Registrando...' : 'Continuar Registro'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear nuevo galpón */}
      <Dialog open={openNewGalponDialog} onClose={() => setOpenNewGalponDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="primary" />
            Crear Nuevo Galpón
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del Galpón"
              name="nombre"
              value={newGalponForm.nombre}
              onChange={handleNewGalponChange}
              fullWidth
              required
              size="small"
              placeholder="Ej: A, B, C, Galpón Norte"
            />

            <TextField
              label="Descripción"
              name="descripcion"
              value={newGalponForm.descripcion}
              onChange={handleNewGalponChange}
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Descripción opcional del galpón"
            />

            <TextField
              label="Ubicación"
              name="ubicacion"
              value={newGalponForm.ubicacion}
              onChange={handleNewGalponChange}
              fullWidth
              size="small"
              placeholder="Ej: Sector Norte, Patio Principal"
            />

            <TextField
              label="Capacidad Máxima"
              name="capacidadMaxima"
              type="number"
              value={newGalponForm.capacidadMaxima}
              onChange={handleNewGalponChange}
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 200 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setOpenNewGalponDialog(false)}
            variant="outlined"
            disabled={creatingGalpon}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateGalpon}
            variant="contained"
            disabled={creatingGalpon}
            startIcon={creatingGalpon ? <CircularProgress size={20} /> : <Add />}
          >
            {creatingGalpon ? 'Creando...' : 'Crear Galpón'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear nueva jaula */}
      <Dialog open={openNewJaulaDialog} onClose={() => setOpenNewJaulaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewModule color="primary" />
            Crear Nueva Jaula
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de la Jaula"
              name="nombre"
              value={newJaulaForm.nombre}
              onChange={handleNewJaulaChange}
              fullWidth
              required
              size="small"
              placeholder="Ej: J1, J2, Jaula-A1"
            />

            <FormControl fullWidth size="small" required>
              <InputLabel>Galpón</InputLabel>
              <Select
                name="galponNombre"
                value={newJaulaForm.galponNombre}
                onChange={handleNewJaulaChange}
                label="Galpón"
              >
                {galpones.map(galpon => (
                  <MenuItem key={galpon.id} value={galpon.nombre}>
                    {galpon.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Descripción"
              name="descripcion"
              value={newJaulaForm.descripcion}
              onChange={handleNewJaulaChange}
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Descripción opcional de la jaula"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Capacidad Máxima"
                name="capacidadMaxima"
                type="number"
                value={newJaulaForm.capacidadMaxima}
                onChange={handleNewJaulaChange}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 50 }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="tipo"
                  value={newJaulaForm.tipo}
                  onChange={handleNewJaulaChange}
                  label="Tipo"
                >
                  <MenuItem value="Estándar">Estándar</MenuItem>
                  <MenuItem value="Cría">Cría</MenuItem>
                  <MenuItem value="Engorde">Engorde</MenuItem>
                  <MenuItem value="Reproducción">Reproducción</MenuItem>
                  <MenuItem value="Cuarentena">Cuarentena</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setOpenNewJaulaDialog(false)}
            variant="outlined"
            disabled={creatingJaula}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateJaula}
            variant="contained"
            disabled={creatingJaula}
            startIcon={creatingJaula ? <CircularProgress size={20} /> : <Add />}
          >
            {creatingJaula ? 'Creando...' : 'Crear Jaula'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de carga para verificación de relaciones múltiples */}
      <Dialog 
        open={showBulkVerificationLoading} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            padding: 2
          }
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Verificando relaciones...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analizando {selectedIds.length} cuyes seleccionados para detectar registros relacionados
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Nuevo diálogo de advertencia para eliminación múltiple */}
      <BulkDeleteWarningDialog
        open={openBulkWarningDialog}
        onClose={() => setOpenBulkWarningDialog(false)}
        onConfirm={handleBulkWarningConfirm}
        selectedCount={bulkWarningData?.selectedCount || 0}
        cuyesWithRelations={bulkWarningData?.cuyesWithRelations || []}
        totalRelations={bulkWarningData?.totalRelations || 0}
        loading={bulkActionLoading}
      />

      {/* Diálogo de eliminación con verificación de relaciones */}
      <DeleteCuyWithRelationsDialog
        open={openDeleteWithRelationsDialog}
        onClose={() => {
          setOpenDeleteWithRelationsDialog(false);
          setCuyToDelete(null);
        }}
        cuyId={cuyToDelete}
        onDeleteConfirmed={handleDeleteWithRelationsConfirmed}
      />
    </Box>
  );
};

export default CuyesManagerFixed;