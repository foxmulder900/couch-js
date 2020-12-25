/**
 * A simple wrapper to make CouchDB cookie authentication a piece of cake.
 * https://docs.couchdb.org/en/stable/api/server/authn.html#cookie-authentication
 */
const utils = require('./utils')

let HTTP_ONLY
if(typeof fetch === 'undefined'){
	fetch = require('node-fetch')
	HTTP_ONLY = false
}
else{
	HTTP_ONLY = true
}


function buildBaseUrl(config){
	let host = config.host || 'localhost'
	let port = config.port || 5984
	let protocol = config.protocol || 'http'
	return `${protocol}://${host}:${port}/`
}


class SessionAPI{
	constructor(config){
		/**
		 * @param {string} baseUrl The CouchDB host URL without any path information.
		 * @param {boolean} http_only If true, the class assumes there is a browser correctly handling cookie headers.
		 * 		Otherwise cookies are managed by the class. Defaults to true, pass false for environments such as Node.
		 */
		this.config = config || {}
		this.baseUrl = buildBaseUrl(this.config)
		this._userInfo = {}
		this.cookie = this.config.cookie
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
			.then(utils.checkOk)
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
		console.debug(`${method} : ${url}`)
		return fetch(url, {
			method,
			credentials: 'include',
			headers: Object.assign(defaultHeaders, headers),
			body: body instanceof Object ? JSON.stringify(body) : body
		}).then(response => {
			let statusCallback = this.config[`on${response.status}`]
			return statusCallback ? statusCallback(response) : response
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
}

module.exports = SessionAPI
