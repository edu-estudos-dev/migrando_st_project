// models/index.js (corrigido)
import { Sequelize } from 'sequelize';
import UserModel from '../users/models/UserModel.js';

const sequelize = new Sequelize('st_project_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false,
    timezone: '-03:00'
});

// Inicializar modelos
const models = {
    Users: UserModel(sequelize) 
};

// Configurar associações
// models.Category.associate(models);
// models.Article.associate(models);

export { models, sequelize };