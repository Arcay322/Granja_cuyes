import { Request, Response } from 'express';
import * as saludService from '../../services/salud/salud.service';

export const getAllHistorial = async (req: Request, res: Response) => {
  try {
    const historial = await saludService.getAllHistorial();
    res.json(historial);
  } catch (error: any) {
    console.error('Error en getAllHistorial:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const getHistorialById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const registro = await saludService.getHistorialById(id);
    if (!registro) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    
    res.json(registro);
  } catch (error: any) {
    console.error('Error en getHistorialById:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const createHistorial = async (req: Request, res: Response) => {
  try {
    const registro = await saludService.createHistorial(req.body);
    res.status(201).json(registro);
  } catch (error: any) {
    console.error('Error en createHistorial:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const updateHistorial = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const registro = await saludService.updateHistorial(id, req.body);
    if (!registro) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    
    res.json(registro);
  } catch (error: any) {
    console.error('Error en updateHistorial:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const deleteHistorial = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const deleted = await saludService.deleteHistorial(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    
    res.json({ message: 'Registro eliminado' });
  } catch (error: any) {
    console.error('Error en deleteHistorial:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};
