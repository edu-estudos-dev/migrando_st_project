import express from 'express';
import session from 'express-session';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import isAuthenticated from './src/middleware/auth.js';

const app = express();

// Configurações de caminho para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações da sessão
app.use(
	session({
		secret: 'suaChaveSecreta', // Altere para uma string segura
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: process.env.NODE_ENV === 'production', // Apenas HTTPS em produção
			maxAge: 3600000 // 1 hora
		}
	})
);

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // Suporte a métodos como DELETE/PUT via formulários
app.use(express.static(path.join(__dirname, 'public'))); // Arquivos estáticos

// Configuração da View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Rotas
import estabelecimentosRouter from './src/estabelecimentos/routes/estabelecimentosRoutes.js';
import lancamentosRouter from './src/lancamentos/routes/lancamentosRoutes.js';
import painelRouter from './src/painel/painelRoutes.js';
import usersRouter from './src/users/routes/userRoutes.js';

app.use('/users', usersRouter); // Rotas de usuários (sem autenticação, provavelmente login)
app.use('/', isAuthenticated, painelRouter); // Painel principal, protegido
app.use('/estabelecimentos', isAuthenticated, estabelecimentosRouter); // Rotas de estabelecimentos, protegidas
app.use('/lancamentos', isAuthenticated, lancamentosRouter); // Rotas de lançamentos, protegidas

// Error Handling
app.use((_req, res) => {
	res.status(404).render('404'); // Página 404 para rotas não encontradas
});

app.use((err, _req, res, _next) => {
	console.error(err.stack);
	res.status(500).render('500'); // Página 500 para erros internos
});

// Exporta a instância configurada
export default app;
