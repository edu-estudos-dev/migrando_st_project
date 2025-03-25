import { models, sequelize } from '../../models/index.js';

class LancamentosController {
	// Renderiza a tabela de Lançamentos
	index = async (req, res) => {
		const usuario = req.session.user;
		try {
			let lancamentos = await models.Lancamentos.findAll();

			res.status(200).render('lancamentos/tabelaLancamentos', {
				title: 'Tabela Com os Lancamentos',
				lancamentos,
				search: false,
				usuario
			});
		} catch (error) {
			console.error('Erro ao obter todos os lancamentos.', error);
			res.status(500).json({ message: 'Erro ao obter todos os lancamentos.' });
		}
	};

	// Método para renderizar o formulário de cadastro e fazer o cadastro de um lançamento
	async addLancamento(req, res) {
		const usuario = req.session.user;
		const success = req.query.success || null;
		const error = req.query.error || null;

		if (req.method === 'GET') {
			return res.render('lancamentos/cadastrarLancamentos', {
				title: 'Cadastrar Lançamento',
				success,
				error,
				usuario
			});
		}

		try {
			const requiredFields = [
				'entrada_saida',
				'data',
				'tipo_de_lancamento',
				'produto',
				'forma_de_pagamento',
				'qtde_de_parcelas',
				'valor',
				'descricao'
			];

			for (const field of requiredFields) {
				if (!req.body[field]) {
					throw new Error(`Preencha o campo obrigatório: ${field}`);
				}
			}

			const entradaSaida = req.body.entrada_saida
				? req.body.entrada_saida.trim()
				: '';
			const tipoDeLancamento = req.body.tipo_de_lancamento
				? req.body.tipo_de_lancamento.trim().toLowerCase()
				: '';
			const qtdeDeParcelas = req.body.qtde_de_parcelas
				? parseInt(req.body.qtde_de_parcelas)
				: 0;
			const valorTotal = req.body.valor
				? parseFloat(req.body.valor.replace(',', '.'))
				: 0.0;

			// Dados comuns a todos os registros
			const lancamentoBase = {
				entrada_saida: entradaSaida,
				data: req.body.data ? req.body.data : null,
				tipo_de_lancamento: tipoDeLancamento,
				produto: req.body.produto ? req.body.produto.trim().toLowerCase() : '',
				forma_de_pagamento: req.body.forma_de_pagamento
					? req.body.forma_de_pagamento.trim().toLowerCase()
					: '',
				descricao: req.body.descricao ? req.body.descricao.trim() : '',
				usuario: usuario.username
			};

			// Verificar se é uma compra parcelada (Saída, Compra, mais de 1 parcela)
			if (
				entradaSaida === 'Saida' &&
				tipoDeLancamento === 'compra' &&
				qtdeDeParcelas > 1
			) {
				// Iniciar uma transação para garantir consistência
				const t = await sequelize.transaction();

				try {
					const valorPorParcela = valorTotal / qtdeDeParcelas; // Ex.: 3000 / 3 = 1000 por parcela
					let vencimentoBase = req.body.vencimento
						? new Date(req.body.vencimento)
						: null;

					// Criar um registro para cada parcela
					for (let i = 0; i < qtdeDeParcelas; i++) {
						let vencimentoParcela = null;
						if (vencimentoBase) {
							// Incrementar a data de vencimento para cada parcela (adicionar i meses)
							vencimentoParcela = new Date(vencimentoBase);
							vencimentoParcela.setMonth(vencimentoParcela.getMonth() + i);
						}

						// Ajustar a descrição para incluir o número da parcela
						const descricaoParcela = lancamentoBase.descricao
							? `${lancamentoBase.descricao} (Parcela ${i + 1} de ${qtdeDeParcelas})`
							: ` ${i + 1} de ${qtdeDeParcelas}`;

						const lancamentoParcela = {
							...lancamentoBase,
							qtde_de_parcelas: 1, // Cada registro representa uma parcela
							parcela_atual: i + 1, // Número da parcela atual (1, 2, 3, ...)
							total_parcelas: qtdeDeParcelas, // Total de parcelas
							valor: valorPorParcela, // Valor ajustado para a parcela
							descricao: descricaoParcela, // Descrição ajustada
							vencimento: vencimentoParcela
								? vencimentoParcela.toISOString().split('T')[0]
								: null, // Formato YYYY-MM-DD
							dia_do_cadastro: new Date(),
							ultima_edicao: new Date()
						};

						await models.Lancamentos.create(lancamentoParcela, {
							transaction: t
						});
					}

					// Confirmar a transação
					await t.commit();
				} catch (error) {
					// Reverter a transação em caso de erro
					await t.rollback();
					throw error;
				}
			} else {
				// Caso não seja uma compra parcelada, criar um único registro
				const lancamento = {
					...lancamentoBase,
					qtde_de_parcelas: qtdeDeParcelas,
					parcela_atual: null, // Não é parcelado
					total_parcelas: null, // Não é parcelado
					valor: valorTotal,
					vencimento: req.body.vencimento ? req.body.vencimento : null,
					dia_do_cadastro: new Date(),
					ultima_edicao: new Date()
				};

				await models.Lancamentos.create(lancamento);
			}

			return res.redirect(
				'/lancamentos/add?success=Lançamento cadastrado com sucesso!'
			);
		} catch (error) {
			console.error('Erro no cadastro:', error);
			let errorMessage = error.message;
			if (error.name === 'SequelizeUniqueConstraintError') {
				const field = error.errors[0].path;
				errorMessage = `Já existe um registro com este ${field}`;
			}

			return res.render('lancamentos/cadastrarLancamentos', {
				title: 'Cadastrar Lançamento',
				success: null,
				error: errorMessage,
				usuario,
				lancamento: req.body
			});
		}
	}

	// Renderiza o formulário de edição de lancamento
	async editLancamentoForm(req, res) {
		const usuario = req.session.user;
		try {
			const id = req.params.id;
			const lancamento = await models.Lancamentos.findByPk(id);
			if (!lancamento) {
				return res.status(404).render('404', { title: 'Lancamento Not Found' });
			}
			const success = req.query.success || null;
			const error = req.query.error || null;
			const info = null; // Inicializa info como null para evitar o erro

			res.status(200).render('lancamentos/editarLancamento', {
				title: 'Editar Lancamento',
				lancamento,
				success,
				error,
				info,
				usuario
			});
		} catch (error) {
			console.error('Erro ao buscar dados do lancamento.', error);
			res.status(500).json({ message: 'Erro ao buscar dados do lancamento.' });
		}
	}

	// Método para atualizar lancamento
	async editLancamento(req, res) {
		const usuario = req.session.user;
		const { id } = req.params;

		try {
			const requiredFields = [
				'lancamento',
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

			const currentLancamento = await models.Lancamentos.findByPk(id);
			if (!currentLancamento) {
				throw new Error('Lancamento não encontrado');
			}

			const lancamentoData = {
				lancamento: req.body.lancamento
					? req.body.lancamento.trim().toUpperCase()
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

			const hasChanges = Object.keys(lancamentoData).some(key => {
				let currentValue = currentLancamento[key] || '';
				let newValue = lancamentoData[key] || '';
				return currentValue.toString() !== newValue.toString();
			});

			if (!hasChanges) {
				return res.render('lancamentos/editarLancamento', {
					title: 'Editar Lancamento',
					lancamento: currentLancamento,
					info: 'Nenhuma alteração foi feita.',
					success: null,
					error: null,
					usuario
				});
			}

			const [affectedRows] = await models.Lancamentos.update(lancamentoData, {
				where: { id }
			});

			if (affectedRows === 0) {
				return res.render('lancamentos/editarLancamento', {
					title: 'Editar Lancamento',
					lancamento: currentLancamento,
					info: 'Nenhuma alteração foi feita.',
					success: null,
					error: null,
					usuario
				});
			}

			return res.render('lancamentos/editarLancamento', {
				title: 'Editar Lancamento',
				lancamento: lancamentoData,
				success: 'Lancamento atualizado com sucesso!',
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

			return res.render('lancamentos/editarLancamento', {
				title: 'Editar Lancamento',
				lancamento: req.body,
				success: null,
				info: null,
				error: errorMessage,
				usuario
			});
		}
	}

	// Método para visualizar lançamento
	async viewLancamento(req, res) {
		const usuario = req.session.user;
		try {
			const id = req.params.id;
			const lancamento = await models.Lancamentos.findByPk(id);
			if (!lancamento) {
				return res.status(404).render('404', { title: 'Lancamento Not Found' });
			}

			// Log para depuração
			console.log('Valores brutos do lançamento:', {
				dia_do_cadastro: lancamento.dia_do_cadastro,
				ultima_edicao: lancamento.ultima_edicao,
				createdAt: lancamento.createdAt,
				updatedAt: lancamento.updatedAt,
				valor: lancamento.valor,
				descricao: lancamento.descricao,
				qtde_de_parcelas: lancamento.qtde_de_parcelas,
				total_parcelas: lancamento.total_parcelas,
				parcela_atual: lancamento.parcela_atual,
				data: lancamento.data // Adicionando o campo data para depuração
			});

			// Comparar dia_do_cadastro e ultima_edicao
			const isNotEdited =
				lancamento.dia_do_cadastro &&
				lancamento.ultima_edicao &&
				new Date(lancamento.dia_do_cadastro).getTime() ===
					new Date(lancamento.ultima_edicao).getTime();

			// Formatar as datas e o valor no back-end
			const formattedLancamento = {
				...lancamento.dataValues,
				dia_do_cadastro: lancamento.dia_do_cadastro
					? new Date(lancamento.dia_do_cadastro).toLocaleDateString('pt-BR')
					: 'Não informado',
				ultima_edicao: isNotEdited
					? 'Ainda sem edição'
					: lancamento.ultima_edicao
					? new Date(lancamento.ultima_edicao).toLocaleDateString('pt-BR')
					: 'Não informado',
				vencimento: lancamento.vencimento
					? new Date(lancamento.vencimento).toLocaleDateString('pt-BR')
					: 'Não informado',
				data: lancamento.data
					? new Date(lancamento.data).toLocaleDateString('pt-BR')
					: 'Não informado', // Adicionando a formatação da data retroativa
				valor: lancamento.valor
					? Number(lancamento.valor).toLocaleString('pt-BR', {
							style: 'currency',
							currency: 'BRL'
					  })
					: 'R$ 0,00',
				descricao: lancamento.descricao || 'Sem descrição',
				qtde_de_parcelas:
					lancamento.total_parcelas !== null
						? lancamento.total_parcelas
						: lancamento.qtde_de_parcelas,
				parcela_atual: lancamento.parcela_atual,
				total_parcelas: lancamento.total_parcelas
			};

			// Log para verificar os valores formatados
			console.log('Valores formatados:', {
				dia_do_cadastro: formattedLancamento.dia_do_cadastro,
				data: formattedLancamento.data,
				valor: formattedLancamento.valor,
				qtde_de_parcelas: formattedLancamento.qtde_de_parcelas
			});

			res.status(200).render('lancamentos/visualizarLancamentos', {
				title: 'Visualizar Lancamento',
				lancamento: formattedLancamento,
				usuario
			});
		} catch (error) {
			console.error(
				'Erro ao buscar dados do lancamento para visualização.',
				error
			);
			res.status(500).json({ message: 'Erro ao buscar dados do lancamento.' });
		}
	}

	// Método para excluir lançamento
	async excluirLancamento(req, res) {
		const id = req.params.id;
		try {
			const lancamento = await models.Lancamentos.findByPk(id);
			if (!lancamento) {
				console.log(`Lançamento com ID ${id} não encontrado`);
				return res.status(404).render('404', { title: 'Lancamento Not Found' });
			}
			await models.Lancamentos.destroy({ where: { id } });
			console.log(
				`Lancamento com ID ${id} excluído com sucesso. Retornando status 204.`
			);
			return res.status(204).end();
		} catch (error) {
			console.error('Erro na exclusão:', error);
			return res.status(500).json({
				message: 'Erro ao excluir lancamento',
				error: error.message
			});
		}
	}
}

export default new LancamentosController();
