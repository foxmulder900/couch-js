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
		this.session = null
	}

	database(dtoClass){
		return new DatabaseAPI(this.baseUrl, dtoClass)
	}

	listDatabases(){
		return fetch(`${this.baseUrl}/_all_dbs`)
			.then(response => response.json())
	}

	login(userName, password){
		this.session = new SessionAPI(this.baseUrl, HTTP_ONLY)
		return this.session.create(userName, password)
	}

	logout(){
		return this.session.delete()
	}
}

module.exports = Client
