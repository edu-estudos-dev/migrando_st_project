import express from 'express';
import EstabelecimentosController from '../controllers/EstabelecimentosController.js';

const estabelecimentosRouter = express.Router();

estabelecimentosRouter
	.route('/add')
	.get(EstabelecimentosController.addEstabelecimento)
	.post(EstabelecimentosController.addEstabelecimento);

// rota para renderizar a tabeleca com os estabeleciments
estabelecimentosRouter.get('/table', EstabelecimentosController.index);

export default estabelecimentosRouter;
