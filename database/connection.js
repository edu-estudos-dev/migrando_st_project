// database/connection.js
import { models, sequelize } from '../src/models/index.js';

// Testar conexão com o banco
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco estabelecida!');
  } catch (error) {
    console.error('❌ Falha na conexão com o banco:', error);
    process.exit(1);
  }
};

// Sincronizar com o banco de dados
const syncDatabase = async () => {
   try {
   //   await sequelize.sync({ force: false, alter: true });
     console.log('🔄 Banco sincronizado!');
   } catch (error) {
     console.error('❌ Erro na sincronização:', error);
     process.exit(1);
   }
 };
// Fluxo principal
const setupDatabase = async () => {
  await testConnection();
  await syncDatabase();
};

export { sequelize, models, setupDatabase };