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
          const { username, password } = req.body;
          const lowerCaseUser = username.toLowerCase().trim();
  
          if (!username || !password) {
              return res.render('users/register', {
                  erro: 'Preencha todos os campos!',
                  success: null
              });
          }
  
          const userExists = await models.Users.findOne({
              where: { username: lowerCaseUser }
          });
  
          if (userExists) {
              return res.render('users/register', {
                  erro: 'Usuário já cadastrado!',
                  success: null
              });
          }
  
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
  
          await models.Users.create({
              username: lowerCaseUser,
              password: hashedPassword
          });
  
          return res.render('users/register', {
              success: 'Registro concluído com sucesso!',
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
      const { username, password } = req.body;
  
      if (!username || !password) {
          return res.render('users/formLogin', {
              erro: 'Por favor, preencha todos os campos!',
              success: null
          });
      }
  
      try {
          const userLowerCase = username.toLowerCase().trim();
          const foundUser = await models.Users.findOne({
              where: { username: userLowerCase }
          });
  
          if (!foundUser) {
              return res.render('users/formLogin', {
                  erro: 'Usuário não encontrado.',
                  success: null
              });
          }
  
          const validPassword = await bcrypt.compare(password, foundUser.password);
  
          if (validPassword) {
              // Adiciona os dados do usuário à sessão
              req.session.user = {
                  id: foundUser.id,
                  username: foundUser.username
              };
  
              // Retorna mensagem de sucesso ao frontend
              return res.render('users/formLogin', {
                  success: 'Login realizado com sucesso! Você será redirecionado.',
                  erro: null
              });
          } else {
              return res.render('users/formLogin', {
                  erro: 'Senha incorreta!',
                  success: null
              });
          }
      } catch (error) {
          console.error('Erro de autenticação:', error);
          return res.render('users/formLogin', {
              erro: 'Erro interno no servidor. Por favor, tente novamente.',
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
