import { Request, Response } from 'express';
import * as cuyesService from '../../services/inventario/cuyes.service';

export const getAllCuyes = async (req: Request, res: Response) => {
  try {
    const { galpon, jaula } = req.query;
    
    // Construir filtros
    const filters: any = {};
    if (galpon && typeof galpon === 'string') {
      filters.galpon = galpon;
    }
    if (jaula && typeof jaula === 'string') {
      filters.jaula = jaula;
    }
    
    console.log('🔍 Filtros recibidos en controller:', filters);
    
    const cuyes = await cuyesService.getAllCuyes(filters);
    
    console.log('🔍 Total de cuyes devueltos:', cuyes.length);
    if (Object.keys(filters).length > 0) {
      console.log('🔍 Filtros aplicados:', filters);
    }
    
    res.json(cuyes);
  } catch (error: any) {
    console.error('Error en getAllCuyes:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const getCuyById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const cuy = await cuyesService.getCuyById(id);
    if (!cuy) {
      return res.status(404).json({ message: 'Cuy no encontrado' });
    }
    
    res.json(cuy);
  } catch (error: any) {
    console.error('Error en getCuyById:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const createCuy = async (req: Request, res: Response) => {
  try {
    const cuy = await cuyesService.createCuy(req.body);
    res.status(201).json(cuy);
  } catch (error: any) {
    console.error('Error en createCuy:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const updateCuy = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const cuy = await cuyesService.updateCuy(id, req.body);
    if (!cuy) {
      return res.status(404).json({ message: 'Cuy no encontrado' });
    }
    
    res.json(cuy);
  } catch (error: any) {
    console.error('Error en updateCuy:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const deleteCuy = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const deleted = await cuyesService.deleteCuy(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Cuy no encontrado' });
    }
    
    res.json({ message: 'Cuy eliminado' });
  } catch (error: any) {
    console.error('Error en deleteCuy:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const getCuyesStats = async (req: Request, res: Response) => {
  try {
    const stats = await cuyesService.getCuyesStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error en getCuyesStats:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const cambiarAReproductor = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const cuy = await cuyesService.cambiarProposito(id, 'Reproducción', 'Reproductor');
    if (!cuy) {
      return res.status(404).json({ message: 'Cuy no encontrado' });
    }
    
    res.json({ 
      message: 'Cuy cambiado a reproductor exitosamente', 
      cuy 
    });
  } catch (error: any) {
    console.error('Error en cambiarAReproductor:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const cambiarAEngorde = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const cuy = await cuyesService.cambiarProposito(id, 'Engorde', 'Engorde');
    if (!cuy) {
      return res.status(404).json({ message: 'Cuy no encontrado' });
    }
    
    res.json({ 
      message: 'Cuy cambiado a engorde exitosamente', 
      cuy 
    });
  } catch (error: any) {
    console.error('Error en cambiarAEngorde:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};

export const crearCuyesPorJaula = async (req: Request, res: Response) => {
  try {
    const cuyesCreados = await cuyesService.crearCuyesPorJaula(req.body);
    res.status(201).json({ 
      message: `${cuyesCreados.length} cuyes creados exitosamente`,
      cuyes: cuyesCreados 
    });
  } catch (error: any) {
    console.error('Error en crearCuyesPorJaula:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error?.message || 'Error desconocido' });
  }
};
