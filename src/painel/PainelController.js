class PainelController {
   showPainel(req, res) {
       const usuario = req.session.user || { userName: 'Visitante' }; 
       console.log('Usuário na sessão:', usuario); 
       res.render('painel', {
           title: 'Painel de Controle',
           usuario
       });
   }
}
export default new PainelController();