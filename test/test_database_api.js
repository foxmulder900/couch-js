const DatabaseAPI = require('../src/database_api');
const DocumentAPI = require('../src/document_api');
const BaseDTO = require('../src/base_dto');

describe('DatabaseAPI', () => {
	let database;
	let dbName = 'test_database';

	beforeEach(() => {
		database = new DatabaseAPI('http://localhost:5984', dbName);
	});

	describe('CRUD', () =>{
		it('creates a new database', done => {
			database.create()
			.then(() => assertExists(true, done));
		});

		it('retrieves database info', done => {
			database.info()
			.then(response => {
				expect(response['db_name']).toEqual(dbName);
				expect(response['doc_count']).toEqual(0);
				done()
			});
		});

		it('deletes the database', done => {
			database.delete()
			.then(() => assertExists(false, done));
		})
	});

	describe('document factory', () => {
		it('should return a new DatabaseAPI instance, with a dto if an id is provided', () =>{
			let docId = 'test_doc';

			let document = database.document(BaseDTO, docId);

			expect(document).toEqual(jasmine.any(DocumentAPI));
			expect(document.dto.id).toEqual(docId);
		});

		it('should return a new DatabaseAPI instance, without a dto when an id is NOT provided', () =>{
			let document = database.document();

			expect(document).toEqual(jasmine.any(DocumentAPI));
			expect(document.dto).toBe(undefined);
		});
	});

	function assertExists(exists, done){
		database.exists()
		.then((response) => {
			expect(response).toBe(exists);
			done();
		});
	}
});
