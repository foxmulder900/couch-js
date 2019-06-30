const Client = require('../src/client')
const DatabaseAPI = require('../src/database_api')
const {DesignDocDTO} = require('../src/design_doc_dto')
const {BaseDTO} = require('../src/base_dto')

class TestDTO extends BaseDTO{
	static databaseName(){
		return 'test_database'
	}

	static getFields(){
		return ['_id', '_rev', 'testField']
	}
}

class TestView extends BaseDTO {
	static databaseName(){
		return 'test_database'
	}

	static getFields() { return ['key', 'testField']}
}

describe('DatabaseAPI', () => {
	describe('Database CRUD', () => {
		let database = new DatabaseAPI(new Client(), TestDTO)
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
		let database = new DatabaseAPI(new Client(), TestDTO)
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


	//TODO: Add test for createDesignDoc

	describe('Join Handling', () => {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;

		class TestDTOWithJoins extends BaseDTO{

			static databaseName(){
				return 'join_test'
			}

			static getFields(){
				return [
					'_id', '_rev',
					{
						name: 'foreignValue',
						source: {
							viewDTO: TestView,
							designDoc: 'projections',
							view: 'minimal',
							foreignKey: '_id',
							sourceField: 'testField'
						}
					}
				]
			}
		}

		let database1 = new DatabaseAPI(new Client(), TestDTO)
		let database2 = new DatabaseAPI(new Client(), TestDTOWithJoins)

		let COUNT = 100

		beforeAll(done => {
			Promise.all([
				database1.create()
				.then(() => {

					let testDocs = []
					for(let i=0; i<COUNT; i++){
						testDocs.push(new TestDTO({_id: `fkey-${i}`, testField: `${i}`}))
					}

					return Promise.all([
						database1.createDoc(new TestDTO({_id: 'fkey', testField: 'I am from another database!'})),
						database1.bulkCreateDocs(testDocs)
					])
				})
				.then(() => {
					let designDoc = new DesignDocDTO({name: 'projections'})
					designDoc.addView(
						'minimal',
						function(doc){emit(doc._id, {testField: doc.testField})}
					)
					return database1.createDesignDoc(designDoc)
				}),
				database2.create()
				.then(() => {

					let testDocs = []
					for(let i=0; i<COUNT; i++){
						testDocs.push(new TestDTOWithJoins({_id: `fkey-${i}`}))
					}

					return Promise.all([
						database2.createDoc(new TestDTOWithJoins({_id: 'fkey'})),
						database2.bulkCreateDocs(testDocs)
					])
				})
			]).then(done)
		})

		it('readDoc should include foreign values', done => {
			database2.readDoc('fkey').then(doc => {
				expect(doc.foreignValue).toEqual('I am from another database!')
			}).then(done)
		})

		it('allDocs should include foreign values', done => {
			database2.allDocs().then(docs => {
				expect(docs[0].foreignValue).toEqual('I am from another database!')

				for(let i=0; i<COUNT; i++){
					expect(docs[i+1]._id).toEqual(`fkey-${docs[i+1].foreignValue}`)
				}
			}).then(done)
		})

		afterAll(done => {
			Promise.all([
				database1.delete(),
				database2.delete()
			]).then(done)
		})
	})
})
