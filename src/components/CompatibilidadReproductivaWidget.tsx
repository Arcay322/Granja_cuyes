import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem,
  Button, CircularProgress, Alert, Card, CardContent, Divider, Chip
} from '../utils/mui';
import { Check, Close, Pets, Science } from '@mui/icons-material';
import api from '../services/api';

interface Cuy {
  id: number;
  identificacion?: string;
  raza: string;
  sexo: string;
  edad: number;
  galpon: string;
  jaula: string;
}

interface CompatibilidadResult {
  compatibilidadPorcentaje: number;
  madre: Cuy;
  padre: Cuy;
  factores: Array<{
    nombre: string;
    descripcion: string;
    compatible: boolean;
  }>;
  recomendaciones?: string;
}

const CompatibilidadReproductivaWidget = () => {
  const [madreId, setMadreId] = useState<string>('');
  const [padreId, setPadreId] = useState<string>('');
  const [compatibilidad, setCompatibilidad] = useState<CompatibilidadResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [madres, setMadres] = useState<Cuy[]>([]);
  const [padres, setPadres] = useState<Cuy[]>([]);
  const [loadingCuyes, setLoadingCuyes] = useState<boolean>(true);

  // Cargar cuyes reproductores al montar el componente
  useEffect(() => {
    const fetchReproductores = async () => {
      try {
        setLoadingCuyes(true);
        const [madresRes, padresRes] = await Promise.all([
          api.get('/reproduccion/prenez/madres-disponibles'),
          api.get('/reproduccion/prenez/padres-disponibles')
        ]);
        
        if (madresRes.data.success) {
          setMadres(madresRes.data.data || []);
        }
        
        if (padresRes.data.success) {
          setPadres(padresRes.data.data || []);
        }
      } catch (error) {
        console.error('Error al cargar reproductores:', error);
      } finally {
        setLoadingCuyes(false);
      }
    };

    fetchReproductores();
  }, []);

  const handleCheckCompatibilidad = async () => {
    if (!madreId || !padreId) {
      setError('Debe seleccionar una madre y un padre');
      return;
    }

    if (madreId === padreId) {
      setError('Debe seleccionar cuyes diferentes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/reproduccion/prenez/calcular-compatibilidad', {
        madreId: Number(madreId),
        padreId: Number(padreId)
      });
      
      if (response.data.success) {
        setCompatibilidad(response.data.data);
      } else {
        setError(response.data.message || 'Error al calcular compatibilidad');
      }
    } catch (error) {
      console.error('Error al verificar compatibilidad:', error);
      setError('Error al verificar la compatibilidad');
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilidadColor = (nivel: number) => {
    if (nivel >= 80) return 'success';
    if (nivel >= 50) return 'warning';
    return 'error';
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Pets color="info" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Compatibilidad Reproductiva
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Herramienta para evaluar la compatibilidad entre reproductores
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={loadingCuyes}>
            <InputLabel id="madre-label">Seleccionar Madre</InputLabel>
            <Select
              labelId="madre-label"
              value={madreId}
              onChange={(e) => setMadreId(e.target.value as string)}
              label="Seleccionar Madre"
            >
              {madres.map((madre) => (
                <MenuItem key={madre.id} value={madre.id.toString()}>
                  {madre.identificacion || `#${madre.id}`} - {madre.raza} ({madre.galpon}-{madre.jaula})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={loadingCuyes}>
            <InputLabel id="padre-label">Seleccionar Padre</InputLabel>
            <Select
              labelId="padre-label"
              value={padreId}
              onChange={(e) => setPadreId(e.target.value as string)}
              label="Seleccionar Padre"
            >
              {padres.map((padre) => (
                <MenuItem key={padre.id} value={padre.id.toString()}>
                  {padre.identificacion || `#${padre.id}`} - {padre.raza} ({padre.galpon}-{padre.jaula})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleCheckCompatibilidad}
          disabled={loading || !madreId || !padreId || loadingCuyes}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Science />}
        >
          Verificar Compatibilidad
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {compatibilidad && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Resultado de Compatibilidad</Typography>
              <Chip 
                label={`${compatibilidad.compatibilidadPorcentaje}% Compatible`}
                color={getCompatibilidadColor(compatibilidad.compatibilidadPorcentaje)}
                icon={compatibilidad.compatibilidadPorcentaje >= 50 ? <Check /> : <Close />}
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Madre Seleccionada</Typography>
                <Typography variant="body2">
                  {compatibilidad.madre.identificacion || `#${compatibilidad.madre.id}`} - {compatibilidad.madre.raza}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ubicación: {compatibilidad.madre.galpon}-{compatibilidad.madre.jaula}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Padre Seleccionado</Typography>
                <Typography variant="body2">
                  {compatibilidad.padre.identificacion || `#${compatibilidad.padre.id}`} - {compatibilidad.padre.raza}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ubicación: {compatibilidad.padre.galpon}-{compatibilidad.padre.jaula}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1">Factores de Compatibilidad</Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {compatibilidad.factores.map((factor, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1,
                    borderRadius: 1,
                    bgcolor: factor.compatible ? 'success.50' : 'error.50'
                  }}>
                    {factor.compatible ? 
                      <Check color="success" sx={{ mr: 1 }} /> : 
                      <Close color="error" sx={{ mr: 1 }} />
                    }
                    <Box>
                      <Typography variant="body2">{factor.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {factor.descripcion}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            {compatibilidad.recomendaciones && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1">Recomendaciones</Typography>
                <Typography variant="body2" paragraph>
                  {compatibilidad.recomendaciones}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información adicional cuando no hay datos */}
      {!loadingCuyes && (madres.length === 0 || padres.length === 0) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {madres.length === 0 && padres.length === 0 
            ? 'No hay reproductores disponibles en el sistema'
            : madres.length === 0 
            ? 'No hay madres disponibles para reproducción'
            : 'No hay padres disponibles para reproducción'
          }
        </Alert>
      )}
    </Paper>
  );
};

export default CompatibilidadReproductivaWidget;