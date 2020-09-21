const {BaseDTO, isDTO} = require('./src/base_dto')
const Client = require('./src/client')
const DatabaseAPI = require('./src/database_api')
const {DesignDocDTO, ViewDTO} = require('./src/design_doc_dto')
const {getUserDatabaseName} = require('./src/utils')


module.exports = {
	BaseDTO,
	Client,
	DatabaseAPI,
	DesignDocDTO,
	ViewDTO,
	getUserDatabaseName,
	isDTO
}
