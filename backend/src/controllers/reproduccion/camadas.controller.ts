import { Request, Response } from 'express';
import * as camadasService from '../../services/reproduccion/camadas.service';

export const getAllCamadas = async (req: Request, res: Response) => {
  try {
    const { fechaNacimiento, numVivos, numMuertos, padreId, madreId, prenezId, numMachos, numHembras, crearCuyes } = req.body;

  try {
    const { fechaNacimiento, numVivos, numMuertos, padreId, madreId, prenezId, numMachos, numHembras, crearCuyes } = req.body;

  try {
    const { fechaNacimiento, numVivos, numMuertos, padreId, madreId, prenezId, numMachos, numHembras, crearCuyes } = req.body;

    // Validaciones básicas
    if (!fechaNacimiento) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de nacimiento es requerida'
      });
    }
    if (numVivos < 0 || numMuertos < 0) {
      return res.status(400).json({
        success: false,
        message: 'Los números de crías no pueden ser negativos'
      });
    }
    // Validar distribución de sexos si se van a crear cuyes
    if (crearCuyes && numVivos > 0) {
      if ((numMachos === undefined || numMachos === null) && numMachos !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar el número de machos'
        });
      }
      if ((numHembras === undefined || numHembras === null) && numHembras !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar el número de hembras'
        });
      }
      if ((Number(numMachos) + Number(numHembras)) !== Number(numVivos)) {
        return res.status(400).json({
          success: false,
          message: `La suma de machos (${numMachos}) y hembras (${numHembras}) debe ser igual al número de crías vivas (${numVivos})`
        });
      }
    }
    const camadaData = {
      fechaNacimiento: new Date(fechaNacimiento + 'T00:00:00.000Z'),
      numVivos,
      numMuertos,
      padreId: padreId || null,
      madreId: madreId || null,
      prenezId: prenezId || null
    };
    const result = await camadasService.createCamadaConCrias(camadaData, {
      crearCuyes: crearCuyes || false,
      numMachos: numMachos || 0,
      numHembras: numHembras || 0
    });
    res.status(201).json({
      success: true,
      data: result.camada,
      criasCreadas: result.criasCreadas || 0,
      message: `Camada creada exitosamente${result.criasCreadas ? ` con ${result.criasCreadas} crías generadas automáticamente` : ''}`
    });
  } catch (error: any) {
    // Si el error es por espacio insuficiente en la jaula, devolver 409
    if (typeof error?.message === 'string' && error.message.includes('No hay espacio suficiente en la jaula')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error al crear camada:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({
      success: false,
      message: 'Error al crear camada',
      error: errorMessage
    });
  }
    if (!numHembras && numHembras !== 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Debe especificar el número de hembras' 
      });
    }
    if (numMachos + numHembras !== numVivos) {
      return res.status(400).json({ 
        success: false,
        message: `La suma de machos (${numMachos}) y hembras (${numHembras}) debe ser igual al número de crías vivas (${numVivos})` 
      });
    }
  }
  const camadaData = {
    fechaNacimiento: new Date(fechaNacimiento + 'T00:00:00.000Z'),
    numVivos,
    numMuertos,
    padreId: padreId || null,
    madreId: madreId || null,
    prenezId: prenezId || null
  };
  try {
    const result = await camadasService.createCamadaConCrias(camadaData, {
      crearCuyes: crearCuyes || false,
      numMachos: numMachos || 0,
      numHembras: numHembras || 0
    });
    res.status(201).json({
      success: true,
      data: result.camada,
      criasCreadas: result.criasCreadas || 0,
      message: `Camada creada exitosamente${result.criasCreadas ? ` con ${result.criasCreadas} crías generadas automáticamente` : ''}`
    });
  } catch (error: any) {
    // Si el error es por espacio insuficiente en la jaula, devolver 409
    if (typeof error?.message === 'string' && error.message.includes('No hay espacio suficiente en la jaula')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error al crear camada:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false,
      message: 'Error al crear camada',
      error: errorMessage
    });
  }
    }

    const { fechaNacimiento, numVivos, numMuertos, padreId, madreId } = req.body;
    
    // Validaciones básicas
    if (!fechaNacimiento) {
      return res.status(400).json({ 
        success: false,
        message: 'La fecha de nacimiento es requerida' 
      });
    }
    
    if (numVivos < 0 || numMuertos < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Los números de crías no pueden ser negativos' 
      });
    }
    
    if (!madreId) {
      return res.status(400).json({ 
        success: false,
        message: 'La madre es requerida' 
      });
    }
    
    const updatedCamada = await camadasService.updateCamada(id, {
      fechaNacimiento: new Date(fechaNacimiento),
      numVivos,
      numMuertos,
      padreId,
      madreId
    });
    
    if (!updatedCamada) {
      return res.status(404).json({
        success: false,
        message: 'Camada no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedCamada,
      message: 'Camada actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar camada:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar camada',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const deleteCamada = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de camada inválido'
      });
    }

    const deleted = await camadasService.deleteCamada(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Camada no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Camada eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar camada:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar camada',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
