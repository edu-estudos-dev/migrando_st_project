import { DataTypes } from 'sequelize';

export default sequelize => {
    const Lancamentos = sequelize.define('lancamentos', {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        entrada_saida: {
            type: DataTypes.ENUM('Entrada', 'Saida'),
            allowNull: false
        },
        data: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        tipo_de_lancamento: {
            type: DataTypes.ENUM('compra', 'extra', 'incremento_de_capital', 'pro-labore', 'receita_dos_pontos', 'gastos_recorrentes', 'bonus'),
            allowNull: false
        },
        produto: {
            type: DataTypes.ENUM('bolinhas', 'figurinhas', 'pelucias'),
            allowNull: false
        },
        forma_de_pagamento: {
            type: DataTypes.ENUM('boleto', 'credito', 'pix', 'especie'),
            allowNull: false
        },
        qtde_de_parcelas: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        parcela_atual: { // Novo campo
            type: DataTypes.INTEGER(11),
            allowNull: true,
            defaultValue: null
        },
        total_parcelas: { // Novo campo
            type: DataTypes.INTEGER(11),
            allowNull: true,
            defaultValue: null
        },
        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        usuario: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        dia_do_cadastro: {
            type: DataTypes.DATE,
            allowNull: false
        },
        ultima_edicao: {
            type: DataTypes.DATE,
            allowNull: false
        },
        vencimento: {
            type: DataTypes.DATEONLY
        }
    }, {
        timestamps: true,
        createdAt: 'dia_do_cadastro',
        updatedAt: 'ultima_edicao'
    });
    return Lancamentos;
};