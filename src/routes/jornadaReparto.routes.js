import { Router } from 'express';
import * as jornadaRepartoController from '../controllers/jornadaReparto.controller.js';


const router = Router();

router.get('/', jornadaRepartoController.obtenerJornadas);

router.get('/mapa-general',jornadaRepartoController.obtenerMapaGeneral);

router.get('/:id', jornadaRepartoController.obtenerJornadaPorId);

router.post('/generar', jornadaRepartoController.generarJornadaReparto);

router.patch('/:id/recalcular', jornadaRepartoController.recalcularJornada);

router.patch('/:id/iniciar', jornadaRepartoController.iniciarJornada);

router.patch('/:id/avanzar', jornadaRepartoController.avanzarJornada);

router.patch('/:id/finalizar', jornadaRepartoController.finalizarJornada);


export default router;

