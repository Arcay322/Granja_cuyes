import express from 'express';
import * as debugController from '../controllers/debug.controller';

const router = express.Router();

router.get('/etapas', debugController.debugEtapas);

export default router;
