import { Request, Response } from 'express';
import * as gastosService from '../services/gastos.service';

export const getAllGastos = async (req: Request, res: Response) => {
  try {
    const gastos = await gastosService.getAllGastos();
    res.json(gastos);
  } catch (error: any) {
    console.error('Error en getAllGastos:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const getGastoById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const gasto = await gastosService.getGastoById(id);
    if (!gasto) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    
    res.json(gasto);
  } catch (error: any) {
    console.error('Error en getGastoById:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const createGasto = async (req: Request, res: Response) => {
  try {
    const gasto = await gastosService.createGasto(req.body);
    res.status(201).json(gasto);
  } catch (error: any) {
    console.error('Error en createGasto:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const updateGasto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const gasto = await gastosService.updateGasto(id, req.body);
    if (!gasto) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    
    res.json(gasto);
  } catch (error: any) {
    console.error('Error en updateGasto:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const deleteGasto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const deleted = await gastosService.deleteGasto(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    
    res.json({ message: 'Gasto eliminado' });
  } catch (error: any) {
    console.error('Error en deleteGasto:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};
