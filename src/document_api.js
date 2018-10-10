class DocumentAPI{
	constructor(baseUrl, dtoClass, documentId, documentRevision){
		this.dbUrl = baseUrl
		this.baseUrl = baseUrl
		this.dtoClass = dtoClass
		if(documentId !== undefined){
			let dto = new dtoClass({id: documentId, rev: documentRevision})
			this._setDTO(dto)
		}
	}

	create(dto){
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
				dto.id = json['id']
				dto.rev = json['rev']
				this._setDTO(dto)
				return dto.id
			})
	}

	delete(){
		let url = new URL(this.baseUrl)
		url.search = new URLSearchParams({rev: this.dto.rev}).toString()
		return fetch(url.toString(), {method: 'DELETE'})
	}

	exists(){
		return fetch(this.baseUrl, {method: 'HEAD'}).then((response) => response.status === 200)
	}

	// getRevision: function(dbName, id){
	// 	return $http.head(COUCH_HOST + dbName + '/' + id)
	// 	.then(function(response){
	// 		return JSON.parse(response.headers('ETag'));
	// 	});
	// },

	read(){
		// TODO: I think this should be the only point that the dto should be retrieved from
		// TODO: the outside. Then we can add version checking to avoid reloading when necessary

		return fetch(this.baseUrl)
			.then(response => response.json())
			.then(json => {
				let dto = new this.dtoClass(json)
				this._setDTO(dto)
				return dto
			})
	}
	//
	// query: function(dbName, queryObj){
	// 	return $http.post(COUCH_HOST + dbName + '/_find', {selector: queryObj})
	// 	.then(returnDocs);
	// },
	//
	update(){
		let jsonObj = this.dto.toJSON()
		return fetch(this.baseUrl, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonObj)
		})
			.then(response => response.json())
			.then(json => this.dto.rev = json['rev'])
	}

	_setDTO(dto){
		this.dto = dto
		this.baseUrl = `${this.dbUrl}/${dto.id}`
	}
}

module.exports = DocumentAPI
