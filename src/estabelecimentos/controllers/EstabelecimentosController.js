import { models } from '../../models/index.js';

class EstabelecimentosController {
	// Renderiza a tabela de estabelecimentos
	index = async (req, res) => {
		const usuario = req.session.user;
		try {
			let estabelecimentos = await models.Estabelecimentos.findAll();

			res.status(200).render('estabelecimentos/tabelaEstabelecimentos', {
				title: 'Tabela Com os Estabelecimentos',
				estabelecimentos,
				search: false,
				usuario
			});
		} catch (error) {
			console.error('Erro ao obter todos os estabelecimentos.', error);
			res
				.status(500)
				.json({ message: 'Erro ao obter todos os estabelecimentos.' });
		}
	};

	// Método para renderizar o formulário de cadastro e fazer o cadastro de um estabelecimento
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

			const produtos = req.body.produto;
			if (!produtos || (Array.isArray(produtos) && produtos.length === 0)) {
				throw new Error('Selecione pelo menos um produto');
			}

			const estabelecimento = {
				estabelecimento: req.body.estabelecimento
					? req.body.estabelecimento.trim().toUpperCase()
					: '',
				status: req.body.status ? req.body.status.trim().toLowerCase() : '',
				produto: Array.isArray(produtos)
					? produtos.map(p => p.trim().toUpperCase()).join(', ')
					: produtos.trim().toUpperCase(),
				chave:
					req.body.chave && req.body.chave.trim() !== ''
						? req.body.chave.trim()
						: '-',
				maquina:
					req.body.maquina && req.body.maquina.trim() !== ''
						? req.body.maquina.trim()
						: '-',
				endereco: req.body.endereco
					? req.body.endereco.trim().toUpperCase()
					: '',
				bairro: req.body.bairro ? req.body.bairro.trim().toUpperCase() : '',
				responsavel_nome: req.body.responsavel_nome
					? req.body.responsavel_nome.trim().toUpperCase()
					: '',
				telefone_contato: req.body.telefone_contato
					? req.body.telefone_contato.replace(/\D/g, '')
					: '',
				observacoes: req.body.observacoes
					? req.body.observacoes.trim().toUpperCase()
					: ''
			};

			await models.Estabelecimentos.create(estabelecimento);

			return res.redirect(
				'/estabelecimentos/add?success=Estabelecimento cadastrado com sucesso!'
			);
		} catch (error) {
			console.error('Erro no cadastro:', error);
			let errorMessage = error.message;
			if (error.name === 'SequelizeUniqueConstraintError') {
				const field = error.errors[0].path;
				errorMessage = `Já existe um registro com este ${
					field === 'telefone_contato' ? 'telefone' : field
				}`;
			}

			return res.render('estabelecimentos/cadastrarEstabelecimento', {
				title: 'Cadastrar Estabelecimento',
				success: null,
				error: errorMessage,
				usuario,
				estabelecimento: req.body
			});
		}
	}

	// Renderiza o formulário de edição de estabelecimento
	async editEstabelecimentoForm(req, res) {
		const usuario = req.session.user;
		try {
			const id = req.params.id;
			const estabelecimento = await models.Estabelecimentos.findByPk(id);
			if (!estabelecimento) {
				return res
					.status(404)
					.render('404', { title: 'Estabelecimento Not Found' });
			}
			const success = req.query.success || null;
			const error = req.query.error || null;
			const info = null; // Inicializa info como null para evitar o erro

			res.status(200).render('estabelecimentos/editarEstabelecimento', {
				title: 'Editar Estabelecimento',
				estabelecimento,
				success,
				error,
				info,
				usuario
			});
		} catch (error) {
			console.error('Erro ao buscar dados do estabelecimento.', error);
			res
				.status(500)
				.json({ message: 'Erro ao buscar dados do estabelecimento.' });
		}
	}

	// Método para atualizar estabelecimento
	async editEstabelecimento(req, res) {
		const usuario = req.session.user;
		const { id } = req.params;

		try {
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

			const produtos = req.body.produto;
			if (!produtos || (Array.isArray(produtos) && produtos.length === 0)) {
				throw new Error('Selecione pelo menos um produto');
			}

			const currentEstabelecimento = await models.Estabelecimentos.findByPk(id);
			if (!currentEstabelecimento) {
				throw new Error('Estabelecimento não encontrado');
			}

			const estabelecimentoData = {
				estabelecimento: req.body.estabelecimento
					? req.body.estabelecimento.trim().toUpperCase()
					: '',
				status: req.body.status ? req.body.status.trim().toLowerCase() : '',
				produto: Array.isArray(produtos)
					? produtos.map(p => p.trim().toUpperCase()).join(', ')
					: produtos.trim().toUpperCase(),
				chave:
					req.body.chave && req.body.chave.trim() !== ''
						? req.body.chave.trim()
						: '-',
				maquina:
					req.body.maquina && req.body.maquina.trim() !== ''
						? req.body.maquina.trim()
						: '-',
				endereco: req.body.endereco
					? req.body.endereco.trim().toUpperCase()
					: '',
				bairro: req.body.bairro ? req.body.bairro.trim().toUpperCase() : '',
				responsavel_nome: req.body.responsavel_nome
					? req.body.responsavel_nome.trim().toUpperCase()
					: '',
				telefone_contato: req.body.telefone_contato
					? req.body.telefone_contato.replace(/\D/g, '')
					: '',
				observacoes: req.body.observacoes
					? req.body.observacoes.trim().toUpperCase()
					: ''
			};

			const hasChanges = Object.keys(estabelecimentoData).some(key => {
				let currentValue = currentEstabelecimento[key] || '';
				let newValue = estabelecimentoData[key] || '';
				return currentValue.toString() !== newValue.toString();
			});

			if (!hasChanges) {
				return res.render('estabelecimentos/editarEstabelecimento', {
					title: 'Editar Estabelecimento',
					estabelecimento: currentEstabelecimento,
					info: 'Nenhuma alteração foi feita.',
					success: null,
					error: null,
					usuario
				});
			}

			const [affectedRows] = await models.Estabelecimentos.update(
				estabelecimentoData,
				{ where: { id } }
			);

			if (affectedRows === 0) {
				return res.render('estabelecimentos/editarEstabelecimento', {
					title: 'Editar Estabelecimento',
					estabelecimento: currentEstabelecimento,
					info: 'Nenhuma alteração foi feita.',
					success: null,
					error: null,
					usuario
				});
			}

			return res.render('estabelecimentos/editarEstabelecimento', {
				title: 'Editar Estabelecimento',
				estabelecimento: estabelecimentoData,
				success: 'Estabelecimento atualizado com sucesso!',
				info: null,
				error: null,
				usuario
			});
		} catch (error) {
			console.error('Erro na atualização:', error);
			let errorMessage = error.message;
			if (error.name === 'SequelizeUniqueConstraintError') {
				errorMessage = 'Já existe um registro com esses dados';
			}

			return res.render('estabelecimentos/editarEstabelecimento', {
				title: 'Editar Estabelecimento',
				estabelecimento: req.body,
				success: null,
				info: null,
				error: errorMessage,
				usuario
			});
		}
	}

	// Método para visualizar estabelecimento
	async viewEstabelecimento(req, res) {
		const usuario = req.session.user;
		try {
			const id = req.params.id;
			const estabelecimento = await models.Estabelecimentos.findByPk(id);
			if (!estabelecimento) {
				return res
					.status(404)
					.render('404', { title: 'Estabelecimento Not Found' });
			}

			res.status(200).render('estabelecimentos/visualizarEstabelecimento', {
				title: 'Visualizar Estabelecimento',
				estabelecimento,
				usuario
			});
		} catch (error) {
			console.error(
				'Erro ao buscar dados do estabelecimento para visualização.',
				error
			);
			res
				.status(500)
				.json({ message: 'Erro ao buscar dados do estabelecimento.' });
		}
	}

	async excluirEstabelecimento(req, res) {
		const id = req.params.id;
		try {
			const estabelecimento = await models.Estabelecimentos.findByPk(id);

			if (!estabelecimento) {
				return res
					.status(404)
					.render('404', { title: 'Estabelecimento Not Found' });
			}

			await models.Estabelecimentos.destroy({ where: { id } });
			console.log(`Estabelecimento com ID ${id} excluído com sucesso.`); // Depuração
			return res.status(204).end();
		} catch (error) {
			console.error('Erro na exclusão:', error);
			return res.status(500).json({
				message: 'Erro ao excluir estabelecimento',
				error: error.message
			});
		}
	}
}

export default new EstabelecimentosController();
