class DatabaseAPI{
	constructor(session, dtoClass, config){
		this.session = session
		this.config = config || {}
		this.dtoClass = dtoClass
		this.databaseName = dtoClass.getDatabaseName(this.config)
		console.log(this.databaseName)
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
		console.log('allDocs')
		console.log(ids)
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

		if(dto instanceof this.dtoClass === false){
			dto = new this.dtoClass(dto)
		}
		let jsonObj = dto.toJSON()

		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(jsonObj)
		return this.session.makeRequest(this.databaseName, 'POST', headers, body)
			.then(json => {
				if(!json['ok']){
					console.warn('WARNING: JSON not OK!')
					console.warn(json)
				}
				dto._id = json['id']
				dto._rev = json['rev']
				return dto._id
			})
	}

	readDoc(documentId){
		let path = `${this.databaseName}/${documentId}`
		return this.session.makeRequest(path)
			.then(json => new this.dtoClass(json))
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

	createDesignDoc(dto){
		// TODO: assert dto is DesignDocDTO
		let path = `${this.databaseName}/_design/${dto.name}`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(dto.toJSON())
		return this.session.makeRequest(path, 'PUT', headers, body)
			.then(json => DatabaseAPI._checkJSON(json, dto))
	}

	security(data){
		let path = `${this.databaseName}/_security`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(data)
		return this.session.makeRequest(path, 'PUT', headers, body)
			.then(DatabaseAPI._checkJSON)
	}

	fetchView(dto, designDocName, viewName, asObject){
		console.log('fetch-view')
		return this.session.makeRequest(`${this.databaseName}/_design/${designDocName}/_view/${viewName}`)
			.then(json => json['rows'].map(doc => new dto({key: doc.key, ...doc.value})))
			.then(dtos => asObject ? Object.fromEntries(dtos.map(dto => [dto.key, dto])) : dtos)
	}

	// Private helper methods
	static _checkJSON(json, dto){
		if(!json['ok']){
			console.warn('WARNING: JSON not OK!')
			console.warn(json)
			console.trace()
		}
		dto._id = json['id']
		dto._rev = json['rev']
		return dto._id
	}
}

module.exports = DatabaseAPI
