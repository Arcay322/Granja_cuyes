import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Box, Tooltip, MenuItem, Select, FormControl, InputLabel, Chip, Divider, Alert,
  useTheme, alpha, CircularProgress, TablePagination, Grid
} from '../utils/mui';
import { 
  Add, Edit, Delete, Inventory, Close, Save
} from '@mui/icons-material';
import { InputAdornment } from '../utils/mui';

interface Alimento {
  id?: number;
  nombre: string;
  descripcion: string;
  unidad: string;
  stock: number;
  costoUnitario: number;
}

const initialForm: Alimento = {
  nombre: '',
  descripcion: '',
  unidad: '',
  stock: 0,
  costoUnitario: 0,
};

// Opciones para las unidades de medida
const unidadOptions = [
  'kg',
  'Fardo',
  'Frasco',
  'Litro',
  'Bolsa',
  'Saco'
];

const AlimentosTable = () => {
  const theme = useTheme();
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Alimento>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchAlimentos = () => {
    setLoading(true);
    api.get('/alimentos')
      .then(res => {
        setAlimentos(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Error al cargar alimentos:", err);
        setError("No se pudieron cargar los alimentos. Por favor, intenta de nuevo.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlimentos();
  }, []);

  const handleOpen = (alimento?: Alimento) => {
    if (alimento) {
      setForm(alimento);
      setEditId(alimento.id!);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/alimentos/${editId}`, form);
      } else {
        await api.post('/alimentos', form);
      }
      fetchAlimentos();
      handleClose();
    } catch (err) {
      console.error("Error al guardar el alimento:", err);
      setError("No se pudo guardar el alimento. Por favor, verifica los datos e intenta de nuevo.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/alimentos/${id}`);
      fetchAlimentos();
    } catch (err) {
      console.error("Error al eliminar el alimento:", err);
      setError("No se pudo eliminar el alimento. Por favor, intenta de nuevo.");
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Función para obtener el color según el stock
  const getStockColor = (stock: number) => {
    if (stock <= 10) return theme.palette.error.main;
    if (stock <= 25) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Formato de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  };
    }
    if (filterStockBajo) {
      filtered = filtered.filter(alimento => alimento.stock < 50);
    }

    // Ordenamiento
    filtered = stableSort(filtered, getComparator(order, orderBy));
    
    setFilteredAlimentos(filtered);
  };

  const resetFilters = () => {
    setFilterUnidad('');
    setFilterStockBajo(false);
  };

  const getUniqueUnidades = () => {
    const unidades = alimentos.map(alimento => alimento.unidad);
    return [...new Set(unidades)];
  };

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
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

  function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const handleRequestSort = (property: keyof Alimento) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleOpen = (alimento?: Alimento) => {
    if (alimento && alimento.id) {
      setForm({ ...alimento });
      setEditId(alimento.id);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setForm(initialForm);
    setEditId(null);
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.unidad || form.stock < 0 || form.costoUnitario <= 0) {
      setError("Por favor, completa todos los campos requeridos correctamente.");
      return;
    }

    if (editId) {
      // Actualizar existente
      api.put(`/alimentos/${editId}`, form)
        .then(() => {
          setSuccess("Alimento actualizado correctamente");
          fetchAlimentos();
          handleClose();
        })
        .catch(err => {
          console.error('Error updating alimento:', err);
          setError("Error al actualizar el alimento. Por favor, intenta de nuevo.");
          
          // En modo de demostración, actualizar localmente
          setAlimentos(prev => prev.map(item => 
            item.id === editId ? { ...form, id: editId } : item
          ));
          setSuccess("Alimento actualizado correctamente (simulado)");
          handleClose();
        });
    } else {
      // Crear nuevo
      api.post('/alimentos', form)
        .then(() => {
          setSuccess("Alimento añadido correctamente");
          fetchAlimentos();
          handleClose();
        })
        .catch(err => {
          console.error('Error creating alimento:', err);
          setError("Error al crear el alimento. Por favor, intenta de nuevo.");
          
          // En modo de demostración, añadir localmente
          const newAlimento = {
            ...form,
            id: Math.max(...alimentos.map(a => a.id || 0)) + 1
          };
          setAlimentos(prev => [...prev, newAlimento]);
          setSuccess("Alimento añadido correctamente (simulado)");
          handleClose();
        });
    }
  };

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedId(id);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedId(null);
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
    handleActionClose();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    
    api.delete(`/alimentos/${deleteId}`)
      .then(() => {
        setSuccess("Alimento eliminado correctamente");
        fetchAlimentos();
        setConfirmOpen(false);
        setDeleteId(null);
      })
      .catch(err => {
        console.error('Error deleting alimento:', err);
        setError("Error al eliminar el alimento. Por favor, intenta de nuevo.");
        
        // En modo de demostración, eliminar localmente
        setAlimentos(prev => prev.filter(item => item.id !== deleteId));
        setSuccess("Alimento eliminado correctamente (simulado)");
        setConfirmOpen(false);
        setDeleteId(null);
      });
  };

  const getStockLevelColor = (stock: number) => {
    if (stock <= 20) {
      return theme.palette.error.main;
    } else if (stock <= 50) {
      return theme.palette.warning.main;
    } else {
      return theme.palette.success.main;
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'table' ? 'grid' : 'table');
  };

  return (
    <Box sx={{ 
      borderRadius: 2, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme.shadows[3]
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: theme.palette.primary.main,
            mr: 2 
          }}>
            <LocalDining />
          </Avatar>
          <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
            Inventario de Alimentos
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            size="small"
          >
            Agregar Alimento
          </Button>
          <IconButton 
            onClick={toggleViewMode} 
            color="primary"
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            {viewMode === 'table' ? <Inventory2 /> : <Table />}
          </IconButton>
        </Box>
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
            placeholder="Buscar alimentos..."
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

        {(filterUnidad || filterStockBajo) && (
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
          <IconButton onClick={fetchAlimentos} size="small" sx={{ height: 40, width: 40 }}>
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
            <InputLabel id="filter-unidad-label">Unidad</InputLabel>
            <Select
              labelId="filter-unidad-label"
              value={filterUnidad}
              label="Unidad"
              onChange={(e) => setFilterUnidad(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {getUniqueUnidades().map(unidad => (
                <MenuItem key={unidad} value={unidad}>{unidad}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch 
                checked={filterStockBajo} 
                onChange={(e) => setFilterStockBajo(e.target.checked)}
                color="warning"
              />
            }
            label="Stock bajo"
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
      
      {/* Contenido principal */}
      <DataStateRenderer
          loading={loading}
          error={error}
          isEmpty={filteredAlimentos.length === 0}
          loadingComponent={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress color="primary" />
            </Box>
          }
          errorComponent={
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          }
          emptyComponent={
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textAlign: 'center', 
              p: 4, 
              height: '200px',
              gap: 2
            }}>
              <Inventory2 sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.2) }} />
              <Typography variant="h6" color="text.secondary">
                No hay alimentos que coincidan con los filtros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Intenta modificar los filtros o agregar un nuevo alimento
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<Add />} 
                onClick={() => handleOpen()}
                size="small"
                sx={{ mt: 1 }}
              >
                Agregar Alimento
              </Button>
            </Box>
          }
        >
          <ConditionalRender condition={viewMode === 'table'}>
            <TableContainer sx={{ 
              width: '100%',
              borderRadius: 2,
              boxShadow: (theme) => `0 0 12px ${alpha(theme.palette.primary.main, 0.08)}`
            }}>
              <Table>
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
                          onClick={() => headCell.id !== 'acciones' && handleRequestSort(headCell.id as keyof Alimento)}
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
                  ? filteredAlimentos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredAlimentos
                ).map(alimento => (
                  <TableRow 
                    key={alimento.id}
                    hover
                    sx={{ 
                      '&:hover': { 
                        bgcolor: alpha(theme.palette.primary.light, 0.1),
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <TableCell>{alimento.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1.5, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                        >
                          <Kitchen fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {alimento.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{alimento.descripcion}</TableCell>
                    <TableCell>
                      <Chip 
                        label={alimento.unidad} 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha(theme.palette.secondary.main, 0.2),
                          color: theme.palette.secondary.dark,
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={alimento.stock} 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha(getStockLevelColor(alimento.stock), 0.1),
                          color: getStockLevelColor(alimento.stock),
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">S/. {alimento.costoUnitario.toFixed(2)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton 
                          color="primary" 
                          size="small" 
                          onClick={() => handleOpen(alimento)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => openDeleteConfirm(alimento.id!)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionClick(e, alimento.id!)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, { label: 'Todos', value: -1 }]}
            component="div"
            count={filteredAlimentos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
          </ConditionalRender>
          <ConditionalRender condition={viewMode !== 'table'}>
            <Grid container spacing={2} sx={{ p: 2 }}>
              {(rowsPerPage > 0
                ? filteredAlimentos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredAlimentos
              ).map(alimento => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={alimento.id}>
                  <Card 
                    sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <Box sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        mr: 2
                      }}
                    >
                      <Spa />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3" fontWeight="bold">
                        {alimento.nombre}
                      </Typography>
                      <Chip 
                        label={alimento.unidad} 
                        size="small" 
                        sx={{ 
                          mt: 0.5,
                          bgcolor: alpha(theme.palette.secondary.main, 0.2),
                          color: theme.palette.secondary.dark
                        }}
                      />
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {alimento.descripcion}
                    </Typography>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        Stock:
                      </Typography>
                      <Chip 
                        label={`${alimento.stock} ${alimento.unidad}`} 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha(getStockLevelColor(alimento.stock), 0.1),
                          color: getStockLevelColor(alimento.stock),
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        Costo:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="text.primary">
                        S/. {alimento.costoUnitario.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<Edit />} 
                      onClick={() => handleOpen(alimento)}
                    >
                      Editar
                    </Button>
                    <Button 
                      color="error" 
                      size="small" 
                      startIcon={<Delete />} 
                      onClick={() => openDeleteConfirm(alimento.id!)}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Paginación para vista de grid */}
          <TablePagination
            rowsPerPageOptions={[12, 24, 48, { label: 'Todos', value: -1 }]}
            component="div"
            count={filteredAlimentos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Tarjetas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
          </ConditionalRender>
        </DataStateRenderer>

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
            <LocalDining color="primary" />
            {editId ? 'Editar Alimento' : 'Agregar Alimento'}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Nombre" 
                name="nombre" 
                value={form.nombre} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: Alfalfa, Concentrado Premium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalDining fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Unidad" 
                name="unidad" 
                value={form.unidad} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: kg, Fardo, Frasco"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory2 fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Stock" 
                name="stock" 
                type="number" 
                value={form.stock} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                inputProps={{ min: 0, step: 1 }}
                placeholder="Cantidad disponible"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Costo Unitario (S/.)" 
                name="costoUnitario" 
                type="number" 
                value={form.costoUnitario} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                inputProps={{ min: 0, step: 0.1 }}
                placeholder="Ej: 5.50"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShoppingCart fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="proveedor-label">Proveedor</InputLabel>
                <Select
                  labelId="proveedor-label"
                  id="proveedor"
                  value={form.proveedorId || ''}
                  name="proveedorId"
                  label="Proveedor"
                  onChange={handleChange}
                  required
                >
                  {proveedores.map((proveedor) => (
                    <MenuItem key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Descripción" 
                name="descripcion" 
                value={form.descripcion} 
                onChange={handleChange} 
                required 
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                size="small"
                placeholder="Ej: Forraje verde fresco para cuyes adultos"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                      <Description fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
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
            {editId ? 'Guardar Cambios' : 'Agregar Alimento'}
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
            ¿Está seguro que desea eliminar este alimento? Esta acción no se puede deshacer.
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
        <MenuItem onClick={() => selectedId && handleOpen(alimentos.find(a => a.id === selectedId))}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <MenuItem onClick={() => selectedId && openDeleteConfirm(selectedId)}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleActionClose}>
          <Print fontSize="small" sx={{ mr: 1 }} /> Imprimir detalles
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
    </Box>
  );
};

export default AlimentosTable;
