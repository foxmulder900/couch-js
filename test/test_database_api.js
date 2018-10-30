const DatabaseAPI = require('../src/database_api')
const DocumentAPI = require('../src/document_api')
const BaseDTO = require('../src/base_dto')

class TestDTO extends BaseDTO{
	static databaseName(){
		return'test_database'
	}

	static getFields(){
		return ['_id', '_rev']
	}
}

describe('DatabaseAPI', () => {
	let database

	beforeEach(() => {
		database = new DatabaseAPI('http://localhost:5984', TestDTO)
	})

	describe('document factory', () => {
		it('should return a new DatabaseAPI instance, with a dto if an id is provided', () => {
			let docId = 'test_doc'

			let document = database.document(docId)

			expect(document).toEqual(jasmine.any(DocumentAPI))
			expect(document.dto._id).toEqual(docId)
		})

		it('should return a new DatabaseAPI instance, without a dto when an id is NOT provided', () => {
			let document = database.document()

			expect(document).toEqual(jasmine.any(DocumentAPI))
			expect(document.dto).toBe(undefined)
		})
	})

	describe('CRUD', () => {
		let documentIds

		it('creates a new database', done => {
			database.create()
				.then(() => assertExists(true, done))
		})

		it('retrieves database info', done => {
			database.info()
				.then(response => {
					expect(response['db_name']).toEqual(database.dtoClass.databaseName())
					expect(response['doc_count']).toEqual(0)
					done()
				})
		})

		it('should create documents through factories and return the correct count', done => {
			Promise.all([
				database.document().create(),
				database.document().create(),
				database.document().create()
			])
				.then(ids => documentIds = ids)
				.then(() => database.countDocuments())
				.then(count => {
					expect(count).toEqual(3)
					done()
				})
		})

		it('should return all documents', done => {
			database.getDocuments()
				.then(documents => {
					let resultIds = documents.map(document => document.dto._id)
					console.log(resultIds)
					console.log(documentIds)
					console.log(resultIds[0] == documentIds[0])
					expect(resultIds.length).toEqual(3)
					expect(resultIds.find(id => id === documentIds[0])).toBeTruthy()
					expect(resultIds.find(id => id === documentIds[1])).toBeTruthy()
					expect(resultIds.find(id => id === documentIds[2])).toBeTruthy()
					done()
				})
		})

		it('should get specific documents', done => {
			database.getDocuments([documentIds[1], documentIds[2]])
				.then(documents => {
					let resultIds = documents.map(document => document.dto._id)
					expect(resultIds.length).toEqual(2)
					expect(resultIds.find(id => id === documentIds[1])).toBeTruthy()
					expect(resultIds.find(id => id === documentIds[2])).toBeTruthy()
					done()
				})
		})

		it('should get specific documents, using a query object', done => {
			let queryObject = {
				_id: {
					$in: [documentIds[0], documentIds[2]]
				}
			}

			database.query(queryObject)
				.then(documents => {
					let resultIds = documents.map(document => document.dto._id)
					expect(resultIds.length).toEqual(2)
					expect(resultIds.find(id => id === documentIds[0])).toBeTruthy()
					expect(resultIds.find(id => id === documentIds[2])).toBeTruthy()
					done()
				})
		})

		it('deletes the database', done => {
			database.delete()
				.then(() => assertExists(false, done))
		})
	})

	function assertExists(exists, done){
		database.exists()
			.then((response) => {
				expect(response).toBe(exists)
				done()
			})
	}
})
