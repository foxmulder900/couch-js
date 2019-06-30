class DatabaseAPI{
	constructor(client, dtoClass, config){
		this.client = client
		this.config = config || {}
		this.dtoClass = dtoClass
		this.baseUrl = `${client.baseUrl}/${dtoClass.databaseName(this.config)}`
	}

	// Database level methods
	create(){
		return fetch(this.baseUrl, {method: 'PUT'})
	}

	delete(){
		return fetch(this.baseUrl, {method: 'DELETE'})
	}

	exists(){
		return fetch(this.baseUrl, {method: 'HEAD'})
		.then((response) => response.status === 200)
	}

	info(){
		return fetch(this.baseUrl)
		.then(response => response.json())
	}

	// Document level methods
	allDocs(ids){
		let config = ids ? {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				keys: ids
			})
		} : undefined

		return fetch(`${this.baseUrl}/_all_docs?include_docs=true`, config)
		.then(response => response.json())
		.then(json => json['rows'].map(row => new this.dtoClass(row['doc'])))
		.then(dto => this._handleJoins(dto))
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

		return fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonObj)
		})
		.then(response => response.json())
		.then(json => DatabaseAPI._checkJSON(json, dto))
	}

	bulkCreateDocs(dtos){
		let jsonDocs = dtos.map(dto => {
			if(dto instanceof this.dtoClass === false){
				dto = new this.dtoClass(dto)
			}
			return dto.toJSON()
		})

		return fetch(`${this.baseUrl}/_bulk_docs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				docs: jsonDocs
			})
		})
		.then(response =>  response.json())
		// .then(json => DatabaseAPI._checkJSON(json, dto))
	}

	createDesignDoc(dto){
		return fetch(`${this.baseUrl}/_design/${dto.name}`,{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dto.toJSON())
		})
		.then(response => response.json())
		.then(json => DatabaseAPI._checkJSON(json, dto))
	}

	readDoc(documentId){
		return fetch(`${this.baseUrl}/${documentId}`)
		.then(response => response.json())
		.then(json => new this.dtoClass(json))
		.then(dto => this._handleJoins([dto]))
		.then(dtos => dtos[0])
	}

	deleteDoc(dto){
		let url = new URL(`${this.baseUrl}/${dto._id}`)
		url.search = new URLSearchParams({rev: dto._rev}).toString()
		return fetch(url.toString(), {method: 'DELETE'})
	}

	docExists(documentId){
		return fetch(`${this.baseUrl}/${documentId}`, {method: 'HEAD'})
		.then(response => response.status === 200)
	}

	updateDoc(dto){
		return fetch(`${this.baseUrl}/${dto._id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dto.toJSON())
		})
		.then(response => response.json())
		.then(json => dto._rev = json['rev'])
	}

	queryDocs(queryObject){
		return fetch(`${this.baseUrl}/_find`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({selector: queryObject})
		})
		.then(response => response.json())
		.then(response =>  response['docs'].map(doc => new this.dtoClass(doc)))
		.then(dto => this._handleJoins(dto))
	}

	fetchView(dto, designDocName, viewName, asMap){
		return fetch(`${this.baseUrl}/_design/${designDocName}/_view/${viewName}`)
		.then(response => response.json())
		.then(json =>  json['rows'].map(doc => new dto({key: doc.key, ...doc.value})))
		.then(dtos =>  asMap ? new Map(dtos.map(dto => [dto.key, dto])) : dtos)
	}

	// Private helper methods
	static _checkJSON(json, dto){
		if(!json['ok']){
			console.warn('WARNING: JSON not OK!')
			console.warn(json)
		}
		dto._id = json['id']
		dto._rev = json['rev']
		return dto._id
	}

	_handleJoins(dtos){
		if(!dtos){
			return []
		}

		let relationships = dtos[0]._relationships

		let joinPromises = relationships.map(relationship => {
			return this.client.database(relationship.viewDTO)
			.fetchView(relationship.viewDTO, relationship.designDoc, relationship.view, true)
			.then(view => {
				dtos.forEach(dto => {
					Object.entries(relationship.fieldMap).forEach(entry => {
						let foreignKey = dto[relationship.foreignKey]
						let destination = entry[0]
						let source = entry[1]
						dto[destination] = view.get(foreignKey)[source]
					})
				})
			})
		})

		return Promise.all(joinPromises).then(() => dtos)
	}
}

module.exports = DatabaseAPI
