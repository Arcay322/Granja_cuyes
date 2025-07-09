import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Box, Tooltip, MenuItem, Select, FormControl, InputLabel, Chip, Divider, Alert,
  useTheme, alpha, CircularProgress, TablePagination, Grid
} from '../utils/mui';
import { 
  Add, Edit, Delete, Inventory, Close, Save, FiberManualRecord
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory color="primary" />
          <Typography variant="h6">Inventario de Alimentos</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: theme.shadows[2]
          }}
        >
          Agregar Alimento
        </Button>
      </Box>

      {/* Alerta de error */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Alerta de éxito */}
      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
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
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Costo Unitario</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? alimentos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : alimentos
                ).map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell>{a.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{a.nombre}</TableCell>
                    <TableCell>{a.descripcion}</TableCell>
                    <TableCell>{a.unidad}</TableCell>
                    <TableCell>
                      <Chip 
                        label={a.stock} 
                        size="small" 
                        icon={<FiberManualRecord />}
                        sx={{ 
                          bgcolor: alpha(getStockColor(a.stock), 0.1),
                          color: getStockColor(a.stock),
                          fontWeight: 500
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(a.costoUnitario)}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleOpen(a)} size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDelete(a.id!)} size="small">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {alimentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No hay alimentos registrados. Agrega uno nuevo para comenzar.
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
            count={alimentos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      )}

      {/* Formulario modal */}
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
            <Inventory color="primary" />
            {editId ? 'Editar Alimento' : 'Agregar Alimento'}
          </Typography>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Nombre del Alimento" 
                name="nombre" 
                value={form.nombre} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: Alfalfa"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="unidad-label">Unidad de Medida</InputLabel>
                <Select
                  labelId="unidad-label"
                  name="unidad"
                  value={form.unidad}
                  onChange={handleSelectChange}
                  label="Unidad de Medida"
                  required
                >
                  {unidadOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
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
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={2}
                placeholder="Descripción del alimento"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Stock Inicial" 
                name="stock" 
                type="number" 
                value={form.stock} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: 100"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Costo Unitario" 
                name="costoUnitario" 
                type="number" 
                value={form.costoUnitario} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: 5.50"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      S/.
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
            startIcon={<Close />}
            variant="outlined"
            color="inherit"
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
    </Box>
  );
};

export default AlimentosTable;
