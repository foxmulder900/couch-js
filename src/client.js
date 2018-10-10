global.fetch = require('node-fetch') // TODO: Only use this for tests (when running in node)
const DatabaseAPI = require('./database_api')

class Client{
	constructor(host = 'localhost', port=5984, secure=false){
		let protocol = secure ? 'https' : 'http'
		this.baseUrl = `${protocol}://${host}:${port}`
	}

	database(dtoClass){
		return new DatabaseAPI(this.baseUrl, dtoClass)
	}

	listDatabases(){
		return fetch(`${this.baseUrl}/_all_dbs`)
			.then(response => response.json())
	}
}

module.exports = Client
