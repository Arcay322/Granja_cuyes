import { Request, Response, NextFunction } from 'express';
import * as ventasService from '../../services/ventas/ventas.service';
// Recomendación: usar validateRequest en las rutas para validar req.body

export const getAllVentas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ventas = await ventasService.getAllVentas();
    res.json(ventas);
  } catch (error) {
    next(error);
  }
};

export const getVentaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venta = await ventasService.getVentaById(Number(req.params.id));
    if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json(venta);
  } catch (error) {
    next(error);
  }
};

export const createVenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venta = await ventasService.createVenta(req.body);
    res.status(201).json(venta);
  } catch (error) {
    next(error);
  }
};

export const updateVenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venta = await ventasService.updateVenta(Number(req.params.id), req.body);
    if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json(venta);
  } catch (error) {
    next(error);
  }
};

export const deleteVenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await ventasService.deleteVenta(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    next(error);
  }
};
