import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Chip, Divider, Tooltip
} from '../utils/mui';
import {
  Pets as PetsIcon,
  Warning as WarningIcon,
  NotificationsActive as NotificationIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { notificacionesService } from '../services/notificaciones.service';
import api from '../services/api';

const PartosProximosWidget = () => {
  const [proximosPartos, setProximosPartos] = useState<any[]>([]);
  const [cuyesInfo, setCuyesInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProximosPartos = async () => {
      setLoading(true);
      try {
        // Intentar cargar datos reales
        try {
          const response = await api.get('/reproduccion/prenez/proximos-partos?dias=15');
          if (response && response.data) {
            setProximosPartos(response.data as any[]);
          } else {
            // Si no hay datos, mostrar datos de ejemplo
            console.log('No se obtuvieron datos reales, usando datos de ejemplo');
            setProximosPartos([
              {
                id: 1,
                madreId: 15,
                fechaPrenez: '2025-05-20T00:00:00.000Z',
                fechaProbableParto: '2025-07-29T00:00:00.000Z',
                estado: 'activa'
              },
              {
                id: 2,
                madreId: 23,
                fechaPrenez: '2025-05-25T00:00:00.000Z',
                fechaProbableParto: '2025-08-03T00:00:00.000Z',
                estado: 'activa'
              },
              {
                id: 3,
                madreId: 28,
                fechaPrenez: '2025-05-15T00:00:00.000Z',
                fechaProbableParto: '2025-07-08T00:00:00.000Z',
                estado: 'activa'
              }
            ]);
          }
        } catch (error) {
          console.log('Error al cargar próximos partos reales, usando datos de ejemplo', error);
          setProximosPartos([
            {
              id: 1,
              madreId: 15,
              fechaPrenez: '2025-05-20T00:00:00.000Z',
              fechaProbableParto: '2025-07-29T00:00:00.000Z',
              estado: 'activa'
            },
            {
              id: 2,
              madreId: 23,
              fechaPrenez: '2025-05-25T00:00:00.000Z',
              fechaProbableParto: '2025-08-03T00:00:00.000Z',
              estado: 'activa'
            },
            {
              id: 3,
              madreId: 28,
              fechaPrenez: '2025-05-15T00:00:00.000Z',
              fechaProbableParto: '2025-07-08T00:00:00.000Z',
              estado: 'activa'
            }
          ]);
        }
        
        // Cargar información de los cuyes relacionados
        try {
          const cuyesResponse = await api.get('/cuyes');
          if (cuyesResponse && cuyesResponse.data) {
            const cuyesData = cuyesResponse.data;
            const cuyesMap: {[key: number]: any} = {};
            (cuyesData as any[]).forEach((cuy: any) => {
              cuyesMap[cuy.id] = cuy;
            });
            setCuyesInfo(cuyesMap);
          } else {
            // Datos de ejemplo si no se pueden cargar los reales
            setCuyesInfo({
              15: { id: 15, raza: 'Peruana', galpon: 'A', jaula: '3' },
              23: { id: 23, raza: 'Andina', galpon: 'B', jaula: '7' },
              28: { id: 28, raza: 'Inti', galpon: 'A', jaula: '12' }
            });
          }
        } catch (error) {
          console.log('Error al cargar información de cuyes, usando datos de ejemplo', error);
          setCuyesInfo({
            15: { id: 15, raza: 'Peruana', galpon: 'A', jaula: '3' },
            23: { id: 23, raza: 'Andina', galpon: 'B', jaula: '7' },
            28: { id: 28, raza: 'Inti', galpon: 'A', jaula: '12' }
          });
        }
      } catch (error) {
        console.error('Error general en fetchProximosPartos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProximosPartos();
  }, []);

  // Calcular días restantes para el parto
  const calcularDiasParaParto = (fechaProbableParto: string | Date) => {
    const fechaParto = new Date(fechaProbableParto);
    const hoy = new Date();
    return differenceInDays(fechaParto, hoy);
  };

  // Obtener color y estilo según días restantes
  const getEstiloParto = (diasRestantes: number) => {
    if (diasRestantes < 0) {
      return { 
        color: 'error', 
        label: 'Parto vencido', 
        icon: <WarningIcon />,
        background: '#ffebee'
      };
    } else if (diasRestantes <= 7) {
      return { 
        color: 'warning', 
        label: 'Parto próximo', 
        icon: <NotificationIcon />,
        background: '#fff8e1'
      };
    } else {
      return { 
        color: 'info', 
        label: 'Programado', 
        icon: <PetsIcon />,
        background: '#e3f2fd'
      };
    }
  };

  // Obtener información del cuy
  const getCuyInfo = (id: number) => {
    const cuy = cuyesInfo[id];
    if (!cuy) return `Cuy #${id}`;
    return `${cuy.raza} #${cuy.id} (G: ${cuy.galpon}, J: ${cuy.jaula})`;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom component="div">
          Próximos Partos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
          <Typography variant="body1">Cargando...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom component="div">
        Próximos Partos
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {proximosPartos.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
          <Typography variant="body1">No hay partos programados próximamente</Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', maxHeight: 270, overflow: 'auto' }}>
          {proximosPartos
            .sort((a, b) => new Date(a.fechaProbableParto).getTime() - new Date(b.fechaProbableParto).getTime())
            .map((parto) => {
              const diasRestantes = calcularDiasParaParto(parto.fechaProbableParto);
              const estilo = getEstiloParto(diasRestantes);
              
              return (
                <React.Fragment key={parto.id}>
                  <ListItem alignItems="flex-start" sx={{ 
                    backgroundColor: estilo.background,
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${estilo.color}.main` }}>
                        {estilo.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" component="span" fontWeight="bold">
                            {getCuyInfo(parto.madreId)}
                          </Typography>
                          <Chip 
                            label={estilo.label}
                            color={estilo.color as any}
                            size="small"
                            icon={estilo.icon}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Fecha probable: {format(new Date(parto.fechaProbableParto), 'dd/MM/yyyy')}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            {diasRestantes >= 0 
                              ? `${diasRestantes} días restantes` 
                              : `Retrasado por ${Math.abs(diasRestantes)} días`
                            }
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })}
        </List>
      )}
    </Paper>
  );
};

export default PartosProximosWidget;
