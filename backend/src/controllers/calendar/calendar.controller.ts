import { Request, Response } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  generateAutomaticEvents,
  getUpcomingEvents,
  getOverdueEvents,
  completeEvent,
  getEventStats,
  validateEventConflicts,
  cleanupOldEvents,
  ReproductiveEvent,
  EventFilters
} from '../../services/calendar/events.service';

// Obtener todos los eventos
export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: EventFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      type: req.query.type as string,
      status: req.query.status as string,
      animalId: req.query.animalId ? parseInt(req.query.animalId as string) : undefined,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined
    };

    const events = await getEvents(filters);

    res.status(200).json({
      success: true,
      data: events,
      message: `${events.length} eventos encontrados`,
      timestamp: new Date()
    });
  } catch (error: unknown) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo eventos del calendario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener evento por ID
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await getEventById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event,
      message: 'Evento obtenido exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo evento',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Crear nuevo evento
export const createNewEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventData = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      userId: req.user?.id // Asumiendo que el middleware de auth agrega user al request
    };

    // Validar campos requeridos
    if (!eventData.type || !eventData.title || !eventData.startDate) {
      res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: type, title, startDate'
      });
      return;
    }

    // Validar conflictos
    const validation = await validateEventConflicts(eventData);
    
    if (validation.hasConflicts) {
      res.status(409).json({
        success: false,
        message: 'Conflicto detectado con eventos existentes',
        data: {
          conflicts: validation.conflicts,
          warnings: validation.warnings
        }
      });
      return;
    }

    const event = await createEvent(eventData);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Evento creado exitosamente',
      warnings: validation.warnings
    });
  } catch (error: unknown) {
    console.error('Error creando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando evento',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Actualizar evento
export const updateExistingEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    };

    // Validar conflictos si se están actualizando fechas o animal
    if (updates.startDate || updates.animalId) {
      const validation = await validateEventConflicts(updates, id);
      
      if (validation.hasConflicts) {
        res.status(409).json({
          success: false,
          message: 'Conflicto detectado con eventos existentes',
          data: {
            conflicts: validation.conflicts,
            warnings: validation.warnings
          }
        });
        return;
      }
    }

    const event = await updateEvent(id, updates);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event,
      message: 'Evento actualizado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando evento',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Eliminar evento
export const removeEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await deleteEvent(id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando evento',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Generar eventos automáticos
export const generateEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await generateAutomaticEvents();

    res.status(200).json({
      success: true,
      data: events,
      message: `${events.length} eventos automáticos generados exitosamente`
    });
  } catch (error: unknown) {
    console.error('Error generando eventos automáticos:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando eventos automáticos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener eventos próximos
export const getUpcoming = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const events = await getUpcomingEvents(days);

    res.status(200).json({
      success: true,
      data: events,
      message: `${events.length} eventos próximos en los próximos ${days} días`
    });
  } catch (error: unknown) {
    console.error('Error obteniendo eventos próximos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo eventos próximos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener eventos vencidos
export const getOverdue = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await getOverdueEvents();

    res.status(200).json({
      success: true,
      data: events,
      message: `${events.length} eventos vencidos encontrados`
    });
  } catch (error: unknown) {
    console.error('Error obteniendo eventos vencidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo eventos vencidos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Marcar evento como completado
export const markAsCompleted = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;

    const event = await completeEvent(id, completionNotes);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event,
      message: 'Evento marcado como completado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error completando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error completando evento',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener estadísticas de eventos
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getEventStats();

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Estadísticas de eventos obtenidas exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error obteniendo estadísticas de eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de eventos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Validar evento (verificar conflictos)
export const validateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventData = {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    };

    const excludeEventId = req.query.excludeEventId as string;
    const validation = await validateEventConflicts(eventData, excludeEventId);

    res.status(200).json({
      success: true,
      data: validation,
      message: 'Validación de evento completada'
    });
  } catch (error: unknown) {
    console.error('Error validando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando evento',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Limpiar eventos antiguos
export const cleanupEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const daysOld = req.query.daysOld ? parseInt(req.query.daysOld as string) : 90;
    const removedCount = await cleanupOldEvents(daysOld);

    res.status(200).json({
      success: true,
      data: { removedCount },
      message: `${removedCount} eventos antiguos eliminados exitosamente`
    });
  } catch (error: unknown) {
    console.error('Error limpiando eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error limpiando eventos antiguos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener eventos para vista de calendario (formato específico)
export const getCalendarView = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query;
    
    let startDate: Date;
    let endDate: Date;

    if (year && month) {
      startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
    } else {
      // Por defecto, mes actual
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const events = await getEvents({ startDate, endDate });

    // Formatear eventos para el calendario
    const calendarEvents = events.map((event: any) => {
      return {
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate || event.startDate,
        allDay: event.allDay,
        color: getEventColor(event.type, event.priority),
        extendedProps: {
          type: event.type,
          status: event.status,
          priority: event.priority,
          description: event.description,
          animalId: event.animalId,
          metadata: event.metadata
        }
      };
    });

    res.status(200).json({
      success: true,
      data: calendarEvents,
      message: `${calendarEvents.length} eventos para el calendario`
    });
  } catch (error: unknown) {
    console.error('Error obteniendo vista de calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo vista de calendario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Función auxiliar para obtener color del evento
const getEventColor = (type: string, priority: string): string => {
  const colors: Record<string, string> = {
    parto: '#f44336', // Rojo
    apareamiento: '#e91e63', // Rosa
    chequeo: '#2196f3', // Azul
    vacunacion: '#4caf50', // Verde
    destete: '#ff9800', // Naranja
    evaluacion: '#9c27b0' // Púrpura
  };

  let baseColor = colors[type] || '#757575';

  // Ajustar intensidad según prioridad
  if (priority === 'critical') {
    return baseColor;
  } else if (priority === 'high') {
    return baseColor + 'CC'; // 80% opacidad
  } else if (priority === 'medium') {
    return baseColor + '99'; // 60% opacidad
  } else {
    return baseColor + '66'; // 40% opacidad
  }
};