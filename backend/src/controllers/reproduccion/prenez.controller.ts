import { Request, Response } from 'express';
import * as prenezService from '../../services/reproduccion/prenez.service';

// Obtener todas las preñeces
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const preneces = await prenezService.getAll();
    res.json(preneces);
  } catch (error: any) {
    console.error('Error al obtener preñeces:', error);
    res.status(500).json({ message: 'Error al obtener preñeces', error: error.message });
  }
};

// Obtener preñeces activas
export const getActivas = async (req: Request, res: Response): Promise<void> => {
  try {
    const preneces = await prenezService.getActivas();
    res.json(preneces);
  } catch (error: any) {
    console.error('Error al obtener preñeces activas:', error);
    res.status(500).json({ message: 'Error al obtener preñeces activas', error: error.message });
  }
};

// Obtener preñez por ID
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const prenez = await prenezService.getById(id);
    if (!prenez) {
      res.status(404).json({ message: 'Preñez no encontrada' });
      return;
    }
    res.json(prenez);
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
    if (!data.madreId || !data.fechaPrenez || !data.fechaProbableParto) {
      res.status(400).json({ message: 'Datos incompletos para registro de preñez' });
      return;
    }

    // Calcular fecha probable de parto si no se proporciona
    if (!data.fechaProbableParto) {
      // Aproximadamente 70 días después de la fecha de preñez
      const fechaPrenez = new Date(data.fechaPrenez);
      const fechaProbableParto = new Date(fechaPrenez);
      fechaProbableParto.setDate(fechaProbableParto.getDate() + 70);
      data.fechaProbableParto = fechaProbableParto;
    }

    const prenez = await prenezService.create(data);
    res.status(201).json(prenez);
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
    const prenez = await prenezService.update(id, data);
    res.json(prenez);
  } catch (error: any) {
    console.error('Error al actualizar preñez:', error);
    res.status(500).json({ message: 'Error al actualizar preñez', error: error.message });
  }
};

// Eliminar preñez
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await prenezService.remove(id);
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
    
    const prenez = await prenezService.completarPrenez(id, camadaId);
    res.json(prenez);
  } catch (error: any) {
    console.error('Error al completar preñez:', error);
    res.status(500).json({ message: 'Error al completar preñez', error: error.message });
  }
};

// Marcar preñez como fallida
export const marcarFallida = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const prenez = await prenezService.marcarComoFallida(id);
    res.json(prenez);
  } catch (error: any) {
    console.error('Error al marcar preñez como fallida:', error);
    res.status(500).json({ message: 'Error al marcar preñez como fallida', error: error.message });
  }
};

// Obtener próximos partos
export const getProximosPartos = async (req: Request, res: Response): Promise<void> => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias as string) : 15;
    const proximosPartos = await prenezService.getProximosPartos(dias);
    res.json(proximosPartos);
  } catch (error: any) {
    console.error('Error al obtener próximos partos:', error);
    res.status(500).json({ message: 'Error al obtener próximos partos', error: error.message });
  }
};
