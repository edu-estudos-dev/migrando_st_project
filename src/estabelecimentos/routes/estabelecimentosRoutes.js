import express from 'express';
import EstabelecimentosController from '../controllers/EstabelecimentosController.js';

const estabelecimentosRouter = express.Router();

// Rotas para adicionar um novo estabelecimento
estabelecimentosRouter
    .route('/add')
    .get(EstabelecimentosController.addEstabelecimento)
    .post(EstabelecimentosController.addEstabelecimento);

// Rota para listar todos os estabelecimentos
estabelecimentosRouter.get('/table', EstabelecimentosController.index);

// Rotas de edição
estabelecimentosRouter
    .route('/:id/edit')
    .get(EstabelecimentosController.editEstabelecimentoForm)
    .post(EstabelecimentosController.editEstabelecimento);

// Rota para visualizar os detalhes de um estabelecimento
estabelecimentosRouter.get('/:id/view', EstabelecimentosController.viewEstabelecimento);

// Rota para excluir um estabelecimento
estabelecimentosRouter.delete('/:id', EstabelecimentosController.excluirEstabelecimento);

export default estabelecimentosRouter;