const DatabaseAPI = require('../src/database_api')
const SessionAPI = require('../src/session_api')
const BaseDTO = require('../src/base_dto')

describe('DatabaseAPI', () => {
	class TestDTO extends BaseDTO{
		static databaseName = 'test_database'
		static fields = ['_id', '_rev', 'testField']
	}

	let session = new SessionAPI('http://couchdb:5984/')
	session.authenticate('test_user', 'test_password')

	describe('Database CRUD', () => {
		let database = new DatabaseAPI(session, TestDTO)
		database.delete()
		let documentIds

		it('creates a new database', done => {
			database.create()
				.then(() => assertExists(true, done))
		})

		it('retrieves database info', done => {
			database.info()
				.then(response => {
					expect(response['db_name']).toEqual(database.dtoClass.getDatabaseName())
					expect(response['doc_count']).toEqual(0)
					done()
				})
		})

		it('should create documents through factories and return the correct count', done => {
			Promise.all([
				database.createDoc(new TestDTO()),
				database.createDoc(new TestDTO()),
				database.createDoc(new TestDTO())
			])
				.then(ids => documentIds = ids)
				.then(() => database.docCount())
				.then(count => {
					expect(count).toEqual(3)
					done()
				})
		})

		it('should return all docs as dtos when getDocuments is called w/o parameters', done => {
			database.allDocs()
				.then(documents => {
					expect(documents.length).toEqual(3)
					expect(documents.find(doc => doc._id === documentIds[0])).toBeTruthy()
					expect(documents.find(doc => doc._id === documentIds[1])).toBeTruthy()
					expect(documents.find(doc => doc._id === documentIds[2])).toBeTruthy()
					done()
				})
		})

		it('should get specific documents', done => {
			database.allDocs([documentIds[1], documentIds[2]])
				.then(documents => {
					expect(documents.length).toEqual(2)
					expect(documents.find(doc => doc._id === documentIds[1])).toBeTruthy()
					expect(documents.find(doc => doc._id === documentIds[2])).toBeTruthy()
					done()
				})
		})

		it('should get specific documents, using a query object', done => {
			let queryObject = {
				_id: {
					$in: [documentIds[0], documentIds[2]]
				}
			}

			database.queryDocs(queryObject)
				.then(documents => {
					expect(documents.length).toEqual(2)
					expect(documents.find(doc => doc._id === documentIds[0])).toBeTruthy()
					expect(documents.find(doc => doc._id === documentIds[2])).toBeTruthy()
					done()
				})
		})

		it('deletes the database', done => {
			database.delete()
				.then(() => assertExists(false, done))
		})

		function assertExists(exists, done){
			database.exists()
				.then((response) => {
					expect(response).toBe(exists)
					done()
				})
		}
	})

	describe('Document CRUD', () => {
		let database = new DatabaseAPI(session, TestDTO)
		let docId
		let docRev
		let testFieldValue = 'hello'
		let dto = new TestDTO({testField: testFieldValue})

		beforeAll(done => {
			database.create().then(done)
		})

		it('creates a new document and populates id and rev on dto', done => {
			database.createDoc(dto)
				.then(() => {
					expect(dto._id).not.toBe(undefined)
					expect(dto._rev).not.toBe(undefined)
					assertExists(true, dto._id, done)
					docId = dto._id
					docRev = dto._rev
				})
		})

		describe('with the new document', () => {
			let updatedTestFieldValue = 'world!'

			it('reads the document', done => {
				database.readDoc(docId)
					.then(dto => {
						expect(dto.testField).toEqual(testFieldValue)
						done()
					})
			})

			it('updates the document', done => {
				let initialRevision = docRev
				dto.testField = updatedTestFieldValue

				database.updateDoc(dto)
					.then(() => {
						expect(dto._rev).not.toBe(undefined)
						expect(dto._rev).not.toEqual(initialRevision)
						expect(dto.testField).toEqual(updatedTestFieldValue)
						done()
					})
			})

			it('deletes the document', done => {
				database.deleteDoc(dto)
					.then(() => assertExists(false, docId, done))
			})
		})

		afterAll(done => {
			database.delete().then(done)
		})

		function assertExists(exists, documentId, done){
			database.docExists(documentId)
				.then((response) => {
					expect(response).toBe(exists)
					done()
				})
		}
	})
})
