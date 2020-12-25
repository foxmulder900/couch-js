const DatabaseAPI = require('./database_api')
const SessionAPI = require('./session_api')
const {isDTO} = require('./base_dto')

class Client{
	constructor(couchConfig, apiConfig, authenticateUsingApi){
		this._couchSession = couchConfig ? new SessionAPI(couchConfig) : null
		this._apiLayerSession = apiConfig ? new SessionAPI(apiConfig) : null
		if(!this._couchSession && !this._apiLayerSession){
			console.log('CouchJS Client instantiated without parameters, assuming default host config.')
			this._couchSession = new SessionAPI()
		}
		this._authSession = authenticateUsingApi ? this._apiLayerSession : this._couchSession
		this._databases = {}
	}

	database(nameOrDTOClass, config){
		let databaseName = isDTO(nameOrDTOClass) ? nameOrDTOClass.name : nameOrDTOClass
		let cacheKey = databaseName + JSON.stringify(config)
		let database = this._databases[cacheKey] || new DatabaseAPI(this._couchSession, nameOrDTOClass, config)
		this._databases[cacheKey] = database
		return database
	}

	listDatabases(){
		let session = this._couchSession || this._apiLayerSession
		return session.makeRequest('_all_dbs')
	}

	login(username, password){
		return this._authSession.authenticate(username, password)
	}

	logout(){
		return this._authSession.deauthenticate()
	}

	getSessionInfo(){
		return this._authSession.getSessionInfo()
	}

	api(endpointUrl, responseDTO){
		return this._apiLayerSession.makeRequest(endpointUrl)
			.then(json => responseDTO ? new responseDTO(json) : json)
	}
}

module.exports = Client
