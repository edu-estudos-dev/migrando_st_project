import { DataTypes } from 'sequelize';

export default sequelize => {
	const Users = sequelize.define('users', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		userName: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: false
		}
	});
	return Users;
};
