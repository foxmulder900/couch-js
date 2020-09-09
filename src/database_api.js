class DatabaseAPI{
	constructor(session, dtoClass, config){
		this.session = session
		this.config = config || {}
		this.dtoClass = dtoClass
		this.databaseName = dtoClass.getDatabaseName(this.config)
	}

	// Database level methods
	create(){
		return this.session.makeRequest(this.databaseName, 'PUT')
	}

	delete(){
		return this.session.makeRequest(this.databaseName, 'DELETE')
	}

	exists(){
		return this.session.makeRequest(this.databaseName, 'HEAD', {}, undefined, true)
			.then((response) => response.status === 200)
	}

	info(){
		return this.session.makeRequest(this.databaseName)
	}

	// Document level methods
	allDocs(ids){
		let path = `${this.databaseName}/_all_docs`
		// let params = new URLSearchParams({ include_docs: true }).toString()
		let params = 'include_docs=true'

		let promise
		if(ids){
			let headers = {'Content-Type': 'application/json'}
			let body = JSON.stringify({keys: ids})
			promise = this.session.makeRequest(`${path}?${params}`, 'POST', headers, body)
		}
		else{
			promise = this.session.makeRequest(`${path}?${params}`)
		}

		return promise.then(json => {
			return json['rows'].map(row => {
				return new this.dtoClass(row['doc'])
			})
		})
	}

	docCount(){
		return this.info()
			.then(json => json['doc_count'])
	}

	createDoc(dto){
		// TODO assert that dto.id is undefined, otherwise it would be an indication that the document already exists
		if(!(dto instanceof this.dtoClass)){
			dto = new this.dtoClass(dto)
		}

		let jsonObj = dto.toJSON()

		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(jsonObj)
		return this.session.makeRequest(this.databaseName, 'POST', headers, body)
			.then(json => DatabaseAPI._checkJSON(json, dto))
	}

	readDoc(documentId){
		// TODO: probably add a failIfDoesntExist option, currently if the document does not exist we return a fresh DTO
		let path = `${this.databaseName}/${documentId}`
		return this.session.makeRequest(path)
			.then(json => {
				let doc = new this.dtoClass(json)
				doc._id = doc._id || documentId
				return doc
			})
	}

	deleteDoc(dto){
		let path = `${this.databaseName}/${dto._id}`
		let params = `rev=${dto._rev}`
		return this.session.makeRequest(`${path}?${params}`, 'DELETE')
	}

	docExists(documentId){
		let path = `${this.databaseName}/${documentId}`
		return this.session.makeRequest(path, 'HEAD', {}, undefined, true)
			.then((response) => response.status === 200)
	}

	updateDoc(dto){
		let path = `${this.databaseName}/${dto._id}`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(dto.toJSON())

		return this.session.makeRequest(path, 'PUT', headers, body)
			.then(json => dto._rev = json['rev'])
	}

	queryDocs(queryObject){
		let path = `${this.databaseName}/_find`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify({selector: queryObject})
		return this.session.makeRequest(path, 'POST', headers, body)
			.then(response => {
				return response['docs'].map(doc => new this.dtoClass(doc))
			})
	}

	security(data){
		let path = `${this.databaseName}/_security`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(data)
		return this.session.makeRequest(path, 'PUT', headers, body)
			.then(DatabaseAPI._checkJSON)
	}

	fetchView(dto, designDocName, viewName, asObject){
		return this.session.makeRequest(`${this.databaseName}/_design/${designDocName}/_view/${viewName}`)
			.then(json => json['rows'].map(doc => new dto({key: doc.key, ...doc.value})))
			.then(dtos => asObject ? Object.fromEntries(dtos.map(dto => [dto.key, dto])) : dtos)
	}

	callUpdate(designDocName, updateName, documentId='', params={}, responseDTO=null){
		return this.session.makeRequest(
			`${this.databaseName}/_design/${designDocName}/_update/${updateName}/${documentId}`,
			'PUT',
			{},
			params
		).then(response => responseDTO ? new responseDTO(response) : response)
	}

	// Private helper methods
	static _checkJSON(json, dto){
		if(!json['ok']){
			console.warn('WARNING: JSON not OK!')
			console.warn(json)
			console.trace()
			return Promise.reject(new Error('JSON not OK!'))
		}
		dto._id = json['id']
		dto._rev = json['rev']
		return Promise.resolve(dto._id)
	}
}

module.exports = DatabaseAPI
