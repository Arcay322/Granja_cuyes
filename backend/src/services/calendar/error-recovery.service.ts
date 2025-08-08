import logger from '../../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CalendarError {
  code: string;
  message: string;
  context: string;
  timestamp: Date;
  eventId?: string;
  userId?: string;
  details?: any;
}

export interface EventConflict {
  eventId: string;
  conflictType: 'date_overlap' | 'resource_conflict' | 'capacity_exceeded';
  conflictingEvents: string[];
  suggestions: string[];
}

export class CalendarErrorRecovery {
  private static instance: CalendarErrorRecovery;
  private errorHistory: CalendarError[] = [];
  private conflictHistory: EventConflict[] = [];

  private constructor() {}

  public static getInstance(): CalendarErrorRecovery {
    if (!CalendarErrorRecovery.instance) {
      CalendarErrorRecovery.instance = new CalendarErrorRecovery();
    }
    return CalendarErrorRecovery.instance;
  }

  // Manejo de errores de eventos
  public async handleEventError(error: any, context: string, eventId?: string, userId?: string): Promise<CalendarError> {
    const calendarError: CalendarError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      context,
      timestamp: new Date(),
      eventId,
      userId,
      details: this.getErrorDetails(error)
    };

    logger.error(`Calendar Error [${calendarError.code}]:`, calendarError);
    this.errorHistory.push(calendarError);

    // Intentar recuperación automática
    await this.attemptAutoRecovery(calendarError);

    return calendarError;
  }

  // Detección y resolución de conflictos
  public async detectEventConflicts(eventData: any): Promise<EventConflict[]> {
    const conflicts: EventConflict[] = [];

    try {
      // Verificar conflictos de fecha
      const dateConflicts = await this.checkDateConflicts(eventData);
      if (dateConflicts.length > 0) {
        conflicts.push({
          eventId: eventData.id || 'new',
          conflictType: 'date_overlap',
          conflictingEvents: dateConflicts,
          suggestions: this.generateDateSuggestions(eventData, dateConflicts)
        });
      }

      // Verificar conflictos de recursos (jaulas, reproductores)
      const resourceConflicts = await this.checkResourceConflicts(eventData);
      if (resourceConflicts.length > 0) {
        conflicts.push({
          eventId: eventData.id || 'new',
          conflictType: 'resource_conflict',
          conflictingEvents: resourceConflicts,
          suggestions: this.generateResourceSuggestions(eventData, resourceConflicts)
        });
      }

      // Verificar capacidad
      const capacityConflicts = await this.checkCapacityConflicts(eventData);
      if (capacityConflicts.length > 0) {
        conflicts.push({
          eventId: eventData.id || 'new',
          conflictType: 'capacity_exceeded',
          conflictingEvents: capacityConflicts,
          suggestions: this.generateCapacitySuggestions(eventData)
        });
      }

      // Guardar conflictos en historial
      conflicts.forEach(conflict => {
        this.conflictHistory.push(conflict);
      });

      return conflicts;
    } catch (error) {
      logger.error('Error detecting event conflicts:', error);
      return [];
    }
  }

  // Validación de eventos
  public validateEventData(eventData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (!eventData.title || eventData.title.trim().length === 0) {
      errors.push('El título del evento es requerido');
    }

    if (!eventData.type) {
      errors.push('El tipo de evento es requerido');
    }

    if (!eventData.date) {
      errors.push('La fecha del evento es requerida');
    } else {
      const eventDate = new Date(eventData.date);
      const now = new Date();
      
      if (eventDate < now) {
        errors.push('La fecha del evento no puede ser en el pasado');
      }

      // Validar que no sea más de 2 años en el futuro
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      if (eventDate > maxDate) {
        errors.push('La fecha del evento no puede ser más de 2 años en el futuro');
      }
    }

    // Validaciones específicas por tipo
    switch (eventData.type) {
      case 'breeding':
        if (!eventData.motherId) {
          errors.push('El ID de la madre es requerido para eventos de reproducción');
        }
        if (!eventData.fatherId) {
          errors.push('El ID del padre es requerido para eventos de reproducción');
        }
        break;

      case 'birth':
        if (!eventData.motherId) {
          errors.push('El ID de la madre es requerido para eventos de nacimiento');
        }
        if (eventData.expectedOffspring && eventData.expectedOffspring < 1) {
          errors.push('El número esperado de crías debe ser mayor a 0');
        }
        break;

      case 'health_check':
        if (!eventData.animalIds || eventData.animalIds.length === 0) {
          errors.push('Debe especificar al menos un animal para chequeos de salud');
        }
        break;

      case 'vaccination':
        if (!eventData.vaccineType) {
          errors.push('El tipo de vacuna es requerido');
        }
        if (!eventData.animalIds || eventData.animalIds.length === 0) {
          errors.push('Debe especificar al menos un animal para vacunación');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Recuperación automática de errores
  private async attemptAutoRecovery(error: CalendarError): Promise<boolean> {
    try {
      switch (error.code) {
        case 'DUPLICATE_EVENT':
          return await this.recoverFromDuplicateEvent(error);
        
        case 'INVALID_DATE':
          return await this.recoverFromInvalidDate(error);
        
        case 'RESOURCE_CONFLICT':
          return await this.recoverFromResourceConflict(error);
        
        default:
          logger.info(`No auto-recovery available for error: ${error.code}`);
          return false;
      }
    } catch (recoveryError) {
      logger.error('Error during auto-recovery:', recoveryError);
      return false;
    }
  }

  // Métodos de verificación de conflictos
  private async checkDateConflicts(eventData: any): Promise<string[]> {
    if (!eventData.date || !eventData.motherId) return [];

    const eventDate = new Date(eventData.date);
    const conflicts = [];

    // Verificar eventos de reproducción existentes
    const existingBreeding = await prisma.prenez.findMany({
      where: {
        madreId: eventData.motherId,
        estado: 'activa',
        fechaPrenez: {
          gte: new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 días antes
          lte: new Date(eventDate.getTime() + 30 * 24 * 60 * 60 * 1000)  // 30 días después
        }
      }
    });

    if (existingBreeding.length > 0) {
      conflicts.push(...existingBreeding.map(b => `breeding_${b.id}`));
    }

    return conflicts;
  }

  private async checkResourceConflicts(eventData: any): Promise<string[]> {
    const conflicts = [];

    // Verificar disponibilidad de reproductores
    if (eventData.fatherId) {
      const fatherConflicts = await prisma.prenez.findMany({
        where: {
          padreId: eventData.fatherId,
          estado: 'activa',
          fechaPrenez: {
            gte: new Date(eventData.date),
            lte: new Date(new Date(eventData.date).getTime() + 7 * 24 * 60 * 60 * 1000) // 7 días
          }
        }
      });

      if (fatherConflicts.length > 0) {
        conflicts.push(...fatherConflicts.map(c => `father_conflict_${c.id}`));
      }
    }

    return conflicts;
  }

  private async checkCapacityConflicts(eventData: any): Promise<string[]> {
    const conflicts = [];

    if (eventData.jaulaId) {
      // Verificar capacidad de jaula
      const jaula = await prisma.jaula.findUnique({
        where: { id: eventData.jaulaId },
        select: {
          id: true,
          nombre: true,
          capacidadMaxima: true,
          galponNombre: true
        }
      });

      if (jaula) {
        // Contar cuyes activos en la jaula
        const cuyesCount = await prisma.cuy.count({
          where: {
            jaula: jaula.nombre,
            galpon: jaula.galponNombre,
            estado: 'activo'
          }
        });

        if (cuyesCount >= jaula.capacidadMaxima) {
          conflicts.push(`capacity_exceeded_${jaula.id}`);
        }
      }
    }

    return conflicts;
  }

  // Generadores de sugerencias
  private generateDateSuggestions(eventData: any, conflicts: string[]): string[] {
    const suggestions = [];
    const originalDate = new Date(eventData.date);

    // Sugerir fechas alternativas
    for (let i = 1; i <= 7; i++) {
      const alternativeDate = new Date(originalDate);
      alternativeDate.setDate(alternativeDate.getDate() + i);
      suggestions.push(`Considere la fecha ${alternativeDate.toLocaleDateString()}`);
    }

    return suggestions;
  }

  private generateResourceSuggestions(eventData: any, conflicts: string[]): string[] {
    return [
      'Considere usar un reproductor diferente',
      'Espere hasta que el reproductor esté disponible',
      'Verifique el calendario de reproducción para fechas alternativas'
    ];
  }

  private generateCapacitySuggestions(eventData: any): string[] {
    return [
      'Traslade algunos animales a otra jaula',
      'Use una jaula con mayor capacidad',
      'Considere expandir la capacidad actual'
    ];
  }

  // Métodos de recuperación específicos
  private async recoverFromDuplicateEvent(error: CalendarError): Promise<boolean> {
    logger.info('Attempting recovery from duplicate event');
    // Implementar lógica de recuperación para eventos duplicados
    return false;
  }

  private async recoverFromInvalidDate(error: CalendarError): Promise<boolean> {
    logger.info('Attempting recovery from invalid date');
    // Implementar lógica de recuperación para fechas inválidas
    return false;
  }

  private async recoverFromResourceConflict(error: CalendarError): Promise<boolean> {
    logger.info('Attempting recovery from resource conflict');
    // Implementar lógica de recuperación para conflictos de recursos
    return false;
  }

  // Métodos de utilidad
  private getErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.name) return error.name;
    return 'CALENDAR_ERROR';
  }

  private getErrorMessage(error: any): string {
    if (error.message) return error.message;
    return 'Error desconocido en el calendario';
  }

  private getErrorDetails(error: any): any {
    return {
      stack: error.stack,
      originalError: error
    };
  }

  // Métodos públicos para obtener estadísticas
  public getErrorHistory(): CalendarError[] {
    return [...this.errorHistory];
  }

  public getConflictHistory(): EventConflict[] {
    return [...this.conflictHistory];
  }

  public clearHistory(): void {
    this.errorHistory = [];
    this.conflictHistory = [];
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    conflictsByType: Record<string, number>;
  } {
    const errorsByCode: Record<string, number> = {};
    const conflictsByType: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
    });

    this.conflictHistory.forEach(conflict => {
      conflictsByType[conflict.conflictType] = (conflictsByType[conflict.conflictType] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByCode,
      conflictsByType
    };
  }
}

export const calendarErrorRecovery = CalendarErrorRecovery.getInstance();