const DocumentAPI = require('./document_api');

class DatabaseAPI {

	constructor(baseUrl, dtoClass){
		this.dtoClass = dtoClass;
		this.baseUrl = `${baseUrl}/${dtoClass.databaseName()}`;
	}

	document(documentId, documentRevision) {
		return new DocumentAPI(this.baseUrl, this.dtoClass, documentId, documentRevision);
	};

	create(){
		return fetch(this.baseUrl, {method: 'PUT'});
	}

	delete(){
		return fetch(this.baseUrl, {method: 'DELETE'});
	}

	exists(){
		return fetch(this.baseUrl, {method: 'HEAD'}).then((response) => response.status===200);
	}

	info(){
		return fetch(this.baseUrl)
		.then(response => response.json());
	}

	getDocuments(ids){
		let url = `${this.baseUrl}/_all_docs`;
		if(ids){
			url = new URL(url);
			url.search = new URLSearchParams().toString();
			url = url.toString();
		}

		return fetch(url)
		.then(response => response.json())
		.then(json => {
			return json['rows'].map(row => {
				return this.document(row['id'], row['value']['rev']);
			})
		});
	}

	// addIndex: function(dbName, fields, indexName, indexGroup){
	// 	return $http.post(COUCH_HOST + dbName + '/_index', {
	// 		index: {
	// 			fields: fields
	// 		},
	// 		name: indexName,
	// 		ddoc: indexGroup
	// 	}).then(returnData);
	// 	//TODO, do some different handling for each result value 'created' or 'exists'
	// },

	countDocuments(){
		//TODO: consider if this is necessary, or if just having info() is enough
		return this.info()
		.then(json => json['doc_count']);
	}
}

module.exports = DatabaseAPI;