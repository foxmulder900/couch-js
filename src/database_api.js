const DocumentAPI = require('./document_api')

class DatabaseAPI{
	constructor(baseUrl, dtoClass){
		this.dtoClass = dtoClass
		this.baseUrl = `${baseUrl}/${dtoClass.databaseName()}`
	}

	document(documentId, documentRevision){
		return new DocumentAPI(this.baseUrl, this.dtoClass, documentId, documentRevision)
	};

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

	getDocuments(ids){
		let url = `${this.baseUrl}/_all_docs`

		let promise
		if(ids){
			promise = fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					keys: ids
				})
			})
		}else{
			promise = fetch(url)
		}

		return promise.then(response => response.json())
			.then(json => {
				return json['rows'].map(row => {
					return this.document(row['id'], row['value']['rev'])
				})
			})
	}

	countDocuments(){
		// TODO: consider if this is necessary, or if just having info() is enough
		return this.info()
			.then(json => json['doc_count'])
	}

	query(queryObject){
		return fetch(`${this.baseUrl}/_find`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({selector: queryObject})
		}).then(response => response.json())
			.then(response => {
				return response['docs'].map(doc => {
					return this.document(doc['_id'], doc['_rev'])
				})
			})
	}
}

module.exports = DatabaseAPI
