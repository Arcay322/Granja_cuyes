import { Request, Response } from 'express';
import * as preñezService from '../../services/reproduccion/preñez.service';

// Obtener todas las preñeces
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const preñeces = await preñezService.getAll();
    res.json(preñeces);
  } catch (error: any) {
    console.error('Error al obtener preñeces:', error);
    res.status(500).json({ message: 'Error al obtener preñeces', error: error.message });
  }
};

// Obtener preñeces activas
export const getActivas = async (req: Request, res: Response): Promise<void> => {
  try {
    const preñeces = await preñezService.getActivas();
    res.json(preñeces);
  } catch (error: any) {
    console.error('Error al obtener preñeces activas:', error);
    res.status(500).json({ message: 'Error al obtener preñeces activas', error: error.message });
  }
};

// Obtener preñez por ID
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const preñez = await preñezService.getById(id);
    if (!preñez) {
      res.status(404).json({ message: 'Preñez no encontrada' });
      return;
    }
    res.json(preñez);
  } catch (error: any) {
    console.error('Error al obtener preñez:', error);
    res.status(500).json({ message: 'Error al obtener preñez', error: error.message });
  }
};

// Crear nueva preñez
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    
    // Validar campos requeridos
    if (!data.madreId || !data.fechaPreñez || !data.fechaProbableParto) {
      res.status(400).json({ message: 'Datos incompletos para registro de preñez' });
      return;
    }

    // Calcular fecha probable de parto si no se proporciona
    if (!data.fechaProbableParto) {
      // Aproximadamente 70 días después de la fecha de preñez
      const fechaPreñez = new Date(data.fechaPreñez);
      const fechaProbableParto = new Date(fechaPreñez);
      fechaProbableParto.setDate(fechaProbableParto.getDate() + 70);
      data.fechaProbableParto = fechaProbableParto;
    }

    const preñez = await preñezService.create(data);
    res.status(201).json(preñez);
  } catch (error: any) {
    console.error('Error al crear preñez:', error);
    res.status(500).json({ message: 'Error al crear preñez', error: error.message });
  }
};

// Actualizar preñez
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const preñez = await preñezService.update(id, data);
    res.json(preñez);
  } catch (error: any) {
    console.error('Error al actualizar preñez:', error);
    res.status(500).json({ message: 'Error al actualizar preñez', error: error.message });
  }
};

// Eliminar preñez
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await preñezService.remove(id);
    res.status(204).end();
  } catch (error: any) {
    console.error('Error al eliminar preñez:', error);
    res.status(500).json({ message: 'Error al eliminar preñez', error: error.message });
  }
};

// Marcar preñez como completada
export const completar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { camadaId } = req.body;
    
    if (!camadaId) {
      res.status(400).json({ message: 'Se requiere ID de camada para completar la preñez' });
      return;
    }
    
    const preñez = await preñezService.completarPreñez(id, camadaId);
    res.json(preñez);
  } catch (error: any) {
    console.error('Error al completar preñez:', error);
    res.status(500).json({ message: 'Error al completar preñez', error: error.message });
  }
};

// Marcar preñez como fallida
export const marcarFallida = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const preñez = await preñezService.marcarComoFallida(id);
    res.json(preñez);
  } catch (error: any) {
    console.error('Error al marcar preñez como fallida:', error);
    res.status(500).json({ message: 'Error al marcar preñez como fallida', error: error.message });
  }
};

// Obtener próximos partos
export const getProximosPartos = async (req: Request, res: Response): Promise<void> => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias as string) : 15;
    const proximosPartos = await preñezService.getProximosPartos(dias);
    res.json(proximosPartos);
  } catch (error: any) {
    console.error('Error al obtener próximos partos:', error);
    res.status(500).json({ message: 'Error al obtener próximos partos', error: error.message });
  }
};
