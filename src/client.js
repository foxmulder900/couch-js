let HTTP_ONLY
if(typeof fetch === 'undefined'){
	fetch = require('node-fetch')
	HTTP_ONLY = false
}else{
	HTTP_ONLY = true
}
const DatabaseAPI = require('./database_api')
const SessionAPI = require('./session_api')

class Client{
	constructor(host = 'localhost', port=5984, secure=false){
		let protocol = secure ? 'https' : 'http'
		this.baseUrl = `${protocol}://${host}:${port}`
		this._session = null
		this._databases = {}
	}

	_getSession(){
		this._session = this._session || new SessionAPI(this.baseUrl, HTTP_ONLY)
		return this._session
	}

	database(dtoClass, config){
		let database = this._databases[dtoClass] || new DatabaseAPI(this, dtoClass, config)
		this._databases[dtoClass] = database
		return database
	}

	listDatabases(){
		return fetch(`${this.baseUrl}/_all_dbs`)
			.then(response => response.json())
	}

	login(userName, password){
		return this._getSession().create(userName, password)
	}

	logout(){
		return this._getSession().delete()
	}

	getUserInfo(){
		return this._getSession().getUserInfo()
	}
}

module.exports = Client
