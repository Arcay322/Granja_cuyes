import { Request, Response } from 'express';
import * as ventasService from '../../services/ventas/ventas.service';

export const getAllVentas = async (req: Request, res: Response) => {
  const ventas = await ventasService.getAllVentas();
  res.json(ventas);
};

export const getVentaById = async (req: Request, res: Response) => {
  const venta = await ventasService.getVentaById(Number(req.params.id));
  if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
  res.json(venta);
};

export const createVenta = async (req: Request, res: Response) => {
  const venta = await ventasService.createVenta(req.body);
  res.status(201).json(venta);
};

export const updateVenta = async (req: Request, res: Response) => {
  const venta = await ventasService.updateVenta(Number(req.params.id), req.body);
  if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
  res.json(venta);
};

export const deleteVenta = async (req: Request, res: Response) => {
  const deleted = await ventasService.deleteVenta(Number(req.params.id));
  if (!deleted) return res.status(404).json({ message: 'Venta no encontrada' });
  res.json({ message: 'Venta eliminada' });
};
