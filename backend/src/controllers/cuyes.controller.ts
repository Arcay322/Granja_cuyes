import { Request, Response, NextFunction } from 'express';
import { getAllCuyesService, getCuyByIdService, createCuyService, updateCuyService, deleteCuyService } from '../services/cuyes.service';

export const getAllCuyes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuyes = await getAllCuyesService();
    res.json(cuyes);
  } catch (error) {
    next(error);
  }
};

export const getCuyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuy = await getCuyByIdService(Number(req.params.id));
    if (!cuy) return res.status(404).json({ message: 'Cuy no encontrado' });
    res.json(cuy);
  } catch (error) {
    next(error);
  }
};

export const createCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuy = await createCuyService(req.body);
    res.status(201).json(cuy);
  } catch (error) {
    next(error);
  }
};

export const updateCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuy = await updateCuyService(Number(req.params.id), req.body);
    res.json(cuy);
  } catch (error) {
    next(error);
  }
};

export const deleteCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteCuyService(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
