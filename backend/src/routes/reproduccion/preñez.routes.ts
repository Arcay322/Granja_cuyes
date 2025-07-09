import express from 'express';
import * as preñezController from '../../controllers/reproduccion/preñez.controller';

const router = express.Router();

// Rutas para gestionar preñeces
router.get('/', preñezController.getAll);
router.get('/activas', preñezController.getActivas);
router.get('/proximos-partos', preñezController.getProximosPartos);
router.get('/:id', preñezController.getById);
router.post('/', preñezController.create);
router.put('/:id', preñezController.update);
router.delete('/:id', preñezController.remove);
router.post('/:id/completar', preñezController.completar);
router.post('/:id/fallida', preñezController.marcarFallida);

export default router;
