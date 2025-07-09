import { Request, Response } from 'express';
import * as alimentosService from '../services/alimentos.service';

export const getAllAlimentos = async (req: Request, res: Response) => {
  try {
    const alimentos = await alimentosService.getAllAlimentos();
    res.json(alimentos);
  } catch (error: any) {
    console.error('Error en getAllAlimentos:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const getAlimentoById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const alimento = await alimentosService.getAlimentoById(id);
    if (!alimento) {
      return res.status(404).json({ message: 'Alimento no encontrado' });
    }
    
    res.json(alimento);
  } catch (error: any) {
    console.error('Error en getAlimentoById:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const createAlimento = async (req: Request, res: Response) => {
  try {
    const alimento = await alimentosService.createAlimento(req.body);
    res.status(201).json(alimento);
  } catch (error: any) {
    console.error('Error en createAlimento:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const updateAlimento = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const alimento = await alimentosService.updateAlimento(id, req.body);
    if (!alimento) {
      return res.status(404).json({ message: 'Alimento no encontrado' });
    }
    
    res.json(alimento);
  } catch (error: any) {
    console.error('Error en updateAlimento:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const deleteAlimento = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const deleted = await alimentosService.deleteAlimento(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Alimento no encontrado' });
    }
    
    res.json({ message: 'Alimento eliminado' });
  } catch (error: any) {
    console.error('Error en deleteAlimento:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};
