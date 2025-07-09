import { Request, Response } from 'express';
import * as gastosService from '../../services/gastos/gastos.service';

export const getAllGastos = async (req: Request, res: Response) => {
  const gastos = await gastosService.getAllGastos();
  res.json(gastos);
};

export const getGastoById = async (req: Request, res: Response) => {
  const gasto = await gastosService.getGastoById(Number(req.params.id));
  if (!gasto) return res.status(404).json({ message: 'Gasto no encontrado' });
  res.json(gasto);
};

export const createGasto = async (req: Request, res: Response) => {
  const gasto = await gastosService.createGasto(req.body);
  res.status(201).json(gasto);
};

export const updateGasto = async (req: Request, res: Response) => {
  const gasto = await gastosService.updateGasto(Number(req.params.id), req.body);
  if (!gasto) return res.status(404).json({ message: 'Gasto no encontrado' });
  res.json(gasto);
};

export const deleteGasto = async (req: Request, res: Response) => {
  const deleted = await gastosService.deleteGasto(Number(req.params.id));
  if (!deleted) return res.status(404).json({ message: 'Gasto no encontrado' });
  res.json({ message: 'Gasto eliminado' });
};
