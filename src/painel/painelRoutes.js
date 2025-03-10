import express from 'express';
import PainelController from '../../src/painel/PainelController.js';

const painelRouter = express.Router();

// rota para renderizar o painel de controle
painelRouter.get('/painel', PainelController.showPainel);

export default painelRouter;
