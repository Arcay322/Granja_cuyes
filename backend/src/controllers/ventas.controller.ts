import { Request, Response } from 'express';
import * as ventasService from '../services/ventas.service';

export const getAllVentas = async (req: Request, res: Response) => {
  try {
    const ventas = await ventasService.getAllVentas();
    res.json(ventas);
  } catch (error: any) {
    console.error('Error en getAllVentas:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const getVentaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const venta = await ventasService.getVentaById(id);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    res.json(venta);
  } catch (error: any) {
    console.error('Error en getVentaById:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const createVenta = async (req: Request, res: Response) => {
  try {
    const venta = await ventasService.createVenta(req.body);
    res.status(201).json(venta);
  } catch (error: any) {
    console.error('Error en createVenta:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const updateVenta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const venta = await ventasService.updateVenta(id, req.body);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    res.json(venta);
  } catch (error: any) {
    console.error('Error en updateVenta:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const deleteVenta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const deleted = await ventasService.deleteVenta(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    res.json({ message: 'Venta eliminada' });
  } catch (error: any) {
    console.error('Error en deleteVenta:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};
