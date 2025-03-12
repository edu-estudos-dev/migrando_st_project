import express from 'express';
import LancamentosController from '../controllers/LancamentosController.js';

const lancamentosRouter = express.Router();

// Rotas para adicionar um novo lançamento
lancamentosRouter
    .route('/add')
    .get(LancamentosController.addLancamento)
    .post(LancamentosController.addLancamento);

// // Rota para listar todos os lançamentos
// lancamentosRouter.get('/table', LancamentosController.index);

// // Rotas de edição
// lancamentosRouter
//     .route('/:id/edit')
//     .get(LancamentosController.editLancamentoForm)
//     .post(LancamentosController.editLancamento);

// // Rota para visualizar os detalhes de um lançamento
// lancamentosRouter.get('/:id/view', LancamentosController.viewLancamento);

// // Rota para excluir um lançamento
// lancamentosRouter.delete('/:id', LancamentosController.excluirLancamento);

export default lancamentosRouter;