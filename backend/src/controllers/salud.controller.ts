import { Request, Response } from 'express';
import * as saludService from '../services/salud.service';

export const getAllRegistrosSalud = async (req: Request, res: Response) => {
  try {
    const registros = await saludService.getAllRegistrosSalud();
    res.json(registros);
  } catch (error: any) {
    console.error('Error en getAllRegistrosSalud:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const getRegistroSaludById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const registro = await saludService.getRegistroSaludById(id);
    if (!registro) {
      return res.status(404).json({ message: 'Registro de salud no encontrado' });
    }
    
    res.json(registro);
  } catch (error: any) {
    console.error('Error en getRegistroSaludById:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const createRegistroSalud = async (req: Request, res: Response) => {
  try {
    const registro = await saludService.createRegistroSalud(req.body);
    res.status(201).json(registro);
  } catch (error: any) {
    console.error('Error en createRegistroSalud:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const updateRegistroSalud = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const registro = await saludService.updateRegistroSalud(id, req.body);
    if (!registro) {
      return res.status(404).json({ message: 'Registro de salud no encontrado' });
    }
    
    res.json(registro);
  } catch (error: any) {
    console.error('Error en updateRegistroSalud:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const deleteRegistroSalud = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const deleted = await saludService.deleteRegistroSalud(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Registro de salud no encontrado' });
    }
    
    res.json({ message: 'Registro de salud eliminado' });
  } catch (error: any) {
    console.error('Error en deleteRegistroSalud:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};
