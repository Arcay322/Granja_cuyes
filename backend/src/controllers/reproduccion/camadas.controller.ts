import { Request, Response } from 'express';
import * as camadasService from '../../services/reproduccion/camadas.service';

export const getAllCamadas = async (req: Request, res: Response) => {
  try {
    const camadas = await camadasService.getAllCamadas();
    res.json(camadas);
  } catch (error) {
    console.error('Error al obtener camadas:', error);
    res.status(500).json({ error: 'Error al obtener camadas' });
  }
};

export const getCamadaById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const camada = await camadasService.getCamadaById(id);
    
    if (!camada) {
      return res.status(404).json({ error: 'Camada no encontrada' });
    }
    
    res.json(camada);
  } catch (error) {
    console.error('Error al obtener camada:', error);
    res.status(500).json({ error: 'Error al obtener camada' });
  }
};

export const createCamada = async (req: Request, res: Response) => {
  try {
    const { fechaNacimiento, numVivos, numMuertos, padreId, madreId } = req.body;
    
    // Validaciones básicas
    if (!fechaNacimiento) {
      return res.status(400).json({ error: 'La fecha de nacimiento es requerida' });
    }
    
    if (numVivos < 0 || numMuertos < 0) {
      return res.status(400).json({ error: 'Los números de crías no pueden ser negativos' });
    }
    
    if (!madreId) {
      return res.status(400).json({ error: 'La madre es requerida' });
    }
    
    const newCamada = await camadasService.createCamada({
      fechaNacimiento: new Date(fechaNacimiento),
      numVivos,
      numMuertos,
      padreId,
      madreId
    });
    
    res.status(201).json(newCamada);
  } catch (error) {
    console.error('Error al crear camada:', error);
    res.status(500).json({ error: 'Error al crear camada' });
  }
};

export const updateCamada = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { fechaNacimiento, numVivos, numMuertos, padreId, madreId } = req.body;
    
    // Validaciones básicas
    if (!fechaNacimiento) {
      return res.status(400).json({ error: 'La fecha de nacimiento es requerida' });
    }
    
    if (numVivos < 0 || numMuertos < 0) {
      return res.status(400).json({ error: 'Los números de crías no pueden ser negativos' });
    }
    
    if (!madreId) {
      return res.status(400).json({ error: 'La madre es requerida' });
    }
    
    const updatedCamada = await camadasService.updateCamada(id, {
      fechaNacimiento: new Date(fechaNacimiento),
      numVivos,
      numMuertos,
      padreId,
      madreId
    });
    
    if (!updatedCamada) {
      return res.status(404).json({ error: 'Camada no encontrada' });
    }
    
    res.json(updatedCamada);
  } catch (error) {
    console.error('Error al actualizar camada:', error);
    res.status(500).json({ error: 'Error al actualizar camada' });
  }
};

export const deleteCamada = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await camadasService.deleteCamada(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Camada no encontrada' });
    }
    
    res.json({ message: 'Camada eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar camada:', error);
    res.status(500).json({ error: 'Error al eliminar camada' });
  }
};
