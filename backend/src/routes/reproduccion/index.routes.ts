import express from 'express';
import prenezRoutes from './prenez.routes';
import camadasRoutes from './camadas.routes';
import { authenticateToken } from '../../middlewares/auth';

const router = express.Router();

// Aplicar autenticación a todas las rutas de reproducción
router.use(authenticateToken);

// Rutas de preñez
router.use('/prenez', prenezRoutes);

// Rutas de camadas
router.use('/camadas', camadasRoutes);

// Ruta de estadísticas generales de reproducción
router.get('/stats', async (req, res) => {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const prenezController = await import('../../controllers/reproduccion/prenez.controller');
    await prenezController.getEstadisticas(req, res);
  } catch (error) {
    console.error('Error en ruta de estadísticas de reproducción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;