import { Request, Response } from 'express';
import * as camadasService from '../../services/reproduccion/camadas.service';

export const getAllCamadas = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      fechaDesde,
      fechaHasta,
      search,
      galpon,
      jaula
    } = req.query;
    
    // Construir filtros
    const filters: Record<string, unknown> = {};
    if (fechaDesde && typeof fechaDesde === 'string') filters.fechaDesde = fechaDesde;
    if (fechaHasta && typeof fechaHasta === 'string') filters.fechaHasta = fechaHasta;
    if (search && typeof search === 'string') filters.search = search;
    if (galpon && typeof galpon === 'string') filters.galpon = galpon;
    if (jaula && typeof jaula === 'string') filters.jaula = jaula;
    
    // Configurar paginación
    const pagination = {
      page: Math.max(1, Number(page)),
      limit: Math.min(100, Math.max(1, Number(limit)))
    };
    
    const result = await camadasService.getAllCamadasPaginated(filters, pagination);
    
    res.status(200).json({
      success: true,
      data: result.camadas,
      pagination: result.pagination,
      filters: filters,
      message: `${result.pagination.total} camadas encontradas`
    });
  } catch (error) {
    console.error('Error al obtener camadas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener camadas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getCamadaById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de camada inválido'
      });
    }

    const camada = await camadasService.getCamadaById(id);
    
    if (!camada) {
      return res.status(404).json({
        success: false,
        message: 'Camada no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: camada,
      message: 'Camada obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener camada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener camada',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const createCamada = async (req: Request, res: Response) => {
  try {
    const { 
      fechaNacimiento, 
      numVivos, 
      numMuertos, 
      padreId, 
      madreId, 
      prenezId,
      numMachos,
      numHembras,
      crearCuyes 
    } = req.body;
    
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
      if (!numMachos && numMachos !== 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Debe especificar el número de machos' 
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

    // Crear camada con crías automáticamente si se especifica
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
  } catch (error) {
    console.error('Error al crear camada:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      success: false,
      message: 'Error al crear camada',
      error: errorMessage
    });
  }
};

export const updateCamada = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de camada inválido'
      });
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
