import { Request, Response, NextFunction } from 'express';
import * as alimentosService from '../services/alimentos.service';
// Recomendación: usar validateRequest en las rutas para validar req.body

export const getAllAlimentos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alimentos = await alimentosService.getAllAlimentos();
    res.json(alimentos);
  } catch (error) {
    next(error);
  }
};

export const getAlimentoById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const alimento = await alimentosService.getAlimentoById(id);
    if (!alimento) {
      return res.status(404).json({ message: 'Alimento no encontrado' });
    }
    res.json(alimento);
  } catch (error) {
    next(error);
  }
};

export const createAlimento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alimento = await alimentosService.createAlimento(req.body);
    res.status(201).json(alimento);
  } catch (error) {
    next(error);
  }
};

export const updateAlimento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const alimento = await alimentosService.updateAlimento(id, req.body);
    if (!alimento) {
      return res.status(404).json({ message: 'Alimento no encontrado' });
    }
    res.json(alimento);
  } catch (error) {
    next(error);
  }
};

export const deleteAlimento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const deleted = await alimentosService.deleteAlimento(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Alimento no encontrado' });
    }
    res.json({ message: 'Alimento eliminado' });
  } catch (error) {
    next(error);
  }
};
