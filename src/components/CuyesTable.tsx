import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import RegistroJaulaForm from './RegistroJaulaForm';
import { DataStateRenderer, ConditionalRender } from '../utils/conditional-render';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  CircularProgress, Alert, Box, MenuItem, InputAdornment, Chip, Tooltip, 
  Divider, Collapse, FormControl, InputLabel, Select, Avatar, Grid,
  Card, CardContent, Menu, alpha, useTheme, ListItemIcon, TablePagination, FormHelperText,
  Checkbox, Toolbar, Slide, Fab
} from '../utils/mui';
import { 
  Add, Edit, Delete, FilterList, Search, Upload, Download, 
  Refresh, Male, Female, Check, Close, MoreVert, Sort,
  ArrowDropDown, ArrowUpward, ArrowDownward, Visibility, Print, Pets,
  CalendarToday, Wc, FitnessCenter, Warehouse, GridOn, HealthAndSafety,
  FiberManualRecord, SwapHoriz, Psychology, LocalFlorist, Home, SelectAll,
  CheckBox, CheckBoxOutlineBlank, DeleteSweep, Archive, RestoreFromTrash
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

interface Cuy {
  id?: number;
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

const initialForm: Cuy = {
  raza: '',
  fechaNacimiento: '',
  sexo: '',
  peso: 0,
  galpon: '',
  jaula: '',
  estado: '',
  etapaVida: 'Cría',
  proposito: 'Indefinido',
};

interface HeadCell {
  id: keyof Cuy | 'acciones' | 'select';
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const baseHeadCells: HeadCell[] = [
  { id: 'select', label: '', numeric: false, sortable: false },
  { id: 'id', label: 'ID', numeric: true, sortable: true },
  { id: 'raza', label: 'Raza', numeric: false, sortable: true },
  { id: 'sexo', label: 'Sexo', numeric: false, sortable: true },
  { id: 'etapaVida', label: 'Etapa', numeric: false, sortable: true },
  { id: 'proposito', label: 'Propósito', numeric: false, sortable: true },
  { id: 'peso', label: 'Peso', numeric: true, sortable: true },
  { id: 'fechaNacimiento', label: 'Fecha Nac.', numeric: false, sortable: true },
  { id: 'estado', label: 'Estado', numeric: false, sortable: true },
  { id: 'galpon', label: 'Galpón', numeric: false, sortable: true },
  { id: 'jaula', label: 'Jaula', numeric: false, sortable: true },
  { id: 'acciones', label: 'Acciones', numeric: false, sortable: false },
];

const getHeadCells = (showLocationColumns: boolean): HeadCell[] => {
  if (showLocationColumns) {
    return baseHeadCells;
  }
  
  // Filtrar las columnas de ubicación
  return baseHeadCells.filter(cell => cell.id !== 'galpon' && cell.id !== 'jaula');
};

type Order = 'asc' | 'desc';

interface CuyesTableProps {
  filtroGalpon?: string;
  filtroJaula?: string;
  showLocationColumns?: boolean;
  showRegistroButton?: boolean;
}

const CuyesTable: React.FC<CuyesTableProps> = ({
  filtroGalpon,
  filtroJaula,
  showLocationColumns = true,
  showRegistroButton = true
}) => {
  const theme = useTheme();
  const headCells = getHeadCells(showLocationColumns);
  const [cuyes, setCuyes] = useState<Cuy[]>([]);
  const [filteredCuyes, setFilteredCuyes] = useState<Cuy[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Cuy>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterRaza, setFilterRaza] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('');
  const [filterProposito, setFilterProposito] = useState('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Cuy>('id');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [registroJaulaOpen, setRegistroJaulaOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [errors, setErrors] = useState({
    raza: '',
    fechaNacimiento: '',
    sexo: '',
    peso: '',
    galpon: '',
    jaula: '',
    estado: '',
    etapaVida: '',
    proposito: ''
  });

  // Hook para confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/cuyes/${id}`);
      fetchCuyes();
    },
    itemName: 'Cuy',
    successMessage: 'Cuy eliminado exitosamente'
  });

  // Función para cambiar a reproductor
  const handleCambiarAReproductor = async (id: number) => {
    try {
      await api.patch(`/cuyes/${id}/hacer-reproductor`);
      toastService.success(
        'Cambio Exitoso',
        'Cuy cambiado a reproductor exitosamente'
      );
      fetchCuyes();
      handleActionClose();
    } catch (err: any) {
      console.error('Error al cambiar a reproductor:', err);
      toastService.error(
        'Error al Cambiar',
        err.response?.data?.message || 'No se pudo cambiar a reproductor'
      );
    }
  };

  // Función para cambiar a engorde
  const handleCambiarAEngorde = async (id: number) => {
    try {
      await api.patch(`/cuyes/${id}/enviar-engorde`);
      toastService.success(
        'Cambio Exitoso',
        'Cuy enviado a engorde exitosamente'
      );
      fetchCuyes();
      handleActionClose();
    } catch (err: any) {
      console.error('Error al cambiar a engorde:', err);
      toastService.error(
        'Error al Cambiar',
        err.response?.data?.message || 'No se pudo enviar a engorde'
      );
    }
  };

  const fetchCuyes = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Construir la URL con filtros
    let url = '/cuyes';
    const params = new URLSearchParams();
    
    if (filtroGalpon) {
      params.append('galpon', filtroGalpon);
    }
    if (filtroJaula) {
      params.append('jaula', filtroJaula);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('🔍 Fetching cuyes con URL:', url);
    console.log('🔍 Filtros aplicados:', { filtroGalpon, filtroJaula });
    
    api.get(url)
      .then(res => {
        console.log('🔍 Datos recibidos del backend:', res.data);
        console.log('🔍 Total de cuyes:', (res.data as Cuy[]).length);
        if (filtroGalpon || filtroJaula) {
          console.log(`🔍 Filtros aplicados: Galpón=${filtroGalpon}, Jaula=${filtroJaula}`);
        }
        console.log('🔍 Primeros 3 cuyes con ubicación:', (res.data as Cuy[]).slice(0, 3).map((c: Cuy) => ({
          id: c.id,
          galpon: c.galpon,
          jaula: c.jaula,
          raza: c.raza
        })));
        setCuyes(res.data as Cuy[]);
        setFilteredCuyes(res.data as Cuy[]);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cuyes:', err);
        console.log('🔧 Intentando filtrado local como fallback...');
        
        // Si hay filtros específicos y falló, intentar obtener todos y filtrar localmente
        if (filtroGalpon || filtroJaula) {
          api.get('/cuyes')
            .then(allRes => {
              console.log('🔍 Total de cuyes antes del filtrado local:', ((allRes.data as any).data as Cuy[]).length);
              let filtered = (allRes.data as any).data as Cuy[];
              
              if (filtroGalpon) {
                filtered = filtered.filter((cuy: Cuy) => cuy.galpon === filtroGalpon);
                console.log(`🔍 Después de filtrar por galpón "${filtroGalpon}":`, filtered.length);
              }
              if (filtroJaula) {
                filtered = filtered.filter((cuy: Cuy) => cuy.jaula === filtroJaula);
                console.log(`🔍 Después de filtrar por jaula "${filtroJaula}":`, filtered.length);
              }
              
              console.log('🔍 Cuyes filtrados localmente:', (filtered as Cuy[]).map((c: Cuy) => ({
                id: c.id,
                galpon: c.galpon,
                jaula: c.jaula,
                raza: c.raza
              })));
              
              setCuyes(filtered as Cuy[]);
              setFilteredCuyes(filtered as Cuy[]);
              setLoading(false);
            })
            .catch(() => {
              setError('Error al cargar los datos. Por favor, intenta de nuevo.');
              setLoading(false);
            });
          return;
        }
        
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
        setLoading(false);
        // Datos de ejemplo para visualizar la interfaz
        const fakeCuyes = [
          { id: 1, raza: 'Peruano', fechaNacimiento: '2023-01-15', sexo: 'M', peso: 1.2, galpon: 'A', jaula: '101', estado: 'Activo', etapaVida: 'Engorde', proposito: 'Engorde' },
          { id: 2, raza: 'Andino', fechaNacimiento: '2023-02-20', sexo: 'H', peso: 1.1, galpon: 'A', jaula: '102', estado: 'Activo', etapaVida: 'Reproductora', proposito: 'Reproducción' },
          { id: 3, raza: 'Inti', fechaNacimiento: '2023-03-10', sexo: 'M', peso: 1.3, galpon: 'B', jaula: '201', estado: 'Enfermo', etapaVida: 'Engorde', proposito: 'Engorde' },
          { id: 4, raza: 'Peruano', fechaNacimiento: '2023-03-25', sexo: 'H', peso: 1.0, galpon: 'B', jaula: '202', estado: 'Activo', etapaVida: 'Reproductora', proposito: 'Reproducción' },
          { id: 5, raza: 'Andino', fechaNacimiento: '2023-04-05', sexo: 'M', peso: 1.4, galpon: 'C', jaula: '301', estado: 'Vendido', etapaVida: 'Engorde', proposito: 'Engorde' },
        ];
        setCuyes(fakeCuyes);
        setFilteredCuyes(fakeCuyes);
      });
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {
      raza: '',
      fechaNacimiento: '',
      sexo: '',
      peso: '',
      galpon: '',
      jaula: '',
      estado: '',
      etapaVida: '',
      proposito: ''
    };

    if (!form.raza.trim()) {
      newErrors.raza = 'La raza es obligatoria';
    }

    if (!form.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    } else {
      const fechaNac = new Date(form.fechaNacimiento);
      const hoy = new Date();
      if (fechaNac > hoy) {
        newErrors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura';
      }
    }

    if (!form.sexo) {
      newErrors.sexo = 'El sexo es obligatorio';
    }

    if (!form.peso || Number(form.peso) <= 0) {
      newErrors.peso = 'El peso debe ser mayor a 0';
    } else if (Number(form.peso) > 5) {
      newErrors.peso = 'El peso parece muy alto para un cuy (máximo 5kg)';
    }

    if (!form.galpon.trim()) {
      newErrors.galpon = 'El galpón es obligatorio';
    }

    if (!form.jaula.trim()) {
      newErrors.jaula = 'La jaula es obligatoria';
    }

    if (!form.estado) {
      newErrors.estado = 'El estado es obligatorio';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  useEffect(() => {
    fetchCuyes();
  }, [filtroGalpon, filtroJaula]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterRaza, filterSexo, filterEstado, filterEtapa, filterProposito, cuyes, order, orderBy]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const applyFilters = () => {
    let filtered = [...cuyes];

    // Búsqueda global
    if (searchTerm) {
      filtered = filtered.filter(cuy => 
        Object.values(cuy).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtros específicos
    if (filterRaza) {
      filtered = filtered.filter(cuy => cuy.raza === filterRaza);
    }
    if (filterSexo) {
      filtered = filtered.filter(cuy => cuy.sexo === filterSexo);
    }
    if (filterEstado) {
      filtered = filtered.filter(cuy => cuy.estado === filterEstado);
    }
    if (filterEtapa) {
      filtered = filtered.filter(cuy => cuy.etapaVida === filterEtapa);
    }
    if (filterProposito) {
      filtered = filtered.filter(cuy => cuy.proposito === filterProposito);
    }

    // Ordenamiento
    filtered = stableSort(filtered as any, getComparator(order, orderBy) as any);

    setFilteredCuyes(filtered);
  };

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (orderBy === 'fechaNacimiento') {
      return new Date(b[orderBy] as string).getTime() - new Date(a[orderBy] as string).getTime();
    }
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const handleRequestSort = (property: keyof Cuy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterRaza('');
    setFilterSexo('');
    setFilterEstado('');
    setFilterEtapa('');
    setFilterProposito('');
    setFilterOpen(false);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedId(id);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedId(null);
  };

  // Funciones para selección múltiple
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredCuyes.map((n) => n.id!);
      setSelectedIds(newSelected);
      setShowBulkActions(newSelected.length > 0);
    } else {
      setSelectedIds([]);
      setShowBulkActions(false);
    }
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
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
        selectedIds.slice(selectedIndex + 1),
      );
    }

    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.length > 0);
  };

  const isSelected = (id: number) => selectedIds.indexOf(id) !== -1;

  // Funciones para acciones en lote
  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/cuyes/${id}`)));
      toastService.success(
        'Eliminación Exitosa',
        `${selectedIds.length} cuyes eliminados exitosamente`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchCuyes();
    } catch (err: any) {
      console.error('Error al eliminar cuyes:', err);
      toastService.error(
        'Error al Eliminar',
        'No se pudieron eliminar algunos cuyes'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkChangeStatus = async (newStatus: string) => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id => 
          api.patch(`/cuyes/${id}`, { estado: newStatus })
        )
      );
      toastService.success(
        'Cambio Exitoso',
        `Estado de ${selectedIds.length} cuyes actualizado a ${newStatus}`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchCuyes();
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      toastService.error(
        'Error al Cambiar Estado',
        'No se pudo cambiar el estado de algunos cuyes'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleOpen = (cuy?: Cuy) => {
    handleActionClose();
    if (cuy) {
      setForm(cuy);
      setEditId(cuy.id!);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setErrors({
      raza: '',
      fechaNacimiento: '',
      sexo: '',
      peso: '',
      galpon: '',
      jaula: '',
      estado: '',
      etapaVida: '',
      proposito: ''
    });
    setOpen(true);
  };

  const handleView = (cuy: Cuy) => {
    handleActionClose();
    // Implementar vista detallada
    console.log('Ver detalles de:', cuy);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
    setErrors({
      raza: '',
      fechaNacimiento: '',
      sexo: '',
      peso: '',
      galpon: '',
      jaula: '',
      estado: '',
      etapaVida: '',
      proposito: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      // Para campos numéricos, permitir valor vacío temporalmente
      if (name === 'peso') {
        // Si el valor está vacío, mantenerlo como string vacío
        // Si tiene valor, convertir a número
        const numericValue = value === '' ? 0 : Number(value);
        setForm({ ...form, [name]: numericValue });
      } else {
        setForm({ ...form, [name]: value });
      }
      
      // Limpiar error del campo
      if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      setForm({ ...form, [name]: value });
      
      // Limpiar error del campo
      if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Crear una copia del formulario para no modificar el state directamente
      const formData = { ...form };
      
      // Asegurarse de que la fecha esté en formato ISO para almacenarla en la base de datos
      if (formData.fechaNacimiento) {
        // Si la fecha no está en formato ISO, convertirla
        if (typeof formData.fechaNacimiento === 'string' && !formData.fechaNacimiento.includes('T')) {
          // Convertir la fecha a objeto Date y luego a ISO
          const fechaObj = new Date(formData.fechaNacimiento);
          if (!isNaN(fechaObj.getTime())) {
            formData.fechaNacimiento = fechaObj.toISOString();
          }
          console.log(`Fecha convertida a ISO: ${formData.fechaNacimiento}`);
        }
      }
      
      if (editId) {
        await api.put(`/cuyes/${editId}`, formData);
        toastService.success(
          'Cuy Actualizado',
          `Cuy ID #${editId} actualizado con éxito`
        );
      } else {
        await api.post('/cuyes', formData);
        toastService.success(
          'Cuy Registrado',
          'Nuevo cuy agregado con éxito'
        );
      }
      fetchCuyes();
      handleClose();
    } catch (err) {
      console.error('Error saving cuy:', err);
      toastService.error(
        'Error al Guardar',
        editId ? 'No se pudo actualizar el cuy' : 'No se pudo crear el cuy'
      );
    }
  };

  const handleConfirmDelete = (id: number) => {
    handleActionClose();
    deleteConfirmation.handleDeleteClick(id);
  };

  // Ya no necesitamos este método - usamos el hook de confirmación
  /*
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`/cuyes/${deleteId}`);
      setSuccess(`Cuy ID #${deleteId} eliminado con éxito.`);
      fetchCuyes();
    } catch (err) {
      console.error('Error deleting cuy:', err);
      setError('Error al eliminar el registro. Por favor, intenta de nuevo.');
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };
  */

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'table' ? 'grid' : 'table');
  };

  // Extraer razas, sexos y estados únicos para filtros
  const razasUnicas = [...new Set(cuyes.map(cuy => cuy.raza))];
  const estadosUnicos = [...new Set(cuyes.map(cuy => cuy.estado))];
  const etapasUnicas = [...new Set(cuyes.map(cuy => cuy.etapaVida).filter(Boolean))];
  const propositosUnicos = [...new Set(cuyes.map(cuy => cuy.proposito).filter(Boolean))];

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'success';
      case 'enfermo':
        return 'error';
      case 'vendido':
        return 'info';
      case 'cría':
        return 'warning'; // Color naranja/amarillo para crías
      case 'fallecido':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa?.toLowerCase()) {
      case 'cría':
        return 'info';
      case 'juvenil':
        return 'primary';
      case 'engorde':
        return 'warning';
      case 'reproductor':
        return 'success';
      case 'reproductora':
        return 'success';
      case 'gestante':
        return 'secondary';
      case 'lactante':
        return 'secondary';
      case 'retirado':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPropositoColor = (proposito: string) => {
    switch (proposito?.toLowerCase()) {
      case 'reproducción':
        return 'success';
      case 'engorde':
        return 'warning';
      case 'cría':
        return 'info';
      case 'venta':
        return 'secondary';
      case 'indefinido':
      case 'sin definir':
        return 'default';
      default:
        return 'primary';
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Card sx={{ mb: 4, borderRadius: 3, overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Cabecera de la tabla con título y acciones */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            mb: 3
          }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Pets color="primary" />
              Inventario de Cuyes
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<Refresh />}
                onClick={() => fetchCuyes()}
                size="small"
              >
                Actualizar
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={viewMode === 'table' ? <Visibility /> : <TableHead />}
                onClick={toggleViewMode}
                size="small"
              >
                {viewMode === 'table' ? 'Ver Tarjetas' : 'Ver Tabla'}
              </Button>
              {showRegistroButton && (
                <Button 
                  variant="contained" 
                  color="info" 
                  startIcon={<Home />}
                  onClick={() => setRegistroJaulaOpen(true)}
                  size="small"
                  sx={{
                    fontWeight: 'bold',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Registrar Jaula
                </Button>
              )}
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => handleOpen()}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  boxShadow: 2
                }}
                size="small"
              >
                Agregar Cuy
              </Button>
            </Box>
          </Box>

          {/* Barra de búsqueda y filtros */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}>
            <TextField
              placeholder="Buscar cuyes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ maxWidth: { sm: 300 } }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant={filterOpen ? "contained" : "outlined"} 
                color="primary" 
                startIcon={<FilterList />}
                onClick={() => setFilterOpen(!filterOpen)}
                size="small"
              >
                Filtros
              </Button>
              
              {(filterRaza || filterSexo || filterEstado || filterEtapa || filterProposito) && (
                <Button 
                  variant="contained" 
                  color="warning" 
                  onClick={resetFilters}
                  size="small"
                  sx={{
                    fontWeight: 'bold',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Limpiar
                </Button>
              )}
            </Box>
          </Box>

          {/* Panel de filtros */}
          <Collapse in={filterOpen}>
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Filtros avanzados</Typography>
              <Grid container spacing={2}>
                {/* Primera fila de filtros */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Raza</InputLabel>
                    <Select
                      value={filterRaza}
                      label="Raza"
                      onChange={(e) => setFilterRaza(e.target.value as string)}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {razasUnicas.map((raza) => (
                        <MenuItem key={raza} value={raza}>{raza}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sexo</InputLabel>
                    <Select
                      value={filterSexo}
                      label="Sexo"
                      onChange={(e) => setFilterSexo(e.target.value as string)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="M">Macho</MenuItem>
                      <MenuItem value="H">Hembra</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Etapa de Vida</InputLabel>
                    <Select
                      value={filterEtapa}
                      label="Etapa de Vida"
                      onChange={(e) => setFilterEtapa(e.target.value as string)}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {etapasUnicas.map((etapa) => (
                        <MenuItem key={etapa} value={etapa}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={etapa} 
                              size="small" 
                              color={getEtapaColor(etapa || 'Cria') as any}
                              variant="outlined"
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Propósito</InputLabel>
                    <Select
                      value={filterProposito}
                      label="Propósito"
                      onChange={(e) => setFilterProposito(e.target.value as string)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {propositosUnicos.map((proposito) => (
                        <MenuItem key={proposito} value={proposito}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={proposito} 
                              size="small" 
                              color={getPropositoColor(proposito || 'Indefinido') as any}
                              variant="outlined"
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* Segunda fila con Estado (centrado) */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filterEstado}
                      label="Estado"
                      onChange={(e) => setFilterEstado(e.target.value as string)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {estadosUnicos.map((estado) => (
                        <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Collapse>

          {/* Alertas de error y éxito */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}
          
          {/* Mostrar loader o mensaje de no hay datos */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">Cargando datos...</Typography>
            </Box>
          ) : filteredCuyes.length === 0 ? (
            <Box sx={{ textAlign: 'center', my: 6, p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Avatar sx={{ mx: 'auto', bgcolor: alpha(theme.palette.primary.main, 0.1), width: 60, height: 60 }}>
                  <Pets sx={{ color: 'primary.main', fontSize: 30 }} />
                </Avatar>
              </Box>
              <Typography variant="h6" color="text.primary" gutterBottom>
                No hay cuyes que mostrar
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 2 }}>
                {searchTerm || filterRaza || filterSexo || filterEstado || filterEtapa || filterProposito ? 
                  'No hay resultados que coincidan con tus filtros. Intenta modificar los criterios de búsqueda.' : 
                  'No hay cuyes registrados en el sistema. Puedes agregar un nuevo cuy usando el botón "Agregar Cuy".'}
              </Typography>
              {(searchTerm || filterRaza || filterSexo || filterEstado || filterEtapa || filterProposito) && (
                <Button variant="outlined" color="primary" onClick={resetFilters}>
                  Limpiar filtros
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Barra de herramientas para acciones en lote */}
              <Slide direction="down" in={showBulkActions} mountOnEnter unmountOnExit>
                <Toolbar
                  sx={{
                    pl: { sm: 2 },
                    pr: { xs: 1, sm: 1 },
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    borderRadius: 1,
                    mb: 2,
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography
                    sx={{ flex: '1 1 100%' }}
                    color="primary"
                    variant="subtitle1"
                    component="div"
                  >
                    {selectedIds.length} cuy{selectedIds.length !== 1 ? 'es' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Cambiar a Activo">
                      <IconButton
                        size="small"
                        onClick={() => handleBulkChangeStatus('Activo')}
                        disabled={bulkActionLoading}
                        color="success"
                      >
                        <Check />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cambiar a Vendido">
                      <IconButton
                        size="small"
                        onClick={() => handleBulkChangeStatus('Vendido')}
                        disabled={bulkActionLoading}
                        color="info"
                      >
                        <SwapHoriz />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cambiar a Enfermo">
                      <IconButton
                        size="small"
                        onClick={() => handleBulkChangeStatus('Enfermo')}
                        disabled={bulkActionLoading}
                        color="warning"
                      >
                        <HealthAndSafety />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar seleccionados">
                      <IconButton
                        size="small"
                        onClick={handleBulkDelete}
                        disabled={bulkActionLoading}
                        color="error"
                      >
                        {bulkActionLoading ? <CircularProgress size={20} /> : <DeleteSweep />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Toolbar>
              </Slide>

              {/* Vista de tabla */}
                {viewMode === 'table' && (
                  <>
                    <TableContainer component={Paper} sx={{ 
                      borderRadius: 2, 
                      boxShadow: 1, 
                      overflow: 'auto',
                      width: '100%',
                      // Mejoras para móvil
                      maxWidth: { xs: 'calc(100vw - 32px)', sm: '100%' },
                      '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        borderRadius: '8px',
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                      },
                      '&::-webkit-scrollbar-track': {
                        borderRadius: '8px',
                        backgroundColor: (theme) => alpha(theme.palette.grey[200], 0.6),
                      }
                    }}>
                      <Table sx={{ 
                        minWidth: { xs: 800, sm: 1200 } // Menos ancho mínimo en móvil
                      }}>
                    <TableHead>
                      <TableRow>
                        {headCells.map((headCell) => (
                          <TableCell
                            key={headCell.id}
                            align={headCell.numeric ? 'right' : 'left'}
                            sortDirection={orderBy === headCell.id ? order : false}
                            sx={{ 
                              fontWeight: 600,
                              padding: { xs: '8px 4px', sm: '16px' }, // Padding más compacto en móvil
                              fontSize: { xs: '0.75rem', sm: '0.875rem' } // Texto más pequeño en móvil
                            }}
                            padding={headCell.id === 'select' ? 'checkbox' : 'normal'}
                          >
                            {headCell.id === 'select' ? (
                              <Checkbox
                                color="primary"
                                indeterminate={selectedIds.length > 0 && selectedIds.length < filteredCuyes.length}
                                checked={filteredCuyes.length > 0 && selectedIds.length === filteredCuyes.length}
                                onChange={handleSelectAllClick}
                                size="small"
                              />
                            ) : headCell.sortable ? (
                              <Box
                                component="span"
                                onClick={() => handleRequestSort(headCell.id as keyof Cuy)}
                                sx={{ 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  '&:hover': {
                                    color: 'primary.main',
                                  }
                                }}
                              >
                                {headCell.label}
                                {orderBy === headCell.id ? (
                                  <Box component="span" sx={{ ml: 0.5 }}>
                                    {order === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />}
                                  </Box>
                                ) : (
                                  <Box component="span" sx={{ ml: 0.5, opacity: 0.2 }}>
                                    <ArrowDropDown fontSize="small" />
                                  </Box>
                                )}
                              </Box>
                            ) : (
                              headCell.label
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(rowsPerPage > 0
                        ? filteredCuyes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        : filteredCuyes
                      ).map((cuy) => {
                        const isItemSelected = isSelected(cuy.id!);
                        const labelId = `enhanced-table-checkbox-${cuy.id}`;

                        return (
                          <TableRow 
                            key={cuy.id} 
                            hover
                            onClick={(event) => handleClick(event, cuy.id!)}
                            role="checkbox"
                            aria-checked={isItemSelected}
                            tabIndex={-1}
                            selected={isItemSelected}
                            sx={{
                              cursor: 'pointer',
                              '& .MuiTableCell-root': {
                                padding: { xs: '8px 4px', sm: '16px' }, // Padding compacto en móvil
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Texto más pequeño en móvil
                              }
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                color="primary"
                                checked={isItemSelected}
                                inputProps={{
                                  'aria-labelledby': labelId,
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{cuy.id}</TableCell>
                            <TableCell>{cuy.raza}</TableCell>
                            <TableCell>
                              <Chip 
                                icon={cuy.sexo === 'M' ? <Male /> : <Female />} 
                                label={cuy.sexo === 'M' ? 'Macho' : 'Hembra'} 
                                size="small" 
                                variant="outlined"
                                color={cuy.sexo === 'M' ? 'info' : 'secondary'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={cuy.etapaVida || 'Sin etapa'} 
                                size="small"
                                variant="filled"
                                color={getEtapaColor(cuy.etapaVida || '') as any}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={cuy.proposito || 'Sin definir'} 
                                size="small"
                                variant="outlined"
                                color={getPropositoColor(cuy.proposito || '') as any}
                              />
                            </TableCell>
                            <TableCell align="right">{Number(cuy.peso).toFixed(2)} kg</TableCell>
                            <TableCell>{new Date(cuy.fechaNacimiento).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip 
                                label={cuy.estado} 
                                size="small"
                                color={getEstadoColor(cuy.estado) as any}
                              />
                            </TableCell>
                            {showLocationColumns && <TableCell>{cuy.galpon}</TableCell>}
                            {showLocationColumns && <TableCell>{cuy.jaula}</TableCell>}
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionClick(e, cuy.id!);
                                }}
                                sx={{ color: 'text.secondary' }}
                              >
                                <MoreVert />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Paginación */}
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50]}
                  component="div"
                  count={filteredCuyes.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            )}
            
            {viewMode === 'grid' && (
              <>
                <Grid container spacing={2}>
                  {(rowsPerPage > 0
                    ? filteredCuyes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    : filteredCuyes
                    ).map((cuy) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={cuy.id}>
                        <Card sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        borderRadius: 2,
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                        },
                        position: 'relative',
                        overflow: 'visible'
                      }}>
                        <Box sx={{ 
                          position: 'absolute', 
                          top: -15, 
                          right: 20, 
                          backgroundColor: cuy.sexo === 'M' ? 'info.main' : 'secondary.main',
                          color: 'white',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 2
                        }}>
                          {cuy.sexo === 'M' ? <Male /> : <Female />}
                        </Box>
                        <CardContent>
                          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                              #{cuy.id} - {cuy.raza}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleActionClick(e, cuy.id!)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Fecha Nac.</Typography>
                              <Typography variant="body2">{new Date(cuy.fechaNacimiento).toLocaleDateString()}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Peso</Typography>
                              <Typography variant="body2">{Number(cuy.peso).toFixed(2)} kg</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Ubicación</Typography>
                              <Typography variant="body2">Galpón {cuy.galpon}, Jaula {cuy.jaula}</Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Chip 
                              label={cuy.estado} 
                              size="small"
                              color={getEstadoColor(cuy.estado) as any}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Paginación para la vista de grid */}
                <Box sx={{ mt: 3 }}>
                  <TablePagination
                    rowsPerPageOptions={[12, 24, 48, { label: 'Todos', value: -1 }]}
                    component="div"
                    count={filteredCuyes.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Cuyes por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                  />
                </Box>
                </>
              )}

              {/* Conteo de resultados */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total: {filteredCuyes.length} de {cuyes.length} cuyes
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Modal para agregar/editar cuy */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            overflowY: 'auto',
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)', md: '800px' }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Pets color="primary" />
            {editId ? 'Editar Cuy' : 'Agregar Cuy'}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Raza" 
                name="raza" 
                value={form.raza} 
                onChange={handleChange} 
                fullWidth
                required 
                variant="outlined"
                size="small"
                placeholder="Ej: Perú, Andina, Inti"
                error={!!errors.raza}
                helperText={errors.raza}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Pets fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Fecha Nacimiento" 
                name="fechaNacimiento" 
                type="date" 
                value={form.fechaNacimiento} 
                onChange={handleChange} 
                InputLabelProps={{ shrink: true }} 
                fullWidth
                required 
                size="small"
                variant="outlined"
                error={!!errors.fechaNacimiento}
                helperText={errors.fechaNacimiento}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size="small" variant="outlined" error={!!errors.sexo}>
                <InputLabel>Sexo</InputLabel>
                <Select
                  name="sexo"
                  value={form.sexo}
                  label="Sexo"
                  onChange={handleSelectChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <Wc fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="M">Macho</MenuItem>
                  <MenuItem value="H">Hembra</MenuItem>
                </Select>
                {errors.sexo && <FormHelperText>{errors.sexo}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Peso (kg)" 
                name="peso" 
                type="number" 
                value={form.peso === 0 ? '' : form.peso} 
                onChange={handleChange} 
                fullWidth
                required 
                size="small"
                variant="outlined"
                error={!!errors.peso}
                helperText={errors.peso}
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  startAdornment: (
                    <InputAdornment position="start">
                      <FitnessCenter fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Galpón" 
                name="galpon" 
                value={form.galpon} 
                onChange={handleChange} 
                fullWidth
                required 
                size="small"
                variant="outlined"
                placeholder="Ej: Galpón 1, Área A"
                error={!!errors.galpon}
                helperText={errors.galpon}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Warehouse fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Jaula" 
                name="jaula" 
                value={form.jaula} 
                onChange={handleChange} 
                fullWidth
                required 
                size="small"
                variant="outlined"
                placeholder="Ej: J01, Jaula 5"
                error={!!errors.jaula}
                helperText={errors.jaula}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GridOn fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required size="small" variant="outlined" error={!!errors.estado}>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={form.estado}
                  label="Estado"
                  onChange={handleSelectChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <HealthAndSafety fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="Activo">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.success.main }}>
                      <FiberManualRecord fontSize="small" />
                      Activo
                    </Box>
                  </MenuItem>
                  <MenuItem value="Enfermo">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.warning.main }}>
                      <FiberManualRecord fontSize="small" />
                      Enfermo
                    </Box>
                  </MenuItem>
                  <MenuItem value="Vendido">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.info.main }}>
                      <FiberManualRecord fontSize="small" />
                      Vendido
                    </Box>
                  </MenuItem>
                  <MenuItem value="Fallecido">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.error.main }}>
                      <FiberManualRecord fontSize="small" />
                      Fallecido
                    </Box>
                  </MenuItem>
                </Select>
                {errors.estado && <FormHelperText>{errors.estado}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            color="inherit"
            startIcon={<Close />}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={editId ? <Edit /> : <Add />}
            sx={{ borderRadius: 2 }}
          >
            {editId ? 'Guardar Cambios' : 'Agregar Cuy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menú de acciones */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => selectedId && handleView(cuyes.find(c => c.id === selectedId)!)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          Ver detalles
        </MenuItem>
        <MenuItem onClick={() => selectedId && handleOpen(cuyes.find(c => c.id === selectedId)!)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Editar
        </MenuItem>
        
        {/* Botones de cambio de propósito - solo para cuyes adultos */}
        {selectedId && (() => {
          const cuy = cuyes.find(c => c.id === selectedId);
          if (!cuy) return null;
          
          const fechaNac = new Date(cuy.fechaNacimiento);
          const edadMeses = Math.floor((Date.now() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30));
          
          // Solo mostrar opciones si tiene más de 2 meses
          if (edadMeses < 2) return null;
          
          return (
            <>
              <Divider />
              {/* Para machos en engorde: botón hacer reproductor */}
              {(cuy.sexo === 'M' || cuy.sexo === 'Macho') && cuy.proposito === 'Engorde' && edadMeses >= 4 && (
                <MenuItem 
                  onClick={() => selectedId && handleCambiarAReproductor(selectedId)}
                  sx={{ color: 'success.main' }}
                >
                  <ListItemIcon>
                    <Psychology fontSize="small" color="success" />
                  </ListItemIcon>
                  Hacer Reproductor
                </MenuItem>
              )}
              
              {/* Para hembras reproductoras: botón enviar a engorde */}
              {(cuy.sexo === 'H' || cuy.sexo === 'Hembra') && cuy.proposito === 'Reproducción' && (
                <MenuItem 
                  onClick={() => selectedId && handleCambiarAEngorde(selectedId)}
                  sx={{ color: 'warning.main' }}
                >
                  <ListItemIcon>
                    <LocalFlorist fontSize="small" color="warning" />
                  </ListItemIcon>
                  Enviar a Engorde
                </MenuItem>
              )}
              
              {/* Para machos reproductores: botón volver a engorde */}
              {(cuy.sexo === 'M' || cuy.sexo === 'Macho') && cuy.proposito === 'Reproducción' && (
                <MenuItem 
                  onClick={() => selectedId && handleCambiarAEngorde(selectedId)}
                  sx={{ color: 'warning.main' }}
                >
                  <ListItemIcon>
                    <LocalFlorist fontSize="small" color="warning" />
                  </ListItemIcon>
                  Volver a Engorde
                </MenuItem>
              )}
              
              {/* Para hembras en engorde: botón hacer reproductora (si tienen 3+ meses) */}
              {(cuy.sexo === 'H' || cuy.sexo === 'Hembra') && cuy.proposito === 'Engorde' && edadMeses >= 3 && (
                <MenuItem 
                  onClick={() => selectedId && handleCambiarAReproductor(selectedId)}
                  sx={{ color: 'success.main' }}
                >
                  <ListItemIcon>
                    <Psychology fontSize="small" color="success" />
                  </ListItemIcon>
                  Hacer Reproductora
                </MenuItem>
              )}
            </>
          );
        })()}
        
        <Divider />
        <MenuItem onClick={() => selectedId && handleConfirmDelete(selectedId)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          Eliminar
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="cuy"
        loading={deleteConfirmation.loading}
      />

      {/* Modal de registro por jaula */}
      <RegistroJaulaForm
        open={registroJaulaOpen}
        onClose={() => setRegistroJaulaOpen(false)}
        onSuccess={() => {
          fetchCuyes();
          setRegistroJaulaOpen(false);
        }}
      />

      {/* Botón flotante para limpiar selección */}
      {selectedIds.length > 0 && (
        <Fab
          color="secondary"
          aria-label="limpiar selección"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => {
            setSelectedIds([]);
            setShowBulkActions(false);
          }}
        >
          <Close />
        </Fab>
      )}
    </Box>
  );
};

export default CuyesTable;
