class SessionAPI{
	constructor(baseUrl, http_only=true){
		this.baseUrl = `${baseUrl}/_session`
		this.userName = null
		this.roles = null
		this.http_only = http_only
		this.cookie = null
	}

	create(name, password){
		return fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({name, password})
		})
		.then(response => {
			if(!this.http_only){
				this.cookie = response.headers.get('set-cookie')
			}
			return response.json()
		})
		.then(response => {
			if(response['ok']){
				this.userName = response['name']
				this.roles = response['roles']
				return true
			}
			return false
		})
	}

	delete(){
		return fetch(this.baseUrl, {
			method: 'DELETE',
			credentials: 'include',
			headers: this.http_only ? {} : {'Cookie': this.cookie}
		})
		.then(response => response.json())
		.then(response => {
			if(response['ok']){
				this.cookie = null
				this.userName = null
				this.roles = null
				return true
			}
			return false
		})
	}

	get_info() {
		return fetch(this.baseUrl, {
			method: 'GET',
			credentials: 'include',
			headers: this.http_only ? {} : {'Cookie': this.cookie}
		}).then(response => response.json())
	}
}

module.exports = SessionAPI
