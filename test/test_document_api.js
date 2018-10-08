const DocumentAPI = require('../src/document_api');
const Client = require('../src/client');
const BaseDTO = require('../src/base_dto');

class TestDTO extends BaseDTO{
	_defineFields(){
		return ['id', 'rev', 'testField'];
	}
}

describe('DocumentAPI', () => {
	let database;
	let dbName = 'test_database';

	beforeAll(done => {
		database = new Client().database(dbName);
		database.create().then(done);
	});

	describe('CRUD', () => {
		let docId;
		let testFieldValue = 'hello';

		it('creates a new document and populates id and rev on dto', done => {
			let document = new DocumentAPI(`http://localhost:5984/${dbName}`, TestDTO);
			let dto = new TestDTO({testField: testFieldValue});

			document.create(dto)
			.then(() => {
				expect(document.dto.id).not.toBe(undefined);
				expect(document.dto.rev).not.toBe(undefined);
				expect(document.baseUrl.endsWith(document.dto.id)).toBeTruthy();
				assertExists(true, document, done);
				docId = document.dto.id;
			});
		});

		describe('with the new document', () => {
			let document;
			let updatedTestFieldValue = 'world!';

			it('reads the document', done => {
				document = new DocumentAPI(`http://localhost:5984/${dbName}`, TestDTO, docId);

				document.read()
				.then(response => {
					expect(document.dto.testField).toEqual(testFieldValue);
					expect(response.testField).toEqual(testFieldValue);
					done();
				});
			});

			it('updates the document', done => {
				let initialRevision = document.dto.rev;
				document.dto.testField = updatedTestFieldValue;

				document.update()
				.then(() => {
					expect(document.dto.rev).not.toBe(undefined);
					expect(document.dto.rev).not.toEqual(initialRevision);
					expect(document.dto.testField).toEqual(updatedTestFieldValue);
					done();
				});
			});

			it('deletes the document', done => {
				document.delete()
				.then(() => assertExists(false, document, done));
			});
		});

		function assertExists(exists, document, done){
			document.exists()
			.then((response) => {
				expect(response).toBe(exists);
				done();
			});
		}
	});


	afterAll(() => {
		database.delete();
	})
});
