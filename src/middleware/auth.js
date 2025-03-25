const isAuthenticated = (req, res, next) => {
   console.log('Verificando sessão:', req.session);
   if (req.session && req.session.user) {
       console.log('Usuário na sessão:', req.session.user);
       return next();
   } else {
       console.log('Usuário não autenticado.');
       if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
           console.log('Requisição AJAX detectada. Retornando status 401.');
           return res.status(401).json({ message: 'Usuário não autenticado' });
       }
       console.log('Redirecionando para login.');
       return res.redirect('/users/login');
   }
};

export default isAuthenticated;