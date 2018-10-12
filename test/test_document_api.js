const Client = require('../src/client')
const BaseDTO = require('../src/base_dto')

class TestDTO extends BaseDTO{
	static databaseName(){
		return'test_database'
	}

	static getFields(){
		return['_id', '_rev', 'testField']
	}
}

describe('DocumentAPI', () => {
	let database

	beforeAll(done => {
		database = new Client().database(TestDTO)
		database.create().then(done)
	})

	describe('CRUD', () => {
		let docId
		let testFieldValue = 'hello'

		it('creates a new document and populates id and rev on dto', done => {
			let document = database.document()
			let dto = new TestDTO({testField: testFieldValue})

			document.create(dto)
				.then(() => {
					expect(document.dto._id).not.toBe(undefined)
					expect(document.dto._rev).not.toBe(undefined)
					expect(document.baseUrl.endsWith(document.dto._id)).toBeTruthy()
					assertExists(true, document, done)
					docId = document.dto._id
				})
		})

		describe('with the new document', () => {
			let document
			let updatedTestFieldValue = 'world!'

			it('reads the document', done => {
				document = database.document(docId)

				document.read()
					.then(response => {
						expect(document.dto.testField).toEqual(testFieldValue)
						expect(response.testField).toEqual(testFieldValue)
						done()
					})
			})

			it('updates the document', done => {
				let initialRevision = document.dto._rev
				document.dto.testField = updatedTestFieldValue

				document.update()
					.then(() => {
						expect(document.dto._rev).not.toBe(undefined)
						expect(document.dto._rev).not.toEqual(initialRevision)
						expect(document.dto.testField).toEqual(updatedTestFieldValue)
						done()
					})
			})

			it('deletes the document', done => {
				document.delete()
					.then(() => assertExists(false, document, done))
			})
		})

		function assertExists(exists, document, done){
			document.exists()
				.then((response) => {
					expect(response).toBe(exists)
					done()
				})
		}
	})

	afterAll(() => {
		database.delete()
	})
})
