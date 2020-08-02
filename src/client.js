const DatabaseAPI = require('./database_api')
const SessionAPI = require('./session_api')

class Client{
	constructor(host = 'couchdb', port=5984, secure=false){
		let protocol = secure ? 'https' : 'http'
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

	login(userName, password){
		return this._session.authenticate(userName, password)
	}

	logout(){
		return this._session.deauthenticate()
	}

	getSessionInfo(){
		return this._session.getSessionInfo()
	}
}

module.exports = Client
