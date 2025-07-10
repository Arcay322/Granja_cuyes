import { Request, Response, NextFunction } from 'express';
import * as saludService from '../../services/salud/salud.service';
// Recomendación: usar validateRequest en las rutas para validar req.body

export const getAllHistorial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const historial = await saludService.getAllHistorial();
    res.json(historial);
  } catch (error) {
    next(error);
  }
};

export const getHistorialById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const registro = await saludService.getHistorialById(id);
    if (!registro) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json(registro);
  } catch (error) {
    next(error);
  }
};

export const createHistorial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const registro = await saludService.createHistorial(req.body);
    res.status(201).json(registro);
  } catch (error) {
    next(error);
  }
};

export const updateHistorial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const registro = await saludService.updateHistorial(id, req.body);
    if (!registro) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json(registro);
  } catch (error) {
    next(error);
  }
};

export const deleteHistorial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const deleted = await saludService.deleteHistorial(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    next(error);
  }
};
