const DocumentAPI = require('./document_api');

class DatabaseAPI {

	constructor(baseUrl, dbName){
		this.baseUrl = `${baseUrl}/${dbName}`;
		this.dbName = dbName;
	}

	document(dtoClass, docId) {
		return new DocumentAPI(this.baseUrl, dtoClass, docId);
	};

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
	//
	// allDocs: function(dbName){
	// 	return $http.get(COUCH_HOST + dbName + '/_all_docs')
	// 	.then(returnData);
	// },
	//
	// countDocs: function(dbName){
	// 	return $http.get(COUCH_HOST + dbName)
	// 	.then(returnData)
	// 	.then(function(data){
	// 		return data['doc_count'];
	// 	});
	// },

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
		return fetch(this.baseUrl).then(response => response.json());
	}
}

module.exports = DatabaseAPI;