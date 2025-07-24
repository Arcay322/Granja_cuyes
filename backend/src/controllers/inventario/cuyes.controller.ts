// Obtener estadísticas reproductivas de un cuy (madre o padre)
import * as prenezService from '../../services/reproduccion/prenez.service';

// GET /cuyes/:id/estadisticas
export const getCuyEstadisticas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID de cuy inválido' });
    }
    // Buscar cuy
    const cuy = await cuyesService.getCuyById(id);
    if (!cuy) {
      return res.status(404).json({ success: false, message: 'Cuy no encontrado' });
    }

    let estadisticas = null;
    if (cuy.sexo === 'H') {
      estadisticas = await prenezService.getEstadisticasMadre(id);
      if (estadisticas) {
        // Calcular campos avanzados para la madre
        const { totalPreneces, prenecesExitosas, promedioLitada, tasaExito, historialPreneces } = estadisticas;
        // Crías vivas/muertas
        const camadas = historialPreneces.filter((p: any) => p.camada).map((p: any) => p.camada);
        const criasVivas = camadas.reduce((sum: number, c: any) => sum + (c.numVivos || 0), 0);
        const criasMuertas = camadas.reduce((sum: number, c: any) => sum + (c.numMuertos || 0), 0);
        // Fechas de partos
        const fechasPartos = camadas.map((c: any) => c.fechaNacimiento).sort();
        const primerParto = fechasPartos.length > 0 ? fechasPartos[0] : null;
        const ultimoParto = fechasPartos.length > 0 ? fechasPartos[fechasPartos.length - 1] : null;
        const diasDesdeUltimoParto = ultimoParto ? Math.floor((Date.now() - new Date(ultimoParto).getTime()) / (1000 * 60 * 60 * 24)) : null;
        // Días entre partos
        const diasEntrePartos = fechasPartos.length > 1 ? fechasPartos.slice(1).map((f: any, i: number) => Math.floor((new Date(f).getTime() - new Date(fechasPartos[i]).getTime()) / (1000 * 60 * 60 * 24))) : [];
        // Abortos
        const abortos = historialPreneces.filter((p: any) => p.estado === 'fallida').length;
        // Partos próximos
        const partosProximos = historialPreneces.filter((p: any) => p.estado === 'activa').length;
        estadisticas = {
          resumen: {
            totalPreneces,
            prenecesExitosas,
            promedioLitada,
            tasaExito,
            abortos,
            partosProximos,
            primerParto,
            ultimoParto,
            diasDesdeUltimoParto
          },
          crias: {
            vivas: criasVivas,
            muertas: criasMuertas
          },
          dinamica: {
            diasEntrePartos
          },
          historialPreneces
        };
      }
    } else if (cuy.sexo === 'M') {
      estadisticas = await prenezService.getEstadisticasPadre(id);
      if (estadisticas) {
        const { totalCruces, crucesExitosos, promedioDescendencia, tasaExito, historialCruces } = estadisticas;
        // Hijos vivos/muertos
        const camadas = historialCruces.filter((p: any) => p.camada).map((p: any) => p.camada);
        const hijosVivos = camadas.reduce((sum: number, c: any) => sum + (c.numVivos || 0), 0);
        const hijosMuertos = camadas.reduce((sum: number, c: any) => sum + (c.numMuertos || 0), 0);
        // Fechas de montas
        const fechasMontas = historialCruces.map((p: any) => p.fechaPrenez).sort();
        const primerMonta = fechasMontas.length > 0 ? fechasMontas[0] : null;
        const ultimaMonta = fechasMontas.length > 0 ? fechasMontas[fechasMontas.length - 1] : null;
        const diasDesdeUltimaMonta = ultimaMonta ? Math.floor((Date.now() - new Date(ultimaMonta).getTime()) / (1000 * 60 * 60 * 24)) : null;
        estadisticas = {
          resumen: {
            totalCruces,
            crucesExitosos,
            promedioDescendencia,
            tasaExito,
            primerMonta,
            ultimaMonta,
            diasDesdeUltimaMonta
          },
          hijos: {
            vivos: hijosVivos,
            muertos: hijosMuertos
          },
          historialCruces
        };
      }
    } else {
      estadisticas = { message: 'Sexo de cuy no reconocido para estadísticas reproductivas' };
    }
    res.status(200).json({ success: true, data: estadisticas, message: 'Estadísticas reproductivas avanzadas obtenidas' });
  } catch (error) {
    console.error('Error en getCuyEstadisticas:', error);
    next(error);
  }
};
import { Request, Response, NextFunction } from 'express';
import * as cuyesService from '../../services/inventario/cuyes.service';

export const getAllCuyes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      galpon, 
      jaula, 
      raza, 
      sexo, 
      estado, 
      etapaVida, 
      proposito,
      search 
    } = req.query;
    
    // Construir filtros
    const filters: Record<string, any> = {};
    if (galpon && typeof galpon === 'string') filters.galpon = galpon;
    if (jaula && typeof jaula === 'string') filters.jaula = jaula;
    if (raza && typeof raza === 'string') filters.raza = raza;
    if (sexo && typeof sexo === 'string') filters.sexo = sexo;
    if (estado && typeof estado === 'string') filters.estado = estado;
    if (etapaVida && typeof etapaVida === 'string') filters.etapaVida = etapaVida;
    if (proposito && typeof proposito === 'string') filters.proposito = proposito;
    if (search && typeof search === 'string') filters.search = search;
    
    // Configurar paginación
    const pagination = {
      page: Math.max(1, Number(page)),
      limit: Math.min(100, Math.max(1, Number(limit))) // Máximo 100 por página
    };
    
    const result = await cuyesService.getAllCuyesPaginated(filters, pagination);
    
    res.status(200).json({
      success: true,
      data: result.cuyes,
      pagination: result.pagination,
      filters: filters,
      message: `${result.pagination.total} cuyes encontrados`
    });
  } catch (error: unknown) {
    console.error('Error en getAllCuyes:', error);
    next(error);
  }
};

export const getCuyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const cuy = await cuyesService.getCuyById(id);
    if (!cuy) {
      return res.status(404).json({
        success: false,
        message: 'Cuy no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cuy,
      message: 'Cuy obtenido exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en getCuyById:', error);
    next(error);
  }
};

export const createCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuy = await cuyesService.createCuy(req.body);
    res.status(201).json({
      success: true,
      data: cuy,
      message: 'Cuy creado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en createCuy:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cuy con esos datos',
        error: 'Datos duplicados'
      });
    }
    next(error);
  }
};

export const updateCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const cuy = await cuyesService.updateCuy(id, req.body);
    if (!cuy) {
      return res.status(404).json({
        success: false,
        message: 'Cuy no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cuy,
      message: 'Cuy actualizado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en updateCuy:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cuy con esos datos',
        error: 'Datos duplicados'
      });
    }
    next(error);
  }
};

// Verificar relaciones antes de eliminar
export const verificarRelacionesCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const relaciones = await cuyesService.verificarRelacionesCuy(id);
    
    res.status(200).json({
      success: true,
      data: relaciones,
      message: 'Relaciones del cuy verificadas exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en verificarRelacionesCuy:', error);
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: 'Cuy no encontrado'
      });
    }
    next(error);
  }
};

// Eliminar cuy con todas sus relaciones
export const deleteCuyConRelaciones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const resultado = await cuyesService.deleteCuyConRelaciones(id);
    
    if (resultado.success) {
      res.status(200).json({
        success: true,
        data: resultado,
        message: `Cuy eliminado exitosamente junto con ${Object.keys(resultado.eliminados).length} tipos de registros relacionados`
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Error al eliminar el cuy',
        errors: resultado.errores
      });
    }
  } catch (error: unknown) {
    console.error('Error en deleteCuyConRelaciones:', error);
    next(error);
  }
};

export const deleteCuy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const deleted = await cuyesService.deleteCuy(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Cuy no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cuy eliminado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en deleteCuy:', error);
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('referencia')) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el cuy',
        error: error.message
      });
    }
    next(error);
  }
};

export const getCuyesStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await cuyesService.getCuyesStats();
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Estadísticas de cuyes obtenidas exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en getCuyesStats:', error);
    next(error);
  }
};

export const cambiarAReproductor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const cuy = await cuyesService.cambiarProposito(id, 'Reproducción', 'Reproductor');
    if (!cuy) {
      return res.status(404).json({
        success: false,
        message: 'Cuy no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cuy,
      message: 'Cuy cambiado a reproductor exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en cambiarAReproductor:', error);
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('edad')) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar a reproductor',
        error: error.message
      });
    }
    next(error);
  }
};

export const cambiarAEngorde = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const cuy = await cuyesService.cambiarProposito(id, 'Engorde', 'Engorde');
    if (!cuy) {
      return res.status(404).json({
        success: false,
        message: 'Cuy no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cuy,
      message: 'Cuy cambiado a engorde exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en cambiarAEngorde:', error);
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('edad')) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar a engorde',
        error: error.message
      });
    }
    next(error);
  }
};

export const crearCuyesPorJaula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuyesCreados = await cuyesService.crearCuyesPorJaula(req.body);
    res.status(201).json({
      success: true,
      data: cuyesCreados,
      message: `${cuyesCreados.length} cuyes creados exitosamente`
    });
  } catch (error: unknown) {
    console.error('Error en crearCuyesPorJaula:', error);
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('capacidad')) {
      return res.status(400).json({
        success: false,
        message: 'Error de capacidad en la jaula',
        error: error.message
      });
    }
    next(error);
  }
};

export const getCuyesDisponiblesParaVenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cuyes = await cuyesService.getCuyesDisponiblesParaVenta();
    res.status(200).json({
      success: true,
      data: cuyes,
      message: `${cuyes.length} cuyes disponibles para venta`
    });
  } catch (error: unknown) {
    console.error('Error en getCuyesDisponiblesParaVenta:', error);
    next(error);
  }
};

// ===== NUEVOS CONTROLADORES AVANZADOS =====

export const getCuyesEstadisticasAvanzadas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { periodo = '30' } = req.query;
    const stats = await cuyesService.getEstadisticasAvanzadas(Number(periodo));
    
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Estadísticas avanzadas obtenidas exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en getCuyesEstadisticasAvanzadas:', error);
    next(error);
  }
};

export const getCuyHistorial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cuy inválido'
      });
    }
    
    const historial = await cuyesService.getCuyHistorial(id);
    
    res.status(200).json({
      success: true,
      data: historial,
      message: 'Historial del cuy obtenido exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en getCuyHistorial:', error);
    next(error);
  }
};

export const getCuyesPorEtapa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { etapa } = req.params;
    if (!etapa) {
      return res.status(400).json({
        success: false,
        message: 'Etapa de vida requerida'
      });
    }
    
    const cuyes = await cuyesService.getCuyesPorEtapa(etapa);
    
    res.status(200).json({
      success: true,
      data: cuyes,
      message: `${cuyes.length} cuyes en etapa ${etapa}`
    });
  } catch (error: unknown) {
    console.error('Error en getCuyesPorEtapa:', error);
    next(error);
  }
};

export const actualizarEtapasAutomaticamente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resultado = await cuyesService.actualizarEtapasAutomaticamente();
    
    res.status(200).json({
      success: true,
      data: resultado,
      message: `${resultado.actualizados} cuyes actualizados automáticamente`
    });
  } catch (error: unknown) {
    console.error('Error en actualizarEtapasAutomaticamente:', error);
    next(error);
  }
};
export
 const getEstadisticasPorJaula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { galpon, jaula } = req.query;
    
    if (!galpon || !jaula) {
      return res.status(400).json({
        success: false,
        message: 'Galpón y jaula son requeridos'
      });
    }
    
    const stats = await cuyesService.getEstadisticasPorJaula(
      galpon as string, 
      jaula as string
    );
    
    res.status(200).json({
      success: true,
      data: stats,
      message: `Estadísticas de la jaula ${jaula} en galpón ${galpon} obtenidas exitosamente`
    });
  } catch (error: unknown) {
    console.error('Error en getEstadisticasPorJaula:', error);
    next(error);
  }
};