const Client = require('../src/client')
const DatabaseAPI = require('../src/database_api')
const {BaseDTO} = require('../src/base_dto')

class TestDTO1 extends BaseDTO{
	static databaseName = 'test_database_1'
}
class TestDTO2 extends BaseDTO{
	static databaseName = 'test_database_2'
}
class TestDTO3 extends BaseDTO{
	static databaseName = 'test_database_3'
}

describe('Client', () => {
	describe('constructor', () => {
		it('has sane defaults', () => {
			let client = new Client({host: 'couchdb'})

			expect(client.baseUrl).toBe('http://couchdb:5984/')
		})

		it('builds base_url from input parameters', () => {
			let client = new Client({host: 'www.example.com', port: 80, protocol: 'https'})

			expect(client.baseUrl).toBe('https://www.example.com:80/')
		})
	})

	describe('database factory', () => {
		it('should return a new DatabaseAPI instance', () => {
			let client = new Client({host: 'couchdb'})

			let database = client.database(TestDTO1)

			expect(database).toEqual(jasmine.any(DatabaseAPI))
			expect(database.dtoClass).toBe(TestDTO1)
		})
	})

	describe('listDatabases', () => {
		let client = new Client({host: 'couchdb'})

		beforeAll(done => {
			client.login('test_user', 'test_password').then(done)
		})

		it('should return a list of all databases', done => {
			Promise.all([
				client.database(TestDTO1).create(),
				client.database(TestDTO2).create(),
				client.database(TestDTO3).create()
			]).then(() => client.listDatabases())
				.then(response => {
					expect(response.includes(TestDTO1.getDatabaseName())).toBeTruthy()
					expect(response.includes(TestDTO2.getDatabaseName())).toBeTruthy()
					expect(response.includes(TestDTO3.getDatabaseName())).toBeTruthy()
					done()
				})
		})

		afterAll(() => {
			client.database(TestDTO1).delete()
			client.database(TestDTO2).delete()
			client.database(TestDTO3).delete()
			client.logout()
		})
	})
})
