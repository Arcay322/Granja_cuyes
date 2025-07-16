import { Request, Response, NextFunction } from 'express';
import * as consumoService from '../../services/alimentacion/consumo.service';

export const getAllConsumos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumos = await consumoService.getAllConsumos();
    res.json(consumos);
  } catch (error) {
    next(error);
  }
};

export const getConsumoById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumo = await consumoService.getConsumoById(Number(req.params.id));
    if (!consumo) return res.status(404).json({ message: 'Consumo no encontrado' });
    res.json(consumo);
  } catch (error) {
    next(error);
  }
};

export const createConsumo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumo = await consumoService.createConsumo(req.body);
    res.status(201).json(consumo);
  } catch (error: any) {
    // Manejar errores específicos de stock
    if (error.message && error.message.includes('Stock insuficiente')) {
      return res.status(400).json({ 
        message: 'Stock insuficiente', 
        error: error.message 
      });
    }
    if (error.message && error.message.includes('no existe')) {
      return res.status(404).json({ 
        message: 'Alimento no encontrado', 
        error: error.message 
      });
    }
    next(error);
  }
};

export const updateConsumo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumo = await consumoService.updateConsumo(Number(req.params.id), req.body);
    if (!consumo) return res.status(404).json({ message: 'Consumo no encontrado' });
    res.json(consumo);
  } catch (error: any) {
    // Manejar errores específicos de stock
    if (error.message && error.message.includes('Stock insuficiente')) {
      return res.status(400).json({ 
        message: 'Stock insuficiente', 
        error: error.message 
      });
    }
    if (error.message && error.message.includes('no existe')) {
      return res.status(404).json({ 
        message: 'Alimento no encontrado', 
        error: error.message 
      });
    }
    next(error);
  }
};

export const deleteConsumo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await consumoService.deleteConsumo(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: 'Consumo no encontrado' });
    res.json({ message: 'Consumo eliminado y stock revertido' });
  } catch (error) {
    next(error);
  }
};

export const getConsumosPorGalpon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { galpon } = req.params;
    const { fechaInicio, fechaFin } = req.query;
    
    const inicio = fechaInicio ? new Date(fechaInicio as string) : undefined;
    const fin = fechaFin ? new Date(fechaFin as string) : undefined;
    
    const consumos = await consumoService.getConsumosPorGalpon(galpon, inicio, fin);
    res.json(consumos);
  } catch (error) {
    next(error);
  }
};

export const getEstadisticasConsumo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const inicio = fechaInicio ? new Date(fechaInicio as string) : undefined;
    const fin = fechaFin ? new Date(fechaFin as string) : undefined;
    
    const estadisticas = await consumoService.getEstadisticasConsumo(inicio, fin);
    res.json(estadisticas);
  } catch (error) {
    next(error);
  }
};