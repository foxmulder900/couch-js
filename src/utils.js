
function getUserDatabaseName(userName){
	// TODO Make userdb prefix configurable
	return `userdb-${toHex(userName)}`
}

function toHex(s){
	// utf8 to latin1
	s = unescape(encodeURIComponent(s))
	let h = ''
	for (let i = 0; i < s.length; i++){
		h += s.charCodeAt(i).toString(16)
	}
	return h
}

function checkOk(json){
	if(json.ok){
		return Promise.resolve(json)
	}
	else{
		console.warn('WARNING: JSON not OK!')
		console.warn(json)
		return Promise.reject(new Error('JSON not OK!'))
	}
}

function updateRevision(json, dto){
	dto._id = json['id']
	dto._rev = json['rev']
	return Promise.resolve(dto._id)
}

module.exports = {
	getUserDatabaseName,
	checkOk,
	updateRevision
}
