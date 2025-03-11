// src/middleware/auth.js - Versão básica e funcional
const isAuthenticated = (req, res, next) => {
   // Verifica se o usuário está autenticado na sessão
   if (req.session && req.session.user) {
       // Se autenticado, continua para a próxima função
       return next();
   } else {
       // Se não autenticado, redireciona para login
       console.log('Usuário não autenticado. Redirecionando para login.');
       return res.redirect('/users/login');
   }
};

export default isAuthenticated;