import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Chip, Button, Alert, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, TextField, Accordion,
  AccordionSummary, AccordionDetails
} from '../utils/mui';
import { 
  Timeline, TrendingUp, Warning, AutoMode, 
  Psychology, ExpandMore, Refresh
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';
import { isSuccessfulApiResponse } from '../utils/typeGuards';

interface EtapaStats {
  etapa: string;
  cantidad: number;
}

interface ProximaTransicion {
  id: number;
  raza: string;
  sexo: string;
  etapaActual: string;
  proximaTransicion: string;
  diasParaTransicion: number;
  edadEnMeses: string;
}

interface TransicionSugerida {
  id: number;
  etapaActual: string;
  etapaSugerida: string;
  edadEnMeses: string;
  sexo: string;
  proposito: string;
}

const EtapasManagementWidget: React.FC = () => {
  const [stats, setStats] = useState<EtapaStats[]>([]);
  const [proximasTransiciones, setProximasTransiciones] = useState<ProximaTransicion[]>([]);
  const [transicionesSugeridas, setTransicionesSugeridas] = useState<TransicionSugerida[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCuy, setSelectedCuy] = useState<any>(null);
  const [nuevaEtapa, setNuevaEtapa] = useState('');
  const [nuevoProposito, setNuevoProposito] = useState('');
  const [motivo, setMotivo] = useState('');

  const etapasDisponibles = [
    'Cría', 'Juvenil', 'Engorde', 'Reproductor', 
    'Reproductora', 'Gestante', 'Lactante', 'Retirado'
  ];

  const propositos = [
    'Indefinido', 'Engorde', 'Reproducción', 'Venta'
  ];

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case 'Cría': return 'info';
      case 'Juvenil': return 'primary';
      case 'Engorde': return 'warning';
      case 'Reproductor': return 'success';
      case 'Reproductora': return 'success';
      case 'Gestante': return 'secondary';
      case 'Lactante': return 'secondary';
      case 'Retirado': return 'default';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, proximasRes] = await Promise.all([
        api.get('/etapas/estadisticas'),
        api.get('/etapas/proximas')
      ]);
      
      if (isSuccessfulApiResponse<EtapaStats[]>(statsRes.data)) {
        setStats(statsRes.data.data);
      }
      if (isSuccessfulApiResponse<ProximaTransicion[]>(proximasRes.data)) {
        setProximasTransiciones(proximasRes.data.data);
      }
    } catch (error) {
      console.error('Error al cargar datos de etapas:', error);
      toastService.error('Error', 'No se pudieron cargar los datos de etapas');
    } finally {
      setLoading(false);
    }
  };

  const evaluarTransiciones = async () => {
    try {
      setEvaluating(true);
      const response = await api.get('/etapas/evaluar');
      if (isSuccessfulApiResponse<any>(response.data)) {
        setTransicionesSugeridas(response.data.data.transiciones);
        toastService.success(
          'Evaluación Completada', 
          `${response.data.data.transicionesSugeridas} transiciones sugeridas`
        );
      }
    } catch (error) {
      console.error('Error al evaluar transiciones:', error);
      toastService.error('Error', 'No se pudo completar la evaluación');
    } finally {
      setEvaluating(false);
    }
  };

  const aplicarTransicion = async () => {
    if (!selectedCuy || !nuevaEtapa) return;

    try {
      await api.post(`/etapas/transicion/${selectedCuy.id}`, {
        nuevaEtapa,
        motivo
      });

      // Si también se cambió el propósito
      if (nuevoProposito && nuevoProposito !== 'Indefinido') {
        await api.put(`/etapas/proposito/${selectedCuy.id}`, {
          proposito: nuevoProposito
        });
      }

      toastService.success('Transición Aplicada', 'La etapa se actualizó correctamente');
      setOpenDialog(false);
      fetchData();
      
      // Actualizar transiciones sugeridas
      setTransicionesSugeridas(prev => 
        prev.filter(t => t.id !== selectedCuy.id)
      );
    } catch (error) {
      console.error('Error al aplicar transición:', error);
      toastService.error('Error', 'No se pudo aplicar la transición');
    }
  };

  const abrirDialogoTransicion = (transicion: any) => {
    setSelectedCuy(transicion);
    setNuevaEtapa(transicion.etapaSugerida || '');
    setNuevoProposito('');
    setMotivo('');
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline color="primary" />
          Gestión de Etapas de Vida
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchData}
            size="small"
          >
            Actualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AutoMode />}
            onClick={evaluarTransiciones}
            disabled={evaluating}
            size="small"
          >
            {evaluating ? 'Evaluando...' : 'Evaluar Transiciones'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Estadísticas de etapas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución por Etapas
              </Typography>
              <Grid container spacing={2}>
                {stats.map((stat) => (
                  <Grid item xs={6} sm={4} key={stat.etapa}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="h6" color="primary">
                          {stat.cantidad}
                        </Typography>
                        <Chip 
                          label={stat.etapa} 
                          size="small" 
                          color={getEtapaColor(stat.etapa) as any}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Próximas transiciones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Próximas Transiciones ({proximasTransiciones.length})
              </Typography>
              {proximasTransiciones.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Sexo</TableCell>
                        <TableCell>Actual</TableCell>
                        <TableCell>Próxima</TableCell>
                        <TableCell>Días</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proximasTransiciones.slice(0, 5).map((transicion) => (
                        <TableRow key={transicion.id}>
                          <TableCell>{transicion.id}</TableCell>
                          <TableCell>{transicion.sexo}</TableCell>
                          <TableCell>
                            <Chip 
                              label={transicion.etapaActual} 
                              size="small" 
                              color={getEtapaColor(transicion.etapaActual) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transicion.proximaTransicion} 
                              size="small" 
                              variant="outlined"
                              color={getEtapaColor(transicion.proximaTransicion) as any}
                            />
                          </TableCell>
                          <TableCell>{transicion.diasParaTransicion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No hay transiciones próximas
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Transiciones sugeridas */}
        {transicionesSugeridas.length > 0 && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology color="info" />
                  Transiciones Sugeridas ({transicionesSugeridas.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Sexo</TableCell>
                        <TableCell>Edad</TableCell>
                        <TableCell>Propósito</TableCell>
                        <TableCell>Etapa Actual</TableCell>
                        <TableCell>Etapa Sugerida</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transicionesSugeridas.map((transicion) => (
                        <TableRow key={transicion.id}>
                          <TableCell>{transicion.id}</TableCell>
                          <TableCell>{transicion.sexo}</TableCell>
                          <TableCell>{transicion.edadEnMeses} meses</TableCell>
                          <TableCell>{transicion.proposito}</TableCell>
                          <TableCell>
                            <Chip 
                              label={transicion.etapaActual} 
                              size="small" 
                              color={getEtapaColor(transicion.etapaActual) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transicion.etapaSugerida} 
                              size="small" 
                              variant="outlined"
                              color={getEtapaColor(transicion.etapaSugerida) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => abrirDialogoTransicion(transicion)}
                            >
                              Aplicar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>

      {/* Dialog para aplicar transición */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aplicar Transición de Etapa</DialogTitle>
        <DialogContent>
          {selectedCuy && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" gutterBottom>
                Cuy ID: {selectedCuy.id} | Sexo: {selectedCuy.sexo} | 
                Edad: {selectedCuy.edadEnMeses} meses
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Nueva Etapa</InputLabel>
                <Select
                  value={nuevaEtapa}
                  onChange={(e) => setNuevaEtapa(e.target.value)}
                  label="Nueva Etapa"
                >
                  {etapasDisponibles.map((etapa) => (
                    <MenuItem key={etapa} value={etapa}>
                      {etapa}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Propósito (Opcional)</InputLabel>
                <Select
                  value={nuevoProposito}
                  onChange={(e) => setNuevoProposito(e.target.value)}
                  label="Propósito (Opcional)"
                >
                  {propositos.map((proposito) => (
                    <MenuItem key={proposito} value={proposito}>
                      {proposito}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Motivo (Opcional)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={aplicarTransicion} variant="contained">
            Aplicar Transición
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EtapasManagementWidget;
