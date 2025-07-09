import { Request, Response } from 'express';
import { getAllCuyesService, getCuyByIdService, createCuyService, updateCuyService, deleteCuyService } from '../services/cuyes.service';

export const getAllCuyes = async (req: Request, res: Response) => {
  const cuyes = await getAllCuyesService();
  res.json(cuyes);
};

export const getCuyById = async (req: Request, res: Response) => {
  const cuy = await getCuyByIdService(Number(req.params.id));
  if (!cuy) return res.status(404).json({ message: 'Cuy no encontrado' });
  res.json(cuy);
};

export const createCuy = async (req: Request, res: Response) => {
  const cuy = await createCuyService(req.body);
  res.status(201).json(cuy);
};

export const updateCuy = async (req: Request, res: Response) => {
  const cuy = await updateCuyService(Number(req.params.id), req.body);
  res.json(cuy);
};

export const deleteCuy = async (req: Request, res: Response) => {
  await deleteCuyService(Number(req.params.id));
  res.status(204).send();
};
