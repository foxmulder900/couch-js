const DesignDocDTO = require('./design_doc_dto').DesignDocDTO
const isDTO = require('./base_dto').isDTO
const utils = require('./utils')

class DatabaseAPI{
	constructor(session, nameOrDTOClass, config){
		this.session = session
		this.config = config || {}
		if(isDTO(nameOrDTOClass)){
			this.dtoClass = nameOrDTOClass
			this.databaseName = nameOrDTOClass.getDatabaseName(this.config)
		}
		else{
			this.dtoClass = null
			this.databaseName = nameOrDTOClass
		}
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
			.then(response => response.status === 200)
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

		if(this.dtoClass){
			return promise.then(json => {
				return json['rows'].map(row => new this.dtoClass(row['doc']))
			})
		}
		else{
			return promise.then(json => {
				return json['rows'].map(row => row['doc'])
			})
		}
	}

	docCount(){
		return this.info()
			.then(json => json['doc_count'])
	}

	createDoc(dataObject){
		if(this.dtoClass && !(dataObject instanceof this.dtoClass)){
			dataObject = new this.dtoClass(dataObject)
		}

		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(this.dtoClass ? dataObject.toJSON() : dataObject)
		return this.session.makeRequest(this.databaseName, 'POST', headers, body)
			.then(utils.checkOk)
			.then(json => utils.updateRevision(json, dataObject))
	}

	readDoc(documentId){
		// TODO: probably add a failIfDoesntExist option, currently if the document does not exist we return a fresh DTO
		let path = `${this.databaseName}/${documentId}`
		return this.session.makeRequest(path)
			.then(json => {
				let doc = this.dtoClass ? new this.dtoClass(json) : json
				doc._id = doc._id || documentId
				return doc
			})
	}

	deleteDoc(dataObject){
		let path = `${this.databaseName}/${dataObject._id}`
		let params = `rev=${dataObject._rev}`
		return this.session.makeRequest(`${path}?${params}`, 'DELETE')
	}

	docExists(documentId){
		let path = `${this.databaseName}/${documentId}`
		return this.session.makeRequest(path, 'HEAD', {}, undefined, true)
			.then((response) => response.status === 200)
	}

	updateDoc(dataObject){
		let path = `${this.databaseName}/${dataObject._id}`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(this.dtoClass ? dataObject.toJSON() : dataObject)

		return this.session.makeRequest(path, 'PUT', headers, body)
			.then(json => dataObject._rev = json['rev'])
	}

	queryDocs(queryObject){
		let path = `${this.databaseName}/_find`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify({selector: queryObject})
		return this.session.makeRequest(path, 'POST', headers, body)
			.then(response => {
				if(this.dtoClass){
					return response['docs'].map(doc => new this.dtoClass(doc))
				}
				else{
					return response['docs']
				}
			})
	}

	readDesignDoc(designDocName){
		let designDocId = `_design/${designDocName}`
		let path = `${this.databaseName}/${designDocId}`
		return this.session.makeRequest(path)
			.then(json => {
				let doc = new DesignDocDTO(json)
				doc._id = designDocId
				return doc
			})
	}

	security(data){
		let path = `${this.databaseName}/_security`
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify(data)
		return this.session.makeRequest(path, 'PUT', headers, body)
			.then(utils.checkOk)
	}

	fetchView(dto, designDocName, viewName, asObject){
		return this.session.makeRequest(`${this.databaseName}/_design/${designDocName}/_view/${viewName}`)
			.then(json => json['rows'].map(doc => new dto({key: doc.key, ...doc.value})))
			.then(dtos => asObject ? Object.fromEntries(dtos.map(dto => [dto.key, dto])) : dtos)
	}

	fetchShow(dto, designDocName, showName, docId){
		console.warn('CouchDB show functions are deprecated.')
		return this.session.makeRequest(`${this.databaseName}/_design/${designDocName}/_show/${showName}/${docId}`)
			.then(json => new dto(json))
	}

	callUpdate(designDocName, updateName, documentId='', params={}, responseDTO=null){
		return this.session.makeRequest(
			`${this.databaseName}/_design/${designDocName}/_update/${updateName}/${documentId}`,
			'PUT',
			{},
			params
		).then(response => responseDTO ? new responseDTO(response) : response)
	}
}

module.exports = DatabaseAPI
