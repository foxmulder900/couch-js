const DatabaseAPI = require('./database_api')
const SessionAPI = require('./session_api')
const Config = require('../config')

class Client{
	constructor(host, port, secure){
		host = host || Config.defaultHost
		port = port || Config.defaultPort
		let protocol = secure ? 'https' : Config.defaultProtocol
		this.baseUrl = `${protocol}://${host}:${port}/`
		this._session = new SessionAPI(this.baseUrl)
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
		username = username || Config.defaultUsername
		password = password || Config.defaultPassword
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
