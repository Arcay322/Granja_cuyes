import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as prenezService from '../../services/reproduccion/prenez.service';

const prisma = new PrismaClient();

// Obtener todas las preñeces con paginación y filtros
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      estado, 
      search,
      fechaDesde,
      fechaHasta,
      galpon,
      jaula
    } = req.query;
    
    // Construir filtros
    const filters: Record<string, any> = {};
    if (estado && typeof estado === 'string') filters.estado = estado;
    if (search && typeof search === 'string') filters.search = search;
    if (fechaDesde && typeof fechaDesde === 'string') filters.fechaDesde = fechaDesde;
    if (fechaHasta && typeof fechaHasta === 'string') filters.fechaHasta = fechaHasta;
    if (galpon && typeof galpon === 'string') filters.galpon = galpon;
    if (jaula && typeof jaula === 'string') filters.jaula = jaula;
    
    // Configurar paginación
    const pagination = {
      page: Math.max(1, Number(page)),
      limit: Math.min(100, Math.max(1, Number(limit)))
    };
    
    const result = await prenezService.getAllPaginated(filters, pagination);
    
    res.status(200).json({
      success: true,
      data: result.preneces,
      pagination: result.pagination,
      filters: filters,
      message: `${result.pagination.total} preñeces encontradas`
    });
  } catch (error: any) {
    console.error('Error al obtener preñeces:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener preñeces', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener preñeces activas
export const getActivas = async (req: Request, res: Response): Promise<void> => {
  try {
    const preneces = await prenezService.getActivas();
    res.status(200).json({
      success: true,
      data: preneces,
      message: `${preneces.length} preñeces activas encontradas`
    });
  } catch (error: any) {
    console.error('Error al obtener preñeces activas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener preñeces activas', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener preñez por ID
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de preñez inválido'
      });
      return;
    }

    const prenez = await prenezService.getById(id);
    if (!prenez) {
      res.status(404).json({
        success: false,
        message: 'Preñez no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: prenez,
      message: 'Preñez obtenida exitosamente'
    });
  } catch (error: any) {
    console.error('Error al obtener preñez:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener preñez', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Crear nueva preñez
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    
    // Validar campos requeridos
    if (!data.madreId || !data.fechaPrenez) {
      res.status(400).json({ 
        success: false,
        message: 'Datos incompletos para registro de preñez. Se requiere madreId y fechaPrenez' 
      });
      return;
    }

    // Convertir fechas a formato ISO correcto
    const fechaPrenez = new Date(data.fechaPrenez + 'T00:00:00.000Z');
    
    // Calcular fecha probable de parto si no se proporciona
    let fechaProbableParto: Date;
    if (data.fechaProbableParto) {
      fechaProbableParto = new Date(data.fechaProbableParto + 'T00:00:00.000Z');
    } else {
      // Aproximadamente 70 días después de la fecha de preñez
      fechaProbableParto = new Date(fechaPrenez);
      fechaProbableParto.setDate(fechaProbableParto.getDate() + 70);
    }

    // Preparar datos para crear preñez
    const prenezData = {
      madreId: Number(data.madreId),
      padreId: data.padreId ? Number(data.padreId) : null,
      fechaPrenez,
      fechaProbableParto,
      notas: data.notas || null,
      estado: data.estado || 'activa',
      fechaCompletada: null
    };

    const prenez = await prenezService.create(prenezData);
    res.status(201).json({
      success: true,
      data: prenez,
      message: 'Preñez registrada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al crear preñez:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear preñez', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Actualizar preñez
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de preñez inválido'
      });
      return;
    }

    const data = req.body;
    
    // Convertir fechas a formato ISO correcto si están presentes
    const updateData: any = { ...data };
    
    if (data.fechaPrenez) {
      updateData.fechaPrenez = new Date(data.fechaPrenez + 'T00:00:00.000Z');
    }
    
    if (data.fechaProbableParto) {
      updateData.fechaProbableParto = new Date(data.fechaProbableParto + 'T00:00:00.000Z');
    } else if (data.fechaPrenez) {
      // Recalcular fecha probable de parto si se actualiza la fecha de preñez
      const fechaPrenez = new Date(data.fechaPrenez + 'T00:00:00.000Z');
      const fechaProbableParto = new Date(fechaPrenez);
      fechaProbableParto.setDate(fechaProbableParto.getDate() + 70);
      updateData.fechaProbableParto = fechaProbableParto;
    }

    // Convertir IDs a números si están presentes
    if (data.madreId) updateData.madreId = Number(data.madreId);
    if (data.padreId) updateData.padreId = Number(data.padreId);

    const prenez = await prenezService.update(id, updateData);
    res.status(200).json({
      success: true,
      data: prenez,
      message: 'Preñez actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar preñez:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar preñez', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Eliminar preñez
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de preñez inválido'
      });
      return;
    }

    await prenezService.remove(id);
    res.status(200).json({
      success: true,
      message: 'Preñez eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar preñez:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar preñez', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Marcar preñez como completada
export const completar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de preñez inválido'
      });
      return;
    }

    const { camadaId } = req.body;
    if (!camadaId) {
      res.status(400).json({ 
        success: false,
        message: 'Se requiere ID de camada para completar la preñez' 
      });
      return;
    }
    
    const prenez = await prenezService.completarPrenez(id, camadaId);
    res.status(200).json({
      success: true,
      data: prenez,
      message: 'Preñez completada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al completar preñez:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al completar preñez', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Marcar preñez como fallida
export const marcarFallida = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de preñez inválido'
      });
      return;
    }

    const prenez = await prenezService.marcarComoFallida(id);
    res.status(200).json({
      success: true,
      data: prenez,
      message: 'Preñez marcada como fallida exitosamente'
    });
  } catch (error: any) {
    console.error('Error al marcar preñez como fallida:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al marcar preñez como fallida', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener próximos partos
export const getProximosPartos = async (req: Request, res: Response): Promise<void> => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias as string) : 15;
    if (isNaN(dias) || dias < 1) {
      res.status(400).json({
        success: false,
        message: 'El parámetro días debe ser un número positivo'
      });
      return;
    }

    const proximosPartos = await prenezService.getProximosPartos(dias);
    res.status(200).json({
      success: true,
      data: proximosPartos,
      message: `${proximosPartos.length} próximos partos en los próximos ${dias} días`
    });
  } catch (error: any) {
    console.error('Error al obtener próximos partos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener próximos partos', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener estadísticas de reproducción
export const getEstadisticas = async (req: Request, res: Response): Promise<void> => {
  try {
    const estadisticas = await prenezService.getEstadisticasReproduccion();
    res.status(200).json({
      success: true,
      data: estadisticas,
      message: 'Estadísticas de reproducción obtenidas exitosamente'
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas de reproducción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener estadísticas de reproducción', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener estadísticas avanzadas de reproducción
export const getEstadisticasAvanzadas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { periodo = '30' } = req.query;
    const periodoNum = parseInt(periodo as string);
    
    if (isNaN(periodoNum) || periodoNum < 1) {
      res.status(400).json({
        success: false,
        message: 'El parámetro periodo debe ser un número positivo'
      });
      return;
    }

    const estadisticas = await prenezService.getEstadisticasAvanzadas(periodoNum);
    res.status(200).json({
      success: true,
      data: estadisticas,
      message: 'Estadísticas avanzadas de reproducción obtenidas exitosamente'
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas avanzadas de reproducción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener estadísticas avanzadas de reproducción', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener alertas de reproducción
export const getAlertas = async (req: Request, res: Response): Promise<void> => {
  try {
    // Próximos partos (próximos 7 días)
    const proximosPartos = await prenezService.getProximosPartos(7);
    
    // Preñeces vencidas (más de 75 días)
    const prenecesVencidas = await prenezService.getAll();
    const vencidas = prenecesVencidas.filter(p => {
      if (p.estado !== 'activa') return false;
      const diasGestacion = Math.floor((new Date().getTime() - new Date(p.fechaPrenez).getTime()) / (1000 * 60 * 60 * 24));
      return diasGestacion > 75;
    });

    // Reproductoras inactivas (sin preñez en los últimos 90 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 90);
    
    const reproductoras = await prisma.cuy.findMany({
      where: {
        sexo: 'H',
        etapaVida: 'Reproductora',
        estado: 'Activo'
      }
    });

    // Obtener preñeces recientes para cada reproductora
    const reproductorasConPreneces = await Promise.all(
      reproductoras.map(async (r) => {
        const prenecesRecientes = await prisma.prenez.count({
          where: {
            madreId: r.id,
            fechaPrenez: {
              gte: fechaLimite
            }
          }
        });
        return { ...r, prenecesRecientes };
      })
    );

    const reproductorasInactivas = reproductorasConPreneces.filter((r: any) => r.prenecesRecientes === 0);

    res.status(200).json({
      success: true,
      data: {
        proximosPartos: proximosPartos.length,
        prenecesVencidas: vencidas.length,
        reproductorasInactivas: reproductorasInactivas.length,
        detalles: {
          proximosPartos,
          prenecesVencidas: vencidas,
          reproductorasInactivas: reproductorasInactivas.map(r => ({
            id: r.id,
            galpon: r.galpon,
            jaula: r.jaula,
            raza: r.raza
          }))
        }
      },
      message: 'Alertas de reproducción obtenidas exitosamente'
    });
  } catch (error: any) {
    console.error('Error al obtener alertas de reproducción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener alertas de reproducción', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener alertas específicas de reproducción
export const getAlertasEspecificas = async (req: Request, res: Response): Promise<void> => {
  try {
    const alertas = await prenezService.getAlertasEspecificas();
    res.status(200).json({
      success: true,
      data: alertas,
      message: `${alertas.resumen.total} alertas de reproducción encontradas`
    });
  } catch (error: any) {
    console.error('Error al obtener alertas específicas de reproducción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener alertas específicas de reproducción', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// ===== CONTROLADORES PARA SELECCIÓN DE REPRODUCTORES =====

// Obtener madres disponibles para reproducción
export const getMadresDisponibles = async (req: Request, res: Response): Promise<void> => {
  try {
    const madres = await prenezService.getMadresDisponibles();
    res.status(200).json({
      success: true,
      data: madres,
      message: `${madres.length} madres disponibles para reproducción`
    });
  } catch (error: any) {
    console.error('Error al obtener madres disponibles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener madres disponibles', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener padres disponibles para reproducción
export const getPadresDisponibles = async (req: Request, res: Response): Promise<void> => {
  try {
    const padres = await prenezService.getPadresDisponibles();
    res.status(200).json({
      success: true,
      data: padres,
      message: `${padres.length} padres disponibles para reproducción`
    });
  } catch (error: any) {
    console.error('Error al obtener padres disponibles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener padres disponibles', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Validar período de gestación para registro de camada
export const validarGestacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { madreId, fechaRegistroCamada } = req.body;
    
    if (!madreId || !fechaRegistroCamada) {
      res.status(400).json({
        success: false,
        message: 'Se requiere madreId y fechaRegistroCamada para validar gestación'
      });
      return;
    }

    const validacion = await prenezService.validarPeriodoGestacion(
      Number(madreId), 
      fechaRegistroCamada
    );
    
    res.status(200).json({
      success: true,
      data: validacion,
      message: 'Validación de gestación completada'
    });
  } catch (error: any) {
    console.error('Error al validar período de gestación:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al validar período de gestación', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener madres elegibles para registro de camada
export const getMadresElegiblesCamada = async (req: Request, res: Response): Promise<void> => {
  try {
    const madres = await prenezService.getMadresElegiblesCamada();
    res.status(200).json({
      success: true,
      data: madres,
      message: `${madres.length} madres elegibles para registro de camada`
    });
  } catch (error: any) {
    console.error('Error al obtener madres elegibles para camada:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener madres elegibles para camada', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// ===== CONTROLADORES PARA SISTEMA DE COMPATIBILIDAD =====

// Calcular compatibilidad reproductiva entre dos reproductores
export const calcularCompatibilidad = async (req: Request, res: Response): Promise<void> => {
  try {
    const { madreId, padreId } = req.body;
    
    if (!madreId || !padreId) {
      res.status(400).json({
        success: false,
        message: 'Se requiere madreId y padreId para calcular compatibilidad'
      });
      return;
    }

    const compatibilidad = await prenezService.calcularCompatibilidadReproductiva(
      Number(madreId), 
      Number(padreId)
    );
    
    res.status(200).json({
      success: true,
      data: compatibilidad,
      message: 'Compatibilidad reproductiva calculada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al calcular compatibilidad reproductiva:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al calcular compatibilidad reproductiva', 
      error: error?.message || 'Error desconocido'
    });
  }
};

// Obtener recomendaciones de parejas reproductivas
export const getRecomendaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { madreId, padreId } = req.query;
    
    const recomendaciones = await prenezService.getRecomendacionesReproductivas(
      madreId ? Number(madreId) : undefined,
      padreId ? Number(padreId) : undefined
    );
    
    res.status(200).json({
      success: true,
      data: recomendaciones,
      message: `${recomendaciones.recomendaciones.length} recomendaciones reproductivas encontradas`
    });
  } catch (error: any) {
    console.error('Error al obtener recomendaciones reproductivas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener recomendaciones reproductivas', 
      error: error?.message || 'Error desconocido'
    });
  }
};