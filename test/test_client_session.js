const Client = require('../src/client')

describe('Client', () => {
	let client = new Client()

	beforeAll(done => {
		createTestUser(client).then(done)
	})

	it('can create a session', done => {
		client.login('test_user', 'test_password')
			.then(response => {
				expect(response).toBeTruthy()
				expect(client.session.userName).toEqual('test_user')
				done()
			})
	})

	it('has an active session', done => {
		client.session.get_info().then(response => {
			expect(response['userCtx']['name']).toEqual('test_user')
			done()
		})
	})

	it('can delete a session', done => {
		client.logout().then(response => {
			expect(response).toBeTruthy()
			expect(client.session.userName).toBeNull()
			done()
		})
	})

	it('does not have an active session', done => {
		client.session.get_info().then(response => {
			expect(response['userCtx']['name']).toBeNull()
			done()
		})
	})

	afterAll(done => {
		client.login('test_user', 'test_password')
			.then(() => deleteTestUser(client, client.session.cookie))
			.then(done)
	})
})

// A few helper methods to create and remove an admin user, functionality that we don't want the client itself to have
function createTestUser(client){
	return fetch(`${client.baseUrl}/_node/_local/_config/admins/test_user`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify('test_password')
	})
}

function deleteTestUser(client, cookie){
	return fetch(`${client.baseUrl}/_node/_local/_config/admins/test_user`, {
		method: 'DELETE',
		headers: {
			'Cookie': cookie
		}
	})
}
