import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Card, CardContent, Typography, Chip, Box, Avatar, Grid, IconButton,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Stack,
  Divider, Alert, CircularProgress, Tooltip
} from '../utils/mui';
import {
  Search, FilterList, Female, Male, Scale, LocationOn, History,
  TrendingUp, CheckCircle, Warning, Info, Close
} from '@mui/icons-material';

interface MotherSelectionData {
  id: number;
  raza: string;
  sexo: string;
  galpon: string;
  jaula: string;
  etapaVida: string;
  peso: number;
  fechaNacimiento: string;
  edad: number;
  estadoReproductivo: 'Disponible' | 'Preñada' | 'Lactando' | 'Descanso';
  estaDisponible: boolean;
  historialReproductivo: {
    totalPreneces: number;
    prenecesExitosas: number;
    promedioLitada: number;
    ultimaPrenez?: string;
    tasaExito: number;
  };
  salud: {
    estado: string;
    pesoOptimo: boolean;
  };
}

interface FatherSelectionData {
  id: number;
  raza: string;
  sexo: string;
  galpon: string;
  jaula: string;
  etapaVida: string;
  peso: number;
  fechaNacimiento: string;
  edad: number;
  estaDisponible: boolean;
  rendimientoReproductivo: {
    totalCruces: number;
    tasaExito: number;
    promedioDescendencia: number;
    ultimoCruce?: string;
    frecuenciaCruce: number;
  };
  genetica: {
    linaje: string;
    diversidadGenetica: number;
  };
  salud: {
    estado: string;
    pesoOptimo: boolean;
  };
}

interface ReproductorSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (reproductorId: number) => void;
  type: 'madre' | 'padre';
  title: string;
  madres?: MotherSelectionData[];
  padres?: FatherSelectionData[];
  loading?: boolean;
}

const ReproductorSelectionDialog: React.FC<ReproductorSelectionDialogProps> = ({
  open,
  onClose,
  onSelect,
  type,
  title,
  madres = [],
  padres = [],
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRaza, setFilterRaza] = useState('');
  const [filterGalpon, setFilterGalpon] = useState('');
  const [sortBy, setSortBy] = useState<'edad' | 'rendimiento' | 'ubicacion'>('rendimiento');
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [selectedForCompatibility, setSelectedForCompatibility] = useState<number | null>(null);

  const reproductores = type === 'madre' ? madres : padres;

  // Filtrar y ordenar reproductores
  const filteredReproductores = reproductores
    .filter(r => {
      const matchesSearch = !searchTerm || 
        r.id.toString().includes(searchTerm) ||
        r.raza.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${r.galpon}-${r.jaula}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRaza = !filterRaza || r.raza === filterRaza;
      const matchesGalpon = !filterGalpon || r.galpon === filterGalpon;
      
      return matchesSearch && matchesRaza && matchesGalpon;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'edad':
          return a.edad - b.edad;
        case 'rendimiento':
          if (type === 'madre') {
            const madreA = a as MotherSelectionData;
            const madreB = b as MotherSelectionData;
            return madreB.historialReproductivo.tasaExito - madreA.historialReproductivo.tasaExito;
          } else {
            const padreA = a as FatherSelectionData;
            const padreB = b as FatherSelectionData;
            return padreB.rendimientoReproductivo.tasaExito - padreA.rendimientoReproductivo.tasaExito;
          }
        case 'ubicacion':
          return `${a.galpon}-${a.jaula}`.localeCompare(`${b.galpon}-${b.jaula}`);
        default:
          return 0;
      }
    });

  // Obtener opciones únicas para filtros
  const razasUnicas = [...new Set(reproductores.map(r => r.raza))];
  const galponesUnicos = [...new Set(reproductores.map(r => r.galpon))];

  const handleSelect = (reproductorId: number) => {
    onSelect(reproductorId);
    onClose();
  };

  const renderMotherCard = (madre: MotherSelectionData) => (
    <Card 
      key={madre.id}
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        },
        border: madre.estaDisponible ? '2px solid transparent' : '2px solid #f44336',
        opacity: madre.estaDisponible ? 1 : 0.7
      }}
      onClick={() => madre.estaDisponible && handleSelect(madre.id)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#e91e63', width: 40, height: 40 }}>
              <Female />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                ID: {madre.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {madre.raza} • {madre.etapaVida}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={madre.estadoReproductivo}
            color={madre.estaDisponible ? 'success' : 'error'}
            size="small"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2">
                {madre.galpon}-{madre.jaula}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Scale fontSize="small" color="action" />
              <Typography variant="body2">
                {madre.peso} kg
                {madre.salud.pesoOptimo && (
                  <CheckCircle fontSize="small" color="success" sx={{ ml: 0.5 }} />
                )}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Edad: {madre.edad} meses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estado: {madre.salud.estado}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <History fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Historial Reproductivo
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" align="center">
                <strong>{madre.historialReproductivo.totalPreneces}</strong>
                <br />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Preñeces</span>
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" align="center">
                <strong>{madre.historialReproductivo.tasaExito}%</strong>
                <br />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Éxito</span>
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" align="center">
                <strong>{madre.historialReproductivo.promedioLitada}</strong>
                <br />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Prom. Crías</span>
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {!madre.estaDisponible && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No disponible: {madre.estadoReproductivo}
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderFatherCard = (padre: FatherSelectionData) => (
    <Card 
      key={padre.id}
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        },
        border: padre.estaDisponible ? '2px solid transparent' : '2px solid #f44336',
        opacity: padre.estaDisponible ? 1 : 0.7
      }}
      onClick={() => padre.estaDisponible && handleSelect(padre.id)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#2196f3', width: 40, height: 40 }}>
              <Male />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                ID: {padre.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {padre.raza} • {padre.etapaVida}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={padre.estaDisponible ? 'Disponible' : 'No Disponible'}
            color={padre.estaDisponible ? 'success' : 'error'}
            size="small"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2">
                {padre.galpon}-{padre.jaula}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Scale fontSize="small" color="action" />
              <Typography variant="body2">
                {padre.peso} kg
                {padre.salud.pesoOptimo && (
                  <CheckCircle fontSize="small" color="success" sx={{ ml: 0.5 }} />
                )}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Edad: {padre.edad} meses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estado: {padre.salud.estado}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <TrendingUp fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Rendimiento Reproductivo
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" align="center">
                <strong>{padre.rendimientoReproductivo.totalCruces}</strong>
                <br />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Cruces</span>
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" align="center">
                <strong>{padre.rendimientoReproductivo.tasaExito}%</strong>
                <br />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Éxito</span>
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" align="center">
                <strong>{padre.rendimientoReproductivo.promedioDescendencia}</strong>
                <br />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Prom. Crías</span>
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Información Genética
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Linaje: {padre.genetica.linaje}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Diversidad: {padre.genetica.diversidadGenetica}%
          </Typography>
        </Box>

        {!padre.estaDisponible && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No disponible para reproducción
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Filtros y búsqueda */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por ID, raza o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Raza</InputLabel>
                <Select
                  value={filterRaza}
                  onChange={(e) => setFilterRaza(e.target.value)}
                  label="Raza"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {razasUnicas.map(raza => (
                    <MenuItem key={raza} value={raza}>{raza}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Galpón</InputLabel>
                <Select
                  value={filterGalpon}
                  onChange={(e) => setFilterGalpon(e.target.value)}
                  label="Galpón"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {galponesUnicos.map(galpon => (
                    <MenuItem key={galpon} value={galpon}>{galpon}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  label="Ordenar por"
                >
                  <MenuItem value="rendimiento">Rendimiento</MenuItem>
                  <MenuItem value="edad">Edad</MenuItem>
                  <MenuItem value="ubicacion">Ubicación</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredReproductores.length} disponibles
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Lista de reproductores */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredReproductores.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">
                  No se encontraron {type === 'madre' ? 'madres' : 'padres'} disponibles con los filtros aplicados.
                </Alert>
              </Grid>
            ) : (
              filteredReproductores.map(reproductor => (
                <Grid item xs={12} md={6} lg={4} key={reproductor.id}>
                  {type === 'madre' 
                    ? renderMotherCard(reproductor as MotherSelectionData)
                    : renderFatherCard(reproductor as FatherSelectionData)
                  }
                </Grid>
              ))
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReproductorSelectionDialog;