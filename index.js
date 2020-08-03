const {BaseDTO, FunctionSource} = require('./src/base_dto')
const Client = require('./src/client')
const DatabaseAPI = require('./src/database_api')
const {DesignDocDTO, ViewDTO} = require('./src/design_doc_dto')
const CouchUtils = require('./src/utils')


module.exports = {
	BaseDTO,
	Client,
	DatabaseAPI,
	DesignDocDTO,
	FunctionSource,
	ViewDTO,
	CouchUtils,
}
