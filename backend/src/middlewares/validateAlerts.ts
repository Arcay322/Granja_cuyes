import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

// Schemas de validación para alertas
const alertRuleSchema = z.object({
  name: z.string().min(1, 'El nombre de la regla es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().optional(),
  type: z.enum(['pregnancy_overdue', 'birth_reminder', 'health_check', 'capacity_warning'], {
    errorMap: () => ({ message: 'Tipo de alerta no válido' })
  }),
  conditions: z.object({
    threshold: z.number().min(0, 'El umbral debe ser mayor o igual a 0').optional(),
    days: z.number().min(1, 'Los días deben ser mayor a 0').max(365, 'Los días no pueden exceder 365').optional(),
    percentage: z.number().min(0, 'El porcentaje debe ser mayor o igual a 0').max(100, 'El porcentaje no puede exceder 100').optional()
  }).optional(),
  recipients: z.array(z.string().email('Email no válido')).min(1, 'Debe especificar al menos un destinatario'),
  enabled: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Prioridad no válida' })
  }).default('medium'),
  schedule: z.object({
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly'], {
      errorMap: () => ({ message: 'Frecuencia no válida' })
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora no válido (HH:MM)').optional(),
    days: z.array(z.number().min(0).max(6)).optional() // 0 = Sunday, 6 = Saturday
  }).optional()
});

const alertUpdateSchema = alertRuleSchema.partial();

const alertConfigSchema = z.object({
  globalEnabled: z.boolean().default(true),
  defaultRecipients: z.array(z.string().email('Email no válido')).optional(),
  notificationChannels: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
    webhook: z.boolean().default(false)
  }).optional(),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora no válido (HH:MM)').optional(),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora no válido (HH:MM)').optional()
  }).optional()
});

// Middleware de validación para crear regla de alerta
export const validateCreateAlertRule = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = alertRuleSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      logger.warn('Alert rule validation failed:', { errors, body: req.body });
      
      return res.status(400).json({
        success: false,
        message: 'Datos de regla de alerta no válidos',
        errors
      });
    }
    
    logger.error('Unexpected error in alert rule validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de validación'
    });
  }
};

// Middleware de validación para actualizar regla de alerta
export const validateUpdateAlertRule = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = alertUpdateSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      logger.warn('Alert rule update validation failed:', { errors, body: req.body });
      
      return res.status(400).json({
        success: false,
        message: 'Datos de actualización de regla no válidos',
        errors
      });
    }
    
    logger.error('Unexpected error in alert rule update validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de validación'
    });
  }
};

// Middleware de validación para configuración de alertas
export const validateAlertConfig = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = alertConfigSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      logger.warn('Alert config validation failed:', { errors, body: req.body });
      
      return res.status(400).json({
        success: false,
        message: 'Configuración de alertas no válida',
        errors
      });
    }
    
    logger.error('Unexpected error in alert config validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de validación'
    });
  }
};

// Validación de parámetros de consulta para alertas
export const validateAlertQuery = (req: Request, res: Response, next: NextFunction) => {
  const querySchema = z.object({
    page: z.string().regex(/^\d+$/, 'Página debe ser un número').transform(Number).optional(),
    limit: z.string().regex(/^\d+$/, 'Límite debe ser un número').transform(Number).refine(val => val <= 100, 'Límite máximo es 100').optional(),
    type: z.enum(['pregnancy_overdue', 'birth_reminder', 'health_check', 'capacity_warning']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum(['active', 'resolved', 'dismissed']).optional(),
    dateFrom: z.string().datetime('Fecha desde no válida').optional(),
    dateTo: z.string().datetime('Fecha hasta no válida').optional()
  });

  try {
    const validatedQuery = querySchema.parse(req.query);
    req.query = validatedQuery as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      logger.warn('Alert query validation failed:', { errors, query: req.query });
      
      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta no válidos',
        errors
      });
    }
    
    logger.error('Unexpected error in alert query validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de validación'
    });
  }
};

// Validación personalizada para reglas de negocio
export const validateAlertBusinessRules = (req: Request, res: Response, next: NextFunction) => {
  const { type, conditions, schedule } = req.body;
  const errors: Array<{ field: string; message: string }> = [];

  // Validaciones específicas por tipo de alerta
  switch (type) {
    case 'pregnancy_overdue':
      if (!conditions?.days || conditions.days < 65 || conditions.days > 90) {
        errors.push({
          field: 'conditions.days',
          message: 'Para alertas de preñez vencida, los días deben estar entre 65 y 90'
        });
      }
      break;

    case 'birth_reminder':
      if (!conditions?.days || conditions.days < 1 || conditions.days > 14) {
        errors.push({
          field: 'conditions.days',
          message: 'Para recordatorios de parto, los días deben estar entre 1 y 14'
        });
      }
      break;

    case 'capacity_warning':
      if (!conditions?.percentage || conditions.percentage < 50 || conditions.percentage > 95) {
        errors.push({
          field: 'conditions.percentage',
          message: 'Para alertas de capacidad, el porcentaje debe estar entre 50% y 95%'
        });
      }
      break;

    case 'health_check':
      if (!conditions?.days || conditions.days < 7 || conditions.days > 365) {
        errors.push({
          field: 'conditions.days',
          message: 'Para chequeos de salud, los días deben estar entre 7 y 365'
        });
      }
      break;
  }

  // Validación de horarios de silencio
  if (schedule?.quietHours?.enabled) {
    const { start, end } = schedule.quietHours;
    if (start && end) {
      const startTime = new Date(`2000-01-01T${start}:00`);
      const endTime = new Date(`2000-01-01T${end}:00`);
      
      if (startTime >= endTime) {
        errors.push({
          field: 'schedule.quietHours',
          message: 'La hora de inicio debe ser anterior a la hora de fin'
        });
      }
    }
  }

  // Validación de frecuencia y días
  if (schedule?.frequency === 'weekly' && (!schedule.days || schedule.days.length === 0)) {
    errors.push({
      field: 'schedule.days',
      message: 'Para frecuencia semanal, debe especificar al menos un día'
    });
  }

  if (errors.length > 0) {
    logger.warn('Alert business rules validation failed:', { errors, body: req.body });
    
    return res.status(400).json({
      success: false,
      message: 'Reglas de negocio de alertas no válidas',
      errors
    });
  }

  next();
};

// Middleware para validar permisos de alerta
export const validateAlertPermissions = (req: Request, res: Response, next: NextFunction) => {
  // Aquí podrías implementar validación de permisos basada en roles
  // Por ejemplo, solo administradores pueden crear alertas críticas
  
  const { priority } = req.body;
  const userRole = req.user?.rol; // Asumiendo que el middleware de auth agrega el usuario
  
  if (priority === 'critical' && userRole !== 'admin') {
    logger.warn('Unauthorized attempt to create critical alert:', { 
      userId: req.user?.id, 
      userRole,
      body: req.body 
    });
    
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para crear alertas críticas'
    });
  }
  
  next();
};

// Middleware de rate limiting específico para alertas
export const validateAlertRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Implementar rate limiting específico para creación de alertas
  // Por ejemplo, máximo 10 alertas por usuario por hora
  
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }
  
  // Aquí implementarías la lógica de rate limiting
  // Por simplicidad, solo logueamos la acción
  logger.info('Alert action rate limit check:', { 
    userId, 
    action: req.method,
    endpoint: req.path 
  });
  
  next();
};