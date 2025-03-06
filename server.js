import dotenv from 'dotenv';
import app from './app.js';
import { setupDatabase } from './database/connection.js';

// Configura variáveis de ambiente
dotenv.config();

const PORT = process.env.PORT || 3000;

// Função para iniciar o servidor
const startServer = async () => {
	try {
		// 1. Configura o banco de dados
		await setupDatabase();

		// 2. Inicia o servidor HTTP
		app.listen(PORT, () => {
			console.log(`✅ Server running at: http://localhost:${PORT}/users/login`);
			console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
		});
	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1); // Encerra o processo com erro
	}
};

// Inicia a aplicação
startServer();

// Captura erros não tratados
process.on('unhandledRejection', reason => {
	console.error('⚠️  Unhandled Rejection:', reason);
});

process.on('uncaughtException', error => {
	console.error('⚠️  Uncaught Exception:', error);
	process.exit(1);
});
