const DatabaseAPI = require('./database_api')
const SessionAPI = require('./session_api')

class Client{
	constructor(config){
		this.config = config || {}
		let host = this.config.host || 'localhost'
		let port = this.config.port || 5984
		let protocol = this.config.protocol || 'http'
		this.baseUrl = `${protocol}://${host}:${port}/`
		this._session = new SessionAPI(this.baseUrl, this.config)
		this._databases = {}
	}

	database(nameOrDTOClass, config){
		let databaseName = nameOrDTOClass instanceof String ? nameOrDTOClass : nameOrDTOClass.name
		let cacheKey = databaseName + JSON.stringify(config)
		let database = this._databases[cacheKey] || new DatabaseAPI(this._session, nameOrDTOClass, config)
		this._databases[cacheKey] = database
		return database
	}

	listDatabases(){
		return this._session.makeRequest('_all_dbs')
	}

	login(username, password){
		// TODO: don't have default credentials
		username = username || 'test_username'
		password = password || 'test_password'
		return this._session.authenticate(username, password)
	}

	logout(){
		return this._session.deauthenticate()
	}

	getSessionInfo(){
		return this._session.getSessionInfo()
	}
}

module.exports = Client
