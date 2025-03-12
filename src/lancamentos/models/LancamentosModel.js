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
        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        descricao: {
            type: DataTypes.TEXT
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
        timestamps: true, // Habilita timestamps automáticos
        createdAt: 'dia_do_cadastro', // Mapeia para dia_do_cadastro
        updatedAt: 'ultima_edicao' // Mapeia para ultima_edicao
    });
    return Lancamentos;
};