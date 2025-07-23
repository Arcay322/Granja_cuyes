import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../services/api';

// Variable global para evitar múltiples instancias del sistema de notificaciones
let systemNotificationInstance: string | null = null;

interface SystemNotificationConfig {
  stockCriticoThreshold: number;
  vacunacionDaysAhead: number;
  partoDaysAhead: number;
  checkInterval: number; // minutes
}

const defaultConfig: SystemNotificationConfig = {
  stockCriticoThreshold: 5, // kg
  vacunacionDaysAhead: 7, // días antes de recordar vacunación
  partoDaysAhead: 3, // días antes del parto probable
  checkInterval: 15, // revisar cada 15 minutos
};

export const useSystemNotifications = (config: SystemNotificationConfig = defaultConfig) => {
  const { addNotification, notifications, removeNotification } = useNotifications();
  const instanceId = useRef<string>(`instance-${Date.now()}-${Math.random()}`);
  const isActiveInstance = useRef<boolean>(false);

  // Función para limpiar notificaciones antiguas automáticamente
  const cleanupOldNotifications = () => {
    const now = Date.now();
    let removedCount = 0;
    
    notifications.forEach(notification => {
      const ageInHours = (now - notification.timestamp.getTime()) / (1000 * 60 * 60);
      let maxAge = 24; // 24 horas por defecto
      
      // Diferentes tiempos de vida según el tipo de notificación
      if (notification.category === 'health' && notification.title === 'Cuyes con emergencias') {
        maxAge = 6; // 6 horas para emergencias
      } else if (notification.category === 'stock') {
        maxAge = 12; // 12 horas para stock crítico
      } else if (notification.category === 'reproductive') {
        maxAge = 18; // 18 horas para próximos partos
      }
      
      if (ageInHours > maxAge) {
        console.log(`Removing old notification: ${notification.title} (${Math.round(ageInHours)} hours old)`);
        removeNotification(notification.id);
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old notifications`);
    }
  };

  // Función para verificar stock crítico
  const checkStockCritico = async () => {
    try {
      const response = await api.get('/alimentos');
      const alimentos = response.data;
      
      console.log('Checking stock crítico for alimentos:', alimentos);
      
      // Filtrar solo alimentos con stock numérico válido
      const alimentosConStockBajo = alimentos.filter((alimento: any) => {
        const stock = typeof alimento.stock === 'number' ? alimento.stock : parseFloat(alimento.stock);
        return !isNaN(stock) && stock <= config.stockCriticoThreshold;
      });
      
      console.log('Alimentos con stock bajo:', alimentosConStockBajo);
      
      alimentosConStockBajo.forEach((alimento: any) => {
        // Crear una clave única para la notificación
        const notificationKey = `stock-${alimento.id || alimento.nombre}`;
        
        // Verificar si ya existe una notificación similar reciente (últimas 8 horas)
        const existingNotification = notifications.find(n => 
          n.category === 'stock' && 
          n.title === 'Stock crítico de alimento' &&
          n.message.includes(alimento.nombre) &&
          Date.now() - n.timestamp.getTime() < 8 * 60 * 60 * 1000 // 8 horas
        );
        
        if (!existingNotification) {
          console.log('Adding stock notification for:', alimento.nombre, 'stock:', alimento.stock);
          addNotification({
            type: 'warning',
            category: 'stock',
            title: 'Stock crítico de alimento',
            message: `El alimento "${alimento.nombre}" está por debajo del nivel mínimo (${alimento.stock} restantes)`,
            priority: 'high',
            date: new Date().toISOString(),
          });
        } else {
          console.log('Stock notification already exists for:', alimento.nombre, 'expires in:', Math.round((8 * 60 * 60 * 1000 - (Date.now() - existingNotification.timestamp.getTime())) / (60 * 1000)), 'minutes');
        }
      });
      
      if (alimentosConStockBajo.length === 0) {
        console.log('No hay alimentos con stock crítico');
      }
    } catch (error) {
      console.error('Error checking stock crítico:', error);
    }
  };

  // Función para verificar vacunaciones pendientes
  const checkVacunacionesPendientes = async () => {
    try {
      const response = await api.get('/cuyes');
      const cuyes = response.data;
      
      // Obtener registros de salud para verificar vacunaciones
      const saludResponse = await api.get('/salud');
      const registrosSalud = saludResponse.data;
      
      const today = new Date();
      let cuyesSinVacunar = 0;
      
      cuyes.forEach((cuy: any) => {
        // Buscar última vacunación del cuy
        const ultimaVacunacion = registrosSalud
          .filter((registro: any) => 
            registro.cuyId === cuy.id && 
            registro.tipo === 'Vacunación'
          )
          .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
        
        // Si no tiene vacunación o la última fue hace más de 6 meses
        if (!ultimaVacunacion) {
          // Solo contar cuyes adultos (más de 3 meses)
          const fechaNacimiento = new Date(cuy.fechaNacimiento);
          const edadMeses = (today.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (edadMeses >= 3) {
            cuyesSinVacunar++;
          }
        } else {
          const fechaUltimaVacunacion = new Date(ultimaVacunacion.fecha);
          const mesesSinVacunar = (today.getTime() - fechaUltimaVacunacion.getTime()) / (1000 * 60 * 60 * 24 * 30);
          
          // Solo alertar si necesita vacunación en los próximos días configurados
          if (mesesSinVacunar >= (6 - config.vacunacionDaysAhead / 30)) {
            cuyesSinVacunar++;
          }
        }
      });
      
      if (cuyesSinVacunar > 0) {
        // Verificar si ya existe una notificación similar reciente (últimas 8 horas)
        const existingNotification = notifications.find(n => 
          n.category === 'health' && 
          n.title === 'Vacunación pendiente' &&
          Date.now() - n.timestamp.getTime() < 8 * 60 * 60 * 1000 // 8 horas
        );
        
        if (!existingNotification) {
          console.log('Adding vacunación notification for:', cuyesSinVacunar, 'cuyes');
          addNotification({
            type: 'warning',
            category: 'health',
            title: 'Vacunación pendiente',
            message: `Hay ${cuyesSinVacunar} cuyes que necesitan vacunación pronto`,
            priority: 'medium',
            date: new Date().toISOString(),
          });
        } else {
          console.log('Vacunación notification already exists, expires in:', Math.round((8 * 60 * 60 * 1000 - (Date.now() - existingNotification.timestamp.getTime())) / (60 * 1000)), 'minutes');
        }
      }
    } catch (error) {
      console.error('Error checking vacunaciones:', error);
    }
  };

  // Función para verificar cuyes enfermos
  const checkCuyesEnfermos = async () => {
    try {
      const response = await api.get('/salud');
      const registrosSalud = response.data;
      
      const today = new Date();
      const recentDate = new Date();
      recentDate.setDate(today.getDate() - 3); // últimos 3 días para ser más específico
      
      // Buscar registros de emergencia o tratamiento recientes sin resolución
      const cuyesEnfermos = registrosSalud.filter((registro: any) => {
        const fechaRegistro = new Date(registro.fecha);
        return (
          registro.tipo === 'Emergencia' &&
          fechaRegistro >= recentDate &&
          (!registro.observaciones || !registro.observaciones.toLowerCase().includes('resuelto'))
        );
      });
      
      // Agrupar por cuy para evitar notificaciones duplicadas
      const cuyesUnicos = [...new Set(cuyesEnfermos.map(r => r.cuyId))];
      
      if (cuyesUnicos.length > 0) {
        // Verificar si ya existe una notificación reciente (últimas 4 horas para emergencias)
        const existingNotification = notifications.find(n => 
          n.category === 'health' && 
          n.title === 'Cuyes con emergencias' &&
          Date.now() - n.timestamp.getTime() < 4 * 60 * 60 * 1000 // 4 horas
        );
        
        if (!existingNotification) {
          console.log('Adding cuyes enfermos notification for:', cuyesUnicos.length, 'cuyes');
          addNotification({
            type: 'error',
            category: 'health',
            title: 'Cuyes con emergencias',
            message: `${cuyesUnicos.length} cuy${cuyesUnicos.length !== 1 ? 'es' : ''} con emergencias médicas recientes`,
            priority: 'high',
            date: new Date().toISOString(),
          });
        } else {
          console.log('Cuyes enfermos notification already exists, expires in:', Math.round((4 * 60 * 60 * 1000 - (Date.now() - existingNotification.timestamp.getTime())) / (60 * 1000)), 'minutes');
        }
      }
    } catch (error) {
      console.error('Error checking cuyes enfermos:', error);
    }
  };

  // Función para verificar próximos partos
  const checkProximosPartos = async () => {
    try {
      const response = await api.get('/reproduccion/prenez');
      const preneces = response.data;
      
      const today = new Date();
      const checkDate = new Date();
      checkDate.setDate(today.getDate() + config.partoDaysAhead);
      
      const proximosPartos = preneces.filter((prenez: any) => {
        if (prenez.estado !== 'activa') return false;
        
        const fechaParto = new Date(prenez.fechaEstimadaParto);
        return fechaParto <= checkDate && fechaParto >= today;
      });
      
      proximosPartos.forEach((prenez: any) => {
        // Verificar si ya existe una notificación para esta preñez (últimas 12 horas)
        const existingNotification = notifications.find(n => 
          n.category === 'reproductive' && 
          n.title === 'Próximo parto' &&
          n.message.includes(`madre #${prenez.madreId}`) &&
          Date.now() - n.timestamp.getTime() < 12 * 60 * 60 * 1000 // 12 horas
        );
        
        if (!existingNotification) {
          const fechaParto = new Date(prenez.fechaEstimadaParto);
          const diasRestantes = Math.ceil((fechaParto.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log('Adding parto notification for madre:', prenez.madreId);
          addNotification({
            type: 'info',
            category: 'reproductive',
            title: 'Próximo parto',
            message: `La madre #${prenez.madreId} tiene parto previsto en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
            priority: 'medium',
            date: new Date().toISOString(),
          });
        } else {
          console.log('Parto notification already exists for madre:', prenez.madreId, 'expires in:', Math.round((12 * 60 * 60 * 1000 - (Date.now() - existingNotification.timestamp.getTime())) / (60 * 1000)), 'minutes');
        }
      });
    } catch (error) {
      console.error('Error checking próximos partos:', error);
    }
  };

  // Función principal que ejecuta todas las verificaciones
  const checkSystemNotifications = async () => {
    console.log('=== INICIANDO VERIFICACIÓN DE NOTIFICACIONES DEL SISTEMA ===');
    console.log('Configuración:', config);
    console.log('Notificaciones existentes antes:', notifications.length);
    
    try {
      // Limpiar notificaciones antiguas primero
      cleanupOldNotifications();
      
      // Ejecutar las verificaciones secuencialmente para evitar race conditions
      await checkStockCritico();
      await new Promise(resolve => setTimeout(resolve, 100)); // pequeña pausa entre verificaciones
      await checkVacunacionesPendientes();
      await new Promise(resolve => setTimeout(resolve, 100));
      await checkCuyesEnfermos();
      await new Promise(resolve => setTimeout(resolve, 100));
      await checkProximosPartos();
      
      console.log('=== VERIFICACIÓN COMPLETADA ===');
      console.log('Notificaciones existentes después:', notifications.length);
    } catch (error) {
      console.error('Error en verificación de notificaciones:', error);
    }
  };

  // Efecto para ejecutar verificaciones periódicamente
  useEffect(() => {
    // Solo permitir una instancia activa del sistema de notificaciones
    if (systemNotificationInstance && systemNotificationInstance !== instanceId.current) {
      console.log(`Instance ${instanceId.current} skipped - another instance ${systemNotificationInstance} is already active`);
      return;
    }

    if (!systemNotificationInstance) {
      systemNotificationInstance = instanceId.current;
      isActiveInstance.current = true;
      console.log(`Instance ${instanceId.current} is now the active notification system`);
    }

    let initialCleanupDone = false;
    let interval: NodeJS.Timeout | null = null;
    
    // LIMPIAR TODAS LAS NOTIFICACIONES AL INICIO para eliminar datos de prueba
    const cleanupAndStart = async () => {
      if (initialCleanupDone || !isActiveInstance.current) return;
      
      console.log('Limpiando todas las notificaciones existentes...');
      notifications.forEach(n => {
        removeNotification(n.id);
      });
      
      // Esperar a que se limpien las notificaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Running initial system notifications check...');
      await checkSystemNotifications();
      
      initialCleanupDone = true;
      
      // Configurar intervalo para verificaciones periódicas SOLO después del cleanup inicial
      if (isActiveInstance.current) {
        interval = setInterval(checkSystemNotifications, config.checkInterval * 60 * 1000);
      }
    };
    
    cleanupAndStart();
    
    // Exponer funciones globalmente para testing (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      (window as any).checkNotifications = checkSystemNotifications;
      (window as any).cleanupOldNotifications = cleanupOldNotifications;
      (window as any).clearAllNotifications = () => {
        notifications.forEach(n => removeNotification(n.id));
        console.log('All notifications cleared manually');
      };
      (window as any).showNotificationStats = () => {
        console.log('=== NOTIFICATION STATISTICS ===');
        console.log('Total notifications:', notifications.length);
        console.log('By category:', notifications.reduce((acc, n) => {
          const category = n.category || 'unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));
        console.log('By age:');
        const now = Date.now();
        notifications.forEach(n => {
          const ageInHours = Math.round((now - n.timestamp.getTime()) / (1000 * 60 * 60));
          console.log(`- ${n.title}: ${ageInHours} hours old`);
        });
      };
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      
      // Limpiar la instancia global solo si somos la instancia activa
      if (systemNotificationInstance === instanceId.current) {
        systemNotificationInstance = null;
        isActiveInstance.current = false;
        console.log(`Instance ${instanceId.current} cleaned up and released singleton`);
      }
    };
  }, []); // Sin dependencias para evitar loops

  return {
    checkSystemNotifications,
    config,
  };
};
