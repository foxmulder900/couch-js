const Client = require('../src/client');
const DatabaseAPI = require('../src/database_api');
const BaseDTO = require('../src/base_dto');

class TestDTO1 extends BaseDTO{
	static databaseName() {
		return 'test_database_1';
	}
}
class TestDTO2 extends BaseDTO{
	static databaseName() {
		return 'test_database_2';
	}
}
class TestDTO3 extends BaseDTO{
	static databaseName() {
		return 'test_database_3';
	}
}

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

			let database = client.database(TestDTO1);

			expect(database).toEqual(jasmine.any(DatabaseAPI));
			expect(database.dtoClass).toBe(TestDTO1);
		});
	});

	describe('listDatabases', () => {
		let client = new Client();

		it('should return a list of all databases', done => {
			Promise.all([
				client.database(TestDTO1).create(),
				client.database(TestDTO2).create(),
				client.database(TestDTO3).create()
			]).then(() => client.listDatabases())
			.then(response => {
				expect(response.includes(TestDTO1.databaseName())).toBeTruthy();
				expect(response.includes(TestDTO2.databaseName())).toBeTruthy();
				expect(response.includes(TestDTO3.databaseName())).toBeTruthy();
				done();
			});
		});

		afterAll(() => {
			client.database(TestDTO1).delete();
			client.database(TestDTO2).delete();
			client.database(TestDTO3).delete();
		});
	});
});
