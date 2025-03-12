// models/index.js (corrigido)
import { Sequelize } from 'sequelize';
import UserModel from '../users/models/UserModel.js';
import EstabelecimentosModel from '../estabelecimentos/models/EstabelecimentosModel.js';
import LancamentosModel from '../lancamentos/models/LancamentosModel.js';

const sequelize = new Sequelize('st_project_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false,
    timezone: '-03:00'
});

// Inicializar modelos
const models = {
    Users: UserModel(sequelize),
    Estabelecimentos: EstabelecimentosModel(sequelize),
    Lancamentos: LancamentosModel(sequelize) // Adicionado
};

// Configurar associações (se houver)
// Object.keys(models).forEach(modelName => {
//     if (models[modelName].associate) {
//         models[modelName].associate(models);
//     }
// });

export { models, sequelize };