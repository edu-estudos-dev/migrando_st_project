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
							? `${lancamentoBase.descricao} (Parcela ${
									i + 1
							  } de ${qtdeDeParcelas})`
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

			res.status(200).render('lancamentos/editarLancamentos', {
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
		console.log('=== INÍCIO DA REQUISIÇÃO ===');
		const usuario = req.session.user;
		const { id } = req.params;
		const success = req.query.success || null;
		const error = req.query.error || null;
		const info = req.query.info || null;

		console.log('Tipo de requisição:', req.method);
		console.log('ID do lançamento:', id);
		console.log('Usuário:', usuario.id);

		if (req.method === 'GET') {
			console.log('Processando método GET...');
			try {
				const lancamento = await models.Lancamentos.findByPk(id);
				if (!lancamento) {
					console.error('Lançamento não encontrado no banco de dados');
					return res.status(404).render('404', {
						title: 'Lançamento Não Encontrado',
						usuario
					});
				}

				console.log('Formatação dos dados do lançamento...');
				const formattedLancamento = {
					id: lancamento.id,
					entrada_saida: lancamento.entrada_saida,
					data: lancamento.data
						? new Date(lancamento.data).toISOString().split('T')[0]
						: '',
					tipo_de_lancamento: lancamento.tipo_de_lancamento,
					produto: lancamento.produto,
					forma_de_pagamento: lancamento.forma_de_pagamento,
					valor: lancamento.valor
						? Number(lancamento.valor).toFixed(2)
						: '0.00',
					descricao: lancamento.descricao,
					vencimento: lancamento.vencimento
						? new Date(lancamento.vencimento).toISOString().split('T')[0]
						: '',
					qtde_de_parcelas: lancamento.qtde_de_parcelas,
					total_parcelas: lancamento.total_parcelas,
					parcela_atual: lancamento.parcela_atual
				};

				console.log('Renderizando página de edição...');
				return res.render('lancamentos/editarLancamentos', {
					title: 'Editar Lançamento',
					lancamento: formattedLancamento,
					success,
					error,
					info,
					usuario
				});
			} catch (error) {
				console.error('Erro no método GET:', error);
				return res.status(500).render('lancamentos/editarLancamentos', {
					title: 'Erro',
					lancamento: null,
					success: null,
					error: 'Erro interno ao carregar lançamento',
					info: null,
					usuario
				});
			}
		}

		// Método POST
		console.log('Processando método POST...');
		try {
			console.log('Buscando lançamento no banco de dados...');
			const currentLancamento = await models.Lancamentos.findByPk(id);
			if (!currentLancamento) {
				console.error('Lançamento não encontrado para atualização');
				throw new Error('Lançamento não encontrado');
			}

			console.log('Validação de campos obrigatórios...');
			const requiredFields = [];
			const isParcelado = currentLancamento.total_parcelas !== null;

			requiredFields.push('data', 'produto', 'forma_de_pagamento', 'valor');
			if (!isParcelado) {
				requiredFields.push(
					'entrada_saida',
					'tipo_de_lancamento',
					'qtde_de_parcelas'
				);
			}

			for (const field of requiredFields) {
				if (!req.body[field] || req.body[field].trim() === '') {
					console.error(`Campo obrigatório ausente: ${field}`);
					throw new Error(`Preencha o campo: ${field.replace(/_/g, ' ')}`);
				}
			}

			console.log('Preparando dados para atualização...');
			const lancamentoData = {
				entrada_saida: req.body.entrada_saida
					? req.body.entrada_saida.trim()
					: currentLancamento.entrada_saida,
				data: req.body.data || currentLancamento.data,
				tipo_de_lancamento: req.body.tipo_de_lancamento
					? req.body.tipo_de_lancamento.trim().toLowerCase()
					: currentLancamento.tipo_de_lancamento,
				produto: req.body.produto
					? req.body.produto.trim().toLowerCase()
					: currentLancamento.produto,
				forma_de_pagamento: req.body.forma_de_pagamento
					? req.body.forma_de_pagamento.trim().toLowerCase()
					: currentLancamento.forma_de_pagamento,
				valor: req.body.valor
					? parseFloat(req.body.valor)
					: currentLancamento.valor,
				descricao: req.body.descricao
					? req.body.descricao.trim()
					: currentLancamento.descricao,
				vencimento: req.body.vencimento || currentLancamento.vencimento
			};

			console.log('Tratamento de lançamentos parcelados...');
			if (isParcelado) {
				lancamentoData.descricao = `${lancamentoData.descricao} | ${currentLancamento.parcela_atual} de ${currentLancamento.total_parcelas}`;
			} else {
				lancamentoData.qtde_de_parcelas = req.body.qtde_de_parcelas
					? parseInt(req.body.qtde_de_parcelas)
					: currentLancamento.qtde_de_parcelas;
			}

			console.log('Verificando alterações...');
			let hasChanges = false;
			const changesLog = [];

			Object.keys(lancamentoData).forEach(key => {
				let currentValue = currentLancamento[key];
				let newValue = lancamentoData[key];

				// Pular campos bloqueados em lançamentos parcelados
				if (
					isParcelado &&
					(key === 'entrada_saida' || key === 'tipo_de_lancamento')
				) {
					return;
				}

				// Normalização de valores
				if (key === 'data' || key === 'vencimento') {
					currentValue = currentValue
						? new Date(currentValue).toISOString().split('T')[0]
						: null;
					newValue = newValue
						? new Date(newValue).toISOString().split('T')[0]
						: null;
				}

				if (key === 'valor') {
					currentValue = currentValue
						? Number(currentValue).toFixed(2)
						: '0.00';
					newValue = newValue ? Number(newValue).toFixed(2) : '0.00';
				}

				if (key === 'descricao' && isParcelado) {
					currentValue = currentValue.split(' | ')[0];
					newValue = newValue.split(' | ')[0];
				}

				// Comparar apenas se o campo foi enviado no formulário
				if (
					req.body[key] !== undefined &&
					String(currentValue) !== String(newValue)
				) {
					hasChanges = true;
					changesLog.push({
						campo: key,
						original: currentValue,
						novo: newValue
					});
				}
			});

			console.log('Registro de alterações:', changesLog);
			console.log('Alterações detectadas:', hasChanges);

			if (!hasChanges) {
				console.log('Nenhuma alteração relevante encontrada');
				const formattedLancamento = {
					...currentLancamento.dataValues,
					data: currentLancamento.data
						? new Date(currentLancamento.data).toISOString().split('T')[0]
						: '',
					vencimento: currentLancamento.vencimento
						? new Date(currentLancamento.vencimento).toISOString().split('T')[0]
						: '',
					valor: currentLancamento.valor
						? Number(currentLancamento.valor).toFixed(2)
						: '0.00'
				};

				return res.render('lancamentos/editarLancamentos', {
					title: 'Editar Lançamento',
					lancamento: formattedLancamento,
					success: null,
					error: null,
					info: 'Nenhuma alteração foi feita.',
					usuario
				});
			}

			console.log('Validando alterações em lançamentos parcelados...');
			if (isParcelado) {
				const camposBloqueados = ['entrada_saida', 'tipo_de_lancamento'];
				const alteracoesInvalidas = camposBloqueados.some(campo => {
					return (
						String(currentLancamento[campo]) !== String(lancamentoData[campo])
					);
				});

				if (alteracoesInvalidas) {
					console.error(
						'Tentativa de alterar campos bloqueados em lançamento parcelado'
					);
					const formattedLancamento = {
						...currentLancamento.dataValues,
						data: currentLancamento.data
							? new Date(currentLancamento.data).toISOString().split('T')[0]
							: '',
						vencimento: currentLancamento.vencimento
							? new Date(currentLancamento.vencimento)
									.toISOString()
									.split('T')[0]
							: '',
						valor: Number(currentLancamento.valor).toFixed(2)
					};

					return res.render('lancamentos/editarLancamentos', {
						title: 'Editar Lançamento',
						lancamento: formattedLancamento,
						success: null,
						error:
							'Não é possível alterar campos chave em lançamentos parcelados',
						info: null,
						usuario
					});
				}
			}

			// Atualizar ultima_edicao apenas se houver mudanças
			lancamentoData.ultima_edicao = new Date();
			console.log('Atualizando registro no banco de dados...');
			const [affectedRows] = await models.Lancamentos.update(lancamentoData, {
				where: { id }
			});

			if (affectedRows === 0) {
				console.error('Nenhum registro afetado na atualização');
				const formattedLancamento = {
					...currentLancamento.dataValues,
					data: currentLancamento.data
						? new Date(currentLancamento.data).toISOString().split('T')[0]
						: '',
					vencimento: currentLancamento.vencimento
						? new Date(currentLancamento.vencimento).toISOString().split('T')[0]
						: '',
					valor: Number(currentLancamento.valor).toFixed(2)
				};

				return res.render('lancamentos/editarLancamentos', {
					title: 'Editar Lançamento',
					lancamento: formattedLancamento,
					success: null,
					error: 'Nenhum registro foi atualizado',
					info: null,
					usuario
				});
			}

			console.log('Buscando dados atualizados...');
			const updatedLancamento = await models.Lancamentos.findByPk(id);
			const formattedLancamento = {
				...updatedLancamento.dataValues,
				data: updatedLancamento.data
					? new Date(updatedLancamento.data).toISOString().split('T')[0]
					: '',
				vencimento: updatedLancamento.vencimento
					? new Date(updatedLancamento.vencimento).toISOString().split('T')[0]
					: '',
				valor: Number(updatedLancamento.valor).toFixed(2)
			};

			console.log('Atualização concluída com sucesso');
			return res.render('lancamentos/editarLancamentos', {
				title: 'Editar Lançamento',
				lancamento: formattedLancamento,
				success: 'Lançamento atualizado com sucesso!',
				error: null,
				info: null,
				usuario
			});
		} catch (error) {
			console.error('Erro durante a atualização:', error);
			const currentLancamento = await models.Lancamentos.findByPk(id);
			const formattedLancamento = {
				...currentLancamento.dataValues,
				data: currentLancamento.data
					? new Date(currentLancamento.data).toISOString().split('T')[0]
					: '',
				vencimento: currentLancamento.vencimento
					? new Date(currentLancamento.vencimento).toISOString().split('T')[0]
					: '',
				valor: Number(currentLancamento.valor).toFixed(2)
			};

			return res.render('lancamentos/editarLancamentos', {
				title: 'Editar Lançamento',
				lancamento: formattedLancamento,
				success: null,
				error: error.message,
				info: null,
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
