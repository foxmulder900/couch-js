/**
 * A simple wrapper to make CouchDB cookie authentication a piece of cake.
 * https://docs.couchdb.org/en/stable/api/server/authn.html#cookie-authentication
 */

let HTTP_ONLY
if(typeof fetch === 'undefined'){
	fetch = require('node-fetch')
	HTTP_ONLY = false
}
else{
	HTTP_ONLY = true
}

class SessionAPI{
	constructor(baseUrl){
		/**
		 * @param {string} baseUrl The CouchDB host URL without any path information.
		 * @param {boolean} http_only If true, the class assumes there is a browser correctly handling cookie headers.
		 * 		Otherwise cookies are managed by the class. Defaults to true, pass false for environments such as Node.
		 */
		this.baseUrl = baseUrl
		this._userInfo = {}
		this.cookie = null
	}

	authenticate(name, password){
		let headers = {'Content-Type': 'application/json'}
		let body = JSON.stringify({name, password})
		return this.makeRequest('_session', 'POST', headers, body, true)
			.then(response => {
				if(!HTTP_ONLY){
					this.cookie = response.headers.get('set-cookie')
				}
				return response.json()
			})
			.then(SessionAPI._checkJSON)
	}

	deauthenticate(){
		return this.makeRequest('_session', 'DELETE')
			.then(response => {
				if(response['ok']){
					this.cookie = null
					this._userInfo = {}
					return true
				}
				return false
			})
	}

	makeRequest(path = '', method = 'GET', headers = {}, body = undefined, raw = false){
		let url = this.baseUrl + path
		let defaultHeaders = HTTP_ONLY ? {} : {'Cookie': this.cookie}
		// console.debug(`${method} : ${url}`)
		return fetch(url, {
			method,
			credentials: 'include',
			headers: Object.assign(defaultHeaders, headers),
			body
		}).then(response => raw ? response : response.json())
	}

	_userInfoIsEmpty(){
		return Object.keys(this._userInfo).length === 0
	}

	_fetchInfo(){
		return this.makeRequest('_session')
			.then(json => json['userCtx'])
	}

	getSessionInfo(){
		return this._userInfoIsEmpty() ? this._fetchInfo() : Promise.resolve(this._userInfo)
	}

	// Private helper methods
	static _checkJSON(json){
		// TODO: this should probably be handled by looking at HTTP codes instead
		if(json['ok']){
			return true
		}
		else{
			console.warn('WARNING: JSON not OK!')
			console.warn(json)
			console.trace()
			return false
		}
	}
}

module.exports = SessionAPI
