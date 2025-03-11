import express from 'express';
import session from 'express-session';
import methodOverride from 'method-override';
import isAuthenticated from './src/middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();

// Configurações de caminho
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações da sessão
app.use(
	session({
		secret: 'suaChaveSecreta', // Altere para uma string segura
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			maxAge: 3600000 // 1 hora
		}
	})
);

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Rotas
import estabelecimentosRouter from './src/estabelecimentos/routes/estabelecimentosRoutes.js'
import painelRouter from './src/painel/painelRoutes.js';
import usersRouter from './src/users/routes/userRoutes.js';

app.use('/users', usersRouter);
app.use('/estabelecimentos', isAuthenticated, estabelecimentosRouter);
app.use('/', isAuthenticated, painelRouter);

// Error Handlingm
app.use((_req, res) => {
	res.status(404).render('404');
});

app.use((err, _req, res, _next) => {
	console.error(err.stack);
	res.status(500).render('500');
});

// Exporta a instância configurada
export default app;
