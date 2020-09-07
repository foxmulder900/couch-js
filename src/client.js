const DatabaseAPI = require('./database_api')
const SessionAPI = require('./session_api')

class Client{
	constructor(config){
		this.config = config
		let host = config.host || 'localhost'
		let port = config.port || 5984
		let protocol = config.protocol || 'http'
		this.baseUrl = `${protocol}://${host}:${port}/`
		this._session = new SessionAPI(this.baseUrl, config)
		this._databases = {}
	}

	database(dtoClass, config){
		let database = this._databases[dtoClass] || new DatabaseAPI(this._session, dtoClass, config)
		this._databases[dtoClass] = database
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
