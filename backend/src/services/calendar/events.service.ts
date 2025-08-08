import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReproductiveEvent {
  id: string;
  type: 'parto' | 'apareamiento' | 'chequeo' | 'vacunacion' | 'destete' | 'evaluacion';
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  animalId?: number;
  prenezId?: number;
  camadaId?: number;
  status: 'programado' | 'completado' | 'cancelado' | 'vencido';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reminders: EventReminder[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  userId?: number;
}

export interface EventReminder {
  id: string;
  eventId: string;
  type: 'notification' | 'email' | 'sms';
  minutesBefore: number;
  sent: boolean;
  sentAt?: Date;
}

export interface EventFilters {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  status?: string;
  animalId?: number;
  userId?: number;
}

// Simulación de almacenamiento en memoria (en producción usar base de datos)
let events: ReproductiveEvent[] = [];
let reminders: EventReminder[] = [];
let eventIdCounter = 1;
let reminderIdCounter = 1;

// Generar ID único para eventos
const generateEventId = (): string => {
  return `event_${eventIdCounter++}_${Date.now()}`;
};

// Generar ID único para recordatorios
const generateReminderId = (): string => {
  return `reminder_${reminderIdCounter++}_${Date.now()}`;
};

// Crear nuevo evento
export const createEvent = async (eventData: Omit<ReproductiveEvent, 'id' | 'createdAt' | 'updatedAt' | 'reminders'>): Promise<ReproductiveEvent> => {
  const event: ReproductiveEvent = {
    ...eventData,
    id: generateEventId(),
    reminders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  events.push(event);
  
  console.log(`📅 Nuevo evento creado: ${event.type} - ${event.title}`);
  
  return event;
};

// Obtener todos los eventos con filtros
export const getEvents = async (filters: EventFilters = {}): Promise<unknown[]> => {
  let filteredEvents = [...events];

  if (filters.startDate && filters.endDate) {
    filteredEvents = filteredEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      
      return (eventStart >= filters.startDate! && eventStart <= filters.endDate!) ||
             (eventEnd >= filters.startDate! && eventEnd <= filters.endDate!) ||
             (eventStart <= filters.startDate! && eventEnd >= filters.endDate!);
    });
  }

  if (filters.type) {
    filteredEvents = filteredEvents.filter(event => event.type === filters.type);
  }

  if (filters.status) {
    filteredEvents = filteredEvents.filter(event => event.status === filters.status);
  }

  if (filters.animalId) {
    filteredEvents = filteredEvents.filter(event => event.animalId === filters.animalId);
  }

  if (filters.userId) {
    filteredEvents = filteredEvents.filter(event => event.userId === filters.userId);
  }

  // Convertir fechas a strings para el frontend
  const eventsForFrontend = filteredEvents.map(event => ({
    ...event,
    date: event.startDate.toISOString().split('T')[0], // Formato YYYY-MM-DD para compatibilidad
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  }));

  return eventsForFrontend.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

// Obtener evento por ID
export const getEventById = async (id: string): Promise<ReproductiveEvent | null> => {
  return events.find(event => event.id === id) || null;
};

// Actualizar evento
export const updateEvent = async (id: string, updates: Partial<ReproductiveEvent>): Promise<ReproductiveEvent | null> => {
  const eventIndex = events.findIndex(event => event.id === id);
  
  if (eventIndex === -1) {
    return null;
  }

  events[eventIndex] = {
    ...events[eventIndex],
    ...updates,
    updatedAt: new Date()
  };

  console.log(`📅 Evento actualizado: ${events[eventIndex].type} - ${events[eventIndex].title}`);
  
  return events[eventIndex];
};

// Eliminar evento
export const deleteEvent = async (id: string): Promise<boolean> => {
  const eventIndex = events.findIndex(event => event.id === id);
  
  if (eventIndex === -1) {
    return false;
  }

  // Eliminar recordatorios asociados
  reminders = reminders.filter(reminder => reminder.eventId !== id);
  
  events.splice(eventIndex, 1);
  
  console.log(`📅 Evento eliminado: ${id}`);
  
  return true;
};

// Generar eventos automáticos basados en datos de reproducción
export const generateAutomaticEvents = async (): Promise<ReproductiveEvent[]> => {
  const generatedEvents: ReproductiveEvent[] = [];

  try {
    // Generar eventos de partos programados
    const activePregnancies = await prisma.prenez.findMany({
      where: {
        estado: 'activa'
      }
    });

    for (const prenez of activePregnancies) {
      // Verificar si ya existe un evento para este parto
      const existingEvent = events.find(event => 
        event.type === 'parto' && 
        event.prenezId === prenez.id &&
        event.status !== 'cancelado'
      );

      if (!existingEvent) {
        const event = await createEvent({
          type: 'parto',
          title: `Parto programado - Hembra ID ${prenez.madreId}`,
          description: `Parto esperado de la hembra ID ${prenez.madreId}`,
          startDate: prenez.fechaProbableParto,
          allDay: true,
          animalId: prenez.madreId,
          prenezId: prenez.id,
          status: 'programado',
          priority: 'high',
          metadata: {
            prenezId: prenez.id,
            madreId: prenez.madreId,
            padreId: prenez.padreId,
            autoGenerated: true
          }
        });

        generatedEvents.push(event);
      }
    }

    // Generar eventos de chequeos de salud
    const reproductoras = await prisma.cuy.findMany({
      where: {
        sexo: 'H',
        etapaVida: 'Reproductora',
        estado: 'Activo'
      }
    });

    for (const reproductora of reproductoras) {
      // Chequeo mensual si no hay uno programado
      const nextCheckDate = new Date();
      nextCheckDate.setDate(nextCheckDate.getDate() + 30);

      const existingCheck = events.find(event => 
        event.type === 'chequeo' && 
        event.animalId === reproductora.id &&
        event.startDate > new Date() &&
        event.status === 'programado'
      );

      if (!existingCheck) {
        const event = await createEvent({
          type: 'chequeo',
          title: `Chequeo de salud - ${reproductora.raza} (${reproductora.galpon}-${reproductora.jaula})`,
          description: `Chequeo de salud rutinario para reproductora`,
          startDate: nextCheckDate,
          allDay: false,
          animalId: reproductora.id,
          status: 'programado',
          priority: 'medium',
          metadata: {
            cuyId: reproductora.id,
            raza: reproductora.raza,
            galpon: reproductora.galpon,
            jaula: reproductora.jaula,
            autoGenerated: true
          }
        });

        generatedEvents.push(event);
      }
    }

    // Generar eventos de destete para camadas recientes
    const recentLitters = await prisma.camada.findMany({
      where: {
        fechaNacimiento: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      }
    });

    for (const camada of recentLitters) {
      const weainingDate = new Date(camada.fechaNacimiento);
      weainingDate.setDate(weainingDate.getDate() + 21); // Destete a los 21 días

      // Solo crear si la fecha de destete es futura
      if (weainingDate > new Date()) {
        const existingWeaning = events.find(event => 
          event.type === 'destete' && 
          event.camadaId === camada.id &&
          event.status === 'programado'
        );

        if (!existingWeaning) {
          const event = await createEvent({
            type: 'destete',
            title: `Destete programado - Camada #${camada.id}`,
            description: `Destete de camada nacida el ${camada.fechaNacimiento.toLocaleDateString()}`,
            startDate: weainingDate,
            allDay: true,
            camadaId: camada.id,
            animalId: camada.madreId || undefined,
            status: 'programado',
            priority: 'medium',
            metadata: {
              camadaId: camada.id,
              madreId: camada.madreId,
              numVivos: camada.numVivos,
              autoGenerated: true
            }
          });

          generatedEvents.push(event);
        }
      }
    }

    console.log(`📅 Generados ${generatedEvents.length} eventos automáticos`);
    return generatedEvents;

  } catch (error) {
    console.error('Error generando eventos automáticos:', error);
    return [];
  }
};

// Obtener eventos próximos (próximos 7 días)
export const getUpcomingEvents = async (days: number = 7): Promise<any[]> => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return getEvents({ startDate, endDate });
};

// Obtener eventos vencidos
export const getOverdueEvents = async (): Promise<unknown[]> => {
  const now = new Date();
  
  return events.filter(event => 
    event.status === 'programado' &&
    new Date(event.startDate) < now
  ).map(event => ({
    ...event,
    status: 'vencido' as const
  }));
};

// Marcar evento como completado
export const completeEvent = async (id: string, completionNotes?: string): Promise<ReproductiveEvent | null> => {
  const event = await updateEvent(id, {
    status: 'completado',
    metadata: {
      ...events.find(e => e.id === id)?.metadata,
      completedAt: new Date(),
      completionNotes
    }
  });

  if (event) {
    console.log(`✅ Evento completado: ${event.type} - ${event.title}`);
  }

  return event;
};

// Obtener estadísticas de eventos
export const getEventStats = async (): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  upcoming: number;
  overdue: number;
}> => {
  const total = events.length;
  
  const byStatus = events.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const upcomingEvents = await getUpcomingEvents();
  const overdueEvents = await getOverdueEvents();

  return {
    total,
    byStatus,
    byType,
    upcoming: upcomingEvents.length,
    overdue: overdueEvents.length
  };
};

// Validar conflictos de eventos
export const validateEventConflicts = async (
  eventData: Partial<ReproductiveEvent>,
  excludeEventId?: string
): Promise<{
  hasConflicts: boolean;
  conflicts: ReproductiveEvent[];
  warnings: string[];
}> => {
  const conflicts: ReproductiveEvent[] = [];
  const warnings: string[] = [];

  if (!eventData.startDate || !eventData.animalId) {
    return { hasConflicts: false, conflicts, warnings };
  }

  const eventStart = new Date(eventData.startDate);
  const eventEnd = eventData.endDate ? new Date(eventData.endDate) : eventStart;

  // Buscar eventos que se solapen en tiempo y animal
  const potentialConflicts = events.filter(event => {
    if (excludeEventId && event.id === excludeEventId) return false;
    if (event.animalId !== eventData.animalId) return false;
    if (event.status === 'cancelado') return false;

    const existingStart = new Date(event.startDate);
    const existingEnd = event.endDate ? new Date(event.endDate) : existingStart;

    // Verificar solapamiento
    return (eventStart <= existingEnd && eventEnd >= existingStart);
  });

  conflicts.push(...potentialConflicts);

  // Generar advertencias específicas
  if (eventData.type === 'parto') {
    const recentBirths = events.filter(event => 
      event.type === 'parto' &&
      event.animalId === eventData.animalId &&
      event.status === 'completado' &&
      Math.abs(new Date(event.startDate).getTime() - eventStart.getTime()) < 60 * 24 * 60 * 60 * 1000 // 60 días
    );

    if (recentBirths.length > 0) {
      warnings.push('La hembra tuvo un parto reciente hace menos de 60 días');
    }
  }

  if (eventData.type === 'apareamiento') {
    const recentMating = events.filter(event => 
      event.type === 'apareamiento' &&
      event.animalId === eventData.animalId &&
      Math.abs(new Date(event.startDate).getTime() - eventStart.getTime()) < 7 * 24 * 60 * 60 * 1000 // 7 días
    );

    if (recentMating.length > 0) {
      warnings.push('La hembra tuvo un apareamiento reciente hace menos de 7 días');
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    warnings
  };
};

// Limpiar eventos antiguos completados
export const cleanupOldEvents = async (daysOld: number = 90): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const initialCount = events.length;
  events = events.filter(event => 
    event.status !== 'completado' || 
    new Date(event.updatedAt) > cutoffDate
  );

  const removedCount = initialCount - events.length;
  console.log(`🧹 Limpieza de eventos: ${removedCount} eventos antiguos eliminados`);
  
  return removedCount;
};