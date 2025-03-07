import { DataTypes } from 'sequelize';

export default sequelize => {
	const Estabelecimentos = sequelize.define('estabelecimentos', {
		id: {
			type: DataTypes.INTEGER(11),
			primaryKey: true,
			autoIncrement: true
		},
		estabelecimento: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true
		},
		produto: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		chave: {
			type: DataTypes.CHAR(10)
		},
		maquina: {
			type: DataTypes.CHAR(10)
		},
		endereco: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true
		},
		bairro: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		responsavel_nome: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		telefone_contato: {
			type: DataTypes.STRING(11),
			allowNull: false,
			unique: true
		},
		observacoes: {
			type: DataTypes.TEXT
		},
		data_encerramento: {
			type: DataTypes.DATE
		},
		status: {
			type: DataTypes.ENUM('ativo', 'inativo'),
			defaultValue: 'ativo',
			allowNull: false
		}
	});
	return Estabelecimentos;
};
