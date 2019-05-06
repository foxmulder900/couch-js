class DatabaseAPI{
	constructor(baseUrl, dtoClass, config){
		this.config = config || {}
		this.dtoClass = dtoClass
		this.baseUrl = `${baseUrl}/${dtoClass.databaseName(this.config)}`
	}

	// Database level methods
	create(){
		return fetch(this.baseUrl, {method: 'PUT'})
	}

	delete(){
		return fetch(this.baseUrl, {method: 'DELETE'})
	}

	exists(){
		return fetch(this.baseUrl, {method: 'HEAD'}).then((response) => response.status === 200)
	}

	info(){
		return fetch(this.baseUrl)
			.then(response => response.json())
	}

	// Document level methods
	allDocs(ids){
		let url = new URL(`${this.baseUrl}/_all_docs`)
		url.search = new URLSearchParams({include_docs: true}).toString()

		let promise
		if(ids){
			promise = fetch(url.toString(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					keys: ids
				})
			})
		}else{
			promise = fetch(url.toString())
		}

		return promise.then(response => response.json())
			.then(json => {
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

		return fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonObj)
		})
			.then(response => response.json())
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
		return fetch(`${this.baseUrl}/${documentId}`)
			.then(response => response.json())
			.then(json => new this.dtoClass(json))
	}

	deleteDoc(dto){
		let url = new URL(`${this.baseUrl}/${dto._id}`)
		url.search = new URLSearchParams({rev: dto._rev}).toString()
		return fetch(url.toString(), {method: 'DELETE'})
	}

	docExists(documentId){
		return fetch(`${this.baseUrl}/${documentId}`, {method: 'HEAD'})
			.then((response) => response.status === 200)
	}

	updateDoc(dto){
		let jsonObj = dto.toJSON()
		return fetch(`${this.baseUrl}/${dto._id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonObj)
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
		}).then(response => response.json())
			.then(response => {
				return response['docs'].map(doc => new this.dtoClass(doc))
			})
	}
}

module.exports = DatabaseAPI
