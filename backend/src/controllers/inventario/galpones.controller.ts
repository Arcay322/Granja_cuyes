import { Request, Response, NextFunction } from 'express';
import * as galponesService from '../../services/inventario/galpones.service';

// ===== CONTROLADORES PARA GALPONES =====

export const getAllGalpones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const galpones = await galponesService.getAllGalpones();
    res.status(200).json({
      success: true,
      data: galpones,
      message: 'Galpones obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error en getAllGalpones:', error);
    next(error);
  }
};

export const getGalponById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de galpón inválido'
      });
    }

    const galpon = await galponesService.getGalponById(id);
    if (!galpon) {
      return res.status(404).json({
        success: false,
        message: 'Galpón no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: galpon,
      message: 'Galpón obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error en getGalponById:', error);
    next(error);
  }
};

export const getGalponByNombre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre } = req.params;
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nombre de galpón requerido'
      });
    }

    const galpon = await galponesService.getGalponByNombre(nombre);
    if (!galpon) {
      return res.status(404).json({
        success: false,
        message: 'Galpón no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: galpon,
      message: 'Galpón obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error en getGalponByNombre:', error);
    next(error);
  }
};

export const createGalpon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const galpon = await galponesService.createGalpon(req.body);
    res.status(201).json({
      success: true,
      data: galpon,
      message: 'Galpón creado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en createGalpon:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un galpón con ese nombre',
        error: 'Nombre duplicado'
      });
    }
    next(error);
  }
};

export const updateGalpon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de galpón inválido'
      });
    }

    const galpon = await galponesService.updateGalpon(id, req.body);
    if (!galpon) {
      return res.status(404).json({
        success: false,
        message: 'Galpón no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: galpon,
      message: 'Galpón actualizado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en updateGalpon:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un galpón con ese nombre',
        error: 'Nombre duplicado'
      });
    }
    next(error);
  }
};

export const deleteGalpon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de galpón inválido'
      });
    }

    const deleted = await galponesService.deleteGalpon(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Galpón no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Galpón eliminado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en deleteGalpon:', error);
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('cuyes asignados')) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el galpón',
        error: error.message
      });
    }
    next(error);
  }
};

// ===== CONTROLADORES PARA JAULAS =====

export const getAllJaulas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jaulas = await galponesService.getAllJaulas();
    res.status(200).json({
      success: true,
      data: jaulas,
      message: 'Jaulas obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error en getAllJaulas:', error);
    next(error);
  }
};

export const getJaulaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de jaula inválido'
      });
    }

    const jaula = await galponesService.getJaulaById(id);
    if (!jaula) {
      return res.status(404).json({
        success: false,
        message: 'Jaula no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: jaula,
      message: 'Jaula obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error en getJaulaById:', error);
    next(error);
  }
};

export const getJaulasByGalpon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { galpon } = req.params;
    if (!galpon || galpon.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nombre de galpón requerido'
      });
    }

    const jaulas = await galponesService.getJaulasByGalpon(galpon);
    res.status(200).json({
      success: true,
      data: jaulas,
      message: 'Jaulas del galpón obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error en getJaulasByGalpon:', error);
    next(error);
  }
};

export const createJaula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jaula = await galponesService.createJaula(req.body);
    res.status(201).json({
      success: true,
      data: jaula,
      message: 'Jaula creada exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en createJaula:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una jaula con ese nombre en el galpón',
        error: 'Nombre duplicado'
      });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'El galpón especificado no existe',
        error: 'Galpón no encontrado'
      });
    }
    next(error);
  }
};

export const updateJaula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de jaula inválido'
      });
    }

    const jaula = await galponesService.updateJaula(id, req.body);
    if (!jaula) {
      return res.status(404).json({
        success: false,
        message: 'Jaula no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: jaula,
      message: 'Jaula actualizada exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en updateJaula:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una jaula con ese nombre en el galpón',
        error: 'Nombre duplicado'
      });
    }
    next(error);
  }
};

export const deleteJaula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de jaula inválido'
      });
    }

    const deleted = await galponesService.deleteJaula(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Jaula no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Jaula eliminada exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en deleteJaula:', error);
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('cuyes asignados')) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la jaula',
        error: error.message
      });
    }
    next(error);
  }
};

// ===== CONTROLADORES DE ESTADÍSTICAS =====

export const getEstadisticasGalpon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { galpon } = req.params;
    if (!galpon || galpon.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nombre de galpón requerido'
      });
    }

    const estadisticas = await galponesService.getEstadisticasGalpon(galpon);
    res.status(200).json({
      success: true,
      data: estadisticas,
      message: 'Estadísticas del galpón obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error en getEstadisticasGalpon:', error);
    next(error);
  }
};

export const getResumenTodosGalpones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resumen = await galponesService.getResumenTodosGalpones();
    res.status(200).json({
      success: true,
      data: resumen,
      message: 'Resumen de galpones obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error en getResumenTodosGalpones:', error);
    next(error);
  }
};

export const sugerirUbicacionCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sexo, proposito } = req.query;
    const sugerencia = await galponesService.sugerirUbicacionCuy(
      sexo as string || 'Indefinido', 
      proposito as string || 'Indefinido'
    );
    
    if (!sugerencia) {
      return res.status(404).json({
        success: false,
        message: 'No hay espacio disponible en ningún galpón',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      data: sugerencia,
      message: 'Sugerencia de ubicación generada exitosamente'
    });
  } catch (error) {
    console.error('Error en sugerirUbicacionCuy:', error);
    next(error);
  }
};

// Verificar capacidad de jaula específica
export const checkJaulaCapacity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { galpon, jaula } = req.params;
    
    if (!galpon || !jaula) {
      return res.status(400).json({
        success: false,
        message: 'Galpón y jaula son requeridos'
      });
    }

    const capacityInfo = await galponesService.getJaulaCapacityInfo(galpon, jaula);
    
    if (!capacityInfo) {
      return res.status(404).json({
        success: false,
        message: 'Jaula no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: capacityInfo,
      message: 'Información de capacidad obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error en checkJaulaCapacity:', error);
    next(error);
  }
};