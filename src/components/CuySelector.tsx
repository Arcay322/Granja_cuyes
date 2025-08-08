import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, TextField, Button, Alert, CircularProgress, Chip, IconButton,
  InputAdornment, Tooltip
} from '../utils/mui';
import { Search, Delete, Add } from '@mui/icons-material';
import api from '../services/api';
import { isSuccessfulApiResponse } from '../utils/typeGuards';

interface Cuy {
  id: number;
  raza: string;
  sexo: string;
  peso: number;
  galpon: string;
  jaula: string;
  etapaVida: string;
  fechaNacimiento: string;
}

interface VentaDetalle {
  cuyId: number;
  peso: number;
  precioUnitario: number;
  cuy?: Cuy;
}

interface CuySelectorProps {
  selectedCuyes: VentaDetalle[];
  onCuyesChange: (cuyes: VentaDetalle[]) => void;
  onTotalChange: (total: number) => void;
}

const CuySelector: React.FC<CuySelectorProps> = ({ selectedCuyes, onCuyesChange, onTotalChange }) => {
  const [availableCuyes, setAvailableCuyes] = useState<Cuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableCuyes();
  }, []);

  useEffect(() => {
    // Calcular total automáticamente cuando cambian los cuyes seleccionados
    const total = selectedCuyes.reduce((sum, detalle) => sum + (detalle.peso * detalle.precioUnitario), 0);
    onTotalChange(total);
  }, [selectedCuyes, onTotalChange]);

  const fetchAvailableCuyes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cuyes/disponibles-venta');
      if (isSuccessfulApiResponse<Cuy[]>(response.data)) {
        setAvailableCuyes(response.data.data);
      }
      setError(null);
    } catch (error) {
      console.error('Error al cargar cuyes disponibles:', error);
      setError('Error al cargar los cuyes disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleCuySelect = (cuy: Cuy, selected: boolean) => {
    if (selected) {
      // Agregar cuy con valores por defecto
      const newDetalle: VentaDetalle = {
        cuyId: cuy.id,
        peso: cuy.peso,
        precioUnitario: 25, // Precio por defecto
        cuy: cuy
      };
      onCuyesChange([...selectedCuyes, newDetalle]);
    } else {
      // Remover cuy
      onCuyesChange(selectedCuyes.filter(detalle => detalle.cuyId !== cuy.id));
    }
  };

  const handleDetalleChange = (cuyId: number, field: 'peso' | 'precioUnitario', value: number) => {
    const updatedCuyes = selectedCuyes.map(detalle => 
      detalle.cuyId === cuyId 
        ? { ...detalle, [field]: value }
        : detalle
    );
    onCuyesChange(updatedCuyes);
  };

  const handleRemoveCuy = (cuyId: number) => {
    onCuyesChange(selectedCuyes.filter(detalle => detalle.cuyId !== cuyId));
  };

  const filteredCuyes = availableCuyes.filter(cuy =>
    cuy.raza.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cuy.galpon.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cuy.jaula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCuySelected = (cuyId: number) => selectedCuyes.some(detalle => detalle.cuyId === cuyId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Seleccionar Cuyes para la Venta
      </Typography>

      {/* Cuyes seleccionados */}
      {selectedCuyes.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Cuyes Seleccionados ({selectedCuyes.length})
          </Typography>
          <Paper sx={{ p: 2 }}>
            {selectedCuyes.map((detalle) => (
              <Box key={detalle.cuyId} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2,
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    <strong>Cuy #{detalle.cuyId}</strong> - {detalle.cuy?.raza} ({detalle.cuy?.sexo})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Galpón {detalle.cuy?.galpon} - Jaula {detalle.cuy?.jaula}
                  </Typography>
                </Box>
                <TextField
                  label="Peso (kg)"
                  type="number"
                  size="small"
                  value={detalle.peso}
                  onChange={(e) => handleDetalleChange(detalle.cuyId, 'peso', parseFloat(e.target.value) || 0)}
                  sx={{ width: 100 }}
                  inputProps={{ step: 0.1, min: 0 }}
                />
                <TextField
                  label="Precio Unit."
                  type="number"
                  size="small"
                  value={detalle.precioUnitario}
                  onChange={(e) => handleDetalleChange(detalle.cuyId, 'precioUnitario', parseFloat(e.target.value) || 0)}
                  sx={{ width: 100 }}
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">S/</InputAdornment>,
                  }}
                />
                <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                  <strong>S/ {(detalle.peso * detalle.precioUnitario).toFixed(2)}</strong>
                </Typography>
                <Tooltip title="Remover cuy">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleRemoveCuy(detalle.cuyId)}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            <Box sx={{ textAlign: 'right', pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="h6">
                Total: S/ {selectedCuyes.reduce((sum, detalle) => sum + (detalle.peso * detalle.precioUnitario), 0).toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Buscador */}
      <TextField
        fullWidth
        placeholder="Buscar por raza, galpón o jaula..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Lista de cuyes disponibles */}
      <Typography variant="subtitle1" gutterBottom>
        Cuyes Disponibles ({filteredCuyes.length})
      </Typography>
      
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">Sel.</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Raza</TableCell>
              <TableCell>Sexo</TableCell>
              <TableCell>Peso</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Etapa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCuyes.map((cuy) => {
              const isSelected = isCuySelected(cuy.id);
              return (
                <TableRow key={cuy.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleCuySelect(cuy, e.target.checked)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>{cuy.id}</TableCell>
                  <TableCell>{cuy.raza}</TableCell>
                  <TableCell>{cuy.sexo}</TableCell>
                  <TableCell>{cuy.peso} kg</TableCell>
                  <TableCell>{cuy.galpon}-{cuy.jaula}</TableCell>
                  <TableCell>
                    <Chip 
                      label={cuy.etapaVida} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredCuyes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            {searchTerm ? 'No se encontraron cuyes con ese criterio' : 'No hay cuyes disponibles para venta'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CuySelector;