class PainelController {
   showPainel(req, res) {
       const usuario = req.session.user || { userName: 'Visitante' }; 
       res.render('painel', {
           title: 'Painel de Controle',
           usuario
       });
   }
}
export default new PainelController();