import { Request, Response } from 'express';
import * as alimentosService from '../../services/alimentacion/alimentos.service';

export const getAllAlimentos = async (req: Request, res: Response) => {
  const alimentos = await alimentosService.getAllAlimentos();
  res.json(alimentos);
};

export const getAlimentoById = async (req: Request, res: Response) => {
  const alimento = await alimentosService.getAlimentoById(Number(req.params.id));
  if (!alimento) return res.status(404).json({ message: 'Alimento no encontrado' });
  res.json(alimento);
};

export const createAlimento = async (req: Request, res: Response) => {
  const alimento = await alimentosService.createAlimento(req.body);
  res.status(201).json(alimento);
};

export const updateAlimento = async (req: Request, res: Response) => {
  const alimento = await alimentosService.updateAlimento(Number(req.params.id), req.body);
  if (!alimento) return res.status(404).json({ message: 'Alimento no encontrado' });
  res.json(alimento);
};

export const deleteAlimento = async (req: Request, res: Response) => {
  const deleted = await alimentosService.deleteAlimento(Number(req.params.id));
  if (!deleted) return res.status(404).json({ message: 'Alimento no encontrado' });
  res.json({ message: 'Alimento eliminado' });
};
