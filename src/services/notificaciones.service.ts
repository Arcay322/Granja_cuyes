import api from './api';
import type { Prenez, ApiResponse } from '../types/api';

// Servicio específico para notificaciones de preñez
export const notificacionesService = {
  // Obtener próximos partos (partos programados en los próximos días)
  getProximosPartos: async (dias = 15) => {
    try {
      const response = await api.get(`/reproduccion/prenez/proximos-partos?dias=${dias}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener próximos partos:', error);
      throw error;
    }
  },
  
  // Obtener preñeces con fecha de parto vencida (sin registro de camada)
  getPartosVencidos: async () => {
    try {
      // Obtener todas las preñeces activas
      const response = await api.get('/reproduccion/prenez/activas');
      const hoy = new Date();
      
      // Filtrar las preñeces cuya fecha probable de parto ya pasó
      const prenezData = (response.data as ApiResponse<Prenez[]>)?.data || (response.data as Prenez[]) || [];
      const partosVencidos = prenezData.filter((prenez: Prenez) => {
        const fechaParto = new Date(prenez.fechaEstimadaParto);
        return fechaParto < hoy;
      });
      
      return partosVencidos;
    } catch (error) {
      console.error('Error al obtener partos vencidos:', error);
      throw error;
    }
  }
};
