import { useEffect, useState } from 'react';
import api from '../services/api';
import { DataStateRenderer, ConditionalRender } from '../utils/conditional-render';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  CircularProgress, Alert, Box, MenuItem, InputAdornment, Chip, Tooltip, 
  Divider, Collapse, FormControl, InputLabel, Select, Grid, Avatar,
  Card, CardContent, Menu, alpha, useTheme, DialogContentText, Snackbar,
  InputBase, styled, LinearProgress, TablePagination
} from '../utils/mui';
import { 
  Add, Edit, Delete, FilterList, Search, Upload, Download, 
  Refresh, Check, Close, MoreVert, Sort, 
  ArrowDropDown, ArrowUpward, ArrowDownward, Visibility, Print,
  MonetizationOn, Receipt, Category, CalendarMonth, AttachMoney, ShowChart,
  FiberManualRecord
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

interface Gasto {
  id?: number;
  concepto: string;
  fecha: string;
  monto: number;
  categoria: string;
}

const initialForm: Gasto = {
  concepto: '',
  fecha: new Date().toISOString().split('T')[0],
  monto: 0,
  categoria: '',
};

interface HeadCell {
  id: keyof Gasto | 'acciones';
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'id', label: 'ID', numeric: true, sortable: true },
  { id: 'concepto', label: 'Concepto', numeric: false, sortable: true },
  { id: 'fecha', label: 'Fecha', numeric: false, sortable: true },
  { id: 'monto', label: 'Monto (S/.)', numeric: true, sortable: true },
  { id: 'categoria', label: 'Categoría', numeric: false, sortable: true },
  { id: 'acciones', label: 'Acciones', numeric: false, sortable: false },
];

type Order = 'asc' | 'desc';

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

// Categorías predefinidas para gastos
const categorias = [
  'Alimentación',
  'Salud',
  'Mantenimiento',
  'Personal',
  'Servicios',
  'Equipamiento',
  'Transporte',
  'Otros'
];

const GastosTable = () => {
  const theme = useTheme();
  
  // DEBUG: Log para verificar que el componente se recarga
  console.log('🔄 GastosTable renderizado - Paginación ARREGLADA');
  
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [filteredGastos, setFilteredGastos] = useState<Gasto[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Gasto>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Gasto>('fecha');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalGastos, setTotalGastos] = useState(0);

  // Handlers para la paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchGastos = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    api.get('/gastos')
      .then(res => {
        setGastos(res.data);
        setFilteredGastos(res.data);
        setLoading(false);
        
        // Calcular el total de gastos
        const total = res.data.reduce((acc: number, curr: Gasto) => acc + curr.monto, 0);
        setTotalGastos(total);
      })
      .catch(err => {
        console.error('Error fetching gastos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
        setLoading(false);
        
        // Datos de ejemplo para visualizar la interfaz
        const fakeGastos = [
          { id: 1, concepto: 'Compra de alfalfa', fecha: '2025-07-01', monto: 450.0, categoria: 'Alimentación' },
          { id: 2, concepto: 'Medicamentos antibióticos', fecha: '2025-07-02', monto: 180.5, categoria: 'Salud' },
          { id: 3, concepto: 'Pago de personal', fecha: '2025-07-03', monto: 1200.0, categoria: 'Personal' },
          { id: 4, concepto: 'Reparación de jaulas', fecha: '2025-07-04', monto: 350.0, categoria: 'Mantenimiento' },
          { id: 5, concepto: 'Servicio de agua', fecha: '2025-07-04', monto: 120.0, categoria: 'Servicios' },
          { id: 6, concepto: 'Compra de vitaminas', fecha: '2025-07-05', monto: 250.0, categoria: 'Salud' },
          { id: 7, concepto: 'Transporte de cuyes', fecha: '2025-07-05', monto: 150.0, categoria: 'Logística' },
          { id: 8, concepto: 'Materiales de limpieza', fecha: '2025-07-05', monto: 80.0, categoria: 'Mantenimiento' },
          { id: 9, concepto: 'Alfalfa', fecha: '2025-07-05', monto: 200.0, categoria: 'Alimentación' },
        ];
        setGastos(fakeGastos);
        setFilteredGastos(fakeGastos);
        
        // Calcular el total de gastos de ejemplo
        const total = fakeGastos.reduce((acc, curr) => acc + curr.monto, 0);
        setTotalGastos(total);
      });
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterCategoria, filterFechaDesde, filterFechaHasta, gastos, order, orderBy]);

  const applyFilters = () => {
    let filtered = [...gastos];

    // Búsqueda global
    if (searchTerm) {
      filtered = filtered.filter(gasto => 
        Object.values(gasto).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtros específicos
    if (filterCategoria) {
      filtered = filtered.filter(gasto => gasto.categoria === filterCategoria);
    }
    
    if (filterFechaDesde) {
      filtered = filtered.filter(gasto => new Date(gasto.fecha) >= new Date(filterFechaDesde));
    }
    
    if (filterFechaHasta) {
      filtered = filtered.filter(gasto => new Date(gasto.fecha) <= new Date(filterFechaHasta));
    }

    // Ordenamiento
    filtered = stableSort(filtered, getComparator(order, orderBy));

    setFilteredGastos(filtered);
    
    // Recalcular el total de gastos filtrados
    const total = filtered.reduce((acc, curr) => acc + curr.monto, 0);
    setTotalGastos(total);
  };

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (orderBy === 'fecha') {
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

  const handleRequestSort = (property: keyof Gasto) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategoria('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
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

  const handleOpen = (gasto?: Gasto) => {
    if (gasto) {
      setForm(gasto);
      setEditId(gasto.id!);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpen(true);
    handleActionClose();
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/gastos/${editId}`, form);
        setSnackbarMessage('Gasto actualizado con éxito');
      } else {
        await api.post('/gastos', form);
        setSnackbarMessage('Gasto agregado con éxito');
      }
      fetchGastos();
      handleClose();
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error saving gasto:', err);
      setError('Error al guardar los datos. Por favor, intenta de nuevo.');
    }
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
    handleActionClose();
  };

  const handleDelete = async () => {
    try {
      if (deleteId) {
        await api.delete(`/gastos/${deleteId}`);
        fetchGastos();
        setSnackbarMessage('Gasto eliminado con éxito');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error deleting gasto:', err);
      setError('Error al eliminar el registro. Por favor, intenta de nuevo.');
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  // Función para obtener el color de la categoría
  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Alimentación':
        return theme.palette.success.main;
      case 'Salud':
        return theme.palette.info.main;
      case 'Mantenimiento':
        return theme.palette.warning.main;
      case 'Personal':
        return theme.palette.primary.main;
      case 'Servicios':
        return theme.palette.secondary.main;
      case 'Equipamiento':
        return theme.palette.error.main;
      case 'Transporte':
        return '#9C27B0'; // Púrpura
      default:
        return '#607D8B'; // Gris azulado
    }
  };

  return (
    <Paper sx={{ 
      borderRadius: 2, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme.shadows[3]
    }}>
      {/* Header con título y acciones */}
      <Box sx={{ 
        p: 2, 
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.error.main, 0.1), 
            color: theme.palette.error.main,
            mr: 2 
          }}>
            <MonetizationOn />
          </Avatar>
          <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
            Registro de Gastos
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            size="small"
            color="primary"
          >
            Nuevo Gasto
          </Button>
          <Tooltip title="Exportar datos">
            <IconButton 
              color="primary"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Información de totales */}
      <Box sx={{ 
        p: 2, 
        bgcolor: alpha(theme.palette.error.light, 0.05),
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShowChart sx={{ color: theme.palette.error.main, mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            Total de gastos:
          </Typography>
        </Box>
        <Typography variant="h6" fontWeight="bold" color="error.main">
          S/. {totalGastos.toFixed(2)}
        </Typography>
      </Box>

      {/* Barra de búsqueda y filtros */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center', 
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexWrap: 'wrap'
      }}>
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: { xs: '100%', sm: 300 },
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none'
          }}
        >
          <SearchIconWrapper>
            <Search />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Buscar gastos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <IconButton 
              size="small" 
              onClick={() => setSearchTerm('')} 
              sx={{ p: '5px' }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Paper>

        <Button
          size="small"
          startIcon={<FilterList />}
          onClick={() => setFilterOpen(!filterOpen)}
          variant={filterOpen ? "contained" : "outlined"}
          color="primary"
          sx={{ height: 40 }}
        >
          Filtros
        </Button>

        {(filterCategoria || filterFechaDesde || filterFechaHasta) && (
          <Button
            size="small"
            onClick={resetFilters}
            sx={{ height: 40 }}
          >
            Limpiar filtros
          </Button>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Actualizar datos">
          <IconButton onClick={fetchGastos} size="small" sx={{ height: 40, width: 40 }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Collapse in={filterOpen}>
        <Box sx={{ 
          p: 2, 
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="filter-categoria-label">Categoría</InputLabel>
            <Select
              labelId="filter-categoria-label"
              value={filterCategoria}
              label="Categoría"
              onChange={(e) => setFilterCategoria(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {categorias.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Desde"
            type="date"
            size="small"
            value={filterFechaDesde}
            onChange={(e) => setFilterFechaDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={filterFechaHasta}
            onChange={(e) => setFilterFechaHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Box>
      </Collapse>

      {/* Alertas de error o éxito */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ m: 2, borderRadius: 1 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ m: 2, borderRadius: 1 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      
      {/* Tabla principal */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer sx={{ 
            flex: 1, 
            overflowY: 'auto',
            width: '100%',
            borderRadius: 2,
            boxShadow: (theme) => `0 0 12px ${alpha(theme.palette.primary.main, 0.08)}`,
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
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.numeric ? 'right' : 'left'}
                      sortDirection={orderBy === headCell.id ? order : false}
                      sx={{ 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {headCell.sortable ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': {
                              color: theme.palette.primary.main,
                            },
                          }}
                          onClick={() => headCell.id !== 'acciones' && handleRequestSort(headCell.id as keyof Gasto)}
                        >
                          {headCell.label}
                          {orderBy === headCell.id ? (
                            <Box component="span" sx={{ ml: 1, position: 'relative' }}>
                              {order === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />}
                            </Box>
                          ) : null}
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
                  ? filteredGastos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredGastos
                ).map(gasto => (
                  <TableRow 
                    key={gasto.id}
                    hover
                    sx={{ 
                      '&:hover': { 
                        bgcolor: alpha(theme.palette.primary.light, 0.1),
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <TableCell>{gasto.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1.5, 
                            bgcolor: alpha(getCategoriaColor(gasto.categoria), 0.1),
                            color: getCategoriaColor(gasto.categoria),
                          }}
                        >
                          <Receipt fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {gasto.concepto}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarMonth fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                        {new Date(gasto.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        color="error.main"
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                      >
                        <AttachMoney fontSize="small" />
                        {gasto.monto.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={gasto.categoria} 
                        size="small" 
                        icon={<Category fontSize="small" />}
                        sx={{ 
                          bgcolor: alpha(getCategoriaColor(gasto.categoria), 0.1),
                          color: getCategoriaColor(gasto.categoria),
                          fontWeight: 'medium',
                          '& .MuiChip-icon': {
                            color: 'inherit'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleOpen(gasto)} size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => openDeleteConfirm(gasto.id!)} size="small">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredGastos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No hay gastos registrados. Agrega uno nuevo para comenzar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, { label: 'Todos', value: -1 }]}
            component="div"
            count={filteredGastos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      )}

      {/* Dialog para agregar o editar */}
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
            <MonetizationOn color="primary" />
            {editId ? 'Editar Gasto' : 'Registrar Gasto'}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Concepto" 
                name="concepto" 
                value={form.concepto} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: Compra de alfalfa, Pago de personal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Receipt fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Fecha" 
                name="fecha" 
                type="date" 
                value={form.fecha} 
                onChange={handleChange} 
                InputLabelProps={{ shrink: true }} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Monto (S/.)" 
                name="monto" 
                type="number" 
                value={form.monto} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                inputProps={{ min: 0, step: 0.1 }}
                placeholder="Ej: 150.50"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel id="categoria-label">Categoría</InputLabel>
                <Select
                  labelId="categoria-label"
                  name="categoria"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  label="Categoría"
                  startAdornment={
                    <InputAdornment position="start">
                      <Category fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {categorias.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: getCategoriaColor(cat) }}>
                        <FiberManualRecord fontSize="small" />
                        {cat}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
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
            {editId ? 'Guardar Cambios' : 'Registrar Gasto'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}>
            <Delete />
          </Avatar>
          <Typography variant="h6">
            Confirmar Eliminación
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            ¿Está seguro que desea eliminar este gasto? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={() => setConfirmOpen(false)} 
            variant="outlined"
            startIcon={<Close />}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menú de acciones adicionales */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
        sx={{ '& .MuiPaper-root': { borderRadius: 2, boxShadow: 3 } }}
      >
        <MenuItem onClick={() => selectedId && handleOpen(gastos.find(a => a.id === selectedId))}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <MenuItem onClick={() => selectedId && openDeleteConfirm(selectedId)}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleActionClose}>
          <Print fontSize="small" sx={{ mr: 1 }} /> Imprimir detalle
        </MenuItem>
      </Menu>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
};

export default GastosTable;
