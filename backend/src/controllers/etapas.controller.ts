import { Request, Response } from 'express';
import * as etapasService from '../services/etapas.service';

// Evaluar transiciones automáticas
export const evaluarTransiciones = async (req: Request, res: Response) => {
  try {
    const transiciones = await etapasService.evaluarTransicionesAutomaticas();
    res.json({
      message: 'Evaluación completada',
      transicionesSugeridas: transiciones.length,
      transiciones
    });
  } catch (error) {
    console.error('Error al evaluar transiciones:', error);
    res.status(500).json({ error: 'Error al evaluar transiciones' });
  }
};

// Aplicar transición manual
export const aplicarTransicion = async (req: Request, res: Response) => {
  try {
    const { cuyId } = req.params;
    const { nuevaEtapa, motivo } = req.body;
    
    if (!nuevaEtapa) {
      return res.status(400).json({ error: 'Nueva etapa es requerida' });
    }
    
    const resultado = await etapasService.aplicarTransicionEtapa(
      parseInt(cuyId), 
      nuevaEtapa, 
      motivo
    );
    
    res.json({
      message: 'Transición aplicada correctamente',
      ...resultado
    });
  } catch (error) {
    console.error('Error al aplicar transición:', error);
    res.status(500).json({ error: 'Error al aplicar transición' });
  }
};

// Obtener estadísticas de etapas
export const obtenerEstadisticas = async (req: Request, res: Response) => {
  try {
    const estadisticas = await etapasService.obtenerEstadisticasEtapas();
    res.json(estadisticas);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener próximas transiciones
export const obtenerProximasTransiciones = async (req: Request, res: Response) => {
  try {
    const { dias } = req.query;
    const diasAnticipacion = dias ? parseInt(dias as string) : 7;
    
    const proximas = await etapasService.obtenerProximasTransiciones(diasAnticipacion);
    res.json(proximas);
  } catch (error) {
    console.error('Error al obtener próximas transiciones:', error);
    res.status(500).json({ error: 'Error al obtener próximas transiciones' });
  }
};

// Actualizar propósito de un cuy
export const actualizarProposito = async (req: Request, res: Response) => {
  try {
    const { cuyId } = req.params;
    const { proposito } = req.body;
    
    if (!proposito) {
      return res.status(400).json({ error: 'Propósito es requerido' });
    }
    
    const cuy = await etapasService.actualizarProposito(parseInt(cuyId), proposito);
    
    res.json({
      message: 'Propósito actualizado correctamente',
      cuy
    });
  } catch (error) {
    console.error('Error al actualizar propósito:', error);
    res.status(500).json({ error: 'Error al actualizar propósito' });
  }
};
