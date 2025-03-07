import express from 'express';
import EstabelecimentosController from '../controllers/EstabelecimentosController.js';

const estabelecimentosRouter = express.Router();

estabelecimentosRouter.route('/add')
    .get(EstabelecimentosController.addEstabelecimento)
    .post(EstabelecimentosController.addEstabelecimento);

export default estabelecimentosRouter;