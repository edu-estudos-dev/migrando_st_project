import bcrypt from 'bcrypt';
import { models } from '../../models/index.js';

class UserController {
	// Método para renderizar formulário de login
	async showFormLogin(req, res, success) {
		res.render('users/formLogin', { erro: null, success: success || null });
	}

	// Método para renderizar formulário de 1º registro
	async showFormRegister(req, res) {
		res.render('users/register', {
			erro: null,
			success: null
		});
	}

	// Método para criar usuário
	async createUser(req, res) {
		try {
			const { userName, password } = req.body;
			const lowerCaseUser = userName.toLowerCase().trim();

			if (!userName || !password) {
				return res.render('register', {
					erro: 'Preencha todos os campos!',
					success: null
				});
			}

			const userExists = await models.Users.findOne({
				where: { userName: lowerCaseUser }
			});

			if (userExists) {
				return res.render('register', {
					erro: 'Usuário já cadastrado!',
					success: null
				});
			}

			// --- BLOCO DE CRIPTOGRAFIA ---
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			// ----------------------------

			await models.Users.create({
				userName: lowerCaseUser,
				password: hashedPassword
			});

			return res.render('users/formLogin', {
				success: 'Registro concluído! Redirecionando...',
				erro: null
			});
		} catch (error) {
			console.error('Erro no registro:', error);
			return res.render('users/register', {
				erro: 'Erro interno no servidor',
				success: null
			});
		}
	}

	// Autentica credenciais e inicia sessão do usuário
	async login(req, res) {
		const { userName, password } = req.body;

		if (!userName || !password) {
			return res.render('users/formLogin', {
				erro: 'Usuário ou senha incorretos.',
				success: null
			});
		}

		try {
			const userLowwerCase = userName.toLowerCase().trim();
			const foundUser = await models.Users.findOne({
				where: { userName: userLowwerCase }
			});

			if (!foundUser) {
				return res.render('users/formLogin', {
					erro: 'Usuário não cadastrado.',
					success: null
				});
			}

			const validPassword = await bcrypt.compare(password, foundUser.password);

			if (validPassword) {
				// Adicione esta verificação para garantir que a sessão existe
				if (!req.session) {
					throw new Error('Sessão não inicializada');
				}

				req.session.user = {
					id: foundUser.id,
					userName: foundUser.userName
				};

				return res.status(200).redirect('/painel');
			} else {
				return res.render('users/formLogin', {
					erro: 'Senha incorreta',
					success: null
				});
			}
		} catch (error) {
			console.error('Erro de autenticação:', error);
			return res.render('users/formLogin', {
				erro: 'Erro interno no servidor',
				success: null
			});
		}
	}

	// Metodo de logout
	logout = (req, res) => {
		req.session.destroy(err => {
			if (err) {
				console.error('Erro ao destruir sessão:', err);
				return res.status(500).render('500');
			}
			res.clearCookie('connect.sid', {
				path: '/',
				secure: process.env.NODE_ENV === 'production',
				httpOnly: true,
				sameSite: 'lax'
			});
			res.redirect('/users/login'); // Ou '/login' conforme suas rotas
		});
	};
}

export default new UserController();
