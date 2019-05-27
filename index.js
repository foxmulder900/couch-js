const {BaseDTO, FunctionSource} = require('./src/base_dto')
const {DesignDocDTO, ViewDTO} = require('./src/design_doc_dto')
const Client = require('./src/client')
const DatabaseAPI = require('./src/database_api')
const CouchUtils = require('./src/utils')

module.exports = {
	BaseDTO,
	FunctionSource,
	DesignDocDTO,
	Client,
	DatabaseAPI,
	CouchUtils
}