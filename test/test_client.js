const Client = require('../src/client');
const DatabaseAPI = require('../src/database_api');

describe('Client', () => {
	describe('constructor', () => {
		it('has sane defaults', () => {
			let client = new Client();

			expect(client.baseUrl).toBe('http://localhost:5984');
		});

		it('builds base_url from input parameters', () => {
			let client = new Client('www.example.com', 80, true);

			expect(client.baseUrl).toBe('https://www.example.com:80');
		});
	});

	describe('database factory', () => {
		it('should return a new DatabaseAPI instance', () =>{
			let client = new Client();
			let dbName = 'test_db'

			let database = client.database(dbName);

			expect(database).toEqual(jasmine.any(DatabaseAPI));
			expect(database.dbName).toEqual(dbName);
		});
	});

	describe('listDatabases', () => {
		let client = new Client();

		it('should return a list of all databases', done => {
			Promise.all([
				client.database('db_1').create(),
				client.database('db_2').create(),
				client.database('db_3').create()
			]).then(() => client.listDatabases())
			.then(response => {
				expect(response).toEqual(['db_1', 'db_2', 'db_3']);
				done();
			});
		});

		afterAll(() => {
			client.database('db_1').delete();
			client.database('db_2').delete();
			client.database('db_3').delete();
		});
	});
});
