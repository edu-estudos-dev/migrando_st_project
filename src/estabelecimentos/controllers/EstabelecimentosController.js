import { models } from '../../models/index.js';

class EstabelecimentosController {
    async addEstabelecimento(req, res) {
        const usuario = req.session.user;
        const success = req.query.success || null;
        const error = req.query.error || null;

        if (req.method === 'GET') {
            return res.render('estabelecimentos/cadastrarEstabelecimento', {
                title: 'Cadastrar Estabelecimento',
                success,
                error,
                usuario
            });
        }

        try {
            // Validação de campos obrigatórios
            const requiredFields = [
                'estabelecimento',
                'status',
                'endereco',
                'bairro',
                'responsavel_nome',
                'telefone_contato'
            ];
            
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    throw new Error(`Preencha o campo obrigatório: ${field}`);
                }
            }

            // Validação de produtos
            const produtos = req.body.produto;
            if (!produtos || (Array.isArray(produtos) && produtos.length === 0)) {
                throw new Error('Selecione pelo menos um produto');
            }

            // Formatação dos dados
            const estabelecimento = {
                estabelecimento: req.body.estabelecimento.trim().toUpperCase(),
                status: req.body.status.trim().toLowerCase(), // Corrigido para minúsculas
                produto: Array.isArray(produtos)
                    ? produtos.map(p => p.trim().toUpperCase()).join(', ')
                    : produtos.trim().toUpperCase(),
                chave: req.body.chave?.trim() || '',
                maquina: req.body.maquina?.trim() || '',
                endereco: req.body.endereco.trim().toUpperCase(),
                bairro: req.body.bairro.trim().toUpperCase(),
                responsavel_nome: req.body.responsavel_nome.trim().toUpperCase(),
                telefone_contato: req.body.telefone_contato.replace(/\D/g, ''), // Remove formatação
                observacoes: req.body.observacoes?.trim().toUpperCase() || ''
            };

            await models.Estabelecimentos.create(estabelecimento);

            // Redirecionamento com mensagem de sucesso
            return res.redirect('/estabelecimentos/add?success=Estabelecimento cadastrado com sucesso!');

        } catch (error) {
            console.error('Erro no cadastro:', error);

            // Tratamento de erros específicos
            let errorMessage = error.message;
            if (error.name === 'SequelizeUniqueConstraintError') {
                const field = error.errors[0].path;
                errorMessage = `Já existe um registro com este ${field === 'telefone_contato' ? 'telefone' : field}`;
            }

            // Renderiza novamente o formulário com os dados preenchidos
            return res.render('estabelecimentos/cadastrarEstabelecimento', {
                title: 'Cadastrar Estabelecimento',
                success: null,
                error: errorMessage,
                usuario,
                estabelecimento: req.body // Mantém os dados preenchidos
            });
        }
    }
}

export default new EstabelecimentosController();