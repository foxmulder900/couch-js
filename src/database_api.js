class DatabaseAPI{
	constructor(session, dtoClass, config){
		this.session = session
		this.config = config || {}
		this.dtoClass = dtoClass
		this.name = dtoClass.getDatabaseName(this.config)
	}

	// Database level methods
	create(){
		return this.session.makeRequest(this.name, 'PUT')
	}

	delete(){
		return this.session.makeRequest(this.name, 'DELETE')
	}

	exists(){
		return this.session.makeRequest(this.name, 'HEAD', {}, undefined, true)
		.then((response) => response.status === 200)
	}

	info(){
		return this.session.makeRequest(this.name)
	}

	// Document level methods
	allDocs(ids){
		let path = `${this.name}/_all_docs`
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
		return this.session.makeRequest(this.name, 'POST', headers, body)
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
		let path = `${this.name}/${documentId}`
		return this.session.makeRequest(path)
		.then(json => new this.dtoClass(json))
	}

	deleteDoc(dto){
		let path = `${this.name}/${dto._id}`
		let params = `rev=${dto._rev}`
		return this.session.makeRequest(`${path}?${params}`, 'DELETE')
	}

	docExists(documentId){
		let path = `${this.name}/${documentId}`
		return this.session.makeRequest(path, 'HEAD', {}, undefined, true)
		.then((response) => response.status === 200)
	}

	updateDoc(dto){
		let path = `${this.name}/${dto._id}`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(dto.toJSON())

		return this.session.makeRequest(path, 'PUT', headers, body)
		.then(json => dto._rev = json['rev'])
	}

	queryDocs(queryObject){
		let path = `${this.name}/_find`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify({selector: queryObject})
		return this.session.makeRequest(path, 'POST', headers, body)
		.then(response => {
			return response['docs'].map(doc => new this.dtoClass(doc))
		})
	}

	createDesignDoc(dto){
		// TODO: assert dto is DesignDocDTO
		return fetch(`${this.baseUrl}/_design/${dto.name}`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(dto.toJSON())
		})
			.then(response => response.json())
			.then(json => DatabaseAPI._checkJSON(json, dto))
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
