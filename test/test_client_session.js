const Client = require('../src/client')

describe('Client', () => {
	let client = new Client({host: 'couchdb'})

	it('can create a session', done => {
		client.login('test_user', 'test_password')
			.then(response => {
				expect(response).toBeTruthy()
			})
			.then(() => client.getSessionInfo())
			.then(userInfo => {
				expect(userInfo.name).toEqual('test_user')
				done()
			}).catch(error => console.error(error))
	})

	it('has an active session', done => {
		client.getSessionInfo().then(response => {
			expect(response.name).toEqual('test_user')
			done()
		})
	})

	it('can delete a session', done => {
		client.logout().then(response => {
			expect(response).toBeTruthy()
		})
			.then(() => client.getSessionInfo())
			.then(userInfo => {
				expect(userInfo.name).toBeNull()
				done()
			})
	})

	it('does not have an active session', done => {
		client.getSessionInfo().then(response => {
			expect(response.name).toBeNull()
			done()
		})
	})
})
