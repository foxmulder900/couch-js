const Client = require('../src/client');

describe('client', () => {
	it('should say hello', () => {
		let client = new Client();

		let response = client.sayHello();

		expect(response).toBe('Hello World!');
	});
});
